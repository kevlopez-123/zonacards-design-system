import SwiftUI
import UniformTypeIdentifiers
import ZonacardsTokens

/// Texto plano para guardar en un archivo (códigos de recuperación) con el selector de archivos del sistema.
struct ZCTextDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.plainText] }
    var text: String

    init(text: String) { self.text = text }

    init(configuration: ReadConfiguration) throws {
        text = String(data: configuration.file.regularFileContents ?? Data(), encoding: .utf8) ?? ""
    }

    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: Data(text.utf8))
    }
}

/// Activar el segundo factor, TOTP. 1) Escanear el QR con una app de autenticación, o escribir la clave a mano. 2) Escribir el código de 6 dígitos, que valida
/// `verify`. 3) Si hay `recoveryCodes`: mostrarlos con copiar y guardar en un archivo (selector de archivos del sistema), y confirmar que se guardaron.
/// El servidor genera el secreto: aquí llega `qrPayload` (la URI `otpauth://…`) y el componente no crea secretos. El QR va siempre sobre fondo claro.
public struct ZCMfaSetup<Cancel: View>: View {
    private enum Step: String { case scan, verify, codes, done }

    @Environment(\.zcTheme) private var theme
    @State private var step: Step = .scan
    @State private var code = ""
    @State private var codeError = false
    @State private var failed = false
    @State private var busy = false
    @State private var saved = false
    @State private var exporting = false
    private let qrPayload: String
    private let secret: String
    private let account: String
    private let recoveryCodes: [String]
    private let fileName: String
    private let verify: (String) async throws -> Bool
    private let onFinished: () -> Void
    private let cancel: Cancel

    public init(
        qrPayload: String, secret: String, account: String = "", recoveryCodes: [String] = [], fileName: String = "codigos-recuperacion",
        verify: @escaping (String) async throws -> Bool, onFinished: @escaping () -> Void, @ViewBuilder cancel: () -> Cancel
    ) {
        self.qrPayload = qrPayload
        self.secret = secret
        self.account = account
        self.recoveryCodes = recoveryCodes
        self.fileName = fileName
        self.verify = verify
        self.onFinished = onFinished
        self.cancel = cancel()
    }

    private var steps: [Step] { recoveryCodes.isEmpty ? [.scan, .verify] : [.scan, .verify, .codes] }
    private func label(_ s: Step) -> String { ZCString.text("mol.mfa.paso.\(s == .done ? "codes" : s.rawValue)") }

    private func go(_ next: Step) {
        step = next
        if next == .verify { code = ""; codeError = false; failed = false }
    }

    private func finish() { go(.done); onFinished() }

    private func check(_ entered: String) {
        guard entered.count >= 6, !busy else { return }
        busy = true
        failed = false
        Task {
            do {
                if try await verify(entered) { if recoveryCodes.isEmpty { finish() } else { go(.codes) } }
                else { codeError = true; code = "" }
            } catch { failed = true }
            busy = false
        }
    }

    private func heading(_ title: String, _ text: String) -> some View {
        VStack(alignment: .leading, spacing: ZCSpace.v2) {
            Text(title).font(.zc(ZCType.heading, theme: theme).weight(.semibold)).foregroundStyle(theme.colors.text).accessibilityAddTraits(.isHeader)
            Text(text).font(.zc(ZCType.body, theme: theme)).foregroundStyle(theme.colors.textMuted)
        }
    }

    private var indicator: some View {
        let c = theme.colors
        let index = step == .done ? steps.count : (steps.firstIndex(of: step) ?? 0)
        return ZCFlowLayout(spacing: ZCSpace.v4, lineSpacing: ZCSpace.v1) {
            ForEach(Array(steps.enumerated()), id: \.offset) { i, s in
                let done = index > i, on = s == step
                HStack(spacing: 6) {
                    ZStack {
                        Circle().fill(done ? c.successBg : (on ? c.primary : c.surface2))
                        if done { ZCIcon(.lCheck, size: 12).foregroundStyle(c.successFg) }
                        else { Text("\(i + 1)").font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(on ? c.onPrimary : c.text) }
                    }
                    .frame(width: 20, height: 20)
                    Text(label(s)).font(.zc(ZCType.caption, theme: theme).weight(on ? .semibold : .regular)).foregroundStyle(on ? c.text : c.textMuted)
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(on ? ZCString.text("org.pasoDe", i + 1, steps.count, label(s)) : (done ? ZCString.text("org.pasoCompletado", label(s)) : label(s)))
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(ZCString.text("mol.mfa.pasos"))
    }

    public var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
        VStack(alignment: .leading, spacing: 24) {
            indicator
            switch step {
            case .scan:
                heading(ZCString.text("mol.mfa.escanear.titulo"), ZCString.text("mol.mfa.escanear.texto"))
                VStack(spacing: ZCSpace.v4) {
                    ZCCodeImage(qrPayload, format: .qr, showsValue: false).scaleEffect(1.6).frame(width: 192, height: 192)
                        .accessibilityHidden(false).accessibilityElement(children: .ignore).accessibilityLabel(ZCString.text("mol.mfa.escanear.qrAlt"))
                    if !account.isEmpty { Text(account).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.textMuted) }
                }
                .padding(ZCSpace.v5)
                .frame(maxWidth: .infinity)
                .background(c.surface, in: shape)
                .overlay(shape.stroke(c.border))
                ZCAccordion(items: [ZCAccordionItem(id: "manual", title: ZCString.text("mol.mfa.escanear.manual")) {
                    VStack(alignment: .leading, spacing: ZCSpace.v3) {
                        Text(ZCString.text("mol.mfa.escanear.manualTexto")).font(.zc(ZCType.bodySm, theme: theme))
                        Text(secret.filter { !$0.isWhitespace }.chunked(4).joined(separator: " "))
                            .font(.system(size: 15, design: .monospaced).monospacedDigit()).foregroundStyle(c.text)
                            .padding(.horizontal, ZCSpace.v3).padding(.vertical, ZCSpace.v2)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(c.surface2, in: RoundedRectangle(cornerRadius: ZCRadius.sm, style: .continuous))
                            .accessibilityLabel(ZCString.text("mol.mfa.escanear.clave"))
                            .accessibilityValue(secret)
                        ZCCopyButton(value: secret, showText: true, variant: .outline)
                    }
                }])
                HStack(spacing: ZCSpace.v2) {
                    Spacer()
                    cancel
                    ZCButton(ZCString.text("mol.mfa.continuar")) { go(.verify) }
                }
            case .verify:
                heading(ZCString.text("mol.mfa.verificar.titulo"), ZCString.text("mol.mfa.verificar.texto"))
                ZCOtpField(ZCString.text("mol.mfa.verificar.codigo"), value: Binding(get: { code }, set: { code = $0; codeError = false }),
                           error: codeError ? ZCString.text("mol.mfa.verificar.error") : nil, onComplete: check)
                    .disabled(busy)
                if failed { ZCAlert(ZCString.text("mol.mfa.verificar.fallo"), tone: .danger, text: ZCString.text("mol.mfa.verificar.falloTexto")) }
                HStack {
                    ZCButton(ZCString.text("ui.volver"), variant: .ghost, leadingIcon: .sAltArrowLeft) { go(.scan) }
                    Spacer()
                    ZCButton(ZCString.text("mol.mfa.verificar.boton"), loading: busy) { check(code) }.disabled(code.count < 6 || busy)
                }
            case .codes:
                heading(ZCString.text("mol.mfa.codigos.titulo"), ZCString.text("mol.mfa.codigos.texto"))
                ZCAlert(ZCString.text("mol.mfa.codigos.aviso"), tone: .warning, text: ZCString.text("mol.mfa.codigos.avisoTexto"))
                ZCFlowLayout(spacing: ZCSpace.v2, lineSpacing: ZCSpace.v2) {
                    ForEach(recoveryCodes, id: \.self) { cd in
                        Text(cd).font(.system(size: 15, design: .monospaced).monospacedDigit()).foregroundStyle(c.text)
                            .padding(.horizontal, ZCSpace.v3).padding(.vertical, ZCSpace.v2).frame(minWidth: 128)
                            .background(c.surface2, in: RoundedRectangle(cornerRadius: ZCRadius.sm, style: .continuous))
                    }
                }
                .padding(ZCSpace.v4)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(c.surface, in: shape)
                .overlay(shape.stroke(c.border))
                .accessibilityElement(children: .contain)
                .accessibilityLabel(ZCString.text("mol.mfa.codigos.titulo"))
                HStack(spacing: ZCSpace.v2) {
                    ZCCopyButton(value: recoveryCodes.joined(separator: "\n"), showText: true, variant: .outline)
                    ZCButton(ZCString.text("mol.mfa.codigos.descargar"), variant: .outline, size: .sm, leadingIcon: .sDownloadMinimalistic) { exporting = true }
                }
                ZCCheckbox(isOn: $saved, label: ZCString.text("mol.mfa.codigos.guarde"))
                HStack { Spacer(); ZCButton(ZCString.text("mol.mfa.terminar")) { finish() }.disabled(!saved) }
            case .done:
                VStack(spacing: ZCSpace.v2) {
                    ZCIcon(.sShieldCheck, size: 24).foregroundStyle(c.successFg).frame(width: 56, height: 56).background(c.successBg, in: RoundedRectangle(cornerRadius: ZCRadius.ms, style: .continuous))
                    Text(ZCString.text("mol.mfa.listo.titulo")).font(.zc(ZCType.heading, theme: theme).weight(.semibold)).foregroundStyle(c.text).accessibilityAddTraits(.isHeader)
                    Text(ZCString.text("mol.mfa.listo.texto")).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted).multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .accessibilityElement(children: .combine)
                .onAppear { AccessibilityNotification.Announcement(ZCString.text("mol.mfa.listo.titulo")).post() }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .fileExporter(isPresented: $exporting, document: ZCTextDocument(text: recoveryCodes.joined(separator: "\r\n") + "\r\n"), contentType: .plainText, defaultFilename: fileName) { _ in }
    }
}

public extension ZCMfaSetup where Cancel == EmptyView {
    init(qrPayload: String, secret: String, account: String = "", recoveryCodes: [String] = [], fileName: String = "codigos-recuperacion", verify: @escaping (String) async throws -> Bool, onFinished: @escaping () -> Void) {
        self.init(qrPayload: qrPayload, secret: secret, account: account, recoveryCodes: recoveryCodes, fileName: fileName, verify: verify, onFinished: onFinished) { EmptyView() }
    }
}

extension String {
    /// Trozos de `size` caracteres ("ABCDEFGH" → ["ABCD", "EFGH"]).
    func chunked(_ size: Int) -> [String] {
        guard size > 0 else { return [self] }
        var out: [String] = [], current = ""
        for ch in self { current.append(ch); if current.count == size { out.append(current); current = "" } }
        if !current.isEmpty { out.append(current) }
        return out
    }
}
