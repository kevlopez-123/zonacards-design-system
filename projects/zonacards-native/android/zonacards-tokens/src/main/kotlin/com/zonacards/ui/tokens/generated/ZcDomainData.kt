// Archivo generado por scripts/build-native-domain.mjs. No editar a mano.
package com.zonacards.ui.tokens

data class ZcCountry(val code: String, val name: String, val currency: String, val decimals: Int, val locale: String, val taxId: String, val taxIdHint: String, val phoneDigits: Int, val dial: String, val timeZone: String)
data class ZcDialCountry(val code: String, val name: String, val dial: String, val phoneDigits: Int)
data class ZcStateLook(val tone: String, val icon: String, val labelKey: String)
class ZcStateMachine(val transitions: Map<String, List<String>>, val looks: Map<String, ZcStateLook>) {
    fun canTransition(from: String, to: String): Boolean = transitions[from]?.contains(to) ?: false
    fun next(from: String): List<String> = transitions[from] ?: emptyList()
}
data class ZcTaxIdRule(val maxLength: Int, val inputMode: String, val allowed: Regex)

object ZcDomainData {
    val countries = listOf(
        ZcCountry("pe", "Perú", "PEN", 2, "es-PE", "RUC", "RUC de 11 dígitos", 9, "+51", "America/Lima"),
        ZcCountry("ec", "Ecuador", "USD", 2, "es-EC", "RUC", "RUC de 13 dígitos", 9, "+593", "America/Guayaquil"),
        ZcCountry("bo", "Bolivia", "BOB", 2, "es-BO", "NIT", "NIT de 7 a 12 dígitos", 8, "+591", "America/La_Paz"),
        ZcCountry("co", "Colombia", "COP", 0, "es-CO", "NIT", "NIT de 9 dígitos + verificador", 10, "+57", "America/Bogota"),
        ZcCountry("cl", "Chile", "CLP", 0, "es-CL", "RUT", "RUT con guion, ej. 12345678-5", 9, "+56", "America/Santiago"),
        ZcCountry("mx", "México", "MXN", 2, "es-MX", "RFC", "RFC de 12 o 13 caracteres", 10, "+52", "America/Mexico_City"),
    )
    val dialCountries = listOf(
        ZcDialCountry("pe", "Perú", "+51", 9),
        ZcDialCountry("ec", "Ecuador", "+593", 9),
        ZcDialCountry("bo", "Bolivia", "+591", 8),
        ZcDialCountry("co", "Colombia", "+57", 10),
        ZcDialCountry("cl", "Chile", "+56", 9),
        ZcDialCountry("mx", "México", "+52", 10),
        ZcDialCountry("us", "Estados Unidos", "+1", 10),
        ZcDialCountry("ar", "Argentina", "+54", 10),
        ZcDialCountry("br", "Brasil", "+55", 11),
        ZcDialCountry("es", "España", "+34", 9),
    )
    val settlementObservable = listOf("pending_approval", "pending_signature", "to_pay")
    val giftcard = ZcStateMachine(mapOf("created" to listOf("activated", "voided"), "activated" to listOf("expired", "voided"), "expired" to listOf(), "voided" to listOf()), mapOf("created" to ZcStateLook("neutral", "s:add-circle", "estado.creado"), "activated" to ZcStateLook("success", "s:check-circle", "estado.activado"), "expired" to ZcStateLook("warning", "s:clock-circle", "estado.expirado"), "voided" to ZcStateLook("danger", "s:close-circle", "estado.anulado")))
    val settlement = ZcStateMachine(mapOf("pending_approval" to listOf("pending_signature", "observada"), "pending_signature" to listOf("to_pay", "observada"), "to_pay" to listOf("paying", "observada"), "paying" to listOf("paid"), "paid" to listOf(), "observada" to listOf("pending_approval")), mapOf("pending_approval" to ZcStateLook("warning", "s:hourglass", "estadoLiquidacion.pending_approval"), "pending_signature" to ZcStateLook("info", "s:pen", "estadoLiquidacion.pending_signature"), "to_pay" to ZcStateLook("info", "s:wallet", "estadoLiquidacion.to_pay"), "paying" to ZcStateLook("info", "s:refresh", "estadoLiquidacion.paying"), "paid" to ZcStateLook("success", "s:check-circle", "estadoLiquidacion.paid"), "observada" to ZcStateLook("danger", "s:danger-triangle", "estadoLiquidacion.observada")))
    val approval = ZcStateMachine(mapOf("requested" to listOf("pending"), "pending" to listOf("approved", "rejected"), "approved" to listOf("executed"), "executed" to listOf(), "rejected" to listOf("requested")), mapOf("requested" to ZcStateLook("neutral", "s:add-circle", "estadoAprobacion.requested"), "pending" to ZcStateLook("warning", "s:hourglass", "estadoAprobacion.pending"), "approved" to ZcStateLook("info", "s:check-circle", "estadoAprobacion.approved"), "executed" to ZcStateLook("success", "s:check-circle", "estadoAprobacion.executed"), "rejected" to ZcStateLook("danger", "s:close-circle", "estadoAprobacion.rejected")))
    val lot = ZcStateMachine(mapOf("pendiente_aprobacion" to listOf("activo", "rechazado"), "rechazado" to listOf("pendiente_aprobacion"), "activo" to listOf("parcialmente_anulado", "anulado", "agotado"), "agotado" to listOf("parcialmente_anulado", "anulado"), "parcialmente_anulado" to listOf("anulado", "agotado"), "anulado" to listOf()), mapOf("pendiente_aprobacion" to ZcStateLook("warning", "s:hourglass", "estadoLote.pendiente_aprobacion"), "rechazado" to ZcStateLook("danger", "s:close-circle", "estadoLote.rechazado"), "activo" to ZcStateLook("success", "s:check-circle", "estadoLote.activo"), "agotado" to ZcStateLook("neutral", "s:box", "estadoLote.agotado"), "parcialmente_anulado" to ZcStateLook("warning", "s:danger-triangle", "estadoLote.parcialmente_anulado"), "anulado" to ZcStateLook("danger", "s:close-circle", "estadoLote.anulado")))
    val shipment = ZcStateMachine(mapOf("borrador" to listOf("pendiente_aprobacion", "cancelado"), "pendiente_aprobacion" to listOf("programado", "en_curso", "rechazado", "cancelado"), "rechazado" to listOf("pendiente_aprobacion"), "programado" to listOf("en_curso", "cancelado"), "en_curso" to listOf("completado", "con_errores"), "con_errores" to listOf("en_curso"), "completado" to listOf(), "cancelado" to listOf()), mapOf("borrador" to ZcStateLook("neutral", "s:pen", "estadoEnvio.borrador"), "pendiente_aprobacion" to ZcStateLook("warning", "s:hourglass", "estadoEnvio.pendiente_aprobacion"), "rechazado" to ZcStateLook("danger", "s:close-circle", "estadoEnvio.rechazado"), "programado" to ZcStateLook("info", "s:clock-circle", "estadoEnvio.programado"), "en_curso" to ZcStateLook("info", "s:letter", "estadoEnvio.en_curso"), "con_errores" to ZcStateLook("danger", "s:danger-triangle", "estadoEnvio.con_errores"), "completado" to ZcStateLook("success", "s:check-circle", "estadoEnvio.completado"), "cancelado" to ZcStateLook("neutral", "s:close-circle", "estadoEnvio.cancelado")))
    val transfer = ZcStateMachine(mapOf("pendiente_aprobacion" to listOf("ejecutado", "rechazado"), "rechazado" to listOf("pendiente_aprobacion"), "ejecutado" to listOf()), mapOf("pendiente_aprobacion" to ZcStateLook("warning", "s:hourglass", "estadoTraslado.pendiente_aprobacion"), "rechazado" to ZcStateLook("danger", "s:close-circle", "estadoTraslado.rechazado"), "ejecutado" to ZcStateLook("success", "s:check-circle", "estadoTraslado.ejecutado")))
    val taxIdRules = mapOf("pe" to ZcTaxIdRule(11, "numeric", Regex("\\d")), "ec" to ZcTaxIdRule(13, "numeric", Regex("\\d")), "bo" to ZcTaxIdRule(12, "numeric", Regex("\\d")), "co" to ZcTaxIdRule(11, "numeric", Regex("[\\d-]")), "cl" to ZcTaxIdRule(12, "text", Regex("[\\dkK.-]")), "mx" to ZcTaxIdRule(13, "text", Regex("[A-Za-zÑñ&\\d]")))
    const val RECUR_MAX_INTERVAL = 30
    const val RECUR_MAX_COUNT = 100
}
