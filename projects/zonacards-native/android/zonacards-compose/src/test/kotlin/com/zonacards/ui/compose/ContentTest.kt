package com.zonacards.ui.compose

import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.ZcIcons
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Contenido base (ola 5): roles y estados para TalkBack, comportamiento y toque mínimo de cada componente. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ContentTest {
    @get:Rule val rule = createComposeRule()

    @Test fun tabsSelectHaveTabRoleAndRespectDisabled() {
        rule.setContent { ZonacardsTheme(dark = false) {
            var s by remember { mutableStateOf("a") }
            ZcTabs(listOf(ZcTab("a", "Uno", count = 3), ZcTab("b", "Dos"), ZcTab("c", "Tres", enabled = false)), s, { s = it }, label = "Secciones")
        } }
        rule.onNodeWithText("Uno").assertIsSelected().assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Tab))
        rule.onNodeWithText("Dos").assertIsNotSelected().assertHeightIsAtLeast(44.dp).performClick()
        rule.onNodeWithText("Dos").assertIsSelected()
        rule.onNodeWithText("Uno").assertIsNotSelected()
        rule.onNodeWithText("Tres").assertIsNotEnabled()
    }

    @Test fun segmentedTabsWorkToo() {
        rule.setContent { ZonacardsTheme(dark = false) {
            var s by remember { mutableStateOf("sem") }
            ZcTabs(listOf(ZcTab("sem", "Semana"), ZcTab("mes", "Mes")), s, { s = it }, variant = ZcTabsVariant.SEGMENTED)
        } }
        rule.onNodeWithText("Mes").performClick()
        rule.onNodeWithText("Mes").assertIsSelected()
    }

    @Test fun dangerAlertIsAssertiveAndOthersPolite() {
        rule.setContent { ZonacardsTheme(dark = false) { Column {
            ZcAlert("No pudimos guardar", tone = ZcAlertTone.DANGER, text = "Referencia ZC-1")
            ZcAlert("Aviso", tone = ZcAlertTone.INFO, text = "Todo bien", actions = { ZcAlertAction("Ver", {}) })
        } } }
        rule.onNode(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Assertive)).assertTextContains("No pudimos guardar").assertTextContains("Referencia ZC-1", substring = true)
        rule.onNode(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite)).assertTextContains("Aviso")
    }

    @Test fun singleAccordionOpensOneAtATimeAndExposesExpandCollapse() {
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcAccordion(listOf(
                ZcAccordionItem("a", "Pregunta A", content = { ZcText("Respuesta A") }),
                ZcAccordionItem("b", "Pregunta B", content = { ZcText("Respuesta B") }),
                ZcAccordionItem("c", "Pregunta C", enabled = false, content = { ZcText("Respuesta C") }),
            ))
        } }
        rule.onNodeWithText("Respuesta A").assertDoesNotExist()
        rule.onNodeWithText("Pregunta A").assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading)).assert(SemanticsMatcher.keyIsDefined(SemanticsActions.Expand)).assertHeightIsAtLeast(44.dp).performClick()
        rule.onNodeWithText("Respuesta A").assertIsDisplayed()
        rule.onNodeWithText("Pregunta A").assert(SemanticsMatcher.keyIsDefined(SemanticsActions.Collapse))
        rule.onNodeWithText("Pregunta B").performClick()
        rule.waitForIdle()
        rule.onNodeWithText("Respuesta B").assertIsDisplayed()
        rule.onNodeWithText("Respuesta A").assertDoesNotExist()
        rule.onNodeWithText("Pregunta C").assertIsNotEnabled()
    }

    @Test fun multipleAccordionExpandsAndCollapsesAll() {
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcAccordion(listOf(
                ZcAccordionItem("a", "Sección A", content = { ZcText("Contenido A") }),
                ZcAccordionItem("b", "Sección B", content = { ZcText("Contenido B") }),
            ), multiple = true, label = "Datos")
        } }
        rule.onNodeWithText("Expandir todo").assertHeightIsAtLeast(44.dp).performClick()
        rule.onNodeWithText("Contenido A").assertIsDisplayed()
        rule.onNodeWithText("Contenido B").assertIsDisplayed()
        rule.onNodeWithText("Contraer todo").performClick()
        rule.waitForIdle()
        rule.onNodeWithText("Contenido A").assertDoesNotExist()
        rule.onNodeWithText("Expandir todo").assertExists()
    }

    @Test fun descriptionListReadsEachPairAsOneThing() {
        val items = listOf(ZcDescription("Cliente", "Interbank"), ZcDescription("País", "Perú", flag = "pe"))
        rule.setContent { ZonacardsTheme(dark = false) { Column { ZcDescriptionList(items); ZcDescriptionList(items, layout = ZcDescriptionLayout.ROWS) } } }
        rule.onAllNodes(hasContentDescription("Cliente: Interbank")).assertCountEquals(2)
        rule.onAllNodes(hasContentDescription("País: Perú")).assertCountEquals(2)
    }

    @Test fun timelineReadsTitleAndDetail() {
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcTimeline(listOf(ZcTimelineItem(ZcIcons.sCheckCircle, "Aprobado", "17 nov 2026 · Luis"), ZcTimelineItem(ZcIcons.sWallet, "Entregado")), label = "Historial del lote")
        } }
        rule.onNode(hasContentDescription("Historial del lote")).assertExists()
        rule.onNode(hasContentDescription("Aprobado. 17 nov 2026 · Luis")).assertExists()
        rule.onNode(hasContentDescription("Entregado")).assertExists()
    }

    @Test fun copyButtonCopiesAnnouncesAndReturnsToIdle() {
        var ctx: Context? = null
        var copied: String? = null
        rule.setContent { ZonacardsTheme(dark = false) { ctx = LocalContext.current; ZcCopyButton("ABC-123", label = "Copiar el pedido", onCopied = { copied = it }) } }
        rule.onNodeWithContentDescription("Copiar el pedido").assertHeightIsAtLeast(44.dp).performClick()
        assertEquals("ABC-123", copied)
        rule.onNodeWithContentDescription("Copiado").assertExists()
        val clip = (ctx!!.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).primaryClip
        assertEquals("ABC-123", clip?.getItemAt(0)?.text?.toString())
        rule.mainClock.advanceTimeBy(2100)
        rule.waitForIdle()
        rule.onNodeWithContentDescription("Copiar el pedido").assertExists()
    }

    @Test fun copyButtonWithTextShowsCopiedText() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcCopyButton("ABC-123", showText = true, variant = ZcButtonVariant.OUTLINE) } }
        rule.onNodeWithText("Copiar").performClick()
        rule.onNodeWithText("Copiado").assertExists()
    }

    @Test fun errorPageHasHeadingActionsAndReference() {
        rule.setContent { ZonacardsTheme(dark = false) {
            ZcErrorPage("No encontramos esta página", "Tu trabajo está guardado.", ZcIcons.sMagnifer, code = "404", reference = "ZC-48213", actions = { ZcButton("Ir al inicio", {}, size = ZcButtonSize.SM) })
        } }
        rule.onNodeWithText("No encontramos esta página").assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading))
        rule.onNodeWithText("Ref. ZC-48213").assertIsDisplayed()
        rule.onNodeWithText("404").assertIsDisplayed()
        rule.onNodeWithText("Ir al inicio").assertHeightIsAtLeast(44.dp)
    }

    @Test fun bulletIsAnImageWithItsLabel() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcBullet(38.0, 50.0, 160.0, "Stock: 38 de 160", reorder = 66.0, head = { ZcText("Stock") }) } }
        rule.onNode(hasContentDescription("Stock: 38 de 160")).assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Image))
        rule.onNode(hasText("Stock")).assertIsDisplayed()
    }
}
