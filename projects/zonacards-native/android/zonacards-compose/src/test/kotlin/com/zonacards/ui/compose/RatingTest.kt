package com.zonacards.ui.compose

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.click
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performKeyInput
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.pressKey
import androidx.compose.ui.test.requestFocus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** `ZcRating`: lectura accesible, toque, medias estrellas, ajuste por TalkBack, teclado y estado deshabilitado. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class RatingTest {
    @get:Rule val rule = createComposeRule()
    private fun has(text: String) = rule.onAllNodes(hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()

    @Test fun readOnlyIsAnImageWithItsNoteAndReviews() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcRating(4.3f, "Calificación del producto", showValue = true, count = 128) } }
        rule.onNodeWithContentDescription("Calificación del producto: 4,3 de 5, 128 opiniones")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, androidx.compose.ui.semantics.Role.Image))
    }

    @Test fun withoutRatingItSaysSo() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcRating(0f, "Calificación del comercio") } }
        rule.onNodeWithContentDescription("Calificación del comercio: sin calificar").assertExists()
    }

    @Test fun aTapPicksTheStarUnderTheFinger() {
        var picked = 0f
        rule.setContent { ZonacardsTheme(dark = false) { ZcRating(0f, "Servicio", onValueChange = { picked = it }) } }
        rule.onNodeWithContentDescription("Servicio").performTouchInput { click(Offset(width * 0.5f, centerY)) }   // tercera estrella (40 a 60 %)
        assertEquals(3f, picked, 0f)
        rule.onNodeWithContentDescription("Servicio").performTouchInput { click(Offset(width * 0.99f, centerY)) }
        assertEquals(5f, picked, 0f)
    }

    @Test fun withHalvesTheLeftHalfOfAStarIsHalf() {
        var picked = 0f
        rule.setContent { ZonacardsTheme(dark = false) { ZcRating(0f, "Entrega", onValueChange = { picked = it }, allowHalf = true) } }
        rule.onNodeWithContentDescription("Entrega").performTouchInput { click(Offset(width * 0.05f, centerY)) }
        assertEquals(0.5f, picked, 0f)
        rule.onNodeWithContentDescription("Entrega").performTouchInput { click(Offset(width * 0.15f, centerY)) }
        assertEquals(1f, picked, 0f)
    }

    @Test fun talkBackAdjustsItAsASlider() {
        var value by mutableFloatStateOf(2f)
        rule.setContent { ZonacardsTheme(dark = false) { ZcRating(value, "Servicio", onValueChange = { value = it }) } }
        val node = rule.onNodeWithContentDescription("Servicio")
        node.assert(SemanticsMatcher("rango 0 a 5 con el valor actual") {
            val r = it.config.getOrNull(SemanticsProperties.ProgressBarRangeInfo)
            r != null && r.current == 2f && r.range.endInclusive == 5f
        })
        node.performSemanticsAction(SemanticsActions.SetProgress) { it(4f) }
        assertEquals(4f, value, 0f)
        rule.waitForIdle()
        node.assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Servicio: 4 de 5"))
    }

    @Test fun theKeyboardStepsJumpsAndClamps() {
        var value by mutableFloatStateOf(0f)
        rule.setContent { ZonacardsTheme(dark = false) { ZcRating(value, "Servicio", onValueChange = { value = it }) } }
        val node = rule.onNodeWithContentDescription("Servicio")
        node.requestFocus()
        node.performKeyInput { pressKey(Key.DirectionRight) }
        assertEquals(1f, value, 0f)
        node.performKeyInput { pressKey(Key.DirectionUp) }
        assertEquals(2f, value, 0f)
        node.performKeyInput { pressKey(Key.MoveEnd) }
        assertEquals(5f, value, 0f)
        node.performKeyInput { pressKey(Key.DirectionRight) }
        assertEquals(5f, value, 0f)
        node.performKeyInput { pressKey(Key.MoveHome) }
        assertEquals(0f, value, 0f)
    }

    @Test fun aDisabledOneIgnoresTouch() {
        var picked = -1f
        rule.setContent { ZonacardsTheme(dark = false) { ZcRating(2f, "Bloqueada", onValueChange = { picked = it }, enabled = false) } }
        rule.onNodeWithContentDescription("Bloqueada: 2 de 5").performClick()
        assertEquals(-1f, picked, 0f)
    }
}
