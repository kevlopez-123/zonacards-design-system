package com.zonacards.catalog

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.zonacards.ui.compose.*
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcType

private data class Lot(val id: String, val country: String, val codes: Int, val amount: Double, val state: String)
private val LOTS = listOf(
    Lot("02829", "Perú", 1200, 150000.0, "activo"), Lot("02830", "Chile", 500, 2500000.0, "pendiente_aprobacion"),
    Lot("02831", "Perú", 80, 4000.0, "agotado"), Lot("02832", "México", 300, 45000.0, "parcialmente_anulado"),
)

/**
 * Demostración de app completa y adaptable: teléfono con barra inferior, tablet con riel, escritorio con menú lateral;
 * panel, lotes (lista y detalle lado a lado en tablet), formulario y configuración (subnav).
 */
@Composable
fun TemplatesScreen(toasts: ZcToastState) {
    var page by rememberSaveable { mutableStateOf("inicio") }
    val groups = listOf(
        ZcNavGroup(null, listOf(ZcNavEntry("inicio", "Inicio", ZcIcons.sHome2), ZcNavEntry("lotes", "Lotes", ZcIcons.sBox), ZcNavEntry("nuevo", "Nuevo lote", ZcIcons.sAddCircle, short = "Nuevo"))),
        ZcNavGroup("Cuenta", listOf(ZcNavEntry("config", "Configuración", ZcIcons.sSettings, short = "Ajustes"))),
    )
    ZcAppScaffold(groups, page, { page = it }) {
        when (page) {
            "inicio" -> DashboardDemo()
            "lotes" -> LotsDemo(toasts)
            "nuevo" -> FormDemo(toasts) { page = "lotes" }
            else -> SettingsDemo()
        }
    }
}

@Composable
private fun KpiGrid() {
    val kpis = listOf(Triple("Ventas", "S/ 12,500", 8.2), Triple("Lotes activos", "24", 4.0), Triple("Canjes", "1,830", -3.1), Triple("Anulados", "38", 12.0))
    ZcAdaptiveGrid(kpis, minCell = 128.dp) { (l, v, d) -> ZcKpi(l, v, Modifier.fillMaxSize(), delta = d, invert = l == "Anulados") }
}

@Composable
private fun DashboardDemo() {
    ZcDashboardPage(
        header = { ZcPageHeader("Inicio", subtitle = "Perú · noviembre 2026", actions = { ZcHeaderAction("Nuevo lote", {}, icon = ZcIcons.sAddCircle) }) },
        kpis = { KpiGrid() },
        charts = listOf(
            { ChartCard("Ventas por semana", ZcChartKind.LINE, WEEK_SALES) },
            { ChartCard("Canjes por canal", ZcChartKind.STACKED, CHANNELS) },
        ),
        aside = { ZcState("Sin alertas", text = "Te avisaremos si un lote está por agotarse.") },
    )
}

private val WEEK_SALES = ZcChartData(
    listOf("Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6"),
    listOf(ZcChartSeries("Este periodo", listOf(4200.0, 5100.0, 4800.0, 6300.0, 5900.0, 7200.0)), ZcChartSeries("Periodo anterior", listOf(3800.0, 4300.0, 4600.0, 5000.0, 5200.0, 5400.0), dashed = true)),
)
private val CHANNELS = ZcChartData(
    listOf("Jun", "Jul", "Ago", "Sep", "Oct", "Nov"),
    listOf(ZcChartSeries("Web", listOf(1200.0, 1500.0, 1400.0, 1800.0, 2100.0, 2400.0)), ZcChartSeries("App", listOf(800.0, 1100.0, 1300.0, 1500.0, 1900.0, 2300.0))),
)

@Composable
private fun ChartCard(title: String, kind: ZcChartKind, data: ZcChartData) {
    ZcDashboardGrid(listOf(ZcWidget(title, title, ZcIcons.sChart2, span = 4))) { _, _ -> ZcChart(data, kind, description = title, height = 180.dp) }
}

@Composable
private fun LotsDemo(toasts: ZcToastState) {
    var sel by rememberSaveable { mutableStateOf<String?>(null) }
    val lot = LOTS.firstOrNull { it.id == sel }
    ZcListDetail(sel, { sel = null }, detailTitle = lot?.let { "Lote #${it.id}" },
        list = {
            ZcListPage(header = { ZcPageHeader("Lotes", subtitle = "${LOTS.size} lotes") }, kpis = { KpiGrid() }) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    for (l in LOTS) ZcCard("Lote #${l.id}", subtitle = "${l.country} · ${l.codes} códigos", icon = ZcIcons.sBox, onClick = { sel = l.id }, aside = { ZcStateBadge(ZcStates.lot, l.state) })
                }
            }
        },
        detail = { id ->
            val l = LOTS.first { it.id == id }
            BoxWithConstraints(Modifier.padding(start = 0.dp)) {
                ZcDetailPage(
                    header = { ZcPageHeader("Lote #${l.id}", subtitle = "${l.country} · ${l.codes} códigos", meta = { ZcStateBadge(ZcStates.lot, l.state) }, actions = {
                        ZcHeaderAction("Descargar", { toasts.success("Descarga iniciada") }, ZcButtonVariant.OUTLINE); ZcHeaderAction("Anular", {}, ZcButtonVariant.DANGER)
                    }) },
                    aside = { ZcCard("Resumen", icon = ZcIcons.sWallet) { ZcMoneyText(l.amount, "pe", style = ZcType.heading) } },
                ) {
                    ZcProgress(0.62f, label = "Canjeados", variant = ZcProgressVariant.METER)
                    ZcState("Sin movimientos recientes", text = "Los canjes aparecerán aquí.")
                }
            }
        },
        empty = { Box(Modifier.padding(24.dp)) { ZcState("Elige un lote", text = "Su detalle aparece aquí.") } },
    )
}

@Composable
private fun FormDemo(toasts: ZcToastState, done: () -> Unit) {
    var name by rememberSaveable { mutableStateOf("") }
    var amount by rememberSaveable { mutableStateOf<Double?>(null) }
    ZcFormPage(
        header = { ZcPageHeader("Nuevo lote", subtitle = "Los códigos se generan al aprobarse.") },
        actions = { ZcButton("Cancelar", done, variant = ZcButtonVariant.OUTLINE); ZcButton("Crear lote", { toasts.success("Lote creado", "Pendiente de aprobación."); done() }) },
    ) {
        ZcTextField(name, { name = it }, "Nombre del lote", required = true, placeholder = "Ej. Navidad 2026")
        ZcMoneyField(amount, { amount = it }, "Monto por código", country = "pe", required = true)
        ZcDateField(null, {}, "Vigencia hasta")
    }
}

@Composable
private fun SettingsDemo() {
    var tab by rememberSaveable { mutableStateOf("perfil") }
    val items = listOf(ZcSubnavItem("perfil", "Perfil", ZcIcons.sUserRounded), ZcSubnavItem("seguridad", "Seguridad", ZcIcons.sShieldCheck), ZcSubnavItem("avisos", "Notificaciones", ZcIcons.sInbox))
    BoxWithConstraints(Modifier.fillMaxSize().padding(vertical = 24.dp)) {
        if (zcScreenWidth() >= 768.dp) Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
            ZcSubnav(items, tab, { tab = it }, "Configuración", Modifier.width(220.dp))
            Box(Modifier.weight(1f)) { SettingsBody(tab) }
        } else Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            ZcSubnav(items, tab, { tab = it }, "Configuración")
            SettingsBody(tab)
        }
    }
}

@Composable
private fun SettingsBody(tab: String) {
    Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        ZcText(when (tab) { "perfil" -> "Perfil"; "seguridad" -> "Seguridad"; else -> "Notificaciones" }, style = ZcType.title)
        var a by rememberSaveable(tab) { mutableStateOf(true) }
        ZcSwitch(a, { a = it }, label = "Avisos por correo", description = "Resumen diario")
    }
}

