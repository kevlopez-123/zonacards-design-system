package com.zonacards.ui.compose

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.zonacards.ui.tokens.ZcIcons
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Hoja legal y consentimiento, ayuda y soporte e introducción. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class InfoSheetsTest {
    @get:Rule val rule = createComposeRule()
    private fun has(text: String) = rule.onAllNodes(hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()

    private val doc = ZcLegalDocument("Términos y condiciones", "2026.3", listOf(ZcLegalSection("1. Uso", listOf("Párrafo uno.", "Párrafo dos."))))

    @Test fun legalSheetShowsTheDocumentAndConfirmsAndCloses() {
        var confirmed = 0; var closed = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcLegalSheet("Términos", doc, { closed++ }, confirmLabel = "Aceptar", onConfirm = { confirmed++ }) } }
        rule.onNodeWithText("Términos y condiciones").assertExists()
        rule.onNodeWithText("Versión 2026.3").assertExists()
        rule.onNodeWithText("1. Uso").assertExists()
        rule.onNodeWithText("Párrafo dos.").assertExists()
        rule.onNodeWithText("Aceptar").performClick()
        assertEquals(1, confirmed); assertEquals(1, closed)
    }

    @Test fun legalSheetWhileLoadingDisablesTheButtonAndOnErrorOffersRetry() {
        var retries = 0
        var failed by mutableStateOf(false)
        rule.setContent { ZonacardsTheme(dark = false) { ZcLegalSheet("Términos", null, {}, error = failed, onRetry = { retries++ }) } }
        rule.onNodeWithText("Entendido").assertIsNotEnabled()
        failed = true
        rule.waitForIdle()
        rule.onNodeWithText("No pudimos cargar el documento").assertExists()
        rule.onNodeWithText("Reintentar").performClick()
        assertEquals(1, retries)
    }

    @Test fun consentCheckShowsTheChipAndTheErrorWhenSkipped() {
        var checked by mutableStateOf(false)
        var terms = 0; var privacy = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcLegalConsent(checked, { checked = it }, { terms++ }, { privacy++ }, error = true) } }
        assertTrue(has("Debes aceptar para continuar."))
        rule.onNodeWithText("Leer los términos").performClick()
        rule.onNodeWithText("Leer la política de privacidad").performClick()
        assertEquals(1, terms); assertEquals(1, privacy)
        rule.onNodeWithText("Acepto los términos y la política de privacidad").performClick()
        rule.waitForIdle()
        assertTrue(checked)
        assertTrue(has("Términos aceptados"))
        assertTrue(!has("Debes aceptar para continuar."))
    }

    @Test fun prettyPhoneGroupsCellphonesAndLimaLandlines() {
        assertEquals("+51 900 000 099", zcPrettyPhone("+51900000099"))
        assertEquals("+51 1 700 8000", zcPrettyPhone("+5117008000"))
        assertEquals("+99912345", zcPrettyPhone("+99912345"))
    }

    @Test fun supportListsOneRowPerChannelAndEachRowActs() {
        val calls = mutableListOf<String>()
        val actions = ZcSupportActions({ calls += "call:$it" }, { calls += "wa:$it" }, { calls += "mail:$it" }, { calls += "web:$it" })
        rule.setContent { ZonacardsTheme(dark = false) { ZcSupportSheet(ZcSupportInfo("Lunes a viernes", "+5117008000", "+51900000099", "a@b.com", "https://ayuda.test"), {}, actions = actions) } }
        rule.onNodeWithText("Lunes a viernes").assertExists()
        rule.onNode(hasContentDescription("Llamar: +51 1 700 8000")).performClick()
        rule.onNode(hasContentDescription("WhatsApp: +51 900 000 099")).performClick()
        rule.onNode(hasContentDescription("Correo: a@b.com")).performClick()
        rule.onNode(hasContentDescription("Centro de ayuda", substring = true)).performClick()
        assertEquals(listOf("call:+5117008000", "wa:+51900000099", "mail:a@b.com", "web:https://ayuda.test"), calls)
    }

    @Test fun supportHidesTheChannelsThatAreMissing() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcSupportSheet(ZcSupportInfo(email = "a@b.com"), {}, actions = ZcSupportActions({}, {}, {}, {})) } }
        assertTrue(rule.onAllNodes(hasContentDescription("Llamar", substring = true)).fetchSemanticsNodes().isEmpty())
        rule.onNode(hasContentDescription("Correo: a@b.com")).assertExists()
    }

    @Test fun introAdvancesSkipsDisappearOnTheLastAndStartFinishes() {
        var finished = 0; var skipped = 0
        val slides = listOf(ZcIntroSlide("Uno", "t1", icon = ZcIcons.sGift), ZcIntroSlide("Dos", "t2"), ZcIntroSlide("Tres", "t3"))
        rule.setContent { ZonacardsTheme(dark = false) { ZcIntroSlides(slides, { finished++ }, { skipped++ }) } }
        rule.onNodeWithText("Uno").assertExists()
        rule.onNodeWithContentDescription("Paso 1 de 3").assertExists()
        rule.onNodeWithText("Saltar").assertExists()
        rule.onNodeWithText("Continuar").performClick()
        rule.onNodeWithText("Dos").assertExists()
        rule.onNodeWithText("Continuar").performClick()
        rule.onNodeWithText("Tres").assertExists()
        assertTrue(!has("Saltar"))
        rule.onNodeWithText("Empezar").performClick()
        assertEquals(1, finished); assertEquals(0, skipped)
    }

    @Test fun introSkipCallsOnSkipped() {
        var skipped = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcIntroSlides(listOf(ZcIntroSlide("Uno", "t1"), ZcIntroSlide("Dos", "t2")), {}, { skipped++ }) } }
        rule.onNodeWithText("Saltar").performClick()
        assertEquals(1, skipped)
    }
}
