package com.zonacards.ui.compose

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
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
import java.time.Instant

/** Eliminar mi cuenta: consecuencias, código, solicitud abierta y rechazada. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class DeleteAccountTest {
    @get:Rule val rule = createComposeRule()
    private fun has(text: String) = rule.onAllNodes(hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()

    @Test fun beforeTheCodeItExplainsAndOffersToSendIt() {
        var sent = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcDeleteAccount(null, null, { sent++ }, { _, _ -> }, {}) } }
        rule.onNodeWithText("¿Qué pasa si eliminas tu cuenta?").assertIsDisplayed()
        assertTrue(has("Perderás el acceso a tu cuenta"))
        rule.onNodeWithText("Enviar código a mi correo").performClick()
        assertEquals(1, sent)
        assertTrue(!has("Solicitar eliminación"))
    }

    @Test fun withTheCodeSentItNeedsSixDigitsAndSendsTheReason() {
        var got: Pair<String, String?>? = null
        rule.setContent { ZonacardsTheme(dark = false) { ZcDeleteAccount(null, "a•••@empresa.com", {}, { c, r -> got = c to r }, {}) } }
        assertTrue(has("a•••@empresa.com"))
        rule.onNodeWithText("Solicitar eliminación").performClick()
        assertTrue(has("Ingresa los 6 dígitos del código."))
        assertEquals(null, got)
        val boxes = rule.onAllNodes(hasSetTextAction())
        boxes[0].performTextInput("123456")
        boxes[1].performTextInput("  Ya no lo uso ")
        rule.onNodeWithText("Solicitar eliminación").performClick()
        assertEquals("123456" to "Ya no lo uso", got)
    }

    @Test fun anOpenRequestShowsItsStatusAndDateAndOnlyBack() {
        var back = 0
        val req = ZcDeletionRequest(true, "Pendiente", Instant.parse("2026-11-20T20:30:00Z"))
        rule.setContent { ZonacardsTheme(dark = false) { ZcDeleteAccount(req, null, {}, { _, _ -> }, { back++ }) } }
        rule.onNodeWithText("Tu solicitud está «Pendiente»").assertExists()
        assertTrue(has("La registraste el"))
        assertTrue(!has("Enviar código a mi correo"))
        rule.onNodeWithText("Volver").performClick()
        assertEquals(1, back)
    }

    @Test fun aRejectedRequestShowsTheReasonAndLetsAskAgain() {
        val req = ZcDeletionRequest(false, "Rechazada", Instant.parse("2026-11-01T10:00:00Z"), "Tienes un pedido en curso.")
        rule.setContent { ZonacardsTheme(dark = false) { ZcDeleteAccount(req, null, {}, { _, _ -> }, {}) } }
        rule.onNodeWithText("Tu solicitud anterior fue rechazada").assertExists()
        assertTrue(has("Tienes un pedido en curso."))
        rule.onNodeWithText("Enviar código a mi correo").assertExists()
    }

    @Test fun anErrorFromTheAppShowsUnderTheCode() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcDeleteAccount(null, "a•••@empresa.com", {}, { _, _ -> }, {}, error = "El código no es válido.") } }
        assertTrue(has("El código no es válido."))
    }
}
