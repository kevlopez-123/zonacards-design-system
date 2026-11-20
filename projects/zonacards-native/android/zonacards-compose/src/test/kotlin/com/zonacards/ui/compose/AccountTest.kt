package com.zonacards.ui.compose

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.ZcIcons
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Cuenta y sesión (ola 5): acceso, segundo factor, país, notificaciones, sesión por expirar, acceso con proveedor y logos. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class AccountTest {
    @get:Rule val rule = createComposeRule()

    private fun has(text: String) = rule.onAllNodes(androidx.compose.ui.test.hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()
    private fun field(i: Int) = rule.onAllNodes(hasSetTextAction())[i]
    private fun fillLogin(email: String = "ana@promotick.com", pw: String = "ok") { field(0).performTextInput(email); field(1).performTextInput(pw) }

    // ---------- Acceso ----------

    @Test fun loginThenOtpThenDone() {
        var signed = 0
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcAuth({ _, pw -> if (pw == "ok") ZcLoginResult.OTP else ZcLoginResult.BAD }, { it == "123456" }, { signed++ }, userName = "Ana")
        } }
        fillLogin()
        rule.onNodeWithText("Ingresar").performClick()
        rule.waitUntil(5000) { has("Verifica que eres tú") }
        rule.onNodeWithText("Reenviar código en", substring = true).assertIsDisplayed()
        rule.onNode(hasSetTextAction()).performTextInput("123456")
        rule.waitUntil(5000) { signed > 0 }
        rule.onNodeWithText("Hola, Ana").assertIsDisplayed()
    }

    @Test fun emptyFormShowsErrorsWithoutCallingLogin() {
        var calls = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcAuth({ _, _ -> calls++; ZcLoginResult.OK }, { true }, {}) } }
        rule.onNodeWithText("Ingresar").performClick()
        rule.onNodeWithText("Ingresa tu correo.").assertIsDisplayed()
        rule.onNodeWithText("Ingresa tu contraseña.").assertIsDisplayed()
        assertEquals(0, calls)
    }

    @Test fun wrongPasswordCountsAttemptsAndLocksAfterFive() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcAuth({ _, _ -> ZcLoginResult.BAD }, { true }, {}) } }
        field(0).performTextInput("ana@promotick.com")
        repeat(5) { i ->
            field(1).performTextInput("mala")
            rule.onNodeWithText("Ingresar").performClick()
            rule.waitForIdle()
            when (i) {
                0 -> assertTrue(has("Correo o contraseña incorrectos") && !has("Te quedan"))
                2 -> assertTrue(has("Te quedan 2 intentos"))
            }
        }
        rule.onNodeWithText("Cuenta bloqueada temporalmente").assertIsDisplayed()
        rule.onNodeWithText("Ingresar").assertIsNotEnabled()
    }

    @Test fun aNetworkErrorIsNotAFailedAttempt() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcAuth({ _, _ -> error("sin red") }, { true }, {}) } }
        fillLogin()
        rule.onNodeWithText("Ingresar").performClick()
        rule.waitUntil(3000) { has("Revisa tu conexión") }
        assertTrue(!has("Correo o contraseña incorrectos"))
    }

    @Test fun forgotPasswordSendsTheLinkAndNeverRevealsTheAccount() {
        var sentTo: String? = null
        rule.setContent { ZonacardsTheme(dark = false) { ZcAuth({ _, _ -> ZcLoginResult.BAD }, { true }, {}, forgot = { sentTo = it }) } }
        rule.onNodeWithText("¿Olvidaste tu contraseña?").assertHeightIsAtLeast(44.dp).performClick()
        rule.onNodeWithText("Recupera tu contraseña").assertIsDisplayed()
        field(0).performTextInput("no-es-correo")
        rule.onNodeWithText("Enviar enlace").performClick()
        rule.onNodeWithText("Ingresa un correo válido.").assertIsDisplayed()
        field(0).performTextInput("@empresa.com")
        rule.onNodeWithText("Enviar enlace").performClick()
        rule.waitUntil(3000) { has("Revisa tu correo") }
        assertEquals("no-es-correo@empresa.com", sentTo)
        rule.onNodeWithText("Volver a ingresar").performClick()
        rule.onNodeWithText("Ingresa al administrador").assertIsDisplayed()
    }

    @Test fun forgotFailureShowsTheAlert() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcAuth({ _, _ -> ZcLoginResult.BAD }, { true }, {}, forgot = { error("falló") }) } }
        rule.onNodeWithText("¿Olvidaste tu contraseña?").performClick()
        field(0).performTextInput("ana@empresa.com")
        rule.onNodeWithText("Enviar enlace").performClick()
        rule.waitUntil(3000) { has("No pudimos enviar el enlace") }
    }

    @Test fun adminOffersMicrosoftAndShopOffersGoogleAndAppleWithSignup() {
        rule.setContent { ZonacardsTheme(dark = false) { androidx.compose.foundation.layout.Column {
            ZcAuth({ _, _ -> ZcLoginResult.BAD }, { true }, {}, variant = ZcAuthVariant.ADMIN)
        } } }
        rule.onNodeWithContentDescription("Iniciar sesión con Microsoft").assertHeightIsAtLeast(44.dp)
    }

    @Test fun shopVariantHasSocialAccessAndSignup() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcAuth({ _, _ -> ZcLoginResult.BAD }, { true }, {}, variant = ZcAuthVariant.SHOP) } }
        rule.onNodeWithContentDescription("Continuar con Google").assertExists()
        rule.onNodeWithContentDescription("Continuar con Apple").assertExists()
        rule.onNodeWithText("Regístrate").performClick()
        rule.onNodeWithText("Crea tu cuenta").assertIsDisplayed()
        rule.onNodeWithContentDescription("Registrarse con Google").assertExists()
        rule.onNodeWithText("Ingresa").performClick()
        rule.onNodeWithText("Ingresa a tu cuenta").assertIsDisplayed()
    }

    @Test fun recoveryCodeEntersWhenTheAuthenticatorIsLost() {
        var signed = 0
        var received: String? = null
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcAuth({ _, _ -> ZcLoginResult.OTP }, { false }, { signed++ }, userName = "Ana", verifyRecoveryCode = { received = it; it == "AAAA-BBBB" })
        } }
        fillLogin()
        rule.onNodeWithText("Ingresar").performClick()
        rule.waitUntil(5000) { has("Verifica que eres tú") }
        rule.onNodeWithText("Usar código de recuperación").performClick()
        rule.onNodeWithText("Usa un código de recuperación").assertIsDisplayed()
        rule.onNodeWithText("Ingresar").performClick()
        rule.onNodeWithText("Escribe un código de recuperación").assertIsDisplayed()
        field(0).performTextInput("aaaa-bbbb")
        rule.onNodeWithText("Ingresar").performClick()
        rule.waitUntil(5000) { signed > 0 }
        assertEquals("AAAA-BBBB", received)
    }

    @Test fun setupViewShowsTheMfaSlotAndFinishes() {
        var signed = 0
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcAuth({ _, _ -> ZcLoginResult.SETUP }, { true }, { signed++ }, userName = "Ana", mfaSetup = { done -> ZcButton("Terminé", done) })
        } }
        fillLogin()
        rule.onNodeWithText("Ingresar").performClick()
        rule.waitUntil(5000) { has("Configura la verificación en dos pasos") }
        rule.onNodeWithText("Terminé").performClick()
        assertEquals(1, signed)
    }

    // ---------- Segundo factor ----------

    @Test fun mfaScansVerifiesSavesCodesAndFinishes() {
        var finished = 0
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcMfaSetup("otpauth://totp/Zona:ana@x.com?secret=JBSWY3DPEHPK3PXP", "JBSWY3DPEHPK3PXP", { it == "123456" }, { finished++ }, account = "Zona · ana@x.com", recoveryCodes = listOf("AAAA-1111", "BBBB-2222"))
        } }
        rule.onNodeWithText("Escanea el código QR").assertIsDisplayed()
        rule.onNodeWithContentDescription("Código QR para la app de autenticación").assertExists()
        rule.onNodeWithText("Continuar").performClick()
        rule.onNodeWithText("Escribe el código de la app").assertIsDisplayed()
        rule.onNode(hasSetTextAction()).performTextInput("123456")
        rule.waitUntil(5000) { has("Guarda tus códigos de recuperación") }
        rule.onNodeWithText("Terminar").assertIsNotEnabled()
        rule.onNodeWithText("AAAA-1111").assertIsDisplayed()
        rule.onNodeWithText("Guardé mis códigos en un lugar seguro").performClick()
        rule.onNodeWithText("Terminar").assertIsEnabled().performClick()
        assertEquals(1, finished)
        rule.onNodeWithText("Verificación en dos pasos activada").assertIsDisplayed()
    }

    @Test fun mfaWrongCodeShowsTheErrorAndClearsTheField() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcMfaSetup("otpauth://x", "ABCD", { false }, {}) } }
        rule.onNodeWithText("Continuar").performClick()
        rule.onNode(hasSetTextAction()).performTextInput("111111")
        rule.waitUntil(5000) { has("El código no es correcto") }
    }

    @Test fun mfaWithoutRecoveryCodesFinishesRightAfterVerifying() {
        var finished = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcMfaSetup("otpauth://x", "ABCD", { true }, { finished++ }) } }
        rule.onNodeWithText("Continuar").performClick()
        rule.onNode(hasSetTextAction()).performTextInput("123456")
        rule.waitUntil(5000) { finished > 0 }
    }

    // ---------- Sesión por expirar ----------

    @Test fun sessionTimeoutExtendsWithTheButton() {
        var open by mutableStateOf(true)
        var extended = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcSessionTimeout(open, { open = it }, { extended++ }, {}, seconds = 30) } }
        rule.onNodeWithText("Tu sesión está por expirar").assertIsDisplayed()
        rule.onNodeWithText("Se cerrará en", substring = true).assertIsDisplayed()
        rule.onNodeWithText("Seguir conectado").performClick()
        assertEquals(1, extended)
        assertEquals(false, open)
    }

    @Test fun sessionTimeoutLogsOutWhenTheCountdownEnds() {
        var open by mutableStateOf(true)
        var logouts = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcSessionTimeout(open, { open = it }, {}, { logouts++ }, seconds = 3) } }
        rule.mainClock.advanceTimeBy(3500)
        rule.waitForIdle()
        assertEquals(1, logouts)
        assertEquals(false, open)
    }

    @Test fun sessionTimeoutLogoutButton() {
        var open by mutableStateOf(true)
        var logouts = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcSessionTimeout(open, { open = it }, {}, { logouts++ }) } }
        rule.onNodeWithText("Cerrar sesión").performClick()
        assertEquals(1, logouts)
    }

    // ---------- País de operación ----------

    @Test fun countrySwitcherListsCountriesAndPicksOne() {
        var value = "pe"
        rule.setContent { ZonacardsTheme(dark = false) { var v by remember { mutableStateOf("pe") }; ZcCountrySwitcher(v, { v = it; value = it }) } }
        rule.onNode(hasContentDescription("País de operación: Perú", substring = true)).assertHeightIsAtLeast(44.dp).performClick()
        rule.onNodeWithText("Chile").performClick()
        assertEquals("cl", value)
        rule.onNode(hasContentDescription("País de operación: Chile", substring = true)).assertExists()
    }

    @Test fun countrySwitcherWithOneAllowedIsFixedAndCoercesOutOfScopeValues() {
        var value = "mx"
        rule.setContent { ZonacardsTheme(dark = false) { ZcCountrySwitcher(value, { value = it }, allowed = listOf("pe")) } }
        rule.waitForIdle()
        assertEquals("pe", value)
        rule.onNode(hasContentDescription("único en tu alcance", substring = true)).assertExists()
    }

    // ---------- Notificaciones ----------

    private val sample = listOf(
        ZcNotification("1", ZcIcons.sCheckCircle, "Lote 02830 espera tu aprobación", "Aprobaciones · hace 5 min", ZcNotificationKind.APR, true, "Hoy"),
        ZcNotification("2", ZcIcons.sDangerTriangle, "Stock bajo el mínimo", "Alertas · hace 1 h", ZcNotificationKind.ALR, true, "Hoy"),
        ZcNotification("3", ZcIcons.sCheckCircle, "Aprobaste el lote 02829", "Aprobaciones · ayer", ZcNotificationKind.APR, false, "Anteriores"),
    )

    @Test fun notificationsCountMarkAllAndFilter() {
        var items = sample
        rule.setContent { ZonacardsTheme(dark = false) { var l by remember { mutableStateOf(sample) }; ZcNotifications(l, { l = it; items = it }, {}, {}) } }
        rule.onNodeWithContentDescription("Notificaciones, 2 sin leer").assertHeightIsAtLeast(44.dp).performClick()
        rule.onNodeWithText("Lote 02830 espera tu aprobación").assertIsDisplayed()
        rule.onNodeWithText("Hoy").assertIsDisplayed()
        rule.onNodeWithText("Alertas").performClick()
        assertTrue(!has("Lote 02830"))
        rule.onNodeWithText("Stock bajo el mínimo").assertIsDisplayed()
        rule.onNodeWithText("Marcar todo como leído").performClick()
        assertTrue(items.none { it.unread })
        rule.onNodeWithContentDescription("Notificaciones, 0 sin leer").assertExists()
    }

    @Test fun openingANotificationMarksItReadAndNavigates() {
        var opened: String? = null
        var items = sample
        rule.setContent { ZonacardsTheme(dark = false) { var l by remember { mutableStateOf(sample) }; ZcNotifications(l, { l = it; items = it }, { opened = it.id }, {}) } }
        rule.onNodeWithContentDescription("Notificaciones, 2 sin leer").performClick()
        rule.onNodeWithText("Stock bajo el mínimo").performClick()
        assertEquals("2", opened)
        assertEquals(false, items.first { it.id == "2" }.unread)
    }

    @Test fun noNotificationsShowsTheEmptyState() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcNotifications(emptyList(), {}, {}, {}) } }
        rule.onNodeWithContentDescription("Notificaciones, 0 sin leer").performClick()
        rule.onNodeWithText("Sin notificaciones").assertIsDisplayed()
    }

    // ---------- Acceso con proveedor y logos ----------

    @Test fun ssoButtonClicksAndBlocksWhileRedirecting() {
        var clicks = 0
        rule.setContent { ZonacardsTheme(dark = false) { androidx.compose.foundation.layout.Column {
            ZcSsoButton(ZcSsoProvider.GOOGLE, { clicks++ }, block = true)
            ZcSsoButton(ZcSsoProvider.APPLE, { clicks += 10 }, block = true, loading = true)
            ZcSsoButton(ZcSsoProvider.MICROSOFT, {}, text = null)
        } } }
        rule.onNodeWithContentDescription("Continuar con Google").assertHeightIsAtLeast(44.dp).performClick()
        assertEquals(1, clicks)
        rule.onNodeWithContentDescription("Continuar con Apple").assertIsNotEnabled()
        // Solo el logo: lleva el nombre para TalkBack.
        rule.onNodeWithContentDescription("Iniciar sesión con Microsoft").assertExists()
    }

    @Test fun logoRegistryHasEveryLogoOfTheWeb() {
        var ctx: Context? = null
        rule.setContent { ZonacardsTheme(dark = false) {
            ctx = LocalContext.current
            androidx.compose.foundation.layout.Column {
                ZcLogo("visa", label = true); ZcLogo("mastercard"); ZcLogo("apple", mono = true); ZcLogo("no-existe")
            }
        } }
        val r = zcLogoRegistry(ctx!!)
        assertEquals(32, r.logos.size)
        assertEquals(setOf("google-icon", "apple", "microsoft-icon"), r.sso.keys)
        assertEquals(4, r.sso.getValue("google-icon").parts.size)
        rule.onNodeWithContentDescription("Visa").assertExists()
    }
}
