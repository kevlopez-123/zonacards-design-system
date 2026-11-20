package com.zonacards.ui.compose

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
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

private val CODES = mapOf(
    "VERANO10" to ZcCoupon("VERANO10", ZcCouponKind.PCT, 0.10, "10 % de descuento"),
    "SOLO20" to ZcCoupon("SOLO20", ZcCouponKind.FIX, 20.0, "No se combina", solo = true),
)
private val check: suspend (String) -> ZcCouponCheck = { code ->
    when {
        code == "VENCIDO" -> ZcCouponCheck.Expired("01/10/2026")
        CODES[code] != null -> ZcCouponCheck.Valid(CODES.getValue(code))
        else -> ZcCouponCheck.NotFound
    }
}

/** Comercio (ola 5): monto, cupones, anuncio, guía, ayuda y carrusel. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class CommerceTest {
    @get:Rule val rule = createComposeRule()

    @Test fun couponMathNeverExceedsTheSubtotal() {
        val pct = ZcCoupon("A", ZcCouponKind.PCT, 0.10, "")
        val fix = ZcCoupon("B", ZcCouponKind.FIX, 500.0, "")
        assertEquals(20.0, pct.discountOf(200.0), 0.0001)
        assertEquals(200.0, fix.discountOf(200.0), 0.0001)
        assertEquals(200.0, zcCouponsTotal(listOf(pct, fix), 200.0), 0.0001)
    }

    @Test fun amountPickerChoosesAnAmountAndShowsTheTotal() {
        var picked: Double? = null
        rule.setContent { ZonacardsTheme(dark = false) {
            var v by remember { mutableStateOf<Double?>(null) }
            ZcAmountPicker("¿De cuánto será el valor?", listOf(50.0, 100.0), v, { v = it; picked = it }, soldOut = listOf(500.0))
        } }
        rule.onNodeWithText("Total", substring = true).assertIsDisplayed()
        val s50 = com.zonacards.ui.tokens.domain.ZcMoney.formatWhole(50.0, "pe") // lleva un espacio irrompible: se arma con la misma función
        rule.onNodeWithText(s50).assertHeightIsAtLeast(44.dp).assertIsNotSelected().performClick()
        assertEquals(50.0, picked)
        rule.onNodeWithText(s50).assertIsSelected()
        rule.onNodeWithText("Total", substring = true).assertTextContainsAmount("50")
        // Un agotado no responde y se anuncia como tal.
        rule.onNode(hasContentDescription("agotado", substring = true)).assertExists().assert(SemanticsMatcher.keyNotDefined(SemanticsActions.OnClick))
    }

    private fun androidx.compose.ui.test.SemanticsNodeInteraction.assertTextContainsAmount(n: String) = assert(SemanticsMatcher("contiene $n") {
        it.config.getOrNull(SemanticsProperties.Text)?.joinToString("") { t -> t.text }.orEmpty().contains(n)
    })

    @Test fun amountPickerOtherOpensAFreeAmount() {
        var picked: Double? = 100.0
        rule.setContent { ZonacardsTheme(dark = false) {
            var v by remember { mutableStateOf<Double?>(100.0) }
            ZcAmountPicker("Valor", listOf(50.0, 100.0), v, { v = it; picked = it })
        } }
        rule.onNodeWithText("Otro").performClick()
        assertEquals("al abrir Otro vacío no hay monto", null, picked)
        rule.onNode(hasSetTextAction()).performTextInput("250")
        assertEquals(250.0, picked)
        rule.onNodeWithText("Total", substring = true).assertTextContainsAmount("250")
    }

    @Test fun couponAppliesValidatesAndRemoves() {
        var applied = listOf<ZcCoupon>()
        rule.setContent { ZonacardsTheme(dark = false) {
            var v by remember { mutableStateOf(applied) }
            ZcCouponField("Cupones", v, { v = it; applied = it }, check, subtotal = 200.0)
        } }
        rule.onNodeWithText("Aplicar").assertIsNotEnabled()
        rule.onNode(hasSetTextAction()).performTextInput("verano10")
        rule.onNode(hasSetTextAction()).assertTextEquals("VERANO10")
        rule.onNodeWithText("Aplicar").assertIsEnabled().performClick()
        rule.waitUntil(3000) { applied.isNotEmpty() }
        assertEquals(listOf("VERANO10"), applied.map { it.code })
        rule.onNodeWithText("10 % de descuento").assertIsDisplayed()
        rule.onNodeWithText("20.00", substring = true).assertIsDisplayed()
        rule.onNodeWithText("VERANO10 aplicado", substring = true).assertIsDisplayed()

        // El mismo código otra vez, uno que no existe y uno vencido.
        rule.onNode(hasSetTextAction()).performTextInput("VERANO10")
        rule.onNodeWithText("Aplicar").performClick()
        rule.onNodeWithText("Ya aplicaste este código.").assertIsDisplayed()
        rule.onNode(hasSetTextAction()).performTextInput("X")
        rule.onNodeWithText("Aplicar").performClick()
        rule.waitUntil(3000) { rule.onAllNodesWithTextCount("no existe") > 0 }
        rule.onNode(hasSetTextAction()).performTextInput("A")
        rule.onNode(hasContentDescription("Quitar VERANO10")).assertHeightIsAtLeast(44.dp).performClick()
        assertTrue(applied.isEmpty())
        rule.onNodeWithText("VERANO10 quitado.").assertIsDisplayed()
    }

    private fun androidx.compose.ui.test.junit4.ComposeContentTestRule.onAllNodesWithTextCount(s: String) =
        onAllNodes(androidx.compose.ui.test.hasText(s, substring = true)).fetchSemanticsNodes().size

    @Test fun soloCouponDoesNotCombine() {
        var applied = listOf(CODES.getValue("VERANO10"))
        rule.setContent { ZonacardsTheme(dark = false) {
            var v by remember { mutableStateOf(applied) }
            ZcCouponField("Cupones", v, { v = it; applied = it }, check, subtotal = 200.0)
        } }
        rule.onNode(hasSetTextAction()).performTextInput("SOLO20")
        rule.onNode(hasSetTextAction()).performImeAction()
        rule.waitUntil(3000) { rule.onAllNodesWithTextCount("no se puede combinar") > 0 }
        assertEquals(1, applied.size)
    }

    @Test fun announcementClosesAndStaysClosed() {
        var open = true
        rule.setContent { ZonacardsTheme(dark = false) {
            var o by remember { mutableStateOf(true) }
            ZcAnnouncement("Novedad", "Aprovecha el 20 % de descuento hoy.", o, { o = it; open = it }, highlight = "20 % de descuento")
        } }
        rule.onNodeWithText("Aprovecha el 20 % de descuento hoy.", substring = true).assertIsDisplayed()
        rule.onNodeWithContentDescription("Cerrar Novedad").assertHeightIsAtLeast(44.dp).performClick()
        assertEquals(false, open)
        rule.onNodeWithContentDescription("Cerrar Novedad").assertDoesNotExist()
    }

    @Test fun onboardingNumbersItsStepsAndHides() {
        var open = true
        rule.setContent { ZonacardsTheme(dark = false) {
            var o by remember { mutableStateOf(true) }
            ZcOnboarding("Compra en tres pasos", listOf("Elige el monto.", "Agrega destinatarios.", "Paga."), o, { o = it; open = it })
        } }
        rule.onNodeWithText("Compra en tres pasos").assertIsDisplayed()
        rule.onNodeWithText("2").assertIsDisplayed()
        rule.onNodeWithText("Agrega destinatarios.").assertIsDisplayed()
        rule.onNodeWithContentDescription("Ocultar guía de inicio").performClick()
        assertEquals(false, open)
    }

    @Test fun helpCardShowsTextAndAction() {
        var clicked = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcHelpCard("¿Necesitas ayuda?", "Te asesoramos gratis.", action = { ZcButton("Escríbenos", { clicked++ }, size = ZcButtonSize.SM) }) } }
        rule.onNodeWithText("¿Necesitas ayuda?").assertIsDisplayed()
        rule.onNodeWithText("Escríbenos").performClick()
        assertEquals(1, clicked)
    }

    @Test fun carouselNavigatesWithButtonsAndDots() {
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcCarousel(listOf("Uno", "Dos", "Tres", "Cuatro"), "Plantillas", itemLabel = { it }) { name, _ -> ZcText(name) }
        } }
        rule.onNodeWithContentDescription("Anterior").assertIsNotEnabled()
        rule.onNode(hasContentDescription("1 de 4: Uno")).assertExists()
        rule.onNodeWithContentDescription("Siguiente").assertIsEnabled().performClick()
        rule.waitForIdle()
        rule.onNodeWithContentDescription("Anterior").assertIsEnabled()
        rule.onNode(hasContentDescription("2 de 4: Dos")).assertExists()
        rule.onNodeWithContentDescription("Ir a la diapositiva 4").assertHeightIsAtLeast(44.dp).performClick()
        rule.waitForIdle()
        rule.onNodeWithContentDescription("Siguiente").assertIsNotEnabled()
    }
}
