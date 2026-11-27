package com.zonacards.ui.compose

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Grupo de casillas con "Seleccionar todo" y conjunto de campos con leyenda. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class GroupsTest {
    @get:Rule val rule = createComposeRule()
    private fun has(text: String) = rule.onAllNodes(hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()
    private fun state(s: ToggleableState) = SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, s)
    private val options = listOf(
        ZcCheckboxOption("mail", "Correo"),
        ZcCheckboxOption("wa", "WhatsApp", description = "Solo en Perú"),
        ZcCheckboxOption("sms", "SMS", enabled = false),
    )

    @Test fun togglesValuesAndKeepsThemInTheSet() {
        var chosen = emptySet<String>()
        rule.setContent { ZonacardsTheme(dark = false) {
            var s by remember { mutableStateOf(emptySet<String>()) }
            ZcCheckboxGroup(options, s, { s = it; chosen = it }, label = "Canales de aviso")
        } }
        rule.onNodeWithText("WhatsApp").performClick()
        assertEquals(setOf("wa"), chosen)
        rule.onNodeWithText("Correo").performClick()
        assertEquals(setOf("wa", "mail"), chosen)
        rule.onNodeWithText("WhatsApp").performClick()
        assertEquals(setOf("mail"), chosen)
        assertTrue(has("Solo en Perú"))
    }

    @Test fun selectAllGoesMixedAndSkipsTheDisabledOnes() {
        var chosen = emptySet<String>()
        rule.setContent { ZonacardsTheme(dark = false) {
            var s by remember { mutableStateOf(emptySet<String>()) }
            ZcCheckboxGroup(options, s, { s = it; chosen = it }, label = "Canales", selectAllLabel = "Todos")
        } }
        rule.onNodeWithText("Correo").performClick()
        rule.onNodeWithText("Todos").assert(state(ToggleableState.Indeterminate))
        rule.onNodeWithText("Todos").performClick()
        assertEquals(setOf("mail", "wa"), chosen)   // SMS está deshabilitada: "todos" no la toca
        rule.onNodeWithText("Todos").assert(state(ToggleableState.On))
        rule.onNodeWithText("Todos").performClick()
        assertEquals(emptySet<String>(), chosen)
    }

    @Test fun errorReplacesTheHintAndHintShowsOtherwise() {
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcCheckboxGroup(options, emptySet(), {}, label = "Canales", hint = "Elige al menos uno.", error = "Elige un canal.")
        } }
        assertTrue(has("Elige un canal."))
        assertTrue(!has("Elige al menos uno."))
    }

    @Test fun showsTheHintWhenThereIsNoError() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcCheckboxGroup(options, emptySet(), {}, label = "Canales", hint = "Elige al menos uno.", required = true) } }
        assertTrue(has("Elige al menos uno."))
        assertTrue(has("Canales"))
    }

    @Test fun fieldsetShowsItsLegendDescriptionAndContent() {
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcFieldset("Datos de contacto", description = "Para avisarte del envío.", bordered = true) { ZcText("Contenido del grupo") }
        } }
        rule.onNodeWithText("Datos de contacto").assertIsDisplayed()
        assertTrue(has("Para avisarte del envío."))
        assertTrue(has("Contenido del grupo"))
    }
}
