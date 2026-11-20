package com.zonacards.ui.compose

import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeRight
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

private fun progress(v: Float) = SemanticsMatcher("progreso = $v") { it.config.getOrNull(SemanticsProperties.ProgressBarRangeInfo)?.current == v }

/** Campos avanzados (ola 5): pasos, errores, deslizadores, hora, contraseña, credencial y etiquetas. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class FormsMoreTest {
    @get:Rule val rule = createComposeRule()

    @Test fun stepperIsCompactOnPhoneWithProgressBar() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcStepper(listOf("Empresa", "Contacto", "Comercial", "Resumen"), 1, "Nuevo cliente") } }
        rule.onNodeWithText("Paso 2 de 4: Contacto").assertIsDisplayed()
        rule.onNode(SemanticsMatcher.keyIsDefined(SemanticsProperties.ProgressBarRangeInfo)).assert(progress(2f))
    }

    @Test fun formSummaryListsErrorsAndJumpsToTheField() {
        var went: String? = null
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcFormSummary(listOf(ZcFormError("correo", "El correo no es válido."), ZcFormError("monto", "Monto fuera de rango.")), onGo = { went = it })
        } }
        rule.onNodeWithText("Revisa", substring = true).assertIsDisplayed()
        rule.onNodeWithText("Monto fuera de rango.").assertHeightIsAtLeast(44.dp).performClick()
        assertEquals("monto", went)
    }

    @Test fun formSummaryTakesNoSpaceWithoutErrors() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcFormSummary(emptyList(), onGo = {}) } }
        rule.onNodeWithText("Revisa", substring = true).assertDoesNotExist()
    }

    @Test fun sliderSnapsToStepAndAnnouncesItsValue() {
        rule.setContent { ZonacardsTheme(dark = false) {
            var v by remember { mutableStateOf(10f) }
            ZcSlider(v, { v = it }, Modifier.testTag("slider"), valueRange = 0f..100f, step = 5f, label = "Comisión", format = { "${it.toInt()} %" })
        } }
        val thumb = rule.onNode(hasContentDescription("Comisión"))
        thumb.assert(progress(10f)).assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "10 %"))
        thumb.performSemanticsAction(SemanticsActions.SetProgress) { it(32f) }
        rule.onNode(hasContentDescription("Comisión")).assert(progress(30f)).assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "30 %"))
    }

    @Test fun sliderFollowsADrag() {
        rule.setContent { ZonacardsTheme(dark = false) {
            var v by remember { mutableStateOf(0f) }
            ZcSlider(v, { v = it }, Modifier.testTag("slider"), label = "Nivel")
        } }
        rule.onNodeWithTag("slider").performTouchInput { swipeRight() }
        rule.onNode(hasContentDescription("Nivel")).assert(progress(100f))
    }

    @Test fun disabledSliderIgnoresTouch() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcSlider(20f, {}, Modifier.testTag("slider"), enabled = false, label = "Fijo") } }
        rule.onNodeWithTag("slider").performTouchInput { swipeRight() }
        rule.onNode(hasContentDescription("Fijo")).assert(progress(20f)).assert(SemanticsMatcher.keyNotDefined(SemanticsActions.SetProgress))
    }

    @Test fun rangeSliderKeepsTheMinimumGap() {
        var range = 50f..60f
        rule.setContent { ZonacardsTheme(dark = false) {
            var r by remember { mutableStateOf(range) }
            ZcRangeSlider(r, { r = it; range = it }, valueRange = 0f..100f, step = 10f, minGap = 10f, minLabel = "Desde", maxLabel = "Hasta")
        } }
        rule.onNode(hasContentDescription("Desde")).performSemanticsAction(SemanticsActions.SetProgress) { it(90f) }
        assertEquals(50f, range.start, 0f)
        assertEquals(60f, range.endInclusive, 0f)
        rule.onNode(hasContentDescription("Hasta")).performSemanticsAction(SemanticsActions.SetProgress) { it(20f) }
        assertEquals(60f, range.endInclusive, 0f)
        rule.onNode(hasContentDescription("Hasta")).performSemanticsAction(SemanticsActions.SetProgress) { it(80f) }
        assertEquals(80f, range.endInclusive, 0f)
    }

    @Test fun timeFieldMasksWhileTyping() {
        rule.setContent { ZonacardsTheme(dark = false) {
            var t by remember { mutableStateOf<String?>(null) }
            ZcTimeField(t, { t = it }, "Hora de apertura")
        } }
        rule.onNode(hasSetTextAction()).performTextInput("0930")
        rule.onNode(hasSetTextAction()).assertTextEquals("09:30")
        rule.onNodeWithContentDescription("Elegir hora", substring = true, ignoreCase = true).assertHeightIsAtLeast(44.dp)
    }

    @Test fun timeFieldRejectsLetters() {
        rule.setContent { ZonacardsTheme(dark = false) {
            var t by remember { mutableStateOf<String?>(null) }
            ZcTimeField(t, { t = it }, "Hora")
        } }
        rule.onNode(hasSetTextAction()).performTextInput("ab1")
        rule.onNode(hasSetTextAction()).assertTextEquals("1")
    }

    @Test fun passwordMeterAndRulesFollowTheValue() {
        rule.setContent { ZonacardsTheme(dark = false) {
            var pw by remember { mutableStateOf("") }
            Column { ZcPasswordField(pw, { pw = it }, "Crea una contraseña"); ZcPasswordRules(pw) }
        } }
        rule.onNodeWithText("Seguridad", substring = true).assertIsDisplayed()
        rule.onAllNodes(hasContentDescription("pendiente", substring = true, ignoreCase = true)).assertCountEquals(4)
        rule.onNode(hasSetTextAction()).performTextInput("Zona#2026")
        rule.onAllNodes(hasContentDescription("cumplido", substring = true, ignoreCase = true)).assertCountEquals(4)
    }

    @Test fun secretFieldMasksRevealsAndCopies() {
        var ctx: Context? = null
        var revealed = 0
        rule.setContent { ZonacardsTheme(dark = false) {
            ctx = LocalContext.current
            ZcSecretField("zc_live_9f3a7c1d5b2e4a60b8d1", "API Key", keepPrefix = "zc_live_", onRevealed = { revealed++ })
        } }
        // Los puntos se ajustan al ancho (4 a 16); el prefijo y los últimos 4 caracteres siempre se ven.
        val masked = SemanticsMatcher("enmascarado") { n ->
            Regex("^zc_live_•{4,16}b8d1$").matches(n.config.getOrNull(SemanticsProperties.Text)?.joinToString("") { it.text }.orEmpty())
        }
        rule.onNode(masked).assertIsDisplayed()
        rule.onNode(hasContentDescription("Mostrar", substring = true)).performClick()
        rule.onNodeWithText("zc_live_9f3a7c1d5b2e4a60b8d1").assertIsDisplayed()
        assertEquals(1, revealed)
        rule.onNode(hasContentDescription("Copiar", substring = true)).performClick()
        val clip = (ctx!!.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).primaryClip
        assertEquals("zc_live_9f3a7c1d5b2e4a60b8d1", clip?.getItemAt(0)?.text?.toString())
        rule.onNode(hasContentDescription("Ocultar", substring = true)).performClick()
        rule.onNode(masked).assertIsDisplayed()
    }

    @Test fun secretFieldWithoutPermissionHasNoRevealButton() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcSecretField("abcdefgh12345678", "Clave", canReveal = false) } }
        rule.onNode(hasContentDescription("Mostrar", substring = true)).assertDoesNotExist()
        rule.onNode(hasContentDescription("Copiar", substring = true)).assertExists()
    }

    @Test fun tagsFieldAddsOnSeparatorValidatesAndRejectsRepeats() {
        var tags = listOf<String>()
        rule.setContent { ZonacardsTheme(dark = false) {
            var t by remember { mutableStateOf(tags) }
            ZcTagsField(t, { t = it; tags = it }, "Correos", max = 3)
        } }
        rule.onNode(hasSetTextAction()).performTextInput("ana@empresa.com,")
        assertEquals(listOf("ana@empresa.com"), tags)
        rule.onNode(hasSetTextAction()).performTextInput("ANA@empresa.com,")
        assertEquals("el repetido no se agrega", listOf("ana@empresa.com"), tags)
        rule.onNode(hasSetTextAction()).performTextInput("sin-arroba")
        rule.onNode(hasSetTextAction()).performImeAction()
        assertEquals(listOf("ana@empresa.com", "sin-arroba"), tags)
        rule.onNode(hasContentDescription("No válido: sin-arroba")).assertExists()
        rule.onNode(hasContentDescription("No válido: ana@empresa.com")).assertDoesNotExist()
    }

    @Test fun tagsFieldSplitsAPastedListAndStopsAtTheMaximum() {
        var tags = listOf<String>()
        rule.setContent { ZonacardsTheme(dark = false) {
            var t by remember { mutableStateOf(tags) }
            ZcTagsField(t, { t = it; tags = it }, "Correos", max = 2)
        } }
        rule.onNode(hasSetTextAction()).performTextInput("a@x.com b@x.com c@x.com")
        assertEquals(listOf("a@x.com", "b@x.com"), tags)
        rule.onNode(hasContentDescription("Correos")).assertIsNotEnabled()
    }

    @Test fun tagsFieldRemovesATagFromItsChip() {
        var tags = listOf("a@x.com", "b@x.com")
        rule.setContent { ZonacardsTheme(dark = false) {
            var t by remember { mutableStateOf(tags) }
            ZcTagsField(t, { t = it; tags = it }, "Correos")
        } }
        rule.onNode(hasContentDescription("a@x.com", substring = true) and androidx.compose.ui.test.hasClickAction()).performClick()
        assertTrue(tags == listOf("b@x.com"))
    }
}

/** El paso a paso horizontal aparece desde 768 dp. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w800dp-h1000dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class StepperWideTest {
    @get:Rule val rule = createComposeRule()

    @Test fun showsEveryStepWithDoneAndCurrentMarked() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcStepper(listOf("Empresa", "Contacto", "Resumen"), 1, "Nuevo cliente") } }
        rule.onNode(hasContentDescription("Empresa", substring = true)).assertExists()
        rule.onNode(SemanticsMatcher.expectValue(SemanticsProperties.Selected, true) and hasContentDescription("Contacto")).assertExists()
        rule.onNodeWithText("Paso 2 de 3", substring = true).assertDoesNotExist()
    }
}
