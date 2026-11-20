package com.zonacards.ui.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.requiredWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcDateStyle
import com.zonacards.ui.tokens.domain.ZcDates
import java.time.LocalDate
import java.time.ZoneOffset

/** Periodos predefinidos de `zc-date-range` (las mismas claves que la web). */
enum class ZcRangePreset(val key: String) {
    TODAY("hoy"), YESTERDAY("ayer"), LAST7("ult7"), LAST30("ult30"), WEEK("semana"), MONTH("mes"),
    PREV_MONTH("mesAnterior"), QUARTER("trimestre"), YEAR("anio"), CUSTOM("personalizado"),
}

/** Valor del selector: fechas ISO, el periodo elegido (null si vino de afuera) y si se compara con el anterior. */
data class ZcDateRangeValue(val from: String, val to: String, val preset: ZcRangePreset? = null, val compare: Boolean = false)

/** Fechas de un periodo predefinido respecto de hoy; null para "Personalizado". */
fun zcPresetRange(p: ZcRangePreset, today: String): Pair<String, String>? {
    val y = today.substring(0, 4)
    val m = today.substring(5, 7).toInt()
    return when (p) {
        ZcRangePreset.TODAY -> today to today
        ZcRangePreset.YESTERDAY -> ZcDates.addDays(today, -1).let { it to it }
        ZcRangePreset.LAST7 -> ZcDates.addDays(today, -6) to today
        ZcRangePreset.LAST30 -> ZcDates.addDays(today, -29) to today
        ZcRangePreset.WEEK -> ZcDates.startOfWeek(today) to today
        ZcRangePreset.MONTH -> ZcDates.startOfMonth(today) to today
        ZcRangePreset.PREV_MONTH -> ZcDates.addMonths(today, -1).let { it to ZcDates.endOfMonth(it) }
        ZcRangePreset.QUARTER -> "$y-${((m - 1) / 3 * 3 + 1).toString().padStart(2, '0')}-01" to today
        ZcRangePreset.YEAR -> "$y-01-01" to today
        ZcRangePreset.CUSTOM -> null
    }
}

/** Periodo anterior de la misma duración, para comparar. */
fun zcPreviousRange(from: String, to: String): Pair<String, String> {
    val n = ZcDates.daysInRange(from, to)
    return ZcDates.addDays(from, -n) to ZcDates.addDays(from, -1)
}

private fun presetLabel(p: ZcRangePreset) = when (p) {
    ZcRangePreset.TODAY -> R.string.zc_ui_preset_hoy
    ZcRangePreset.YESTERDAY -> R.string.zc_ui_preset_ayer
    ZcRangePreset.LAST7 -> R.string.zc_ui_preset_ult7
    ZcRangePreset.LAST30 -> R.string.zc_ui_preset_ult30
    ZcRangePreset.WEEK -> R.string.zc_ui_preset_semana
    ZcRangePreset.MONTH -> R.string.zc_ui_preset_mes
    ZcRangePreset.PREV_MONTH -> R.string.zc_ui_preset_mes_anterior
    ZcRangePreset.QUARTER -> R.string.zc_ui_preset_trimestre
    ZcRangePreset.YEAR -> R.string.zc_ui_preset_anio
    ZcRangePreset.CUSTOM -> R.string.zc_ui_preset_personalizado
}

private fun instantOf(iso: String) = LocalDate.parse(iso).atStartOfDay().toInstant(ZoneOffset.UTC)
private fun longDate(iso: String, lang: String) = ZcDates.format(instantOf(iso), ZcDateStyle.FULL, lang, "UTC")

/**
 * Un mes de lunes a domingo (zc-calendar). Cada día es un botón de 44 dp con la fecha completa como nombre; hoy lleva un punto,
 * la elegida o los extremos del rango van rellenos y lo que queda entre ellos, con `surface-2`. Deshabilita lo que sale de [min, max].
 * Las siete columnas miden 308 dp (7 × 44): en un panel con margen de 16 dp sobresalen unos pocos dp, sin recortarse.
 */
@Composable
fun ZcCalendar(
    month: String,
    onMonthChange: (String) -> Unit,
    today: String,
    onPick: (String) -> Unit,
    modifier: Modifier = Modifier,
    selected: String? = null,
    rangeStart: String? = null,
    rangeEnd: String? = null,
    min: String? = null,
    max: String? = null,
    hideOutside: Boolean = true,
    lang: String = "es",
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val title = ZcDates.format(instantOf(ZcDates.startOfMonth(month)), ZcDateStyle.MONTH, lang, "UTC")
    val grid = ZcDates.monthGrid(month)
    val weekdays = grid.take(7).map { d ->
        val long = ZcDates.format(instantOf(d), ZcDateStyle.FULL, lang, "UTC").substringBefore(",").substringBefore(" ")
        long to long.take(1).uppercase()
    }
    fun off(d: String) = (min != null && d < min) || (max != null && d > max)
    Box(modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        Column(Modifier.requiredWidth(308.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                ZcIconButton(ZcIcons.sAltArrowLeft, ctx.getString(R.string.zc_ui_mes_anterior), { onMonthChange(ZcDates.addMonths(month, -1)) })
                ZcText(title, Modifier.semantics { heading(); liveRegion = LiveRegionMode.Polite }, style = ZcTextTw.base, weight = FontWeight.SemiBold)
                ZcIconButton(ZcIcons.sAltArrowRight, ctx.getString(R.string.zc_ui_mes_siguiente), { onMonthChange(ZcDates.addMonths(month, 1)) })
            }
            Row {
                weekdays.forEach { (long, short) ->
                    Box(Modifier.size(44.dp, 32.dp).semantics(mergeDescendants = true) { contentDescription = long }, contentAlignment = Alignment.Center) {
                        ZcText(short, style = ZcType.caption, color = c.textMuted, modifier = Modifier.clearAndSetSemantics { })
                    }
                }
            }
            grid.chunked(7).forEach { week ->
                if (week.all { !ZcDates.sameMonth(it, month) }) return@forEach
                Row {
                    week.forEach { d ->
                        val out = !ZcDates.sameMonth(d, month)
                        if (out && hideOutside) { Box(Modifier.size(44.dp)); return@forEach }
                        val edge = d == selected || d == rangeStart || d == rangeEnd
                        val inside = rangeStart != null && rangeEnd != null && d > rangeStart && d < rangeEnd
                        val disabled = off(d)
                        Box(
                            Modifier.size(44.dp).clip(if (inside) RoundedCornerShape(0.dp) else RoundedCornerShape(ZcRadius.sm))
                                .background(if (edge) c.primary else if (inside) c.surface2 else androidx.compose.ui.graphics.Color.Transparent)
                                .clickable(enabled = !disabled, role = Role.Button) { onPick(d) }
                                .semantics { contentDescription = longDate(d, lang); this.selected = edge },
                            contentAlignment = Alignment.Center,
                        ) {
                            ZcText(
                                d.substring(8).toInt().toString(), Modifier.clearAndSetSemantics { },
                                style = ZcTextTw.sm.copy(fontFeatureSettings = "tnum"), weight = if (edge) FontWeight.SemiBold else null,
                                color = if (edge) c.onPrimary else if (disabled || out) c.textSubtle else c.text,
                            )
                            if (d == today && !edge) Box(Modifier.align(Alignment.BottomCenter).padding(bottom = 5.dp).size(4.dp).clip(RoundedCornerShape(ZcRadius.full)).background(if (disabled) c.textSubtle else c.text))
                        }
                    }
                }
            }
        }
    }
}


/**
 * Periodo de reportes y filtros (zc-date-range). Disparador con un ícono de calendario; abre un panel con los periodos
 * predefinidos como chips, Desde y Hasta escribibles (dd/mm/aaaa), un mes con el rango resaltado, "Comparar con el periodo anterior"
 * y Aplicar/Cancelar (el borrador solo se aplica con Aplicar). Por defecto no deja elegir fechas futuras (`allowFuture`).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ZcDateRange(
    value: ZcDateRangeValue?,
    onValueChange: (ZcDateRangeValue) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    today: String = ZcDates.todayIso(),
    allowFuture: Boolean = false,
    lang: String = "es",
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
) {
    val ctx = LocalContext.current
    var open by remember { mutableStateOf(false) }
    val short = value?.let {
        val base = if (it.preset != null && it.preset != ZcRangePreset.CUSTOM) ctx.getString(presetLabel(it.preset))
        else "${ZcDates.formatDmy(it.from).take(5)} – ${ZcDates.formatDmy(it.to)}"
        if (it.compare) "$base · ${ctx.getString(R.string.zc_ui_vs_anterior)}" else base
    }
    val full = value?.let {
        val pre = if (it.preset != null && it.preset != ZcRangePreset.CUSTOM) ctx.getString(presetLabel(it.preset)) + ": " else ""
        "$pre${ZcDates.formatDmy(it.from)} – ${ZcDates.formatDmy(it.to)}" + if (it.compare) ", " + ctx.getString(R.string.zc_ui_comparado_anterior) else ""
    }
    ZcField(label, modifier, required, false, hint, error, null, enabled) {
        SelectTrigger(short, ctx.getString(R.string.zc_ui_elegir_periodo), fieldName(label, required) + (full?.let { ", $it" } ?: ""), error, enabled, ZcIcons.sCalendar, open) { open = true }
    }
    if (open) RangeSheet(value, today, if (allowFuture) null else today, lang, label, { open = false }) { onValueChange(it); open = false }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun RangeSheet(
    value: ZcDateRangeValue?,
    today: String,
    maxDate: String?,
    lang: String,
    title: String,
    onDismiss: () -> Unit,
    onApply: (ZcDateRangeValue) -> Unit,
) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    val start = value?.let { it.from to it.to } ?: zcPresetRange(ZcRangePreset.LAST30, today)!!
    var from by remember { mutableStateOf<String?>(start.first) }
    var to by remember { mutableStateOf<String?>(start.second) }
    var preset by remember { mutableStateOf(value?.preset ?: if (value != null) ZcRangePreset.CUSTOM else ZcRangePreset.LAST30) }
    var compare by remember { mutableStateOf(value?.compare ?: false) }
    var month by remember { mutableStateOf(ZcDates.startOfMonth(start.second)) }
    var fromText by remember { mutableStateOf(ZcDates.formatDmy(start.first)) }
    var toText by remember { mutableStateOf(ZcDates.formatDmy(start.second)) }
    var fromError by remember { mutableStateOf<String?>(null) }
    var toError by remember { mutableStateOf<String?>(null) }

    fun sync() { fromText = from?.let { ZcDates.formatDmy(it) } ?: ""; toText = to?.let { ZcDates.formatDmy(it) } ?: ""; fromError = null; toError = null }
    fun choose(p: ZcRangePreset) {
        preset = p
        zcPresetRange(p, today)?.let { (f, t) -> from = f; to = t; month = ZcDates.startOfMonth(t); sync() }
    }
    fun pick(d: String) {
        val f = from; val t = to
        if (f == null || t != null) { from = d; to = null } else if (d < f) { from = d; to = f } else to = d
        preset = ZcRangePreset.CUSTOM; sync()
    }
    fun typed(raw: String, isTo: Boolean) {
        val masked = ZcDates.maskDmy(raw)
        if (isTo) toText = masked else fromText = masked
        fun setErr(m: String?) { if (isTo) toError = m else fromError = m }
        if (masked.length < 10) { setErr(null); return }
        val d = ZcDates.parseDmy(masked)
        if (d == null) { setErr(ctx.getString(R.string.zc_validacion_date_format)); return }
        if (maxDate != null && d > maxDate) { setErr(ctx.getString(R.string.zc_ui_no_futura)); return }
        if (isTo && from != null && d < from!!) { setErr(ctx.getString(R.string.zc_validacion_range_order)); return }
        setErr(null)
        if (isTo) to = d else { from = d; if (to != null && d > to!!) { to = null; toText = "" } }
        preset = ZcRangePreset.CUSTOM
        month = ZcDates.startOfMonth(to ?: d)
    }

    val f = from; val t = to
    val days = if (f != null && t != null) ZcDates.daysInRange(f, t) else 0
    ZcBottomSheet(
        onDismiss = onDismiss, title = title,
        footer = {
            ZcText(
                if (t != null) ctx.getString(R.string.zc_ui_n_dias, days.toString()) else ctx.getString(R.string.zc_ui_elige_fin),
                Modifier.weight(1f).semantics { liveRegion = LiveRegionMode.Polite }, style = ZcTextTw.sm.copy(fontFeatureSettings = "tnum"), color = c.textMuted,
            )
            ZcButton(ctx.getString(R.string.zc_ui_cancelar), onDismiss, variant = ZcButtonVariant.GHOST, size = ZcButtonSize.SM)
            ZcButton(ctx.getString(R.string.zc_ui_aplicar), { onApply(ZcDateRangeValue(from!!, to!!, preset, compare)) }, size = ZcButtonSize.SM, enabled = f != null && t != null && fromError == null && toError == null)
        },
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            FlowRow(
                Modifier.semantics { contentDescription = ctx.getString(R.string.zc_ui_periodos) },
                horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                ZcRangePreset.entries.forEach { p -> ZcChip(ctx.getString(presetLabel(p)), selected = preset == p, onSelectedChange = { choose(p) }) }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                ZcTextField(fromText, { typed(it, false) }, ctx.getString(R.string.zc_ui_desde), Modifier.weight(1f), placeholder = ctx.getString(R.string.zc_ui_formato_fecha), error = fromError, keyboardType = KeyboardType.Number)
                ZcTextField(toText, { typed(it, true) }, ctx.getString(R.string.zc_ui_hasta), Modifier.weight(1f), placeholder = ctx.getString(R.string.zc_ui_formato_fecha), error = toError, keyboardType = KeyboardType.Number)
            }
            ZcCalendar(month, { month = it }, today, ::pick, rangeStart = f, rangeEnd = t, max = maxDate, lang = lang)
            ZcCheckbox(
                compare, { compare = it }, label = ctx.getString(R.string.zc_ui_comparar_anterior),
                description = if (f != null && t != null) zcPreviousRange(f, t).let { (a, b) -> "${ZcDates.formatDmy(a)} – ${ZcDates.formatDmy(b)}" } else null,
            )
        }
    }
}
