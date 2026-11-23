import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Cuenta y wallet (parte 2): pases de puntos y giftcards, eliminar cuenta, permisos, notificaciones, ubigeo y campos menores.
struct AccountSection: View {
    @State private var toasts = ZCToastState()
    @State private var notifications = [
        ZCNotification(id: "1", icon: .sCheckCircle, title: "Lote #02829 aprobado", meta: "Aprobaciones · hace 5 min", kind: .apr, unread: true, group: "Hoy"),
        ZCNotification(id: "2", icon: .sDangerTriangle, title: "Stock bajo en Giftcard Cine", meta: "Alertas · hace 2 h", kind: .alr, unread: true, group: "Hoy"),
        ZCNotification(id: "3", icon: .sBox, title: "Envío programado", meta: "Envíos · ayer", kind: .other, unread: false, group: "Anteriores")
    ]
    @State private var ubigeo: String? = nil
    @State private var slider = 40.0
    @State private var low = 20.0
    @State private var high = 70.0
    @State private var time: String? = "09:30"
    @State private var tags = ["ana@empresa.com", "correo-invalido"]
    @State private var hasCode = false
    @State private var imported: Int? = nil

    private static func emailKey(_ values: [String: ZCBulkValue]) -> String {
        if case .text(let s)? = values["email"] { return s }
        return ""
    }

    private static let importColumns = [
        ZCBulkColumn(key: "name", title: "Nombre", type: .text, required: true, maxLength: 60, help: "Nombre completo del contacto", example: "Ana Pérez"),
        ZCBulkColumn(key: "email", title: "Correo", type: .email, required: true, maxLength: 80, help: "Correo donde llega la gift card", example: "ana@empresa.com"),
        ZCBulkColumn(key: "amount", title: "Monto", type: .integer, min: 1, max: 5000, help: "Monto entero entre 1 y 5.000", example: 100),
        ZCBulkColumn(key: "date", title: "Fecha de envío", type: .date, help: "AAAA-MM-DD o dd/mm/aaaa", example: "2026-12-24"),
    ]

    private let pass = ZCLoyaltyPass(program: "Zonapuntos", member: "Lucía Mendoza", points: 12850, tier: "Oro", bg: Color(red: 0.12, green: 0.16, blue: 0.3), fg: .white, label: Color(red: 0.7, green: 0.76, blue: 0.95), code: "ZP-0012850-LM")
    private let giftcard = ZCGiftcardData(issuer: "Cinemark", title: "Giftcard Cine", balance: 100, number: "6034881200044321", pin: "4821", expires: "2027-06-30", barcode: .code128, bg: Color(red: 0.62, green: 0.08, blue: 0.12), fg: .white, label: Color(red: 1, green: 0.85, blue: 0.85), terms: "Válida en todas las salas.", support: "0800 12345")

    var body: some View {
        VStack(alignment: .leading, spacing: ZCSpace.v8) {
            group("Wallet") {
                ZCWalletPass(pass: pass, os: .apple)
                ZCWalletPass(pass: pass, os: .google)
                ZCGiftcardPass(card: giftcard, country: "pe", os: .apple)
                ZCGiftcardPass(card: giftcard, country: "pe", os: .google, back: true)
                ZCCodeImage("ABC-123", format: .code39)
            }
            group("Notificaciones y permisos") {
                HStack { Spacer(); ZCNotifications(items: $notifications, onOpen: { _ in }, onSeeAll: {}) }
                ZCPermissionPrompt(icon: .sBell, title: "Activa las notificaciones", text: "Te avisamos cuando aprueben un lote. Puedes cambiarlo en Ajustes.") {
                    ZCButton("Permitir", block: true) {}
                    ZCButton("Ahora no", variant: .ghost, block: true) {}
                }
                ZCPermissionPrompt(icon: .sBell, title: "Notificaciones desactivadas", text: "Actívalas en Ajustes para recibir avisos.", tone: .warning) {
                    ZCButton("Abrir Ajustes", variant: .outline, block: true) {}
                }
                ZCPushPreview(app: "Zonacards", time: "ahora", title: "Lote aprobado", text: "El lote #02829 ya está activo.")
            }
            group("Ubigeo y campos menores") {
                ZCUbigeoSelect(value: $ubigeo, required: true)
                ZCField("Descuento máximo", hint: "\(Int(slider)) %") { ZCSlider(value: $slider, label: "Descuento máximo") { "\(Int($0)) %" } }
                ZCField("Rango de monto", hint: "\(Int(low)) a \(Int(high))") { ZCRangeSlider(low: $low, high: $high, minGap: 10) }
                ZCTimeField("Hora de envío", value: $time)
                ZCTagsField("Correos", value: $tags, max: 5, placeholder: "nombre@empresa.com")
                ZCSecretField(value: "sk_live_51NaBcDeFgHiJkLmNoPqRsTuV", label: "Clave de API", keepPrefix: "sk_live_", toasts: toasts)
            }
            group("Eliminar cuenta") {
                ZCDeleteAccount(request: nil, maskedEmail: hasCode ? "l***@empresa.com" : nil, onSendCode: { hasCode = true }, onSubmit: { _, _ in }, onBack: {})
            }
            group("Importar desde Excel o CSV") {
                ZCBulkImport(columns: Self.importColumns, templateTitle: "Plantilla de contactos", maxRows: 500, keyOf: Self.emailKey) { imported = $0.count }
                if let imported { ZCText("Se entregaron \(imported) filas válidas a la app.", style: ZCType.caption, tone: .muted) }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .top) { ZCToaster(state: toasts) }
    }

    private func group<C: View>(_ title: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: ZCSpace.v4) {
            ZCText(title, style: ZCType.titleSm)
            content()
        }
    }
}
