package com.zonacards.catalog

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.zonacards.ui.compose.*
import com.zonacards.ui.tokens.ZcIcons
import kotlinx.coroutines.delay

private val CODES = listOf("K7M2-9QXA", "P4TD-81ZB", "W9RC-3HNE", "F2LV-6YUJ", "B8GS-0DKQ", "Z5XA-7MTP")

/** Cuenta y sesión de la ola 5: acceso, segundo factor, país, notificaciones, sesión por expirar, botones de acceso y logos. */
@Composable
fun AccountScreen(toasts: ZcToastState) {
    Page {
        Section("Acceso (prueba con ana@promotick.com / Demo#2026 y el código 123456)") {
            var shop by rememberSaveable { mutableStateOf(false) }
            val state = rememberZcAuthState()
            ZcSegmented(listOf(ZcSegmentOption("admin", "Administrador"), ZcSegmentOption("shop", "Portal")), if (shop) "shop" else "admin", { shop = it == "shop"; state.reset() }, label = "Variante")
            ZcAuth(
                login = { email, pw -> delay(300); if (email == "ana@promotick.com" && pw == "Demo#2026") ZcLoginResult.OTP else ZcLoginResult.BAD },
                verifyOtp = { delay(200); it == "123456" },
                onSignedIn = { toasts.success("Ingresaste") },
                variant = if (shop) ZcAuthVariant.SHOP else ZcAuthVariant.ADMIN, state = state, userName = "Ana",
                forgot = { delay(300) }, verifyRecoveryCode = { delay(200); it == "K7M2-9QXA" },
                termsUrl = "https://example.com/terminos", privacyUrl = "https://example.com/privacidad",
            )
            ZcButton("Reiniciar demostración", { state.reset() }, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM)
        }
        Section("Activar el segundo factor") {
            ZcMfaSetup(
                "otpauth://totp/Zonacards:ana@empresa.com?secret=JBSWY3DPEHPK3PXP&issuer=Zonacards", "JBSWY3DPEHPK3PXP",
                verify = { delay(300); it == "123456" }, onFinished = { toasts.success("Verificación activada") },
                account = "Zonacards · ana@empresa.com", recoveryCodes = CODES,
            )
        }
        Section("País de operación") {
            var country by rememberSaveable { mutableStateOf("pe") }
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                ZcCountrySwitcher(country, { country = it })
                ZcCountrySwitcher("pe", {}, allowed = listOf("pe"))
            }
        }
        Section("Notificaciones") {
            var items by remember {
                mutableStateOf(
                    listOf(
                        ZcNotification("1", ZcIcons.sCheckCircle, "Lote #02830 espera tu aprobación", "Aprobaciones · hace 5 min", ZcNotificationKind.APR, true, "Hoy"),
                        ZcNotification("2", ZcIcons.sDangerTriangle, "Stock bajo el mínimo en Navidad 2026", "Alertas · hace 1 h", ZcNotificationKind.ALR, true, "Hoy"),
                        ZcNotification("3", ZcIcons.sCheckCircle, "Aprobaste el lote #02829", "Aprobaciones · ayer", ZcNotificationKind.APR, false, "Anteriores"),
                    ),
                )
            }
            ZcNotifications(items, { items = it }, { toasts.info("Abrir: ${it.title}") }, { toasts.info("Ver todas") })
        }
        Section("Sesión por expirar") {
            var open by rememberSaveable { mutableStateOf(false) }
            ZcButton("Mostrar el aviso", { open = true }, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM)
            ZcSessionTimeout(open, { open = it }, onExtend = { toasts.success("Sesión extendida") }, onLogout = { toasts.info("Sesión cerrada") }, seconds = 30)
        }
        Section("Acceso con proveedor") {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                ZcSsoButton(ZcSsoProvider.GOOGLE, {}, block = true)
                ZcSsoButton(ZcSsoProvider.GOOGLE, {}, theme = ZcSsoTheme.DARK, block = true, text = ZcSsoText.SIGNIN)
                ZcSsoButton(ZcSsoProvider.APPLE, {}, block = true)
                ZcSsoButton(ZcSsoProvider.APPLE, {}, theme = ZcSsoTheme.OUTLINE, block = true, text = ZcSsoText.SIGNUP)
                ZcSsoButton(ZcSsoProvider.MICROSOFT, {}, block = true, text = ZcSsoText.SIGNIN)
                ZcSsoButton(ZcSsoProvider.MICROSOFT, {}, block = true, text = ZcSsoText.SIGNIN, loading = true)
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    ZcSsoButton(ZcSsoProvider.GOOGLE, {}, text = null)
                    ZcSsoButton(ZcSsoProvider.APPLE, {}, text = null)
                    ZcSsoButton(ZcSsoProvider.MICROSOFT, {}, text = null)
                }
            }
        }
        Section("Logos de medios de pago y marcas") {
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                listOf("visa", "mastercard", "paypal", "whatsapp", "netflix", "apple").forEach { ZcLogo(it, size = 32.dp, label = true) }
                ZcLogo("visa", size = 32.dp, mono = true)
                ZcLogo("marca-inexistente", size = 32.dp)
            }
        }
        Section("Logo de la marca sobre la imagen") {
            androidx.compose.foundation.layout.Box(Modifier.fillMaxWidth().height(160.dp).background(ZonacardsTheme.colors.surface3)) { ZcBrandLogo("Repsol") }
        }
        Section("Hoja legal y consentimiento") {
            var checked by rememberSaveable { mutableStateOf(false) }
            var tried by rememberSaveable { mutableStateOf(false) }
            var sheet by rememberSaveable { mutableStateOf<String?>(null) }
            ZcLegalConsent(checked, { checked = it }, { sheet = "terms" }, { sheet = "privacy" }, error = tried)
            ZcButton("Probar sin aceptar", { tried = true }, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM)
            if (sheet == "terms") ZcLegalSheet("Términos y condiciones", TERMS, { sheet = null }, confirmLabel = "Aceptar", onConfirm = { checked = true })
            if (sheet == "privacy") ZcLegalSheet("Política de privacidad", PRIVACY, { sheet = null })
        }
        Section("Ayuda y soporte") {
            var open by rememberSaveable { mutableStateOf(false) }
            ZcButton("Abrir ayuda y soporte", { open = true }, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM)
            if (open) ZcSupportSheet(SUPPORT, { open = false }, actions = ZcSupportActions({ toasts.info("Llamar ${it}") }, { toasts.info("WhatsApp ${it}") }, { toasts.info("Correo ${it}") }, { toasts.info("Web ${it}") }))
        }
        Section("Eliminar mi cuenta (código de prueba 123456)") {
            var masked by rememberSaveable { mutableStateOf<String?>(null) }
            var sending by remember { mutableStateOf(false) }
            var submitting by remember { mutableStateOf(false) }
            var error by remember { mutableStateOf<String?>(null) }
            var request by remember { mutableStateOf<ZcDeletionRequest?>(null) }
            var pending by remember { mutableStateOf<String?>(null) }
            LaunchedEffect(sending) { if (sending) { delay(400); masked = "a•••@empresa.com"; sending = false } }
            LaunchedEffect(pending) {
                val code = pending ?: return@LaunchedEffect
                delay(400); submitting = false; pending = null
                if (code == "123456") request = ZcDeletionRequest(true, "Pendiente", java.time.Instant.parse("2026-11-20T20:30:00Z")) else error = "El código no es válido."
            }
            ZcDeleteAccount(
                request, masked, onSendCode = { sending = true }, onSubmit = { code, _ -> error = null; submitting = true; pending = code },
                onBack = { request = null; masked = null; error = null }, sending = sending, submitting = submitting, error = error,
            )
        }
        Section("Introducción a pantalla completa") {
            var done by rememberSaveable { mutableStateOf(false) }
            if (done) ZcButton("Ver la introducción otra vez", { done = false }, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM)
            else androidx.compose.foundation.layout.Box(Modifier.fillMaxWidth().height(420.dp).clip(androidx.compose.foundation.shape.RoundedCornerShape(24.dp))) {
                ZcIntroSlides(INTRO, { done = true }, { done = true })
            }
        }
    }
}

private val TERMS = ZcLegalDocument("Términos y condiciones", "2026.3", listOf(
    ZcLegalSection("1. Uso de las gift cards", listOf("Las gift cards se canjean una sola vez y no son reembolsables.", "El saldo no usado vence en la fecha indicada en cada código.")),
    ZcLegalSection("2. Tus datos", listOf("Usamos tu correo y tu teléfono solo para enviarte los códigos y avisarte de cambios.")),
))
private val PRIVACY = ZcLegalDocument("Política de privacidad", "2026.1", listOf(ZcLegalSection("Qué guardamos", listOf("Guardamos el mínimo necesario para operar tu cuenta y cumplir la ley."))))
private val SUPPORT = ZcSupportInfo("Lunes a viernes de 9:00 a 18:00", "+5117008000", "+51900000099", "soporte@zonacards.com", "https://ayuda.zonacards.com")
private val INTRO = listOf(
    ZcIntroSlide("Regala en segundos", "Elige un monto, escribe el correo y listo: la gift card llega al instante.", icon = ZcIcons.sGift),
    ZcIntroSlide("Todo bajo control", "Sigue cada envío, anula con aprobación y descarga tus reportes.", icon = ZcIcons.sShieldCheck),
    ZcIntroSlide("Siempre contigo", "Tus marcas favoritas en 6 países, desde un solo lugar.", icon = ZcIcons.sGlobal),
)

