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
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.onNodeWithContentDescription
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

    // ---------- Tipos de operación ----------

    private val funnel = ZcChartData(listOf("Visitas", "Carrito", "Pago"), listOf(ZcChartSeries("U", listOf(100.0, 60.0, 20.0))))
    private val waterfall = ZcChartData(listOf("Bruto", "Desc", "Dev", "Neto"), listOf(ZcChartSeries("M", listOf(100.0, -10.0, -5.0, 85.0))))
    private val heat = ZcChartData(listOf("08", "10", "12"), listOf(ZcChartSeries("Lun", listOf(1.0, 5.0, 2.0)), ZcChartSeries("Mar", listOf(0.0, 3.0, 9.0))))
    private val tree = ZcChartData(listOf("A", "B", "C", "D"), listOf(ZcChartSeries("V", listOf(50.0, 30.0, 15.0, 5.0))))
    private val sankey = ZcChartData(listOf("A → X", "A → Y", "B → X"), listOf(ZcChartSeries("F", listOf(5.0, 3.0, 2.0))))
    private val gauge = ZcChartData(listOf("Logrado", "Meta"), listOf(ZcChartSeries("V", listOf(40.0, 50.0))))
    private val calendar = ZcChartData(listOf("2026-01-05", "2026-01-06", "2026-03-10"), listOf(ZcChartSeries("C", listOf(3.0, 8.0, 1.0))))

    @Test fun squarifyFillsTheAreaWithoutOverlaps() {
        val area = androidx.compose.ui.geometry.Rect(0f, 0f, 200f, 100f)
        val r = zcSquarify(listOf(50.0, 30.0, 15.0, 5.0), area)
        assertEquals(20000.0, r.sumOf { (it.width * it.height).toDouble() }, 1.0)
        r.forEach { assertTrue("dentro del área: $it", it.left >= -0.01f && it.top >= -0.01f && it.right <= 200.01f && it.bottom <= 100.01f) }
        for (i in r.indices) for (j in i + 1 until r.size) {
            val o = r[i].intersect(r[j])
            assertTrue("se solapan $i y $j", o.width <= 0.01f || o.height <= 0.01f)
        }
        // La mayor es la que más área tiene.
        assertTrue(r[0].width * r[0].height > r[1].width * r[1].height)
    }

    @Test fun operationSummariesNameTheDataWithoutExtraWords() {
        fun s(k: ZcChartKind, d: ZcChartData) = chartSummary(null, d, k, ::zcAxisShort)
        assertEquals("Visitas: 100; Carrito: 60; Pago: 20", s(ZcChartKind.FUNNEL, funnel))
        assertEquals("Logrado: 40; Meta: 50 (80 %)", s(ZcChartKind.GAUGE, gauge))
        assertTrue(s(ZcChartKind.HEATMAP, heat).startsWith("Mar 12: 9; Lun 10: 5"))
        assertTrue(s(ZcChartKind.CALENDAR, calendar).startsWith("2026-01-06: 8"))
        assertTrue(s(ZcChartKind.SANKEY, sankey).startsWith("A → X: 5"))
    }

    @Test fun dataViewOfHeatmapHasOneColumnPerRow() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcChartPanel("Canjes", heat, ZcChartKind.HEATMAP, categoryLabel = "Hora") } }
        rule.onNodeWithText("Datos").performClick()
        rule.onNodeWithText("Lun").assertIsDisplayed()
        rule.onNodeWithText("Mar").assertIsDisplayed()
        rule.onNodeWithText("12").assertIsDisplayed()
    }

    private fun tapChanges(kind: ZcChartKind, data: ZcChartData, x: (Float) -> Float, y: Float) {
        rule.setContent { ZonacardsTheme(dark = false) { Box(Modifier.size(360.dp, 380.dp).testTag("chart")) { ZcChart(data, kind, description = "Prueba") } } }
        val before = rule.onNodeWithTag("chart").captureToImage().asAndroidBitmap().copy(Bitmap.Config.ARGB_8888, false)
        rule.onNodeWithTag("chart").performTouchInput { click(Offset(x(center.x), y)) }
        rule.waitForIdle()
        val after = rule.onNodeWithTag("chart").captureToImage().asAndroidBitmap()
        assertTrue("$kind: tocarlo debería resaltarlo y abrir el globo (cambiaron ${changed(before, after)} px)", changed(before, after) > 200)
    }

    @Test fun touchingFunnelStageOpensTooltip() = tapChanges(ZcChartKind.FUNNEL, funnel, { it }, 30f)
    @Test fun touchingWaterfallBarOpensTooltip() = tapChanges(ZcChartKind.WATERFALL, waterfall, { it - 20f }, 120f)
    @Test fun touchingHeatmapCellOpensTooltip() = tapChanges(ZcChartKind.HEATMAP, heat, { it }, 30f)
    @Test fun touchingTreemapTileOpensTooltip() = tapChanges(ZcChartKind.TREEMAP, tree, { 40f }, 40f)
    @Test fun touchingSankeyNodeOpensTooltip() = tapChanges(ZcChartKind.SANKEY, sankey, { 10f }, 30f)
    @Test fun touchingGaugeArcOpensTooltip() = tapChanges(ZcChartKind.GAUGE, gauge, { it }, 40f)

    @Test fun operationTypesRenderInDarkAndEnglish() {
        rule.setContent { ZonacardsTheme(dark = true) { Column { for (k in listOf(ZcChartKind.FUNNEL, ZcChartKind.WATERFALL, ZcChartKind.HEATMAP, ZcChartKind.TREEMAP, ZcChartKind.SANKEY, ZcChartKind.GAUGE)) ZcChart(when (k) { ZcChartKind.FUNNEL -> funnel; ZcChartKind.WATERFALL -> waterfall; ZcChartKind.HEATMAP -> heat; ZcChartKind.TREEMAP -> tree; ZcChartKind.SANKEY -> sankey; else -> gauge }, k) ; ZcChart(calendar, ZcChartKind.CALENDAR) } } }
        rule.waitForIdle()
    }

    // ---------- Mapa ----------

    private val lima = listOf(ZcMapPoint("Lima", -12.0, -77.0, 12.0))

    @Test fun latamGeoHasTheWebCountries() {
        var geo: List<GeoCountry>? = null
        rule.setContent { geo = zcLatamGeo(androidx.compose.ui.platform.LocalContext.current) }
        val g = geo!!
        assertEquals(27, g.size)
        val scope = g.map { it.cc }.filter { it.isNotEmpty() }.toSet()
        assertTrue("alcance: $scope", scope.containsAll(listOf("pe", "cl", "mx", "co", "ec", "bo")))
        assertTrue(g.sumOf { c -> c.rings.sumOf { it.lng.size } } > 10_000)
    }

    @Test fun mapSummaryListsEveryCityWithItsAmount() {
        rule.setContent { ZonacardsTheme(dark = false) { ZcMap("Locales", listOf(ZcMapPoint("Lima", -12.0, -77.0, 12.0), ZcMapPoint("Quito", -0.2, -78.5, 3.0)), scope = listOf("pe"), unit = "locales") } }
        rule.onNode(hasContentDescription("Locales. Lima: 12 locales; Quito: 3 locales")).assertExists()
    }

    @Test fun touchingACityOpensItsTooltip() {
        rule.setContent { ZonacardsTheme(dark = false) { Box(Modifier.size(360.dp, 420.dp).testTag("map")) { ZcMap("Locales", lima, scope = listOf("pe"), unit = "locales") } } }
        val before = rule.onNodeWithTag("map").captureToImage().asAndroidBitmap().copy(Bitmap.Config.ARGB_8888, false)
        // Con un solo punto el encuadre lo deja en el centro del mapa (280 dp de alto).
        rule.onNodeWithTag("map").performTouchInput { click(Offset(center.x, 140f)) }
        rule.waitForIdle()
        val after = rule.onNodeWithTag("map").captureToImage().asAndroidBitmap()
        assertTrue("el globo y el aro deberían dibujarse (cambiaron ${changed(before, after)} px)", changed(before, after) > 200)
    }

    @Test fun zoomButtonsWorkAndStopAtTheLimits() {
        rule.setContent { ZonacardsTheme(dark = false) { Box(Modifier.size(360.dp, 420.dp).testTag("map")) { ZcMap("Locales", lima, scope = listOf("pe")) } } }
        rule.onNodeWithContentDescription("Alejar el mapa").assertIsNotEnabled()
        val before = rule.onNodeWithTag("map").captureToImage().asAndroidBitmap().copy(Bitmap.Config.ARGB_8888, false)
        rule.onNodeWithContentDescription("Acercar el mapa").performClick()
        rule.waitForIdle()
        val after = rule.onNodeWithTag("map").captureToImage().asAndroidBitmap()
        assertTrue("acercar debería redibujar el mapa (cambiaron ${changed(before, after)} px)", changed(before, after) > 500)
        rule.onNodeWithContentDescription("Alejar el mapa").assertIsEnabled()
        repeat(6) { rule.onNodeWithContentDescription("Acercar el mapa").performClick() }
        rule.onNodeWithContentDescription("Acercar el mapa").assertIsNotEnabled()
    }

    @Test fun emptyPointsAndNoScopeDoNotCrash() {
        rule.setContent { ZonacardsTheme(dark = true) { ZcMap("Sin locales", emptyList()) } }
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
