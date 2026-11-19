package com.zonacards.catalog

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import com.zonacards.ui.compose.*

private val WEEKS = listOf("Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8")
private val SALES = listOf(4200.0, 5100.0, 4800.0, 6300.0, 5900.0, 7200.0, 6800.0, 8400.0)
private val BEFORE = listOf(3800.0, 4300.0, 4600.0, 5000.0, 5200.0, 5400.0, 6100.0, 6300.0)

private fun soles(v: Double) = "S/ " + zcAxisShort(v)

private val STACKED = ZcChartData(
    listOf("Jun", "Jul", "Ago", "Sep", "Oct", "Nov"),
    listOf(
        ZcChartSeries("Web", listOf(1200.0, 1500.0, 1400.0, 1800.0, 2100.0, 2400.0)),
        ZcChartSeries("App", listOf(800.0, 1100.0, 1300.0, 1500.0, 1900.0, 2300.0)),
        ZcChartSeries("Tienda", listOf(900.0, 700.0, 800.0, 600.0, 700.0, 500.0)),
    ),
)
private val COUNTRIES = ZcChartData(
    listOf("Perú", "Chile", "México", "Colombia", "Argentina"),
    listOf(ZcChartSeries("Canjes", listOf(4200.0, 3100.0, 2400.0, 1500.0, 900.0))),
)
private val STATES = ZcChartData(
    listOf("Activos", "Agotados", "Anulados", "Pendientes"),
    listOf(ZcChartSeries("Lotes", listOf(62.0, 21.0, 9.0, 8.0))),
)
private val EMPTY = ZcChartData(listOf("Sem 1", "Sem 2"), listOf(ZcChartSeries("Ventas", listOf(0.0, 0.0))))

/** Gráficos dibujados a mano con los tokens `chart-1…6` (mismos tipos y datos que zc-chart de la web). */
@Composable
fun ChartsScreen() {
    Page {
        var weeks by rememberSaveable { mutableStateOf("8") }
        var compare by rememberSaveable { mutableStateOf(true) }
        val n = weeks.toInt()
        val line = ZcChartData(
            WEEKS.takeLast(n),
            buildList {
                add(ZcChartSeries("Este periodo", SALES.takeLast(n)))
                if (compare) add(ZcChartSeries("Periodo anterior", BEFORE.takeLast(n), dashed = true))
            },
        )
        Section("Línea, con filtros y periodo anterior") {
            ZcChartPanel(
                "Ventas por semana", line, ZcChartKind.LINE, format = ::soles, categoryLabel = "Semana",
                toolbar = {
                    ZcSegmented(listOf(ZcSegmentOption("4", "4 sem"), ZcSegmentOption("8", "8 sem")), weeks, { weeks = it }, label = "Periodo")
                    ZcSwitch(compare, { compare = it }, label = "Comparar", size = ZcControlSize.SM)
                },
            )
        }
        Section("Globo al tocar") {
            ZcChart(ZcChartData(WEEKS, listOf(ZcChartSeries("Este periodo", SALES), ZcChartSeries("Periodo anterior", BEFORE, dashed = true))), ZcChartKind.LINE, format = ::soles, description = "Ventas por semana", initialSelection = 4)
        }
        Section("Barras horizontales: el mayor destacado") {
            ZcChartPanel("Canjes por país", COUNTRIES, ZcChartKind.BAR_H, categoryLabel = "País")
        }
        Section("Apiladas") {
            ZcChartPanel("Canjes por canal", STACKED, ZcChartKind.STACKED, categoryLabel = "Mes")
        }
        Section("Dona con el total al centro") {
            ZcChartPanel("Lotes por estado", STATES, ZcChartKind.DONUT, totalLabel = "lotes", categoryLabel = "Estado")
        }
        Section("Sin datos") {
            ZcChartPanel("Ventas por semana", EMPTY, ZcChartKind.LINE)
        }
    }
}
