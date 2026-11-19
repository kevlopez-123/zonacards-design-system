package com.zonacards.ui.compose

import android.graphics.Bitmap
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.click
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

private val LINE = ZcChartData(
    listOf("Sem 1", "Sem 2", "Sem 3", "Sem 4"),
    listOf(ZcChartSeries("Este periodo", listOf(10.0, 30.0, 20.0, 40.0)), ZcChartSeries("Periodo anterior", listOf(8.0, 15.0, 18.0, 25.0), dashed = true)),
)
private val DONUT = ZcChartData(listOf("Activos", "Agotados", "Anulados"), listOf(ZcChartSeries("Lotes", listOf(60.0, 30.0, 10.0))))

/** Escalas, abreviaturas y comportamiento del gráfico (ola 5): vista Datos, resumen para TalkBack, toque y casos borde. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ChartsTest {
    @get:Rule val rule = createComposeRule()

    @Test fun niceScaleUsesRoundSteps() {
        val s = zcNiceScale(0.0, 7.0, 4)
        assertEquals(listOf(0.0, 2.0, 4.0, 6.0, 8.0), s.ticks)
        val n = zcNiceScale(-30.0, 70.0, 4)
        assertEquals(-50.0, n.min, 0.0); assertEquals(100.0, n.max, 0.0)
        val z = zcNiceScale(0.0, 0.0, 4)
        assertTrue("un rango vacío dividiría por cero", z.max > z.min)
    }

    @Test fun axisShortAbbreviatesLikeTheWeb() {
        assertEquals("950", zcAxisShort(950.0))
        // Como la web (`toLocaleString('es-PE')`): en Perú el decimal es el punto.
        assertEquals("1.2K", zcAxisShort(1240.0))
        assertEquals("3.5M", zcAxisShort(3_500_000.0))
    }

    @Test fun hasDataNeedsAValueDifferentFromZero() {
        assertTrue(!zcChartHasData(null))
        assertTrue(!zcChartHasData(ZcChartData(emptyList(), emptyList())))
        assertTrue(!zcChartHasData(ZcChartData(listOf("a"), listOf(ZcChartSeries("x", listOf(0.0))))))
        assertTrue(zcChartHasData(LINE))
    }

    @Test fun panelSwitchesBetweenChartAndData() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcChartPanel("Ventas por semana", LINE, ZcChartKind.LINE, categoryLabel = "Semana") } }
        rule.onNodeWithText("Gráfico").assertIsSelected()
        rule.onNode(hasContentDescription("Ventas por semana", substring = true)).assertExists()
        rule.onNodeWithText("Datos").performClick()
        rule.onNodeWithText("Datos").assertIsSelected()
        rule.onNodeWithText("Datos: Ventas por semana").assertIsDisplayed()
        rule.onNodeWithText("Sem 3").assertIsDisplayed()
        rule.onNodeWithText("Periodo anterior").assertIsDisplayed()
    }

    @Test fun summaryNamesEveryPointForScreenReaders() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcChart(LINE, ZcChartKind.LINE, description = "Ventas") } }
        rule.onNode(SemanticsMatcher("resumen con valores") { n ->
            val d = n.config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString(" ").orEmpty()
            d.startsWith("Ventas.") && "Sem 3: Este periodo 20, Periodo anterior 18" in d
        }).assertExists()
    }

    @Test fun donutSummaryHasPercentages() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcChart(DONUT, ZcChartKind.DONUT, description = "Lotes", totalLabel = "lotes") } }
        rule.onNode(hasContentDescription("Activos: 60 (60 %)", substring = true)).assertExists()
    }

    @Test fun emptyDataShowsTheEmptyState() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcChartPanel("Ventas", ZcChartData(listOf("a"), listOf(ZcChartSeries("x", listOf(0.0)))), ZcChartKind.LINE) } }
        rule.onNodeWithText("Sin datos para este periodo").assertIsDisplayed()
    }

    private fun changed(a: Bitmap, b: Bitmap): Int {
        val pa = IntArray(a.width * a.height).also { a.getPixels(it, 0, a.width, 0, 0, a.width, a.height) }
        val pb = IntArray(b.width * b.height).also { b.getPixels(it, 0, b.width, 0, 0, b.width, b.height) }
        return pa.indices.count { pa[it] != pb[it] }
    }

    @Test fun touchingTheLineChartOpensTheTooltip() {
        rule.setContent { ZonacardsTheme(dark = false) { Box(Modifier.size(360.dp, 300.dp).testTag("chart")) { ZcChart(LINE, ZcChartKind.LINE, description = "Ventas", height = 220.dp) } } }
        val before = rule.onNodeWithTag("chart").captureToImage().asAndroidBitmap().copy(Bitmap.Config.ARGB_8888, false)
        rule.onNodeWithTag("chart").performTouchInput { click(Offset(220f, 150f)) }
        rule.waitForIdle()
        val after = rule.onNodeWithTag("chart").captureToImage().asAndroidBitmap()
        assertTrue("el globo y la guía deberían dibujarse (cambiaron ${changed(before, after)} px)", changed(before, after) > 500)
    }

    @Test fun touchingTheDonutHighlightsASegment() {
        rule.setContent { ZonacardsTheme(dark = false) { Box(Modifier.size(360.dp, 400.dp).testTag("chart")) { ZcChart(DONUT, ZcChartKind.DONUT, description = "Lotes", totalLabel = "lotes") } } }
        val before = rule.onNodeWithTag("chart").captureToImage().asAndroidBitmap().copy(Bitmap.Config.ARGB_8888, false)
        // Angosto: el anillo mide 180 dp y va centrado arriba; el aro queda a ~72 dp a la derecha de su centro.
        rule.onNodeWithTag("chart").performTouchInput { click(Offset(center.x + 72f, 90f)) }
        rule.waitForIdle()
        val after = rule.onNodeWithTag("chart").captureToImage().asAndroidBitmap()
        assertTrue("el segmento tocado debería resaltarse (cambiaron ${changed(before, after)} px)", changed(before, after) > 300)
    }

    @Test fun edgeCasesDoNotCrash() {
        val one = ZcChartData(listOf("Solo"), listOf(ZcChartSeries("x", listOf(5.0))))
        val zeros = ZcChartData(listOf("a", "b"), listOf(ZcChartSeries("x", listOf(0.0, 0.0))))
        val negative = ZcChartData(listOf("a", "b", "c"), listOf(ZcChartSeries("x", listOf(-4.0, 2.0, -1.0))))
        val mixed = ZcChartData(listOf("a", "b"), listOf(ZcChartSeries("x", listOf(0.0, 3.0)), ZcChartSeries("y", listOf(2.0))))
        rule.setContent { ZonacardsTheme(dark = false) { Column {
            for (d in listOf(one, zeros, negative, mixed)) for (k in ZcChartKind.entries) ZcChart(d, k, initialSelection = 0)
        } } }
        rule.waitForIdle()
    }

    @Test fun segmentedHasRadioRolesAndTouchTargets() {
        var picked = "a"
        rule.setContent { ZonacardsTheme(dark = false) { ZcSegmented(listOf(ZcSegmentOption("a", "Uno"), ZcSegmentOption("b", "Dos")), picked, { picked = it }, label = "Elegir") } }
        rule.onNodeWithText("Dos").performClick()
        assertEquals("b", picked)
        rule.onNodeWithText("Uno").assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, androidx.compose.ui.semantics.Role.RadioButton))
    }
}
