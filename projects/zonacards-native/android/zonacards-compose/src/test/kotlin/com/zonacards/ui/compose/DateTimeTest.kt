package com.zonacards.ui.compose

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextReplacement
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Fechas no disponibles, tope de días de un periodo y fecha con hora en un solo campo. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DateTimeTest {
    @get:Rule val rule = createComposeRule()
    private val today = "2026-11-20"
    private fun has(text: String) = rule.onAllNodes(hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()
    // "9 de noviembre" no debe encontrar también el 19 ni el 29: el número va al inicio o después de un no-dígito.
    private fun day(text: String): SemanticsNodeInteraction {
        val re = Regex("(^|[^0-9])" + Regex.escape(text))
        return rule.onNode(SemanticsMatcher("día $text") { n -> n.config.getOrNull(SemanticsProperties.ContentDescription)?.any { re.containsMatchIn(it) } == true })
    }

    @Test fun unavailableDaysAreDisabledInTheCalendar() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcDateRange(null, {}, "Periodo", today = today, unavailable = { it == "2026-11-12" }) } }
        rule.onNodeWithText("Elegir periodo").performClick()
        day("12 de noviembre").assertIsNotEnabled()
        day("13 de noviembre").assertIsEnabled()
    }

    @Test fun aRangeCannotCrossAnUnavailableDay() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcDateRange(null, {}, "Periodo", today = today, unavailable = { it == "2026-11-12" }) } }
        rule.onNodeWithText("Elegir periodo").performClick()
        day("10 de noviembre").performClick()
        day("11 de noviembre").assertIsEnabled()
        day("13 de noviembre").assertIsNotEnabled()   // cruzaría el 12
        day("9 de noviembre").assertIsEnabled()
    }

    @Test fun maxDaysDisablesTheLongPresetsAndTheDaysBeyondTheCap() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcDateRange(null, {}, "Periodo", today = today, maxDays = 7) } }
        rule.onNodeWithText("Elegir periodo").performClick()
        rule.onNodeWithText("Últimos 30 días").assertIsNotEnabled()
        rule.onNodeWithText("Hoy").assertIsEnabled()
        day("18 de noviembre").performClick()
        day("12 de noviembre").assertIsEnabled()      // 12 al 18 son 7 días
        day("11 de noviembre").assertIsNotEnabled()   // 8 días
    }

    @Test fun typingAPeriodLongerThanTheCapShowsTheError() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcDateRange(null, {}, "Periodo", today = today, maxDays = 7) } }
        rule.onNodeWithText("Elegir periodo").performClick()
        rule.onAllNodes(hasSetTextAction())[0].performTextReplacement("01112026")
        assertTrue(has("El periodo no puede pasar de 7 días."))
        rule.onNodeWithText("Aplicar").assertIsNotEnabled()
    }

    @Test fun typingAnUnavailableDateShowsTheError() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcDateRange(null, {}, "Periodo", today = today, unavailable = { it == "2026-11-12" }) } }
        rule.onNodeWithText("Elegir periodo").performClick()
        rule.onAllNodes(hasSetTextAction())[0].performTextReplacement("12112026")
        assertTrue(has("Esa fecha no está disponible."))
    }

    @Test fun calendarDisablesUnavailableDaysOutsideARange() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcCalendar("2026-11-01", {}, today, {}, unavailable = { it == "2026-11-05" }) } }
        day("5 de noviembre").assertIsNotEnabled()
        day("6 de noviembre").assertIsEnabled()
    }

    @Test fun dateTimeKeepsTheDatePartWhenTheTimeIsCleared() {
        val emitted = mutableListOf<String?>()
        rule.setContent { ZonacardsTheme(dark = false) {
            var value by remember { mutableStateOf<String?>("2026-12-24T09:30") }
            ZcDateTimeField(value, { value = it; emitted += it }, "Envío programado")
        } }
        assertTrue(has("Envío programado"))
        assertTrue(has("2026"))
        rule.onNode(hasSetTextAction() and hasText("09:30")).performTextReplacement("")
        assertNull("sin hora el valor es null", emitted.last())
        assertTrue("la fecha elegida se conserva en pantalla", has("2026"))
    }

    @Test fun dateTimeEmitsTheJoinedValueWhenBothPartsAreThere() {
        var got: String? = "sin cambios"
        rule.setContent { ZonacardsTheme(dark = false) {
            var value by remember { mutableStateOf<String?>("2026-12-24T09:30") }
            ZcDateTimeField(value, { value = it; got = it }, "Envío programado")
        } }
        rule.onNode(hasSetTextAction() and hasText("09:30")).performTextReplacement("1845")
        assertEquals("2026-12-24T18:45", got)
    }
}
