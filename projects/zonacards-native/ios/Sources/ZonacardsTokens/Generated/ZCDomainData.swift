// Archivo generado por scripts/build-native-domain.mjs. No editar a mano.
import Foundation

public struct ZCCountry: Sendable, Equatable { public let code, name, currency: String; public let decimals: Int; public let locale, taxId, taxIdHint: String; public let phoneDigits: Int; public let dial, timeZone: String }
public struct ZCDialCountry: Sendable, Equatable { public let code, name, dial: String; public let phoneDigits: Int }
public struct ZCStateLook: Sendable, Equatable { public let tone, icon, labelKey: String }
public struct ZCStateMachine: Sendable {
    public let transitions: [String: [String]]
    public let looks: [String: ZCStateLook]
    public func canTransition(from: String, to: String) -> Bool { transitions[from]?.contains(to) ?? false }
    public func next(from: String) -> [String] { transitions[from] ?? [] }
}
public struct ZCTaxIdRule: Sendable { public let maxLength: Int; public let inputMode: String; public let allowed: String }

public enum ZCDomainData {
    public static let countries: [ZCCountry] = [
        ZCCountry(code: "pe", name: "Perú", currency: "PEN", decimals: 2, locale: "es-PE", taxId: "RUC", taxIdHint: "RUC de 11 dígitos", phoneDigits: 9, dial: "+51", timeZone: "America/Lima"),
        ZCCountry(code: "ec", name: "Ecuador", currency: "USD", decimals: 2, locale: "es-EC", taxId: "RUC", taxIdHint: "RUC de 13 dígitos", phoneDigits: 9, dial: "+593", timeZone: "America/Guayaquil"),
        ZCCountry(code: "bo", name: "Bolivia", currency: "BOB", decimals: 2, locale: "es-BO", taxId: "NIT", taxIdHint: "NIT de 7 a 12 dígitos", phoneDigits: 8, dial: "+591", timeZone: "America/La_Paz"),
        ZCCountry(code: "co", name: "Colombia", currency: "COP", decimals: 0, locale: "es-CO", taxId: "NIT", taxIdHint: "NIT de 9 dígitos + verificador", phoneDigits: 10, dial: "+57", timeZone: "America/Bogota"),
        ZCCountry(code: "cl", name: "Chile", currency: "CLP", decimals: 0, locale: "es-CL", taxId: "RUT", taxIdHint: "RUT con guion, ej. 12345678-5", phoneDigits: 9, dial: "+56", timeZone: "America/Santiago"),
        ZCCountry(code: "mx", name: "México", currency: "MXN", decimals: 2, locale: "es-MX", taxId: "RFC", taxIdHint: "RFC de 12 o 13 caracteres", phoneDigits: 10, dial: "+52", timeZone: "America/Mexico_City"),
    ]
    public static let dialCountries: [ZCDialCountry] = [
        ZCDialCountry(code: "pe", name: "Perú", dial: "+51", phoneDigits: 9),
        ZCDialCountry(code: "ec", name: "Ecuador", dial: "+593", phoneDigits: 9),
        ZCDialCountry(code: "bo", name: "Bolivia", dial: "+591", phoneDigits: 8),
        ZCDialCountry(code: "co", name: "Colombia", dial: "+57", phoneDigits: 10),
        ZCDialCountry(code: "cl", name: "Chile", dial: "+56", phoneDigits: 9),
        ZCDialCountry(code: "mx", name: "México", dial: "+52", phoneDigits: 10),
        ZCDialCountry(code: "us", name: "Estados Unidos", dial: "+1", phoneDigits: 10),
        ZCDialCountry(code: "ar", name: "Argentina", dial: "+54", phoneDigits: 10),
        ZCDialCountry(code: "br", name: "Brasil", dial: "+55", phoneDigits: 11),
        ZCDialCountry(code: "es", name: "España", dial: "+34", phoneDigits: 9),
    ]
    public static let settlementObservable: [String] = ["pending_approval", "pending_signature", "to_pay"]
    public static let giftcard = ZCStateMachine(transitions: ["created": ["activated", "voided"], "activated": ["expired", "voided"], "expired": [], "voided": []], looks: ["created": ZCStateLook(tone: "neutral", icon: "s:add-circle", labelKey: "estado.creado"), "activated": ZCStateLook(tone: "success", icon: "s:check-circle", labelKey: "estado.activado"), "expired": ZCStateLook(tone: "warning", icon: "s:clock-circle", labelKey: "estado.expirado"), "voided": ZCStateLook(tone: "danger", icon: "s:close-circle", labelKey: "estado.anulado")])
    public static let settlement = ZCStateMachine(transitions: ["pending_approval": ["pending_signature", "observada"], "pending_signature": ["to_pay", "observada"], "to_pay": ["paying", "observada"], "paying": ["paid"], "paid": [], "observada": ["pending_approval"]], looks: ["pending_approval": ZCStateLook(tone: "warning", icon: "s:hourglass", labelKey: "estadoLiquidacion.pending_approval"), "pending_signature": ZCStateLook(tone: "info", icon: "s:pen", labelKey: "estadoLiquidacion.pending_signature"), "to_pay": ZCStateLook(tone: "info", icon: "s:wallet", labelKey: "estadoLiquidacion.to_pay"), "paying": ZCStateLook(tone: "info", icon: "s:refresh", labelKey: "estadoLiquidacion.paying"), "paid": ZCStateLook(tone: "success", icon: "s:check-circle", labelKey: "estadoLiquidacion.paid"), "observada": ZCStateLook(tone: "danger", icon: "s:danger-triangle", labelKey: "estadoLiquidacion.observada")])
    public static let approval = ZCStateMachine(transitions: ["requested": ["pending"], "pending": ["approved", "rejected"], "approved": ["executed"], "executed": [], "rejected": ["requested"]], looks: ["requested": ZCStateLook(tone: "neutral", icon: "s:add-circle", labelKey: "estadoAprobacion.requested"), "pending": ZCStateLook(tone: "warning", icon: "s:hourglass", labelKey: "estadoAprobacion.pending"), "approved": ZCStateLook(tone: "info", icon: "s:check-circle", labelKey: "estadoAprobacion.approved"), "executed": ZCStateLook(tone: "success", icon: "s:check-circle", labelKey: "estadoAprobacion.executed"), "rejected": ZCStateLook(tone: "danger", icon: "s:close-circle", labelKey: "estadoAprobacion.rejected")])
    public static let lot = ZCStateMachine(transitions: ["pendiente_aprobacion": ["activo", "rechazado"], "rechazado": ["pendiente_aprobacion"], "activo": ["parcialmente_anulado", "anulado", "agotado"], "agotado": ["parcialmente_anulado", "anulado"], "parcialmente_anulado": ["anulado", "agotado"], "anulado": []], looks: ["pendiente_aprobacion": ZCStateLook(tone: "warning", icon: "s:hourglass", labelKey: "estadoLote.pendiente_aprobacion"), "rechazado": ZCStateLook(tone: "danger", icon: "s:close-circle", labelKey: "estadoLote.rechazado"), "activo": ZCStateLook(tone: "success", icon: "s:check-circle", labelKey: "estadoLote.activo"), "agotado": ZCStateLook(tone: "neutral", icon: "s:box", labelKey: "estadoLote.agotado"), "parcialmente_anulado": ZCStateLook(tone: "warning", icon: "s:danger-triangle", labelKey: "estadoLote.parcialmente_anulado"), "anulado": ZCStateLook(tone: "danger", icon: "s:close-circle", labelKey: "estadoLote.anulado")])
    public static let shipment = ZCStateMachine(transitions: ["borrador": ["pendiente_aprobacion", "cancelado"], "pendiente_aprobacion": ["programado", "en_curso", "rechazado", "cancelado"], "rechazado": ["pendiente_aprobacion"], "programado": ["en_curso", "cancelado"], "en_curso": ["completado", "con_errores"], "con_errores": ["en_curso"], "completado": [], "cancelado": []], looks: ["borrador": ZCStateLook(tone: "neutral", icon: "s:pen", labelKey: "estadoEnvio.borrador"), "pendiente_aprobacion": ZCStateLook(tone: "warning", icon: "s:hourglass", labelKey: "estadoEnvio.pendiente_aprobacion"), "rechazado": ZCStateLook(tone: "danger", icon: "s:close-circle", labelKey: "estadoEnvio.rechazado"), "programado": ZCStateLook(tone: "info", icon: "s:clock-circle", labelKey: "estadoEnvio.programado"), "en_curso": ZCStateLook(tone: "info", icon: "s:letter", labelKey: "estadoEnvio.en_curso"), "con_errores": ZCStateLook(tone: "danger", icon: "s:danger-triangle", labelKey: "estadoEnvio.con_errores"), "completado": ZCStateLook(tone: "success", icon: "s:check-circle", labelKey: "estadoEnvio.completado"), "cancelado": ZCStateLook(tone: "neutral", icon: "s:close-circle", labelKey: "estadoEnvio.cancelado")])
    public static let transfer = ZCStateMachine(transitions: ["pendiente_aprobacion": ["ejecutado", "rechazado"], "rechazado": ["pendiente_aprobacion"], "ejecutado": []], looks: ["pendiente_aprobacion": ZCStateLook(tone: "warning", icon: "s:hourglass", labelKey: "estadoTraslado.pendiente_aprobacion"), "rechazado": ZCStateLook(tone: "danger", icon: "s:close-circle", labelKey: "estadoTraslado.rechazado"), "ejecutado": ZCStateLook(tone: "success", icon: "s:check-circle", labelKey: "estadoTraslado.ejecutado")])
    public static let taxIdRules: [String: ZCTaxIdRule] = ["pe": ZCTaxIdRule(maxLength: 11, inputMode: "numeric", allowed: "\\d"), "ec": ZCTaxIdRule(maxLength: 13, inputMode: "numeric", allowed: "\\d"), "bo": ZCTaxIdRule(maxLength: 12, inputMode: "numeric", allowed: "\\d"), "co": ZCTaxIdRule(maxLength: 11, inputMode: "numeric", allowed: "[\\d-]"), "cl": ZCTaxIdRule(maxLength: 12, inputMode: "text", allowed: "[\\dkK.-]"), "mx": ZCTaxIdRule(maxLength: 13, inputMode: "text", allowed: "[A-Za-zÑñ&\\d]")]
    public static let recurMaxInterval = 30
    public static let recurMaxCount = 100
}
