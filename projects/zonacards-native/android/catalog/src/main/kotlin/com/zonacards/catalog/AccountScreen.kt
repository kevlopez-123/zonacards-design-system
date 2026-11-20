package com.zonacards.catalog

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
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
    }
}
