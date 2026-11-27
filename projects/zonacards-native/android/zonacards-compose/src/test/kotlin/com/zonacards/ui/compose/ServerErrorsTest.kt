package com.zonacards.ui.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isFocused
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import kotlinx.coroutines.launch
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Errores del servidor por campo: caen en su campo, el foco va al primero y el error se borra al editar. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ServerErrorsTest {
    @get:Rule val rule = createComposeRule()
    private fun has(text: String) = rule.onAllNodes(hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()

    @Test fun appliesMessagesAndReportsTheUnknownKeys() {
        val s = ZcServerErrors(listOf("email", "nombre"))
        val left = s.apply(mapOf("email" to "Repetido.", "cuenta" to "Suspendida", "nombre" to "", "otro" to null))
        assertEquals(listOf("cuenta"), left)
        assertEquals("Repetido.", s.error("email"))
        assertNull("un mensaje vacío no es un error", s.error("nombre"))
        assertTrue(s.hasErrors)
        s.clear("email")
        assertFalse(s.hasErrors)
        assertNull(s.firstInvalid)
    }

    @Test fun theFirstInvalidFollowsTheDeclaredOrderNotTheOrderOfTheResponse() {
        val s = ZcServerErrors(listOf("email", "nombre", "telefono"))
        s.apply(mapOf("telefono" to "Corto.", "nombre" to "Sin números."))
        assertEquals("nombre", s.firstInvalid)
    }

    @Test fun showsTheMessagesInTheFieldsFocusesTheFirstAndClearsOnEdit() {
        rule.setContent { ZonacardsTheme(dark = false) {
            val server = rememberZcServerErrors("email", "nombre")
            val scope = rememberCoroutineScope()
            var email by remember { mutableStateOf("ana@empresa.com") }
            var name by remember { mutableStateOf("Ana 2") }
            Column {
                ZcTextField(email, { email = it; server.clear("email") }, "Correo", error = server.error("email"), focusRequester = server.requester("email"))
                ZcTextField(name, { name = it; server.clear("nombre") }, "Nombre", error = server.error("nombre"), focusRequester = server.requester("nombre"))
                ZcButton("Guardar", { scope.launch { server.apply(mapOf("email" to "Ya existe una cuenta con este correo.", "nombre" to "Sin números.")); server.focusFirst() } })
            }
        } }
        rule.onNodeWithText("Guardar").performClick()
        rule.waitForIdle()
        assertTrue(has("Ya existe una cuenta con este correo."))
        assertTrue(has("Sin números."))
        rule.onNode(hasSetTextAction() and isFocused()).assertTextContains("ana@empresa.com")
        // Editar el correo borra su error y deja el otro.
        rule.onNode(hasSetTextAction() and isFocused()).performTextInput("x")
        assertFalse(has("Ya existe una cuenta con este correo."))
        assertTrue(has("Sin números."))
    }
}
