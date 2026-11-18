package com.zonacards.ui.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.test.assertWidthIsAtLeast
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Formularios (ola 2): nombre y error para TalkBack, filtros de entrada, normalización al salir, sheets de selección. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es")
@org.robolectric.annotation.GraphicsMode(org.robolectric.annotation.GraphicsMode.Mode.NATIVE) // medidas de texto reales
class FormsTest {
    @get:Rule val rule = createComposeRule()
    private fun field(name: String) = rule.onNode(hasSetTextAction() and hasContentDescription(name))
    private fun editable(text: String) = SemanticsMatcher.expectValue(SemanticsProperties.EditableText, AnnotatedString(text))

    @Test fun textFieldAnnouncesRequiredAndError() {
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcTextField("", {}, label = "Correo", required = true, error = "Ingresa un correo válido, ej. ana@empresa.com")
        } }
        field("Correo (obligatorio)").assert(SemanticsMatcher.expectValue(SemanticsProperties.Error, "Ingresa un correo válido, ej. ana@empresa.com"))
    }

    @Test fun passwordToggle() {
        rule.setContent { ZonacardsTheme(dark = false) { var v by remember { mutableStateOf("Secreta1!") }; ZcTextField(v, { v = it }, label = "Contraseña", password = true) } }
        rule.onNodeWithContentDescription("Mostrar contraseña").assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button)).performClick()
        rule.onNodeWithContentDescription("Ocultar contraseña").assertExists()
    }

    @Test fun taxIdFiltersAndNormalizesOnBlur() {
        var out = ""
        rule.setContent { ZonacardsTheme(dark = false) { Column {
            var v by remember { mutableStateOf("") }
            ZcTaxIdField(v, { v = it; out = it }, country = "cl")
            ZcTextField("", {}, label = "Otro")
        } } }
        field("RUT").performTextInput("12.345.678x5")
        assertEquals("12.345.6785", out) // la "x" se rechaza
        field("Otro").performClick() // sale del campo: normaliza
        rule.waitForIdle()
        assertEquals("12345678-5", out)
        assertEquals(true, zcIsValidTaxId("cl", out))
    }

    @Test fun moneyFieldLimitsDecimalsAndFormatsOnBlur() {
        var amount: Double? = null
        rule.setContent { ZonacardsTheme(dark = false) { Column {
            var a by remember { mutableStateOf<Double?>(null) }
            ZcMoneyField(a, { a = it; amount = it }, label = "Monto", country = "pe")
            ZcTextField("", {}, label = "Otro")
        } } }
        field("Monto").performTextInput("1250.505")
        assertEquals(null, amount) // el tercer decimal hace inválida la entrada completa: no cambia
        field("Monto").performTextReplacement("1250.5")
        assertEquals(1250.5, amount!!, 0.0001)
        field("Otro").performClick()
        rule.waitForIdle()
        field("Monto").assert(editable("1,250.50"))
    }

    @Test fun clpHasNoDecimals() {
        var amount: Double? = null
        rule.setContent { ZonacardsTheme(dark = false) { var a by remember { mutableStateOf<Double?>(null) }; ZcMoneyField(a, { a = it; amount = it }, label = "Monto", country = "cl") } }
        field("Monto").performTextInput("12345,6")
        assertEquals(null, amount) // la coma no entra en CLP
        field("Monto").performTextReplacement("12345")
        assertEquals(12345.0, amount!!, 0.0)
    }

    @Test fun phoneKeepsDigitsOnly() {
        var out = ""
        rule.setContent { ZonacardsTheme(dark = false) {
            var d by remember { mutableStateOf("") }
            var cc by remember { mutableStateOf("pe") }
            ZcPhoneField(d, { d = it; out = it }, cc, { cc = it }, label = "Celular")
        } }
        field("Celular").performTextInput("987-654-3210")
        assertEquals("987654321", out) // Perú: 9 dígitos
        rule.onNodeWithContentDescription("Código de país, Perú +51").performClick()
        rule.onNodeWithText("Colombia").performClick()
        rule.onNodeWithText("+57").assertExists()
    }

    @Test fun selectOpensSheetAndPicks() {
        var picked: String? = null
        rule.setContent { ZonacardsTheme(dark = false) {
            var s by remember { mutableStateOf<String?>(null) }
            ZcSelect(listOf(ZcSelectOption("pe", "Perú"), ZcSelectOption("cl", "Chile")), s, { s = it; picked = it }, label = "País", placeholder = "Elige un país")
        } }
        rule.onNodeWithContentDescription("País").assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.DropdownList)).performClick()
        rule.onNodeWithText("Chile").performClick()
        assertEquals("cl", picked)
        rule.onNodeWithContentDescription("País").assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Chile"))
    }

    @Test fun multiSelectAppliesOnDone() {
        var chosen = emptySet<String>()
        rule.setContent { ZonacardsTheme(dark = false) {
            var s by remember { mutableStateOf(setOf<String>()) }
            ZcMultiSelect((1..12).map { ZcSelectOption("c$it", "Canal $it") }, s, { s = it; chosen = it }, label = "Canales")
        } }
        rule.onNodeWithContentDescription("Canales").performClick()
        field("Buscar opción").performTextInput("1")
        rule.onNodeWithText("Canal 10").performClick()
        // La lista se desplaza dentro del sheet; el pie (Limpiar / Listo) queda fijo.
        rule.onNode(androidx.compose.ui.test.hasScrollAction()).performScrollToNode(androidx.compose.ui.test.hasText("Canal 12"))
        rule.onNodeWithText("Canal 12").performClick()
        assertEquals(emptySet<String>(), chosen) // aún no aplica
        // Pie del sheet: botones con su texto completo (no se aplastan).
        rule.onNodeWithText("Limpiar").assertWidthIsAtLeast(72.dp)
        rule.onNodeWithText("Listo").assertWidthIsAtLeast(64.dp).performClick()
        assertEquals(setOf("c10", "c12"), chosen)
    }

    @Test fun otpCompletes() {
        var done = ""
        rule.setContent { ZonacardsTheme(dark = false) { var v by remember { mutableStateOf("") }; ZcOtpField(v, { v = it }, label = "Código de verificación", onComplete = { done = it }) } }
        field("Código de verificación").performTextInput("12a3456")
        assertEquals("123456", done)
    }

    @Test fun pinPadProgressAndDelete() {
        var pin = ""
        rule.setContent { ZonacardsTheme(dark = false) { var v by remember { mutableStateOf("") }; ZcPinPad(v, { v = it; pin = it }, length = 4) } }
        rule.onNodeWithContentDescription("1").performClick()
        rule.onNodeWithContentDescription("2").performClick()
        rule.onNodeWithContentDescription("PIN, 2 de 4 dígitos").assertExists()
        rule.onNodeWithContentDescription("Borrar").performClick()
        assertEquals("1", pin)
    }

    @Test fun searchClears() {
        rule.setContent { ZonacardsTheme(dark = false) { var q by remember { mutableStateOf("") }; ZcSearchField(q, { q = it }) } }
        field("Buscar").performTextInput("lote 02829")
        rule.onNodeWithContentDescription("Limpiar").performClick()
        field("Buscar").assert(editable(""))
    }
}
