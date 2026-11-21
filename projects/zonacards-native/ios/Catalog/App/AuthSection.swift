import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Acceso y cámara: acceso completo (admin y tienda), segundo factor, teclado de PIN con biometría, escáner, logos y botones de proveedor.
struct AuthSection: View {
    @State private var toasts = ZCToastState()
    @State private var shopState = ZCAuthState()
    @State private var pin = ""
    @State private var pinState = ZCPinPadState()
    @State private var pinError: String?
    @State private var scanned: String?
    @State private var showScanner = false
    @State private var showMfa = false

    var body: some View {
        VStack(alignment: .leading, spacing: ZCSpace.v8) {
            group("Acceso (tienda)") {
                ZCAuth(
                    variant: .shop, state: shopState, userName: "Lucía",
                    login: { email, password in password == "clave" ? .ok : (password == "otp" ? .otp : .bad) },
                    verifyOtp: { $0 == "123456" },
                    forgot: { _ in }, resendOtp: {}, verifyRecoveryCode: { $0 == "ABCD-1234" },
                    termsUrl: "https://zonacards.com/terminos", privacyUrl: "https://zonacards.com/privacidad",
                    onSignedIn: {}
                )
            }
            group("Segundo factor") {
                ZCButton("Activar segundo factor", variant: .outline) { showMfa = true }
            }
            group("Teclado de PIN") {
                ZCPinPad(value: $pin, length: 4, error: pinError, state: pinState, onComplete: { code in
                    if code == "1234" { toasts.success("PIN correcto"); pin = ""; pinError = nil } else { pinError = "PIN incorrecto"; pinState.reject() }
                }, onBiometric: {
                    Task {
                        switch await ZCBiometric.authenticate(reason: "Confirma que eres tú", cancelLabel: "Cancelar") {
                        case .success: toasts.success("Identidad confirmada")
                        case .cancelled: break
                        case .failed(let m): toasts.error("No se pudo verificar", text: m)
                        }
                    }
                })
                .onChange(of: pin) { _, _ in pinError = nil }
            }
            group("Escáner") {
                ZCButton("Abrir escáner", variant: .outline) { showScanner = true }
                if let scanned { ZCText("Leído: \(scanned)", style: ZCType.caption, tone: .muted) }
            }
            group("Logos y proveedores") {
                HStack(spacing: ZCSpace.v4) { ForEach(["visa", "mastercard", "paypal", "whatsapp"], id: \.self) { ZCLogo($0, size: 32, label: true) } }
                ZCSsoButton(.google, block: true) {}
                ZCSsoButton(.apple, text: .signin, block: true) {}
                ZCSsoButton(.microsoft, text: .signin, block: true) {}
                ZCSsoButton(.google, text: nil) {}
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .top) { ZCToaster(state: toasts) }
        .fullScreenCover(isPresented: $showScanner) {
            ZCThemeScope {
                VStack(spacing: 0) {
                    ZCTopBar("Escanear código", onBack: { showScanner = false })
                    ZCScanner(toasts: toasts, onScanned: { scanned = $0; showScanner = false }, onManual: { showScanner = false })
                }
            }
        }
        .sheet(isPresented: $showMfa) {
            ScrollView {
                ZCMfaSetup(qrPayload: "otpauth://totp/Zonacards:lucia@empresa.com?secret=JBSWY3DPEHPK3PXP&issuer=Zonacards", secret: "JBSWY3DPEHPK3PXP", account: "lucia@empresa.com",
                           recoveryCodes: ["A1B2-C3D4", "E5F6-G7H8", "J9K1-L2M3", "N4P5-Q6R7"], verify: { $0 == "123456" }, onFinished: {}) {
                    ZCButton("Cancelar", variant: .ghost) { showMfa = false }
                }
                .padding(ZCSpace.v4)
            }
        }
    }

    private func group<C: View>(_ title: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: ZCSpace.v4) {
            ZCText(title, style: ZCType.titleSm)
            content()
        }
    }
}

/// Las pantallas completas no heredan el tema del catálogo: lo vuelven a aplicar con la misma marca y el modo del sistema.
private struct ZCThemeScope<Content: View>: View {
    @Environment(\.zcTheme) private var theme
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View { ZCThemeProvider(brand: theme.brand, dark: theme.isDark) { content } }
}
