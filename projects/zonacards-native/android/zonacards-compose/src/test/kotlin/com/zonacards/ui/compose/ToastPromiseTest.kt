package com.zonacards.ui.compose

import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.async
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** `ZcToastState.promise` y `update`: un solo aviso que pasa de "cargando" a éxito o error en su lugar. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ToastPromiseTest {
    @get:Rule val rule = createComposeRule()
    private fun has(text: String) = rule.onAllNodes(hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()

    @Test fun loadingDoesNotCloseByItselfSuccessDoesAndAnErrorWithActionDoesNot() {
        val s = ZcToastState()
        val a = s.loading("Guardando…")
        val b = s.success("Listo")
        val c = s.error("Falló", actionLabel = "Reintentar", onAction = {})
        assertNull(s.items.first { it.id == a }.duration)
        assertEquals(6000L, s.items.first { it.id == b }.duration)
        assertNull(s.items.first { it.id == c }.duration)
    }

    @Test fun updateChangesTheToastInPlaceAndRecomputesTheDuration() {
        val s = ZcToastState()
        val id = s.loading("Guardando…")
        assertTrue(s.update(id, ZcToastKind.SUCCESS, "Guardado", "Ya está activo."))
        val t = s.items.single()
        assertEquals(listOf(id, ZcToastKind.SUCCESS, "Guardado", "Ya está activo.", 6000L), listOf(t.id, t.kind, t.title, t.text, t.duration))
        assertFalse(s.update(999L, ZcToastKind.INFO, "x"))
    }

    @Test fun promiseGoesFromLoadingToSuccessInTheSameToastAndReturnsTheValue() = runBlocking {
        val s = ZcToastState()
        val gate = CompletableDeferred<Int>()
        val done = async { s.promise(ZcToastBody("Guardando…"), { n: Int -> ZcToastBody("Se guardaron $n filas") }, { ZcToastBody("No se pudo guardar") }) { gate.await() } }
        while (s.items.isEmpty()) kotlinx.coroutines.yield()
        assertEquals(listOf(ZcToastKind.LOADING to "Guardando…"), s.items.map { it.kind to it.title })
        val id = s.items.single().id
        gate.complete(7)
        assertEquals(7, done.await())
        assertEquals(listOf(Triple(id, ZcToastKind.SUCCESS, "Se guardaron 7 filas")), s.items.map { Triple(it.id, it.kind, it.title) })
    }

    @Test fun promiseGoesToErrorInPlaceAndRethrows() = runBlocking {
        val s = ZcToastState()
        val gate = CompletableDeferred<Unit>()
        val done = async { runCatching { s.promise("Guardando…", "Guardado", "No se pudo guardar") { gate.await() } } }
        while (s.items.isEmpty()) kotlinx.coroutines.yield()
        val id = s.items.single().id
        gate.completeExceptionally(IllegalStateException("sin conexión"))
        assertTrue(done.await().exceptionOrNull() is IllegalStateException)
        assertEquals(listOf(Triple(id, ZcToastKind.ERROR, "No se pudo guardar")), s.items.map { Triple(it.id, it.kind, it.title) })
    }

    @Test fun ifTheToastWasClosedTheResultIsStillShownInANewOne() = runBlocking {
        val s = ZcToastState()
        val gate = CompletableDeferred<Unit>()
        val done = async { s.promise("Guardando…", "Guardado", "No se pudo guardar") { gate.await() } }
        while (s.items.isEmpty()) kotlinx.coroutines.yield()
        s.dismiss(s.items.single().id)
        assertTrue(s.items.isEmpty())
        gate.complete(Unit)
        done.await()
        assertEquals(listOf(ZcToastKind.SUCCESS to "Guardado"), s.items.map { it.kind to it.title })
    }

    @Test fun cancellingClosesTheLoadingToast() = runBlocking {
        val s = ZcToastState()
        val job = async { s.promise("Guardando…", "Guardado", "No se pudo guardar") { CompletableDeferred<Unit>().await() } }
        while (s.items.isEmpty()) kotlinx.coroutines.yield()
        job.cancel()
        runCatching { job.await() }
        assertTrue(s.items.isEmpty())
    }

    @Test fun theToasterShowsTheSpinnerWhileLoadingAndThenTheResult() {
        val s = ZcToastState()
        val id = s.loading("Guardando el lote…")
        rule.setContent { ZonacardsTheme(dark = false) { ZcToaster(s) } }
        rule.waitForIdle()
        assertTrue(has("Guardando el lote…"))
        rule.onNodeWithContentDescription("Cargando").assertExists()
        s.update(id, ZcToastKind.SUCCESS, "Lote guardado", "120 códigos listos.")
        rule.waitForIdle()
        assertTrue(has("Lote guardado"))
        assertFalse(has("Guardando el lote…"))
        assertTrue(rule.onAllNodes(androidx.compose.ui.test.hasContentDescription("Cargando")).fetchSemanticsNodes().isEmpty())
    }
}
