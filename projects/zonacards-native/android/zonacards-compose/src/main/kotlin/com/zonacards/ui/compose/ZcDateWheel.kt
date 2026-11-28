package com.zonacards.ui.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcDates
import java.time.LocalDate
import java.time.Month
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale

/**
 * Fecha con tres columnas (día, mes, año) en una hoja propia: para fechas lejanas, como el cumpleaños, donde el selector del
 * sistema obliga a retroceder año por año. Idea tomada de Enjoy Beneficios. Valor ISO "aaaa-mm-dd"; `min` y `max` también ISO
 * (por defecto, cien años atrás y hoy) y los años de la columna salen de ese rango. Aceptar solo se habilita con una fecha válida.
 */
@Composable
fun ZcDateWheelField(
    value: String?,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    min: String = ZcDates.addDays(ZcDates.todayIso(), -36525),
    max: String = ZcDates.todayIso(),
    lang: String = "es",
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
) {
    val ctx = LocalContext.current
    var open by remember { mutableStateOf(false) }
    ZcField(label, modifier, required, false, hint, error, null, enabled) {
        SelectTrigger(value?.let { ZcDates.formatDmy(it) }, ctx.getString(R.string.zc_ui_formato_fecha), fieldName(label, required), error, enabled, ZcIcons.sCalendar, open) { open = true }
    }
    if (open) WheelSheet(label, value ?: max, min, max, lang, { open = false }) { onValueChange(it); open = false }
}

@Composable
private fun WheelSheet(title: String, initial: String, min: String, max: String, lang: String, onDismiss: () -> Unit, onAccept: (String) -> Unit) {
    val ctx = LocalContext.current
    val start = LocalDate.parse(initial)
    var year by remember { mutableIntStateOf(start.year) }
    var month by remember { mutableIntStateOf(start.monthValue) }
    var day by remember { mutableIntStateOf(start.dayOfMonth) }
    val days = YearMonth.of(year, month).lengthOfMonth()
    if (day > days) day = days
    val chosen = LocalDate.of(year, month, day)
    val valid = !chosen.isBefore(LocalDate.parse(min)) && !chosen.isAfter(LocalDate.parse(max))
    val locale = Locale.forLanguageTag(if (lang == "en") "en-US" else "es-PE")
    ZcBottomSheet(
        onDismiss, title,
        footer = {
            ZcButton(ctx.getString(R.string.zc_ui_cancelar), onDismiss, Modifier.weight(1f), variant = ZcButtonVariant.OUTLINE)
            ZcButton(ctx.getString(R.string.zc_ui_aceptar), { onAccept(chosen.toString()) }, Modifier.weight(1f), enabled = valid)
        },
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            ZcText(ZcDates.formatDmy(chosen.toString()), style = ZcTextTw.base, weight = ZcWeight.medium)
            if (!valid) ZcText(ctx.getString(R.string.zc_ui_fecha_entre, ZcDates.formatDmy(min), ZcDates.formatDmy(max)), style = ZcTextTw.sm, color = ZonacardsTheme.colors.dangerFg)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                WheelColumn(ctx.getString(R.string.zc_ui_fecha_dia), (1..days).toList(), day, { it.toString().padStart(2, '0') }, Modifier.weight(0.8f)) { day = it }
                WheelColumn(ctx.getString(R.string.zc_ui_fecha_mes), (1..12).toList(), month, { Month.of(it).getDisplayName(TextStyle.FULL, locale).replaceFirstChar(Char::uppercase) }, Modifier.weight(1.4f)) { month = it }
                WheelColumn(ctx.getString(R.string.zc_ui_fecha_anio), (max.take(4).toInt() downTo min.take(4).toInt()).toList(), year, { it.toString() }, Modifier.weight(1f)) { year = it }
            }
        }
    }
}

@Composable
private fun WheelColumn(title: String, values: List<Int>, current: Int, text: (Int) -> String, modifier: Modifier, onPick: (Int) -> Unit) {
    val c = ZonacardsTheme.colors
    val state = rememberLazyListState(initialFirstVisibleItemIndex = (values.indexOf(current) - 2).coerceAtLeast(0))
    Column(modifier) {
        ZcText(title, style = ZcType.caption, color = c.textMuted)
        LazyColumn(
            Modifier.padding(top = 4.dp).height(240.dp).border(1.dp, c.borderStrong, RoundedCornerShape(ZcRadius.sm)).padding(4.dp),
            state,
        ) {
            items(values) { v ->
                val on = v == current
                Row(
                    Modifier.fillMaxWidth().heightIn(min = 48.dp).clip(RoundedCornerShape(ZcRadius.xs)).background(if (on) c.surface2 else androidx.compose.ui.graphics.Color.Transparent)
                        .clickable(role = Role.RadioButton) { onPick(v) }.semantics { selected = on; contentDescription = "$title ${text(v)}" }.padding(horizontal = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    ZcText(text(v), Modifier.weight(1f), style = ZcTextTw.sm.copy(fontFeatureSettings = "tnum"), weight = if (on) ZcWeight.semibold else null, maxLines = 1)
                }
            }
        }
    }
}
