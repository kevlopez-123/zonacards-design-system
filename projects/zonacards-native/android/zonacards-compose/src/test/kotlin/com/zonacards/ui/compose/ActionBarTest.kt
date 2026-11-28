package com.zonacards.ui.compose

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
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

/** Barra de acciones sobre una selección múltiple: aparece con elementos, ejecuta acciones, se quita y explica lo deshabilitado. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ActionBarTest {
    @get:Rule val rule = createComposeRule()
    private fun has(text: String) = rule.onAllNodes(hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()

    private val actions = listOf(
        ZcAction("enviar", "Enviar", ZcIcons.sPlain),
        ZcAction("exportar", "Exportar", ZcIcons.sDownloadMinimalistic, disabledReason = "Un borrador no se puede exportar"),
        ZcAction("anular", "Anular", ZcIcons.sCloseCircle, danger = true),
    )

    @Test fun isHiddenWithoutSelectionAndShowsTheCountWithIt() {
        var count by mutableIntStateOf(0)
        rule.setContent { ZonacardsTheme(dark = false) { ZcActionBar(count, actions, {}, {}) } }
        rule.waitForIdle()
        assertTrue(rule.onAllNodes(hasText("seleccionados", substring = true)).fetchSemanticsNodes().isEmpty())
        count = 3
        rule.waitForIdle()
        assertTrue(has("3 seleccionados"))
        count = 0
        rule.waitForIdle()
        rule.mainClock.advanceTimeBy(1_000)
        assertTrue(rule.onAllNodes(hasText("seleccionados", substring = true)).fetchSemanticsNodes().isEmpty())
    }

    @Test fun iconActionsAreNamedByTheirLabelAndReportTheirId() {
        val ran = mutableListOf<String>()
        rule.setContent { ZonacardsTheme(dark = false) { ZcActionBar(2, actions, { ran += it }, {}) } }
        rule.onNodeWithContentDescription("Enviar").performClick()
        rule.onNodeWithContentDescription("Anular").performClick()
        assertEquals(listOf("enviar", "anular"), ran)
    }

    @Test fun aDisabledActionDoesNothingAndSaysWhy() {
        val ran = mutableListOf<String>()
        rule.setContent { ZonacardsTheme(dark = false) { ZcActionBar(1, actions, { ran += it }, {}) } }
        val exportar = rule.onNodeWithContentDescription("Exportar")
        exportar.assertIsNotEnabled()
        exportar.performClick()
        assertTrue(ran.isEmpty())
        rule.onNode(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Un borrador no se puede exportar")).assertExists()
    }

    @Test fun theXClearsTheSelection() {
        var cleared = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcActionBar(2, actions, {}, { cleared++ }) } }
        rule.onNodeWithContentDescription("Quitar selección").performClick()
        assertEquals(1, cleared)
    }

    @Test fun theRegionIsNamedAndAnActionWithoutIconKeepsItsText() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcActionBar(2, listOf(ZcAction("nota", "Añadir nota")), {}, {}) } }
        rule.onNodeWithContentDescription("Acciones sobre la selección").assertExists()
        assertTrue(has("Añadir nota"))
        rule.onNode(SemanticsMatcher.keyIsDefined(SemanticsProperties.LiveRegion)).assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Text))
    }
}
