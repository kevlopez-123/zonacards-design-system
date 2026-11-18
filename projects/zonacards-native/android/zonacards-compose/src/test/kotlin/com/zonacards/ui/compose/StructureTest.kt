package com.zonacards.ui.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.unit.dp
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.printToString
import androidx.compose.ui.test.swipeDown
import com.zonacards.ui.tokens.ZcIcons
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Estructura (ola 3): barras, sheets con subpantalla, diálogos, avisos, estados y gestos con alternativa accesible. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class StructureTest {
    @get:Rule val rule = createComposeRule()

    /** Ejecuta una acción de TalkBack (CustomAccessibilityAction) por su nombre, como lo haría el lector de pantalla. */
    private fun customAction(label: String) {
        val node = rule.onNode(SemanticsMatcher("acción $label") { n -> n.config.getOrElse(SemanticsActions.CustomActions) { emptyList() }.any { it.label == label } })
        node.fetchSemanticsNode().config[SemanticsActions.CustomActions].first { it.label == label }.action()
        rule.waitForIdle()
    }

    @Test fun topBarBackAndHeading() {
        var back = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcTopBar("Lote #02829", subtitle = "Perú", onBack = { back++ }) } }
        rule.onNodeWithContentDescription("Volver").performClick()
        assertEquals(1, back)
        rule.onNodeWithText("Lote #02829").assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading))
    }

    @Test fun bottomNavSelects() {
        rule.setContent { ZonacardsTheme(dark = false) {
            var cur by remember { mutableStateOf("inicio") }
            ZcBottomNav(listOf(ZcNavItem("inicio", "Inicio", ZcIcons.sHome2), ZcNavItem("lotes", "Lotes", ZcIcons.sBox), ZcNavItem("avisos", "Avisos", ZcIcons.sInbox, badge = "3")), cur, { cur = it })
        } }
        rule.onNodeWithText("Lotes").performClick().assertIsSelected()
    }

    @Test fun selectInsideSheetOpensSubscreenNotAnotherSheet() {
        var picked: String? = null
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcBottomSheet(onDismiss = {}, title = "Filtros") {
                ZcSelect(listOf(ZcSelectOption("pe", "Perú"), ZcSelectOption("cl", "Chile")), null, { picked = it }, label = "País")
            }
        } }
        rule.onNode(hasContentDescription("País") and hasClickAction()).performClick()
        rule.waitForIdle()
        // Subpantalla con Volver dentro del mismo sheet.
        rule.onNodeWithContentDescription("Volver").assertExists()
        rule.onNodeWithText("Chile").performClick()
        assertEquals("cl", picked)
        rule.waitForIdle()
        rule.onNodeWithText("Filtros").assertExists()
    }

    @Test fun sheetCloseRunsExitThenDismiss() {
        var dismissed = false
        rule.setContent { ZonacardsTheme(dark = false) {
            var open by remember { mutableStateOf(true) }
            if (open) ZcBottomSheet(onDismiss = { open = false; dismissed = true }, title = "Acciones") {
                ZcMenu(listOf(ZcAction("a", "Anular", ZcIcons.sCloseCircle, danger = true)), {}, label = "Acciones del lote")
            }
        } }
        rule.onNodeWithContentDescription("Acciones del lote").performClick()
        rule.onNodeWithText("Anular").assertExists() // menú como subpantalla
        rule.onNodeWithContentDescription("Volver").performClick()
        rule.waitForIdle()
        assertTrue(!dismissed)
    }

    @Test fun alertDialogButtons() {
        var confirmed = false
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcAlertDialog("¿Anular el lote #02829?", "Los 1.200 códigos dejarán de funcionar.", "Anular lote", { confirmed = true }, "Cancelar", {}, danger = true)
        } }
        rule.onNodeWithText("Cancelar").assertExists()
        rule.onNodeWithText("Anular lote").performClick()
        assertTrue(confirmed)
    }

    @Test fun toastShowsAndErrorWithActionStays() {
        lateinit var state: ZcToastState
        rule.setContent { ZonacardsTheme(dark = false) {
            state = rememberZcToastState()
            ZcToaster(state)
        } }
        rule.mainClock.autoAdvance = false
        rule.runOnIdle {
            state.success("Lote creado", "Ya puedes descargar los códigos.")
            state.error("No se pudo guardar", actionLabel = "Reintentar", onAction = {})
            // Con el reloj en pausa, el cambio de estado hecho fuera de Compose se publica a mano.
            androidx.compose.runtime.snapshots.Snapshot.sendApplyNotifications()
        }
        rule.mainClock.advanceTimeByFrame()
        rule.mainClock.advanceTimeBy(500)
        rule.onNodeWithText("Lote creado").assertExists()
        rule.onNodeWithText("No se pudo guardar").assertExists()
        rule.mainClock.advanceTimeBy(6000)
        rule.onNodeWithText("Lote creado").assertDoesNotExist()
        rule.onNodeWithText("No se pudo guardar").assertExists() // error con acción: no se cierra solo
        rule.onNodeWithContentDescription("Cerrar notificación").performClick()
        androidx.compose.runtime.snapshots.Snapshot.sendApplyNotifications()
        rule.mainClock.advanceTimeBy(500)
        rule.onNodeWithText("No se pudo guardar").assertDoesNotExist()
    }

    @Test fun stateErrorShowsReferenceAndRetry() {
        var retried = false
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcState("No se pudo cargar los lotes", kind = ZcStateKind.ERROR, text = "Tus filtros se conservaron.", reference = "ZC-7F3A") {
                ZcButton("Reintentar", { retried = true }, variant = ZcButtonVariant.OUTLINE)
            }
        } }
        rule.onNodeWithText("Ref. ZC-7F3A", substring = true).assertExists()
        rule.onNodeWithText("Reintentar").performClick()
        assertTrue(retried)
    }

    @Test fun pullRefreshHasAccessibleAction() {
        var refreshes = 0
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcPullRefresh(false, { refreshes++ }, Modifier.fillMaxSize()) {
                LazyColumn(Modifier.fillMaxSize()) { items((1..30).toList()) { ZcText("Fila $it") } }
            }
        } }
        customAction("Actualizar")
        assertEquals(1, refreshes)
        rule.onNode(hasText("Fila 1")).performTouchInput { swipeDown(startY = top + 10f, endY = top + 600f, durationMillis = 300) }
        rule.waitForIdle()
        assertEquals(2, refreshes)
    }

    @Test fun swipeActionsAlsoInTalkBackAndMenu() {
        val done = mutableListOf<String>()
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcSwipeItem(listOf(ZcAction("archivar", "Archivar", ZcIcons.sInbox), ZcAction("anular", "Anular", ZcIcons.sCloseCircle, true)), { done += it }, menuLabel = "Acciones de Lote #02829") {
                ZcText("Lote #02829")
            }
        } }
        customAction("Anular")
        rule.onNodeWithContentDescription("Acciones de Lote #02829").performClick()
        rule.onNode(hasText("Archivar") and hasClickAction()).performClick()
        assertEquals(listOf("anular", "archivar"), done)
    }

    @Test @Config(qualifiers = "es-w400dp-h1400dp-xhdpi") fun swipeItemKeepsItsHeight() {
        rule.setContent { ZonacardsTheme(dark = false) { Column(Modifier.padding(16.dp)) {
            ZcSwipeItem(listOf(ZcAction("archivar", "Archivar", ZcIcons.sInbox), ZcAction("anular", "Anular", ZcIcons.sCloseCircle, true)), {}, menuLabel = "Acciones") {
                Column { ZcText("Lote #02830"); ZcText("S/ 12,500.00 · 500 códigos") }
            }
            ZcText("Debajo")
        } } }
        val b = rule.onNodeWithText("Debajo").fetchSemanticsNode().boundsInRoot
        val tree = rule.onAllNodes(androidx.compose.ui.test.isRoot()).printToString(maxDepth = 30)
        assertTrue("Debajo top=${b.top} $tree", b.top < 200f) // la fila mide ~70 dp, no la pantalla
    }

    @Test fun offlineBanner() {
        rule.setContent { ZonacardsTheme(dark = true) { Column { ZcOfflineBanner(3) } } }
        rule.onNodeWithText("Sin conexión. 3 cambios pendientes se guardarán al reconectar.").assertExists()
    }
}
