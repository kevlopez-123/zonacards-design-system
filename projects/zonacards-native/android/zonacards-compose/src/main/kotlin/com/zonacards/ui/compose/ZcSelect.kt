package com.zonacards.ui.compose

import android.app.DatePickerDialog
import androidx.annotation.DrawableRes
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcMotion
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcDateStyle
import com.zonacards.ui.tokens.domain.ZcDates
import java.time.LocalDate
import java.time.ZoneOffset

/**
 * Bottom sheet: entra desde abajo (12 dp + fundido), fondo oscuro que cierra al tocarlo, alto máximo del 85 %.
 * Nunca un sheet sobre otro: para un segundo nivel, una subpantalla con Volver dentro del mismo sheet. (La ola 3 completa arrastre y Volver.)
 */
@Composable
fun ZcBottomSheet(onDismiss: () -> Unit, title: String? = null, footer: (@Composable () -> Unit)? = null, content: @Composable () -> Unit) {
    val c = ZonacardsTheme.colors
    val visible = remember { MutableTransitionState(false).apply { targetState = true } }
    val maxH = LocalConfiguration.current.screenHeightDp.dp * 0.85f
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
        Box(Modifier.fillMaxSize().background(c.overlay).clickable(MutableInteractionSource(), null, onClick = onDismiss), contentAlignment = Alignment.BottomCenter) {
            AnimatedVisibility(visible, enter = slideInVertically(tween(ZcMotion.slow, easing = ZcMotion.enterEasing)) { 36 } + fadeIn(tween(ZcMotion.base))) {
                Column(
                    Modifier.fillMaxWidth().heightIn(max = maxH)
                        .clip(RoundedCornerShape(topStart = ZcRadius.lg, topEnd = ZcRadius.lg)).background(c.surface)
                        .clickable(MutableInteractionSource(), null) { }
                        .semantics { if (title != null) paneTitle = title }
                        .navigationBarsPadding(),
                ) {
                    Box(Modifier.fillMaxWidth().padding(top = 8.dp), contentAlignment = Alignment.Center) {
                        Box(Modifier.width(36.dp).heightIn(min = 4.dp, max = 4.dp).clip(RoundedCornerShape(50)).background(c.borderStrong))
                    }
                    if (title != null) ZcText(title, style = ZcType.title, weight = FontWeight.SemiBold, modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 8.dp).semantics { heading() })
                    Box(Modifier.weight(1f, fill = false)) { content() }
                    if (footer != null) {
                        ZcDivider()
                        Box(Modifier.padding(16.dp)) { footer() }
                    }
                }
            }
        }
    }
}

data class ZcSelectOption<T>(val value: T, val label: String, val description: String? = null, @DrawableRes val icon: Int? = null)

/** Disparador con aspecto de campo y chevron a la derecha (rol de lista desplegable). */
@Composable
internal fun SelectTrigger(text: String?, placeholder: String?, name: String, error: String?, enabled: Boolean, @DrawableRes icon: Int, onClick: () -> Unit) {
    val c = ZonacardsTheme.colors
    val look = controlLook(false, error != null)
    Row(
        Modifier.fillMaxWidth().heightIn(min = ZcSize.target).clip(RoundedCornerShape(ZcRadius.ms)).background(c.surface)
            .border(look.width, look.border, RoundedCornerShape(ZcRadius.ms))
            .clickable(enabled = enabled, role = Role.DropdownList, onClick = onClick)
            .semantics { contentDescription = name; if (text != null) stateDescription = text; if (error != null) error(error) }
            .padding(start = 16.dp, end = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        ZcText(text ?: placeholder ?: "", color = if (text != null) c.text else c.textSubtle, maxLines = 1, modifier = Modifier.weight(1f))
        ZcIcon(icon, contentDescription = null, tint = c.textMuted)
    }
}

/** Fila de opción: activa solo con `surface2` (sin bordes ni barras), check a la derecha. */
@Composable
private fun OptionRow(label: String, description: String?, @DrawableRes icon: Int?, selected: Boolean, modifier: Modifier) {
    val c = ZonacardsTheme.colors
    Row(
        modifier.fillMaxWidth().heightIn(min = 56.dp).background(if (selected) c.surface2 else c.surface).padding(horizontal = 20.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (icon != null) ZcIcon(icon, contentDescription = null)
        Column(Modifier.weight(1f)) {
            ZcText(label)
            if (description != null) ZcText(description, style = ZcType.caption, color = c.textMuted)
        }
        if (selected) ZcIcon(ZcIcons.lCheck, contentDescription = null)
    }
}

private fun <T> List<ZcSelectOption<T>>.filtered(q: String) =
    if (q.isBlank()) this else filter { it.label.contains(q.trim(), ignoreCase = true) || it.description?.contains(q.trim(), true) == true }

@Composable
private fun NoResults(q: String) {
    ZcText(LocalContext.current.getString(R.string.zc_ui_sin_resultados, q), color = ZonacardsTheme.colors.textMuted, modifier = Modifier.padding(20.dp))
}

/** Select: lista en un bottom sheet (nada de spinner nativo). Con más de 8 opciones agrega búsqueda. */
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
    var open by remember { mutableStateOf(false) }
    var q by remember { mutableStateOf("") }
    val current = options.firstOrNull { it.value == selected }
    ZcField(label, modifier, required, false, hint, error, null, enabled) {
        SelectTrigger(current?.label, placeholder, fieldName(label, required), error, enabled, ZcIcons.sAltArrowDown) { q = ""; open = true }
    }
    if (open) ZcBottomSheet(onDismiss = { open = false }, title = label) {
        Column {
            if (searchable) Box(Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
                ZcSearchField(q, { q = it }, label = LocalContext.current.getString(R.string.zc_ui_buscar_opcion))
            }
            val list = options.filtered(q)
            if (list.isEmpty()) NoResults(q)
            LazyColumn(Modifier.semantics { }) {
                items(list, key = { it.value.hashCode() }) { o ->
                    OptionRow(o.label, o.description, o.icon, o.value == selected,
                        Modifier.selectable(o.value == selected, role = Role.RadioButton) { onSelect(o.value); open = false })
                }
            }
        }
    }
}

/** Selección múltiple: casillas en el sheet y pie con "Limpiar" y "Listo" a la derecha (sin conteo). Aplica al tocar Listo. */
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
    var open by remember { mutableStateOf(false) }
    var q by remember { mutableStateOf("") }
    val draft = remember { mutableStateListOf<T>() }
    val text = options.filter { it.value in selected }.joinToString(", ") { it.label }.ifEmpty { null }
    ZcField(label, modifier, required, false, hint, error, null, enabled) {
        SelectTrigger(text, placeholder, fieldName(label, required), error, enabled, ZcIcons.sAltArrowDown) {
            draft.clear(); draft.addAll(selected); q = ""; open = true
        }
    }
    if (open) ZcBottomSheet(
        onDismiss = { open = false }, title = label,
        footer = {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)) {
                ZcButton(ctx.getString(R.string.zc_ui_limpiar), { draft.clear() }, variant = ZcButtonVariant.OUTLINE)
                ZcButton(ctx.getString(R.string.zc_ui_listo), { onChange(draft.toSet()); open = false })
            }
        },
    ) {
        Column {
            if (searchable) Box(Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
                ZcSearchField(q, { q = it }, label = ctx.getString(R.string.zc_ui_buscar_opcion))
            }
            val list = options.filtered(q)
            if (list.isEmpty()) NoResults(q)
            LazyColumn {
                items(list, key = { it.value.hashCode() }) { o ->
                    val on = o.value in draft
                    OptionRow(o.label, o.description, o.icon, on,
                        Modifier.toggleable(on, role = Role.Checkbox) { if (it) draft.add(o.value) else draft.remove(o.value) })
                }
            }
        }
    }
}

/**
 * Fecha: abre el selector nativo de Android (patrón del sistema) y muestra la fecha con el formato del sistema de diseño.
 * Valor como ISO "aaaa-mm-dd"; `min` y `max` también ISO.
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

