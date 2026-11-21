import SwiftUI
import ZonacardsTokens

public enum ZCAuthVariant: Sendable { case admin, shop }
public enum ZCAuthView: Sendable { case login, otp, recovery, setup, forgot, sent, signup, done }

/// `otp`: pedir el código; `setup`: la cuenta debe configurar el segundo factor antes de entrar; `ok`: entra; `bad`: datos incorrectos.
public enum ZCLoginResult: Sendable { case otp, setup, ok, bad }

/// Vista actual y conteo de intentos del acceso; `reset()` vuelve al inicio (demostraciones y cierre de sesión).
@Observable
public final class ZCAuthState {
    public var view: ZCAuthView = .login
    public internal(set) var fails = 0
    public internal(set) var lockUntil: Date = .distantPast
    public init() {}

    public func reset() {
        fails = 0
        lockUntil = .distantPast
        view = .login
    }

    func registerFailure(maxFails: Int, lockFor: TimeInterval) {
        fails += 1
        if fails >= maxFails { lockUntil = Date().addingTimeInterval(lockFor) }
    }
}

private let zcAuthMaxFails = 5
private let zcAuthLockSeconds: TimeInterval = 15 * 60
private let zcAuthResendSeconds: TimeInterval = 30

private func zcIsEmail(_ s: String) -> Bool { s.range(of: #"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"#, options: .regularExpression) != nil }

/// Acceso. `admin`: Microsoft Entra ID primero y correo para usuarios externos. `shop`: Google y Apple, correo y registro. Recuperar contraseña, segundo
/// factor (OTP), código de recuperación, intentos fallidos con bloqueo de 15 min tras 5 y mensajes que no revelan si una cuenta existe. `login` y `verifyOtp`
/// los resuelve la app. Desde 900 pt de ancho (iPad) lleva un panel lateral con la marca (`logo` opcional). Si `login` devuelve `.setup`, se muestra
/// `mfaSetup` (con `ZCMfaSetup`, llamando a `done` al terminar). iOS no informa si Bloq Mayús está activo, así que no hay aviso de mayúsculas.
public struct ZCAuth<Logo: View, Captcha: View, MfaSetup: View>: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.openURL) private var openURL
    @State private var email = ""
    @State private var pw = ""
    @State private var otp = ""
    @State private var recovery = ""
    @State private var emailError: String?
    @State private var pwError: String?
    @State private var otpError: String?
    @State private var recoveryError: String?
    @State private var otpOk = false
    @State private var forgotFailed = false
    @State private var busy = false
    @State private var sso: ZCSsoProvider?
    @State private var rememberMe = false
    @State private var trust = false
    @State private var resendAt: Date = .distantPast
    private let state: ZCAuthState
    private let variant: ZCAuthVariant
    private let userName: String
    private let login: (String, String) async throws -> ZCLoginResult
    private let verifyOtp: (String) async throws -> Bool
    private let onSignedIn: () -> Void
    private let forgot: ((String) async throws -> Void)?
    private let resendOtp: (() async -> Void)?
    private let verifyRecoveryCode: ((String) async throws -> Bool)?
    private let onSsoStart: (ZCSsoProvider) -> Void
    private let termsUrl: String
    private let privacyUrl: String
    private let submitBlocked: Bool
    private let logo: Logo
    private let captcha: Captcha
    private let mfaSetup: (@escaping () -> Void) -> MfaSetup

    public init(
        variant: ZCAuthVariant = .admin, state: ZCAuthState = ZCAuthState(), userName: String = "",
        login: @escaping (_ email: String, _ password: String) async throws -> ZCLoginResult, verifyOtp: @escaping (String) async throws -> Bool,
        forgot: ((_ email: String) async throws -> Void)? = nil, resendOtp: (() async -> Void)? = nil, verifyRecoveryCode: ((String) async throws -> Bool)? = nil,
        onSsoStart: @escaping (ZCSsoProvider) -> Void = { _ in }, termsUrl: String = "", privacyUrl: String = "", submitBlocked: Bool = false,
        onSignedIn: @escaping () -> Void,
        @ViewBuilder logo: () -> Logo, @ViewBuilder captcha: () -> Captcha, @ViewBuilder mfaSetup: @escaping (_ done: @escaping () -> Void) -> MfaSetup
    ) {
        self.variant = variant
        self.state = state
        self.userName = userName
        self.login = login
        self.verifyOtp = verifyOtp
        self.forgot = forgot
        self.resendOtp = resendOtp
        self.verifyRecoveryCode = verifyRecoveryCode
        self.onSsoStart = onSsoStart
        self.termsUrl = termsUrl
        self.privacyUrl = privacyUrl
        self.submitBlocked = submitBlocked
        self.onSignedIn = onSignedIn
        self.logo = logo()
        self.captcha = captcha()
        self.mfaSetup = mfaSetup
    }

    private var shop: Bool { variant == .shop }

    // MARK: Acciones

    private func go(_ v: ZCAuthView) {
        state.view = v
        emailError = nil; pwError = nil; otpError = nil; otpOk = false
        if v == .otp { otp = ""; resendAt = Date().addingTimeInterval(zcAuthResendSeconds) }
    }

    private func finish() { go(.done); onSignedIn() }

    private func ssoGo(_ p: ZCSsoProvider) {
        Task { sso = p; try? await Task.sleep(nanoseconds: 900_000_000); sso = nil; onSsoStart(p) }
    }

    private func submit() {
        let em = email.trimmingCharacters(in: .whitespaces)
        let e1: String? = em.isEmpty ? ZCString.text("auth.err.correo") : (zcIsEmail(em) ? nil : ZCString.text("auth.err.correoValido"))
        let e2: String? = pw.isEmpty ? ZCString.text("auth.err.clave") : nil
        emailError = e1; pwError = e2
        guard e1 == nil, e2 == nil else { return }
        busy = true
        Task {
            // Un error de red o del servidor no cuenta como intento fallido: se avisa y se puede reintentar.
            let result = try? await login(em, pw)
            busy = false
            switch result {
            case nil: pwError = ZCString.text("auth.olvidoErrorTexto")
            case .otp?: state.fails = 0; go(.otp)
            case .setup?: state.fails = 0; go(.setup)
            case .ok?: finish()
            case .bad?: state.registerFailure(maxFails: zcAuthMaxFails, lockFor: zcAuthLockSeconds); pw = ""
            }
        }
    }

    private func checkOtp(_ code: String) {
        Task {
            guard let ok = try? await verifyOtp(code) else { otpError = ZCString.text("auth.olvidoErrorTexto"); return }
            if ok { otpOk = true; try? await Task.sleep(nanoseconds: 500_000_000); finish() }
            else { otpError = ZCString.text("auth.otp.error"); otp = "" }
        }
    }

    private func sendLink() {
        let em = email.trimmingCharacters(in: .whitespaces)
        guard zcIsEmail(em) else { emailError = ZCString.text("auth.err.correoValido"); return }
        forgotFailed = false
        busy = true
        Task {
            do { try await forgot?(em); go(.sent) } catch { forgotFailed = true }
            busy = false
        }
    }

    private func checkRecovery() {
        let code = recovery.trimmingCharacters(in: .whitespaces)
        guard !code.isEmpty else { recoveryError = ZCString.text("auth.recuperacion.requerido"); return }
        busy = true
        Task {
            do { if try await verifyRecoveryCode?(code) == true { finish() } else { recoveryError = ZCString.text("auth.recuperacion.error") } }
            catch { recoveryError = ZCString.text("auth.olvidoErrorTexto") }
            busy = false
        }
    }

    // MARK: Piezas

    private func heading(_ text: String, big: Bool = false) -> some View {
        Text(text).font(.zc(big ? ZCType.displaySm : ZCType.heading, theme: theme).weight(.semibold)).foregroundStyle(theme.colors.text).accessibilityAddTraits(.isHeader)
    }

    private func link(_ text: String, enabled: Bool = true, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(text).font(.zc(ZCType.bodySm, theme: theme)).underline(enabled).foregroundStyle(enabled ? theme.colors.text : theme.colors.textSubtle)
                .frame(minHeight: ZCSize.targetSm).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
    }

    private func back(_ to: ZCAuthView) -> some View {
        Button { go(to) } label: {
            HStack(spacing: ZCSpace.v1) {
                ZCIcon(.sAltArrowLeft, size: 16)
                Text(ZCString.text("ui.volver")).font(.zc(ZCType.bodySm, theme: theme))
            }
            .foregroundStyle(theme.colors.text).frame(minHeight: ZCSize.targetSm).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func divider(_ text: String) -> some View {
        HStack(spacing: ZCSpace.v3) {
            ZCDivider()
            Text(text).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(theme.colors.textMuted).fixedSize()
            ZCDivider()
        }
    }

    private func iconBox(_ icon: ZCIconName, _ size: CGFloat, tint: Color? = nil, bg: Color? = nil) -> some View {
        ZCIcon(icon, size: size > 44 ? 24 : 20).foregroundStyle(tint ?? theme.colors.text).frame(width: size, height: size)
            .background(bg ?? theme.colors.surface2, in: RoundedRectangle(cornerRadius: ZCRadius.ms, style: .continuous))
    }

    private func emailField(reserve: Bool = true, submit: (() -> Void)? = nil) -> some View {
        ZCTextField(ZCString.text("auth.correo"), text: Binding(get: { email }, set: { email = $0; emailError = nil }), error: emailError, required: true,
                    keyboard: .emailAddress, capitalization: .never, submitLabel: submit == nil ? .next : .done, reserve: reserve, onSubmit: submit)
    }

    // MARK: Vistas

    @ViewBuilder private func content(now: Date) -> some View {
        let c = theme.colors
        let locked = state.lockUntil > now
        let resendIn = max(0, Int(ceil(resendAt.timeIntervalSince(now))))
        switch state.view {
        case .login:
            VStack(alignment: .leading, spacing: 8) {
                heading(ZCString.text(shop ? "auth.login.titulo.shop" : "auth.login.titulo.admin"), big: true)
                if !shop { Text(ZCString.text("auth.login.sub")).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted) }
                else {
                    ZCFlowLayout(spacing: 4, lineSpacing: 0) {
                        Text(ZCString.text("auth.login.sinCuenta")).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted).frame(minHeight: ZCSize.targetSm)
                        link(ZCString.text("auth.login.registrate")) { go(.signup) }
                    }
                }
            }
            VStack(spacing: ZCSpace.v3) {
                ForEach(shop ? [ZCSsoProvider.google, .apple] : [.microsoft], id: \.self) { p in
                    ZCSsoButton(p, text: shop ? .continue : .signin, block: true, loading: sso == p) { ssoGo(p) }
                }
            }
            divider(ZCString.text(shop ? "auth.login.divisor.shop" : "auth.login.divisor.admin"))
            if locked {
                let s = max(0, Int(ceil(state.lockUntil.timeIntervalSince(now))))
                ZCAlert(ZCString.text("auth.bloqueo.titulo"), tone: .danger, text: ZCString.text("auth.bloqueo.texto", String(format: "%d:%02d", s / 60, s % 60)))
            } else if state.fails > 0 {
                ZCAlert(ZCString.text("auth.error.titulo"), tone: .danger,
                        text: (state.fails >= 3 ? ZCString.text("auth.error.quedan", zcAuthMaxFails - state.fails) + " " : "") + ZCString.text("auth.error.texto"))
            }
            VStack(alignment: .leading, spacing: ZCSpace.v4) {
                emailField().disabled(locked)
                ZCTextField(ZCString.text("auth.clave"), text: Binding(get: { pw }, set: { pw = $0; pwError = nil }), error: pwError, required: true, password: true,
                            submitLabel: .done, reserve: false, onSubmit: submit).disabled(locked)
                HStack {
                    ZCCheckbox(isOn: $rememberMe, label: ZCString.text("auth.recordarme"))
                    Spacer()
                    link(ZCString.text("auth.olvido")) { go(.forgot) }
                }
                captcha
                ZCButton(ZCString.text(busy ? "auth.ingresando" : "auth.ingresar"), loading: busy, block: true, action: submit)
                    .disabled(locked || busy || submitBlocked)
            }
        case .otp:
            back(.login)
            VStack(alignment: .leading, spacing: 8) {
                iconBox(.sShieldKeyhole, 44)
                heading(ZCString.text("auth.otp.titulo"), big: true)
                Text(ZCString.text("auth.otp.texto")).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted)
            }
            ZCOtpField(ZCString.text("auth.otp.codigo"), value: Binding(get: { otp }, set: { otp = $0; otpError = nil }), error: otpError,
                       hint: otpOk ? ZCString.text("auth.otp.correcto") : nil, valid: otpOk, onComplete: checkOtp)
            ZCCheckbox(isOn: $trust, label: ZCString.text("auth.otp.confiar"))
            HStack {
                link(resendIn > 0 ? ZCString.text("auth.otp.reenviarEn", resendIn) : ZCString.text("auth.otp.reenviar"), enabled: resendIn == 0) {
                    resendAt = Date().addingTimeInterval(zcAuthResendSeconds)
                    Task { await resendOtp?() }
                }
                Spacer()
                if verifyRecoveryCode != nil { link(ZCString.text("auth.otp.recuperacion")) { go(.recovery) } }
            }
        case .forgot:
            back(.login)
            VStack(alignment: .leading, spacing: 8) {
                heading(ZCString.text("auth.olvidoTitulo"), big: true)
                Text(ZCString.text("auth.olvidoTexto")).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted)
            }
            emailField(reserve: false, submit: sendLink)
            if forgotFailed { ZCAlert(ZCString.text("auth.olvidoError"), tone: .danger, text: ZCString.text("auth.olvidoErrorTexto")) }
            ZCButton(ZCString.text("auth.enviarEnlace"), loading: busy, block: true, action: sendLink).disabled(busy)
        case .sent:
            VStack(spacing: 8) {
                iconBox(.sInbox, 56)
                heading(ZCString.text("auth.revisaCorreo"), big: true)
                Text(ZCString.text("auth.revisaTexto", email)).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted).multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            ZCButton(ZCString.text("auth.volverIngresar"), variant: .outline, block: true) { go(.login) }
        case .signup:
            back(.login)
            VStack(alignment: .leading, spacing: 8) {
                heading(ZCString.text("auth.crear.titulo"), big: true)
                ZCFlowLayout(spacing: 4, lineSpacing: 0) {
                    Text(ZCString.text("auth.crear.yaTienes")).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted).frame(minHeight: ZCSize.targetSm)
                    link(ZCString.text("auth.crear.ingresa")) { go(.login) }
                }
            }
            VStack(spacing: ZCSpace.v3) {
                ZCSsoButton(.google, text: .signup, block: true) { ssoGo(.google) }
                ZCSsoButton(.apple, text: .signup, block: true) { ssoGo(.apple) }
            }
            divider(ZCString.text("auth.login.divisor.shop"))
            emailField(reserve: false)
            ZCPasswordField(ZCString.text("auth.clave"), text: $pw, required: true)
            ZCButton(ZCString.text("auth.crear.boton"), block: true) {
                if !zcIsEmail(email.trimmingCharacters(in: .whitespaces)) { emailError = ZCString.text("auth.err.correoValido") } else { go(.login) }
            }
        case .recovery:
            back(.otp)
            VStack(alignment: .leading, spacing: 8) {
                iconBox(.sShieldKeyhole, 44)
                heading(ZCString.text("auth.recuperacion.titulo"), big: true)
                Text(ZCString.text("auth.recuperacion.texto")).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted)
            }
            ZCTextField(ZCString.text("auth.recuperacion.codigo"), text: Binding(get: { recovery }, set: { recovery = $0.uppercased(); recoveryError = nil }), placeholder: "XXXX-XXXX",
                        error: recoveryError, required: true, capitalization: .characters, submitLabel: .done, reserve: false, onSubmit: checkRecovery)
            ZCButton(ZCString.text("auth.recuperacion.boton"), loading: busy, block: true, action: checkRecovery).disabled(busy)
        case .setup:
            VStack(alignment: .leading, spacing: 8) {
                heading(ZCString.text("auth.configurar.titulo"), big: true)
                Text(ZCString.text("auth.configurar.texto")).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted)
            }
            mfaSetup { finish() }
        case .done:
            VStack(spacing: 8) {
                iconBox(.sCheckCircle, 56, tint: c.successFg, bg: c.successBg)
                heading(ZCString.text("auth.hola", userName), big: true)
                Text(ZCString.text("auth.listo")).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted).multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .accessibilityElement(children: .combine)
            ZCProgress(value: 1, label: ZCString.text("auth.listo"), tone: .success)
        }
    }

    public var body: some View {
        let c = theme.colors
        let wide = UIScreen.main.bounds.width >= 900
        let shape = RoundedRectangle(cornerRadius: ZCRadius.lg, style: .continuous)
        // La cuenta regresiva (bloqueo y reenvío del código) se refresca cada segundo solo mientras hace falta.
        TimelineView(.periodic(from: .now, by: 1)) { timeline in
            HStack(spacing: 0) {
                if wide {
                    VStack(alignment: .leading) {
                        VStack(alignment: .leading, spacing: ZCSpace.v4) {
                            logo
                            Text(ZCString.text(shop ? "auth.lado.shop.titulo" : "auth.lado.admin.titulo")).font(.zc(ZCType.displaySm, theme: theme).weight(.bold)).foregroundStyle(c.onSecondary).frame(maxWidth: 320, alignment: .leading)
                            Text(ZCString.text(shop ? "auth.lado.shop.texto" : "auth.lado.admin.texto")).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.onSecondary.opacity(0.85)).frame(maxWidth: 360, alignment: .leading)
                        }
                        Spacer()
                        ZCIcon(.sFlag, size: 32).foregroundStyle(c.onSecondary).frame(maxWidth: .infinity).aspectRatio(16.0 / 10.0, contentMode: .fit)
                            .background(LinearGradient(colors: [c.secondary.opacity(0.45), c.infoFg], startPoint: .topLeading, endPoint: .bottomTrailing), in: RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous))
                    }
                    .padding(ZCSpace.v8)
                    .frame(maxWidth: .infinity, minHeight: 620, alignment: .topLeading)
                    .background(c.secondary)
                    .accessibilityHidden(true)
                }
                VStack(spacing: ZCSpace.v6) {
                    VStack(alignment: .leading, spacing: ZCSpace.v6) { content(now: timeline.date) }.frame(maxWidth: 400)
                    if !termsUrl.isEmpty && !privacyUrl.isEmpty {
                        ZCFlowLayout(spacing: 4, lineSpacing: 0) {
                            Text(ZCString.text("auth.legal.antes")).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
                            legal("auth.legal.terminos", termsUrl)
                            Text(ZCString.text("auth.legal.y")).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
                            legal("auth.legal.privacidad", privacyUrl)
                        }
                        .frame(maxWidth: 400)
                    }
                }
                .padding(.horizontal, ZCSpace.v5)
                .padding(.vertical, ZCSpace.v8)
                .frame(maxWidth: .infinity)
            }
            .background(c.bg, in: shape)
            .clipShape(shape)
            .overlay(shape.stroke(c.border))
        }
    }

    private func legal(_ key: String, _ url: String) -> some View {
        Button { if let u = URL(string: url) { openURL(u) } } label: {
            Text(ZCString.text(key)).font(.zc(ZCType.caption, theme: theme)).underline().foregroundStyle(theme.colors.text).frame(minWidth: 44, minHeight: 44).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

public extension ZCAuth where Logo == EmptyView, Captcha == EmptyView, MfaSetup == EmptyView {
    init(
        variant: ZCAuthVariant = .admin, state: ZCAuthState = ZCAuthState(), userName: String = "",
        login: @escaping (_ email: String, _ password: String) async throws -> ZCLoginResult, verifyOtp: @escaping (String) async throws -> Bool,
        forgot: ((_ email: String) async throws -> Void)? = nil, resendOtp: (() async -> Void)? = nil, verifyRecoveryCode: ((String) async throws -> Bool)? = nil,
        onSsoStart: @escaping (ZCSsoProvider) -> Void = { _ in }, termsUrl: String = "", privacyUrl: String = "", submitBlocked: Bool = false,
        onSignedIn: @escaping () -> Void
    ) {
        self.init(variant: variant, state: state, userName: userName, login: login, verifyOtp: verifyOtp, forgot: forgot, resendOtp: resendOtp, verifyRecoveryCode: verifyRecoveryCode,
                  onSsoStart: onSsoStart, termsUrl: termsUrl, privacyUrl: privacyUrl, submitBlocked: submitBlocked, onSignedIn: onSignedIn,
                  logo: { EmptyView() }, captcha: { EmptyView() }, mfaSetup: { _ in EmptyView() })
    }
}
