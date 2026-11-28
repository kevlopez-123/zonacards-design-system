package com.zonacards.ui.compose

import android.app.DatePickerDialog
import androidx.annotation.DrawableRes
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.foundation.text.BasicText
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcMotion
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcDateStyle
import com.zonacards.ui.tokens.domain.ZcDates
import java.time.LocalDate
import java.time.ZoneOffset

/** Opción de select. `meta` va a la derecha (ej. prefijo); `group` agrupa con un título; `separatorBefore` dibuja una línea. */
data class ZcSelectOption<T>(
    val value: T,
    val label: String,
    val description: String? = null,
    @DrawableRes val icon: Int? = null,
    val meta: String? = null,
    val group: String? = null,
    val separatorBefore: Boolean = false,
    val disabled: Boolean = false,
)

/** Disparador con aspecto de campo (radio 8, 56 dp) y chevron de 16 a la derecha que gira al abrir. */
@Composable
internal fun SelectTrigger(text: String?, placeholder: String?, name: String, error: String?, enabled: Boolean, @DrawableRes icon: Int, open: Boolean = false, onClick: () -> Unit) {
    val c = ZonacardsTheme.colors
    val turn by animateFloatAsState(if (open && icon == ZcIcons.sAltArrowDown) 180f else 0f, tween(ZcMotion.base), label = "chevron")
    Row(
        Modifier.fillMaxWidth().heightIn(min = ZonacardsTheme.shape.fieldH)
            .zcControl(open, error != null, !enabled)
            .clickable(enabled = enabled, role = Role.DropdownList, onClick = onClick)
            .semantics { contentDescription = name; if (text != null) stateDescription = text; if (error != null) error(error) }
            .padding(start = 16.dp, end = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        ZcText(text ?: placeholder ?: "", style = ZcTextTw.base, color = if (text != null) c.text else c.textSubtle, maxLines = 1, modifier = Modifier.weight(1f))
        ZcIcon(icon, contentDescription = null, size = 16.dp, tint = c.textMuted, modifier = Modifier.rotate(turn))
    }
}

/** Texto con la coincidencia de la búsqueda resaltada (como `<mark>` de la web). */
@Composable
private fun Highlight(text: String, query: String) {
    val c = ZonacardsTheme.colors
    val q = query.trim()
    val i = if (q.isEmpty()) -1 else text.indexOf(q, ignoreCase = true)
    val annotated = buildAnnotatedString {
        if (i < 0) append(text) else {
            append(text.substring(0, i))
            withStyle(SpanStyle(fontWeight = ZcWeight.semibold, background = c.warningBg)) { append(text.substring(i, i + q.length)) }
            append(text.substring(i + q.length))
        }
    }
    BasicText(annotated, style = ZcType.body.copy(color = c.text, fontFamily = LocalZcFontFamily.current))
}

/**
 * Fila de opción como la lista de la web: alto mínimo 48, px 12, radio 8; la activa solo con `surface-2`.
 * Simple: check de 16 a la derecha con espacio reservado. Múltiple: casilla a la izquierda.
 */
@Composable
internal fun OptionRow(o: ZcSelectOption<*>, selected: Boolean, multi: Boolean, query: String, modifier: Modifier) {
    val c = ZonacardsTheme.colors
    Row(
        modifier.fillMaxWidth().padding(horizontal = 8.dp).heightIn(min = 48.dp).clip(RoundedCornerShape(ZcRadius.sm))
            .background(if (selected && !multi) c.surface2 else c.surface).padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (multi) CheckboxBox(if (selected) ToggleableState.On else ToggleableState.Off, invalid = false, disabled = o.disabled)
        if (o.icon != null) ZcIcon(o.icon, contentDescription = null, size = 16.dp)
        Column(Modifier.weight(1f)) {
            Highlight(o.label, query)
            if (o.description != null) ZcText(o.description, style = ZcType.caption, color = c.textMuted)
        }
        if (o.meta != null) ZcText(o.meta, style = ZcType.caption, color = c.textMuted)
        if (!multi) Box(Modifier.size(16.dp)) { if (selected) ZcIcon(ZcIcons.lCheck, contentDescription = null, size = 16.dp) }
    }
}

private fun <T> List<ZcSelectOption<T>>.filtered(q: String) =
    if (q.isBlank()) this else filter { it.label.contains(q.trim(), ignoreCase = true) || it.description?.contains(q.trim(), true) == true || it.meta?.contains(q.trim(), true) == true }

@Composable
private fun NoResults(q: String) {
    ZcText(LocalContext.current.getString(R.string.zc_ui_sin_resultados, q), color = ZonacardsTheme.colors.textMuted, modifier = Modifier.padding(20.dp))
}

/** Título de grupo y separadores entre opciones. */
@Composable
private fun <T> GroupHeader(list: List<ZcSelectOption<T>>, index: Int) {
    val o = list[index]
    if (o.separatorBefore && index > 0) ZcDivider(Modifier.padding(vertical = 4.dp))
    if (o.group != null && (index == 0 || list[index - 1].group != o.group)) {
        ZcText(o.group, style = ZcTextTw.xs, weight = ZcWeight.medium, color = ZonacardsTheme.colors.textMuted, modifier = Modifier.padding(start = 20.dp, top = 8.dp, bottom = 4.dp))
    }
}

@Composable
internal fun SearchBox(q: String, onQ: (String) -> Unit) {
    Box(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        ZcSearchField(q, onQ, label = LocalContext.current.getString(R.string.zc_ui_buscar_opcion))
    }
}

/** Lista de una opción; `close` cierra el sheet o vuelve de la subpantalla. */
@Composable
private fun <T> SingleList(options: List<ZcSelectOption<T>>, selected: T?, searchable: Boolean, onSelect: (T) -> Unit, close: () -> Unit) {
    var q by remember { mutableStateOf("") }
    val haptic = rememberZcHaptics()
    Column {
        if (searchable) SearchBox(q) { q = it }
        val list = options.filtered(q)
        if (list.isEmpty()) NoResults(q)
        LazyColumn(Modifier.padding(bottom = 8.dp)) {
            items(list.size, key = { list[it].value.hashCode() }) { i ->
                val o = list[i]
                GroupHeader(list, i)
                OptionRow(o, o.value == selected, false, q,
                    Modifier.selectable(o.value == selected, enabled = !o.disabled, role = Role.RadioButton) { haptic(ZcHaptic.SELECTION); onSelect(o.value); close() })
            }
        }
    }
}

/**
 * Lista múltiple como la web: cada casilla aplica al instante; el pie tiene "Limpiar" (fantasma, deshabilitado sin selección)
 * y "Listo", que solo cierra.
 */
@Composable
private fun <T> MultiList(options: List<ZcSelectOption<T>>, selected: () -> Set<T>, onChange: (Set<T>) -> Unit, searchable: Boolean, close: () -> Unit) {
    val ctx = LocalContext.current
    val haptic = rememberZcHaptics()
    var q by remember { mutableStateOf("") }
    Column {
        if (searchable) SearchBox(q) { q = it }
        val list = options.filtered(q)
        if (list.isEmpty()) NoResults(q)
        LazyColumn(Modifier.weight(1f, fill = false)) {
            items(list.size, key = { list[it].value.hashCode() }) { i ->
                val o = list[i]
                val on = o.value in selected()
                GroupHeader(list, i)
                OptionRow(o, on, true, q, Modifier.toggleable(on, enabled = !o.disabled, role = Role.Checkbox) {
                    haptic(ZcHaptic.SELECTION)
                    onChange(if (it) selected() + o.value else selected() - o.value)
                })
            }
        }
        ZcDivider()
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)) {
            ZcButton(ctx.getString(R.string.zc_ui_limpiar), { onChange(emptySet()) }, variant = ZcButtonVariant.GHOST, size = ZcButtonSize.SM, enabled = selected().isNotEmpty())
            ZcButton(ctx.getString(R.string.zc_ui_listo), close, size = ZcButtonSize.SM)
        }
    }
}

/**
 * Select: lista en un bottom sheet (nada de spinner nativo). Placeholder por defecto "Selecciona"; con más de 8 opciones agrega
 * búsqueda con la coincidencia resaltada. Dentro de otro sheet o modal se abre como subpantalla con Volver.
 */
@Composable
fun <T> ZcSelect(
    options: List<ZcSelectOption<T>>,
    selected: T?,
    onSelect: (T) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    searchable: Boolean = options.size > 8,
) {
    val host = LocalZcSubscreenHost.current
    val ctx = LocalContext.current
    var open by remember { mutableStateOf(false) }
    val current = options.firstOrNull { it.value == selected }
    ZcField(label, modifier, required, false, hint, error, null, enabled) {
        SelectTrigger(current?.label, placeholder ?: ctx.getString(R.string.zc_ui_selecciona), fieldName(label, required), error, enabled, ZcIcons.sAltArrowDown, open) {
            if (host != null) host.push(label) { SingleList(options, selected, searchable, onSelect) { host.pop() } } else open = true
        }
    }
    if (open) ZcBottomSheet(onDismiss = { open = false }, title = label) {
        SingleList(options, selected, searchable, onSelect) { open = false }
    }
}

/**
 * Selección múltiple: casillas a la izquierda, aplica al marcar; con más de 2 elegidas el campo dice "N seleccionados".
 * Dentro de otro sheet o modal se abre como subpantalla con Volver.
 */
@Composable
fun <T> ZcMultiSelect(
    options: List<ZcSelectOption<T>>,
    selected: Set<T>,
    onChange: (Set<T>) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    searchable: Boolean = options.size > 8,
) {
    val ctx = LocalContext.current
    val host = LocalZcSubscreenHost.current
    var open by remember { mutableStateOf(false) }
    // La lista lee siempre la selección actual (aplica al instante).
    var latest by remember { mutableStateOf(selected) }
    latest = selected
    val chosen = options.filter { it.value in selected }
    val text = when {
        chosen.isEmpty() -> null
        chosen.size > 2 -> ctx.getString(R.string.zc_ui_n_seleccionados, chosen.size.toString())
        else -> chosen.joinToString(", ") { it.label }
    }
    ZcField(label, modifier, required, false, hint, error, null, enabled) {
        SelectTrigger(text, placeholder ?: ctx.getString(R.string.zc_ui_selecciona), fieldName(label, required), error, enabled, ZcIcons.sAltArrowDown, open) {
            if (host != null) host.push(label) { MultiList(options, { latest }, { latest = it; onChange(it) }, searchable) { host.pop() } } else open = true
        }
    }
    if (open) ZcBottomSheet(onDismiss = { open = false }, title = label) {
        MultiList(options, { latest }, { latest = it; onChange(it) }, searchable) { open = false }
    }
}

/**
 * Fecha: abre el selector nativo de Android (patrón del sistema, decisión del plan) y muestra la fecha con el formato del
 * sistema de diseño. Valor como ISO "aaaa-mm-dd"; `min` y `max` también ISO.
 */
@Composable
fun ZcDateField(
    value: String?,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    min: String? = null,
    max: String? = null,
    lang: String = "es",
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
) {
    val ctx = LocalContext.current
    val text = value?.let { ZcDates.format(LocalDate.parse(it).atStartOfDay().toInstant(ZoneOffset.UTC), ZcDateStyle.MEDIUM, lang, "UTC") }
    ZcField(label, modifier, required, false, hint, error, null, enabled) {
        SelectTrigger(text, ctx.getString(R.string.zc_ui_elegir_fecha), fieldName(label, required), error, enabled, ZcIcons.sCalendar) {
            val d = value?.let { LocalDate.parse(it) } ?: LocalDate.parse(ZcDates.todayIso())
            DatePickerDialog(ctx, { _, y, m, day -> onValueChange("%04d-%02d-%02d".format(y, m + 1, day)) }, d.year, d.monthValue - 1, d.dayOfMonth).apply {
                min?.let { datePicker.minDate = LocalDate.parse(it).atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli() }
                max?.let { datePicker.maxDate = LocalDate.parse(it).atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli() }
            }.show()
        }
    }
}

