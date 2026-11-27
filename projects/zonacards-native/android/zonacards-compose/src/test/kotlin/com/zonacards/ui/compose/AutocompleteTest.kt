package com.zonacards.ui.compose

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Autocomplete: búsqueda hecha por quien llama, con espera, mínimo de letras, "Buscando…", sin resultados y "Crear". */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class AutocompleteTest {
    @get:Rule val rule = createComposeRule()
    private fun has(text: String) = rule.onAllNodes(hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()
    private val clients = listOf(ZcSelectOption("1", "Ana Pérez"), ZcSelectOption("2", "Ana Soto"))

    @Test fun explainsTheMinimumBeforeAskingAnything() {
        val queries = mutableListOf<String>()
        rule.setContent { ZonacardsTheme(dark = false) { ZcAutocomplete(emptyList<ZcSelectOption<String>>(), null, {}, { queries += it }, label = "Cliente") } }
        rule.onNodeWithContentDescription("Cliente").performClick()
        assertTrue(has("Escribe al menos 2 letras para buscar."))
        rule.onNode(hasSetTextAction()).performTextInput("A")
        rule.mainClock.advanceTimeBy(400)
        assertEquals("A", queries.last())   // la app decide si pide algo con una sola letra; el componente solo avisa
        assertTrue(has("Escribe al menos 2 letras para buscar."))
    }

    @Test fun waitsForTheUserToStopTypingBeforeAsking() {
        val queries = mutableListOf<String>()
        rule.setContent { ZonacardsTheme(dark = false) { ZcAutocomplete(clients, null, {}, { queries += it }, label = "Cliente") } }
        rule.onNodeWithContentDescription("Cliente").performClick()
        rule.mainClock.advanceTimeBy(400)
        queries.clear()
        rule.onNode(hasSetTextAction()).performTextInput("An")
        rule.mainClock.advanceTimeBy(100)
        assertTrue("todavía no debía pedir", queries.isEmpty())
        rule.mainClock.advanceTimeBy(300)
        assertEquals(listOf("An"), queries)
    }

    @Test fun showsSearchingInsteadOfTheList() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcAutocomplete(clients, null, {}, {}, label = "Cliente", loading = true) } }
        rule.onNodeWithContentDescription("Cliente").performClick()
        assertTrue(has("Buscando…"))
        assertTrue(!has("Ana Pérez"))
    }

    @Test fun picksAnOptionAndTheFieldShowsItsLabel() {
        var picked: String? = null
        rule.setContent { ZonacardsTheme(dark = false) {
            var s by remember { mutableStateOf<ZcSelectOption<String>?>(null) }
            ZcAutocomplete(clients, s, { s = it; picked = it.value }, {}, label = "Cliente")
        } }
        rule.onNodeWithContentDescription("Cliente").performClick()
        rule.onNodeWithText("Ana Soto").performClick()
        assertEquals("2", picked)
        rule.onNodeWithContentDescription("Cliente").assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Ana Soto"))
    }

    @Test fun saysWhenNothingMatches() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcAutocomplete(emptyList<ZcSelectOption<String>>(), null, {}, {}, label = "Cliente") } }
        rule.onNodeWithContentDescription("Cliente").performClick()
        rule.onNode(hasSetTextAction()).performTextInput("Zeta")
        assertTrue(has("Sin resultados para “Zeta”."))
    }

    @Test fun offersToCreateWhatIsNotThere() {
        var created: String? = null
        rule.setContent { ZonacardsTheme(dark = false) { ZcAutocomplete(clients, null, {}, {}, label = "Cliente", onCreate = { created = it }) } }
        rule.onNodeWithContentDescription("Cliente").performClick()
        rule.onNode(hasSetTextAction()).performTextInput("Zeta")
        rule.onNodeWithText("Crear “Zeta”").performClick()
        assertEquals("Zeta", created)
    }

    @Test fun doesNotOfferToCreateWhatAlreadyExists() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcAutocomplete(clients, null, {}, {}, label = "Cliente", onCreate = {}) } }
        rule.onNodeWithContentDescription("Cliente").performClick()
        rule.onNode(hasSetTextAction()).performTextInput("ana soto")
        assertTrue(!has("Crear “"))
    }
}
