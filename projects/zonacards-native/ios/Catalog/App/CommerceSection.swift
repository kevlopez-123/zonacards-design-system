import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Compra y cuenta (parte 1): pasos, carrito, cupones, montos, contraseña, resumen de errores, hojas legal y de soporte, país, sesión e introducción.
struct CommerceSection: View {
    @State private var toasts = ZCToastState()
    @State private var step = 1
    @State private var lines = [
        ZCCartLine(id: "1", name: "Giftcard Cine", brand: "Cinemark", price: 35, qty: 2, note: "Digital"),
        ZCCartLine(id: "2", name: "Giftcard Café", brand: "Starbucks", price: 50, qty: 1)
    ]
    @State private var coupons: [ZCCoupon] = []
    @State private var amount: Double? = 50
    @State private var password = "Abc12345"
    @State private var accepted = false
    @State private var showTerms = false
    @State private var showSupport = false
    @State private var showTimeout = false
    @State private var showIntro = false
    @State private var country = "pe"
    @State private var errors = [ZCFormError(id: "mail", message: "Ingresa un correo válido."), ZCFormError(id: "tel", message: "El teléfono debe tener 9 dígitos.")]

    private var subtotal: Double { lines.reduce(0) { $0 + $1.price * Double($1.qty) } }

    var body: some View {
        VStack(alignment: .leading, spacing: ZCSpace.v8) {
            group("Pasos y resumen de errores") {
                ZCStepper(steps: ["Datos", "Pago", "Confirmar"], current: step, label: "Pasos de la compra")
                ZCCheckoutSteps(steps: [ZCCheckoutStep(id: "d", title: "Datos", summary: "Lucía Mendoza"), ZCCheckoutStep(id: "p", title: "Pago"), ZCCheckoutStep(id: "c", title: "Confirmar")], current: $step) { i in
                    ZCText("Contenido del paso \(i + 1)", tone: .muted)
                    ZCButton("Guardar y continuar", block: true) { step = min(step + 1, 2) }
                }
                ZCFormSummary(errors: errors) { id in errors.removeAll { $0.id == id } }
            }
            group("Carrito, cupones y monto") {
                ZCCart(lines: $lines, country: "pe", discount: zcCouponsTotal(coupons, subtotal: subtotal), fees: [ZCCartFee(label: "Comisión", amount: 2.5, info: "Cargo por servicio")], toasts: toasts, coupon: {
                    ZCCouponField("Cupón o gift card", value: $coupons, subtotal: subtotal) { code in
                        switch code {
                        case "DESC10": return .valid(ZCCoupon(code: code, kind: .pct, value: 0.10, description: "10 % de descuento"))
                        case "VIEJO": return .expired(date: "01/01/2026")
                        default: return .notFound
                        }
                    }
                })
                ZCAmountPicker("Monto de la giftcard", amounts: [20, 50, 100], value: $amount, soldOut: [200], country: "pe", required: true)
            }
            group("Contraseña") {
                ZCPasswordField("Contraseña nueva", text: $password, required: true)
                ZCPasswordRules(value: password)
            }
            group("Hojas y avisos de cuenta") {
                ZCLegalConsent(checked: $accepted, error: false, onOpenTerms: { showTerms = true }, onOpenPrivacy: { showTerms = true })
                ZCCountrySwitcher(value: $country, allowed: ["pe", "co", "cl"])
                ZCButton("Ayuda y soporte", variant: .outline) { showSupport = true }
                ZCButton("Sesión por expirar", variant: .outline) { showTimeout = true }
                ZCButton("Introducción", variant: .outline) { showIntro = true }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .top) { ZCToaster(state: toasts) }
        .zcLegalSheet(isPresented: $showTerms, title: "Términos", document: ZCLegalDocument(title: "Términos y condiciones", version: "2.1", sections: [ZCLegalSection(title: "1. Uso del servicio", paragraphs: ["Usas el servicio bajo estas condiciones.", "Puedes cancelar cuando quieras."]), ZCLegalSection(title: "2. Privacidad", paragraphs: ["Cuidamos tus datos."])]), confirmLabel: "Aceptar") { accepted = true }
        .zcSupportSheet(isPresented: $showSupport, info: ZCSupportInfo(hours: "Lunes a viernes, 9:00 a 18:00", phone: "+5117008000", whatsapp: "+51900000099", email: "ayuda@zonacards.com", url: "https://ayuda.zonacards.com"))
        .zcSessionTimeout(isPresented: $showTimeout, seconds: 30, onExtend: {}, onLogout: {})
        .fullScreenCover(isPresented: $showIntro) {
            ZCIntroSlides(slides: [ZCIntroSlide(title: "Regala en segundos", text: "Elige una giftcard y envíala.", icon: .sBox), ZCIntroSlide(title: "Todo en un lugar", text: "Tus pases y puntos siempre a mano.", icon: .sBox)], onFinished: { showIntro = false }, onSkipped: { showIntro = false })
        }
    }

    private func group<C: View>(_ title: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: ZCSpace.v4) {
            ZCText(title, style: ZCType.titleSm)
            content()
        }
    }
}
