package com.zonacards.ui.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.assertIsOff
import androidx.compose.ui.test.assertIsOn
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.ZcIcons
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Dominio (ola 4): tarjeta, KPI, monto, estados, pases, checkout y carrito, contra el comportamiento de la web. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DomainComponentsTest {
    @get:Rule val rule = createComposeRule()
    /** Monto como lo escribe la web (con espacio irrompible después del símbolo). */
    private fun m(a: Double) = com.zonacards.ui.tokens.domain.ZcMoney.format(a, "pe")

    @Test fun cardOpensAndAsideKeepsItsOwnTap() {
        var opened = 0; var menu = 0
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcCard("Lote #02829", subtitle = "1.200 códigos", icon = ZcIcons.sBox, onClick = { opened++ }, aside = { ZcIconButton(ZcIcons.sMenuDotsVerticalBold, "Acciones", { menu++ }) })
        } }
        rule.onNodeWithText("Lote #02829").performClick()
        rule.onNodeWithContentDescription("Acciones").performClick()
        assertEquals(1, opened); assertEquals(1, menu)
    }

    @Test fun kpiDeltaAndFilter() {
        assertEquals("+8.2 %", zcFormatDelta(8.2)) // es-PE usa punto decimal, como Intl en la web
        assertEquals("−3 %", zcFormatDelta(-3.0))
        rule.setContent { ZonacardsTheme(dark = false) {
            var on by remember { mutableStateOf(false) }
            ZcKpi("Ventas", "S/ 12,500.00", delta = 8.2, deltaLabel = "vs. mes anterior", trend = listOf(1.0, 3.0, 2.0, 5.0), filter = true, pressed = on, onPressedChange = { on = it })
        } }
        rule.onNodeWithText("+8.2 %").assertExists()
        rule.onNodeWithText("Ventas").assertIsOff().performClick().assertIsOn()
    }

    @Test fun moneyAbbreviatesWhenNarrowButReadsFull() {
        rule.setContent { ZonacardsTheme(dark = false) { Column {
            ZcMoneyText(1234567.0, "pe", Modifier.width(400.dp))
            ZcMoneyText(7654321.0, "pe", Modifier.width(60.dp))
        } } }
        rule.onNodeWithContentDescription(m(1234567.0)).assertExists()
        // El abreviado es solo visual (galería); TalkBack lee siempre la cifra completa. // no cabe: abreviado
        rule.onNodeWithContentDescription(m(7654321.0)).assertExists() // TalkBack lee la cifra completa
    }

    @Test fun stateBadgeFromMachine() {
        rule.setContent { ZonacardsTheme(dark = false) { Column {
            ZcStateBadge(ZcStates.lot, "pendiente_aprobacion")
            ZcStateBadge(ZcStates.giftcard, "voided")
        } } }
        rule.onNodeWithText("Pendiente de aprobación").assertExists()
        rule.onNodeWithText("Anulado").assertExists()
    }

    @Test fun numberFieldRespectsRange() {
        var q = 0
        rule.setContent { ZonacardsTheme(dark = false) { var v by remember { mutableStateOf(9) }; ZcNumberField(v, { v = it; q = it }, min = 1, max = 10, label = "Cantidad") } }
        rule.onNodeWithContentDescription("Aumentar").performClick()
        assertEquals(10, q)
        rule.onNodeWithContentDescription("Aumentar").performClick() // en el máximo no sube
        assertEquals(10, q)
    }

    @Test fun walletAndGiftcardPassesReadAsImages() {
        rule.setContent { ZonacardsTheme(dark = false) { Column {
            ZcWalletPass(ZcLoyaltyPass("Zona Puntos", "Lucía Mendoza", 12500, "Oro", Color(0xFF111827), Color.White, Color(0xFFF8AE23), "ZP-0001"))
            ZcGiftcardPass(ZcGiftcardData("Cineplanet", "Giftcard S/ 100", 100.0, "6011000099991234", pin = "1234", expires = "2027-03-31", bg = Color(0xFF1E3A8A), fg = Color.White, label = Color(0xFFBFDBFE)), "pe")
        } } }
        rule.onNodeWithContentDescription("Pase de Apple Wallet: Zona Puntos, 12,500 puntos, nivel Oro").assertExists()
        rule.onNodeWithContentDescription("Giftcard de Cineplanet en Google Wallet, saldo ${m(100.0)}").assertExists()
    }

    @Test fun checkoutStepsStatusAndEdit() {
        var step = 1
        rule.setContent { ZonacardsTheme(dark = false) {
            var cur by remember { mutableStateOf(1) }
            ZcCheckoutSteps(listOf(ZcCheckoutStep("a", "Destinatario", "ana@empresa.com"), ZcCheckoutStep("b", "Pago"), ZcCheckoutStep("c", "Confirmación")), cur, { cur = it; step = it }) { i -> ZcText("Cuerpo $i") }
        } }
        rule.onNodeWithContentDescription("Destinatario, completado").assertExists()
        rule.onNodeWithContentDescription("Pago, paso actual").assertExists()
        rule.onNodeWithContentDescription("Confirmación, bloqueado").assertExists()
        rule.onNodeWithText("Cuerpo 1").assertExists()
        rule.onNodeWithText("Editar").performClick()
        assertEquals(0, step)
    }

    @Test fun cartTotalsRemoveAndEmpty() {
        val toasts = ZcToastState()
        rule.setContent { ZonacardsTheme(dark = false) {
            var lines by remember { mutableStateOf(listOf(ZcCartLine("1", "Giftcard Cine", "Cineplanet", 50.0, 2), ZcCartLine("2", "Spa", "Zen", 120.0, 1))) }
            ZcCart(lines, { lines = it }, "pe", discount = 30.0, fees = listOf(ZcCartFee("Cargo por servicio", 5.0, "Cubre el envío digital")), toasts = toasts)
        } }
        rule.onNodeWithText(m(195.0)).assertExists() // 100 + 120 − 30 + 5
        rule.onNodeWithText("−" + m(30.0)).assertExists()
        rule.onNodeWithContentDescription("Eliminar Spa del carrito").performClick()
        rule.onNodeWithContentDescription("Eliminar Giftcard Cine del carrito").performClick()
        rule.onNodeWithText("Tu carrito está vacío").assertExists()
        assertEquals(2, toasts.items.size)
    }

    @Test fun permissionPromptAndPush() {
        rule.setContent { ZonacardsTheme(dark = false) { Column {
            ZcPermissionPrompt(ZcIcons.sQrCodeBold, "Usa la cámara para escanear", "Solo la usamos mientras escaneas.") {
                ZcButton("Permitir cámara", {}, block = true); ZcButton("Ahora no", {}, variant = ZcButtonVariant.GHOST, block = true)
            }
            ZcPushPreview("Zonacards", "ahora", "Lote aprobado", "El lote #02829 ya está activo.")
        } } }
        rule.onNodeWithText("Ahora no").assertExists()
        rule.onNodeWithContentDescription("Zonacards: Lote aprobado. El lote #02829 ya está activo.").assertExists()
    }
}
