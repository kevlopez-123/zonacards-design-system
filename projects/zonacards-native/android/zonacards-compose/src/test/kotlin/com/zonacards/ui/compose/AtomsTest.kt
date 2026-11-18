package com.zonacards.ui.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsOff
import androidx.compose.ui.test.assertIsOn
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertWidthIsAtLeast
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.ZcBrand
import com.zonacards.ui.tokens.ZcIcons
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Accesibilidad y comportamiento de los átomos (ola 1): rol, estado, toque mínimo de 48 dp y textos para TalkBack. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es")
@org.robolectric.annotation.GraphicsMode(org.robolectric.annotation.GraphicsMode.Mode.NATIVE)
class AtomsTest {
    @get:Rule val rule = createComposeRule()

    private fun hasRole(role: Role) = SemanticsMatcher.expectValue(SemanticsProperties.Role, role)

    @Test fun buttonHasRoleTouchTargetAndClick() {
        var clicks = 0
        rule.setContent { ZonacardsTheme(dark = false) { Column {
            ZcButton("Crear lote", onClick = { clicks++ })
            ZcButton("Exportar", onClick = {}, size = ZcButtonSize.SM, variant = ZcButtonVariant.OUTLINE)
            ZcButton("Aprobar", onClick = {}, enabled = false)
        } } }
        rule.onNodeWithText("Crear lote", useUnmergedTree = false).assert(hasRole(Role.Button)).assertHasClickAction().performClick()
        assertEquals(1, clicks)
        // SM se ve de 36 dp pero se toca en 48.
        rule.onNodeWithText("Exportar").assertHeightIsAtLeast(48.dp).assertWidthIsAtLeast(48.dp)
        rule.onNodeWithText("Aprobar").assertIsNotEnabled()
    }

    @Test fun loadingButtonIsBusyAndAnnounced() {
        var clicks = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcButton("Guardar", onClick = { clicks++ }, loading = true) } }
        rule.onNodeWithText("Guardar").assertIsNotEnabled()
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Cargando"))
    }

    @Test fun iconButtonNeedsLabel() {
        rule.setContent { ZonacardsTheme(dark = true) { ZcIconButton(ZcIcons.lX, "Cerrar", onClick = {}) } }
        rule.onNodeWithContentDescription("Cerrar").assert(hasRole(Role.Button)).assertHeightIsAtLeast(48.dp)
    }

    @Test fun switchToggles() {
        rule.setContent { ZonacardsTheme(dark = false) {
            var on by remember { mutableStateOf(false) }
            ZcSwitch(on, { on = it }, label = "Notificaciones por correo")
        } }
        val node = rule.onNodeWithText("Notificaciones por correo")
        node.assert(hasRole(Role.Switch)).assertIsOff().performClick()
        node.assertIsOn().assertHeightIsAtLeast(48.dp)
    }

    @Test fun checkboxTriState() {
        rule.setContent { ZonacardsTheme(brand = ZcBrand.GIFTEALO, dark = false) {
            var state by remember { mutableStateOf(ToggleableState.Indeterminate) }
            ZcCheckbox(state, { state = if (state == ToggleableState.On) ToggleableState.Off else ToggleableState.On }, label = "Todos los países")
        } }
        val node = rule.onNodeWithText("Todos los países")
        node.assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, ToggleableState.Indeterminate))
        node.performClick().assert(SemanticsMatcher.expectValue(SemanticsProperties.ToggleableState, ToggleableState.On))
    }

    @Test fun radioGroupSelects() {
        rule.setContent { ZonacardsTheme(dark = false) {
            var sel by remember { mutableStateOf("pe") }
            ZcRadioGroup(listOf(ZcRadioOption("pe", "Perú"), ZcRadioOption("cl", "Chile")), sel, { sel = it }, label = "País")
        } }
        rule.onNodeWithText("Chile").assert(hasRole(Role.RadioButton)).performClick().assertIsSelected()
    }

    @Test fun chipSelectableAndRemovable() {
        var removed = false
        rule.setContent { ZonacardsTheme(dark = false) { Column {
            var sel by remember { mutableStateOf(false) }
            ZcChip("Activos", selected = sel, onSelectedChange = { sel = it })
            ZcChip("Lima", onRemove = { removed = true })
            ZcChip("correo@", invalid = true)
        } } }
        rule.onNodeWithText("Activos").assertIsOff().performClick().assertIsOn()
        rule.onNodeWithContentDescription("Quitar Lima").performClick()
        assertEquals(true, removed)
        rule.onNodeWithContentDescription("No válido: correo@").assertIsEnabled()
    }

    @Test fun badgeAvatarProgressSkeleton() {
        rule.setContent { ZonacardsTheme(dark = true) { Column {
            ZcBadge("Activo", tone = ZcTone.SUCCESS, icon = ZcIcons.sCheckCircle)
            ZcAvatar("Lucía Mendoza")
            ZcProgress(0.4f, label = "Carga de archivo", valueText = "40 %")
            ZcProgress(null, label = "Procesando")
            ZcSkeleton(variant = ZcSkeletonVariant.CARD)
        } } }
        rule.onNodeWithText("Activo").assertExists()
        rule.onNodeWithContentDescription("Lucía Mendoza").assertExists()
        rule.onNodeWithText("LM", useUnmergedTree = true).assertExists()
        rule.onNodeWithContentDescription("Carga de archivo").assert(SemanticsMatcher.expectValue(SemanticsProperties.ProgressBarRangeInfo, ProgressBarRangeInfo(0.4f, 0f..1f)))
        rule.onNodeWithContentDescription("Procesando").assert(SemanticsMatcher.expectValue(SemanticsProperties.ProgressBarRangeInfo, ProgressBarRangeInfo.Indeterminate))
        rule.onNodeWithContentDescription("Cargando").assertExists()
    }

    @Test @Config(qualifiers = "en") fun englishStrings() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcChip("Lima", onRemove = {}) } }
        rule.onNodeWithContentDescription("Remove Lima").assertExists()
    }

    @Test fun initials() {
        assertEquals("LM", zcInitials("  Lucía   Mendoza Paz "))
        assertEquals("Á", zcInitials("álvaro"))
    }
}
