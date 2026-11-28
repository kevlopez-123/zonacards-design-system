package com.zonacards.ui.compose

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
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

/** Filas de ajustes (interruptor, abrir algo, informativa) y hoja con puntos de anclaje. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class SettingsTest {
    @get:Rule val rule = createComposeRule()
    private fun has(text: String) = rule.onAllNodes(hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()

    @Test fun aSwitchRowTogglesWhenTheWholeRowIsTouched() {
        var on = false
        rule.setContent { ZonacardsTheme(dark = false) {
            var checked by remember { mutableStateOf(false) }
            ZcSettingsRow(ZcSettingsItem("Alertas de stock", "Avisa cuando queda poco", ZcIcons.sInfoCircle, checked = checked, onCheckedChange = { checked = it; on = it }))
        } }
        val row = rule.onNodeWithText("Alertas de stock")
        row.assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Switch)).assertHeightIsAtLeast(56.dp)
        row.assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, ToggleableState.Off))
        row.performClick()
        assertTrue(on)
        row.assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, ToggleableState.On))
        assertTrue(has("Avisa cuando queda poco"))
    }

    @Test fun anOpenRowIsAButtonThatReadsItsCurrentValue() {
        var opened = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcSettingsRow(ZcSettingsItem("Idioma", value = "Español", onClick = { opened++ })) } }
        val row = rule.onNodeWithText("Idioma")
        row.assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button))
        row.assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Español"))
        row.performClick()
        assertEquals(1, opened)
    }

    @Test fun aDisabledRowDoesNothing() {
        var opened = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcSettingsRow(ZcSettingsItem("Cuenta", onClick = { opened++ }, enabled = false)) } }
        rule.onNodeWithText("Cuenta").assertIsNotEnabled()
        assertEquals(0, opened)
    }

    @Test fun anInformativeRowHasNoActionAndShowsItsValue() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcSettingsRow(ZcSettingsItem("Versión", value = "2.0.0")) } }
        assertTrue(has("Versión"))
        assertTrue(has("2.0.0"))
    }

    @Test fun aGroupShowsItsHeaderRowsAndFooter() {
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcSettingsGroup(
                listOf(ZcSettingsItem("Notificaciones", checked = true, onCheckedChange = {}), ZcSettingsItem("Idioma", value = "Español", onClick = {}), ZcSettingsItem("Cerrar sesión", danger = true, onClick = {})),
                header = "Preferencias", footer = "Los cambios se aplican al instante.",
            )
        } }
        for (t in listOf("Preferencias", "Notificaciones", "Idioma", "Español", "Cerrar sesión", "Los cambios se aplican al instante.")) assertTrue(t, has(t))
    }

    @Test fun aSheetWithDetentsOpensAtTheFirstAndFlingsToTheNext() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcBottomSheet({}, title = "Filtros", detents = listOf(0.5f, 0.9f)) { ZcText("Contenido") } } }
        rule.waitForIdle()
        val sheet = rule.onNode(SemanticsMatcher.keyIsDefined(SemanticsProperties.PaneTitle))
        fun sheetHeight() = sheet.getBoundsInRoot().let { (it.bottom - it.top).value }
        assertEquals(800f, sheetHeight(), 3f)   // 50 % de 1 600 dp
        // Arrastre manual hacia arriba (rápido, en pasos) desde el título; después se deja correr la animación de asentado.
        rule.onNodeWithTag("zc-sheet-handle").performTouchInput {
            down(Offset(centerX, centerY))
            repeat(14) { moveBy(Offset(0f, -50f), delayMillis = 8) }
            up()
        }
        rule.waitForIdle()
        rule.mainClock.advanceTimeBy(1_000)
        rule.waitForIdle()
        assertEquals("alto tras el arrastre", 1440f, sheetHeight(), 3f)   // 90 %
    }
}
