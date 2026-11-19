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

private val FUNNEL = ZcChartData(listOf("Visitas", "Carrito", "Pago", "Canje"), listOf(ZcChartSeries("Usuarios", listOf(12000.0, 6800.0, 3100.0, 2400.0))))
private val WATERFALL = ZcChartData(
    listOf("Ventas brutas", "Descuentos", "Devoluciones", "Comisiones", "Ventas netas"),
    listOf(ZcChartSeries("Monto", listOf(52000.0, -6500.0, -3200.0, -2800.0, 39500.0))),
)
private val HEAT = ZcChartData(
    listOf("08", "10", "12", "14", "16", "18", "20"),
    listOf("Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom").mapIndexed { d, name ->
        ZcChartSeries(name, List(7) { h -> (((d + 2) * (h + 3) * 7) % 41 + if (h == 5) 20 else 0).toDouble() })
    },
)
private val TREE = ZcChartData(
    listOf("Gift cards", "Experiencias", "Moda", "Tecnología", "Hogar", "Viajes"),
    listOf(ZcChartSeries("Ventas", listOf(18000.0, 12000.0, 7500.0, 6200.0, 3800.0, 2500.0))),
)
private val CALENDAR: ZcChartData = run {
    val days = generateSequence(java.time.LocalDate.of(2026, 1, 1)) { it.plusDays(1) }.takeWhile { it <= java.time.LocalDate.of(2026, 11, 18) }.toList()
    ZcChartData(days.map { it.toString() }, listOf(ZcChartSeries("Canjes", days.map { ((it.dayOfYear * 37 + it.dayOfWeek.value * 11) % 23 + if (it.monthValue in 10..11) 12 else 0).toDouble() })))
}
private val SANKEY = ZcChartData(
    listOf("Web → Gift cards", "App → Gift cards", "Web → Experiencias", "App → Experiencias", "Gift cards → Canjeado", "Gift cards → Vencido", "Experiencias → Canjeado", "Experiencias → Vencido"),
    listOf(ZcChartSeries("Códigos", listOf(4200.0, 2800.0, 1500.0, 1900.0, 5600.0, 1400.0, 2900.0, 500.0))),
)
private val GAUGE = ZcChartData(listOf("Logrado", "Meta"), listOf(ZcChartSeries("Ventas", listOf(39500.0, 50000.0))))

/** Gráficos de operación (embudo, cascada, mapa de calor, treemap, calendario, sankey y medidor), con los mismos datos que la web. */
@Composable
fun OpsChartsScreen() {
    Page {
        Section("Embudo") { ZcChartPanel("Conversión por etapa", FUNNEL, ZcChartKind.FUNNEL, categoryLabel = "Etapa") }
        Section("Cascada") { ZcChartPanel("De ventas brutas a netas", WATERFALL, ZcChartKind.WATERFALL, format = ::soles, categoryLabel = "Concepto") }
        Section("Mapa de calor") { ZcChartPanel("Canjes por día y hora", HEAT, ZcChartKind.HEATMAP, categoryLabel = "Día") }
        Section("Treemap") { ZcChartPanel("Ventas por categoría", TREE, ZcChartKind.TREEMAP, format = ::soles, categoryLabel = "Categoría") }
        Section("Calendario") { ZcChartPanel("Canjes por día", CALENDAR, ZcChartKind.CALENDAR, categoryLabel = "Fecha") }
        Section("Sankey") { ZcChartPanel("De canal a resultado", SANKEY, ZcChartKind.SANKEY, categoryLabel = "Flujo") }
        Section("Medidor") { ZcChartPanel("Meta de ventas", GAUGE, ZcChartKind.GAUGE, format = ::soles, categoryLabel = "Concepto") }
        Section("Globo al tocar (sankey)") { ZcChart(SANKEY, ZcChartKind.SANKEY, description = "De canal a resultado", initialSelection = 0) }
    }
}

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
