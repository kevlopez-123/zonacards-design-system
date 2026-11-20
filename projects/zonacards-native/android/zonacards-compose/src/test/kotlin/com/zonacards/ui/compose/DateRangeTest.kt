package com.zonacards.ui.compose

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.foundation.layout.size
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Periodo de reportes (zc-date-range), su calendario y el logo de marca. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DateRangeTest {
    @get:Rule val rule = createComposeRule()
    private val today = "2026-11-20"

    private fun has(text: String) = rule.onAllNodes(hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()

    @Test fun presetsMatchTheWeb() {
        assertEquals("2026-11-20" to "2026-11-20", zcPresetRange(ZcRangePreset.TODAY, today))
        assertEquals("2026-11-19" to "2026-11-19", zcPresetRange(ZcRangePreset.YESTERDAY, today))
        assertEquals("2026-11-14" to "2026-11-20", zcPresetRange(ZcRangePreset.LAST7, today))
        assertEquals("2026-10-22" to "2026-11-20", zcPresetRange(ZcRangePreset.LAST30, today))
        assertEquals("2026-11-16" to "2026-11-20", zcPresetRange(ZcRangePreset.WEEK, today))
        assertEquals("2026-11-01" to "2026-11-20", zcPresetRange(ZcRangePreset.MONTH, today))
        assertEquals("2026-10-01" to "2026-10-31", zcPresetRange(ZcRangePreset.PREV_MONTH, today))
        assertEquals("2026-10-01" to "2026-11-20", zcPresetRange(ZcRangePreset.QUARTER, today))
        assertEquals("2026-01-01" to "2026-11-20", zcPresetRange(ZcRangePreset.YEAR, today))
        assertNull(zcPresetRange(ZcRangePreset.CUSTOM, today))
    }

    @Test fun previousRangeHasTheSameLength() {
        assertEquals("2026-11-07" to "2026-11-13", zcPreviousRange("2026-11-14", "2026-11-20"))
        assertEquals("2026-08-31" to "2026-09-30", zcPreviousRange("2026-10-01", "2026-10-31"))
    }

    @Test fun triggerShowsTheChosenPeriodAndTheFullRangeForTalkBack() {
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcDateRange(ZcDateRangeValue("2026-10-22", "2026-11-20", ZcRangePreset.LAST30, compare = true), {}, "Periodo", today = today)
        } }
        rule.onNodeWithText("Últimos 30 días · vs. anterior").assertExists()
        rule.onNode(hasContentDescription("22/10/2026 – 20/11/2026", substring = true)).assertExists()
    }

    @Test fun choosingAPresetAndApplyingReturnsTheValue() {
        var got: ZcDateRangeValue? = null
        rule.setContent { ZonacardsTheme(dark = false) { ZcDateRange(null, { got = it }, "Periodo", today = today) } }
        rule.onNodeWithText("Elegir periodo").performClick()
        rule.onNodeWithText("Ayer").performClick()
        rule.onNodeWithText("1 días").assertExists()
        rule.onNodeWithText("Aplicar").performClick()
        assertEquals(ZcDateRangeValue("2026-11-19", "2026-11-19", ZcRangePreset.YESTERDAY, false), got)
    }

    @Test fun pickingTwoDaysInTheCalendarBuildsACustomRangeAndSwapsWhenReversed() {
        var got: ZcDateRangeValue? = null
        rule.setContent { ZonacardsTheme(dark = false) { ZcDateRange(null, { got = it }, "Periodo", today = today) } }
        rule.onNodeWithText("Elegir periodo").performClick()
        rule.onNode(hasContentDescription("18 de noviembre", substring = true)).performClick()
        assertTrue(has("Elige la fecha final"))
        rule.onNode(hasContentDescription("10 de noviembre", substring = true)).performClick()
        rule.onNodeWithText("Aplicar").performClick()
        assertEquals(ZcDateRangeValue("2026-11-10", "2026-11-18", ZcRangePreset.CUSTOM, false), got)
    }

    @Test fun futureDaysAreDisabledAndTypingAFutureDateShowsTheError() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcDateRange(null, {}, "Periodo", today = today) } }
        rule.onNodeWithText("Elegir periodo").performClick()
        rule.onNode(hasContentDescription("21 de noviembre", substring = true)).assertIsNotEnabled()
        rule.onAllNodes(hasSetTextAction())[1].performTextInput("")
        rule.onAllNodes(hasSetTextAction())[1].performTextInput("25112026")
        assertTrue(has("No puede ser una fecha futura."))
        rule.onNodeWithText("Aplicar").assertIsNotEnabled()
    }

    @Test fun typingAnEndBeforeTheStartShowsTheOrderError() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcDateRange(null, {}, "Periodo", today = today) } }
        rule.onNodeWithText("Elegir periodo").performClick()
        rule.onAllNodes(hasSetTextAction())[1].performTextInput("01012026")
        assertTrue(has("La fecha final debe ser posterior a la inicial."))
    }

    @Test fun compareShowsThePreviousPeriodAndIsReturned() {
        var got: ZcDateRangeValue? = null
        rule.setContent { ZonacardsTheme(dark = false) { ZcDateRange(null, { got = it }, "Periodo", today = today) } }
        rule.onNodeWithText("Elegir periodo").performClick()
        rule.onNodeWithText("Últimos 7 días").performClick()
        rule.onNodeWithText("07/11/2026 – 13/11/2026").assertExists()
        rule.onNodeWithText("Comparar con el periodo anterior").performClick()
        rule.onNodeWithText("Aplicar").performClick()
        assertEquals(true, got?.compare)
    }

    @Test fun calendarDaysAreFortyFourDpAndMonthNavigates() {
        var month by mutableStateOf("2026-11-01")
        rule.setContent { ZonacardsTheme(dark = false) { ZcCalendar(month, { month = it }, today, {}) } }
        rule.onNode(hasContentDescription("15 de noviembre", substring = true)).assertHeightIsAtLeast(44.dp)
        rule.onNodeWithContentDescription("Mes anterior").performClick()
        assertEquals("2026-10-01", month)
        rule.onNodeWithContentDescription("Mes siguiente").performClick()
        rule.onNodeWithContentDescription("Mes siguiente").performClick()
        assertEquals("2026-12-01", month)
    }

    @Test fun brandLogoIsDecorativeAndHidesItsInitialsFromTalkBack() {
        rule.setContent { ZonacardsTheme(dark = false) { androidx.compose.foundation.layout.Box(androidx.compose.ui.Modifier.size(160.dp)) { ZcBrandLogo("Supermercados") } } }
        assertTrue(rule.onAllNodes(hasText("SUPERMER")).fetchSemanticsNodes().isEmpty())
    }

}

/** Fecha en tres columnas y entrada escalonada. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DateWheelTest {
    @get:Rule val rule = createComposeRule()

    @Test fun pickingDayMonthAndYearReturnsTheIsoDate() {
        var got: String? = null
        rule.setContent { ZonacardsTheme(dark = false) { ZcDateWheelField("1990-05-14", { got = it }, "Nacimiento", min = "1926-01-01", max = "2008-11-20") } }
        rule.onNodeWithText("14/05/1990").performClick()
        rule.onNode(hasContentDescription("Día 16")).performClick()
        rule.onNode(hasContentDescription("Mes Junio")).performClick()
        rule.onNode(hasContentDescription("Año 1988")).performClick()
        rule.onNodeWithText("Aceptar").performClick()
        assertEquals("1988-06-16", got)
    }

    @Test fun theDayIsClampedWhenTheMonthIsShorterAndOutOfRangeDisablesAccept() {
        var got: String? = null
        rule.setContent { ZonacardsTheme(dark = false) { ZcDateWheelField("2008-04-30", { got = it }, "Nacimiento", min = "1926-01-01", max = "2008-04-30") } }
        rule.onNodeWithText("30/04/2008").performClick()
        rule.onNode(hasContentDescription("Mes Febrero")).performClick()
        rule.onNodeWithText("29/02/2008").assertExists()
        rule.onNode(hasContentDescription("Mes Junio")).performClick()
        rule.onNodeWithText("Elige una fecha entre", substring = true).assertExists()
        rule.onNodeWithText("Aceptar").assertIsNotEnabled()
        assertNull(got)
    }

    @Test fun staggeredEntryEndsFullyVisible() {
        rule.setContent { ZonacardsTheme(dark = false) {
            androidx.compose.foundation.layout.Column { repeat(3) { i -> ZcText("fila $i", androidx.compose.ui.Modifier.zcStaggeredEntry(i)) } }
        } }
        rule.mainClock.advanceTimeBy(1500)
        rule.onNodeWithText("fila 2").assertExists()
    }
}
