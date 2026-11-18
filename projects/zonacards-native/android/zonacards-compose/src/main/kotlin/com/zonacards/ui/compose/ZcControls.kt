package com.zonacards.ui.compose

import androidx.annotation.DrawableRes
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.selection.triStateToggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcMotion
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType
import kotlin.math.roundToInt

/** Fila de control con etiqueta y descripción; toda la fila es el área de toque (alto mínimo `target`, o `targetSm` en SM). */
@Composable
private fun ControlRow(label: String?, description: String?, enabled: Boolean, modifier: Modifier, small: Boolean = false, control: @Composable () -> Unit) {
    Row(
        modifier = modifier.heightIn(min = if (small) ZcSize.targetSm else ZcSize.target).alpha(if (enabled) 1f else 0.5f),
        horizontalArrangement = Arrangement.spacedBy(if (small) 8.dp else 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        control()
        if (label != null) Column(Modifier.weight(1f, fill = false), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            ZcText(label, style = if (small) ZcTextTw.sm else ZcType.body)
            if (description != null) ZcText(description, style = ZcType.caption, color = ZonacardsTheme.colors.textMuted)
        }
    }
}

enum class ZcControlSize { MD, SM }

/**
 * Interruptor (hlm-switch): pista 48×28 (SM 36×22), activado en `success`, pulgar blanco (`thumb`) con sombra.
 * Aplica al instante (sin "Guardar"); para opciones que esperan confirmación, ZcCheckbox.
 */
@Composable
fun ZcSwitch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    description: String? = null,
    enabled: Boolean = true,
    size: ZcControlSize = ZcControlSize.MD,
) {
    val c = ZonacardsTheme.colors
    val haptic = rememberZcHaptics()
    val (w, h) = if (size == ZcControlSize.MD) 48.dp to 28.dp else 36.dp to 22.dp
    val thumb = h - 4.dp
    val track by animateColorAsState(if (checked) c.successFg else c.borderStrong, tween(ZcMotion.base), label = "track")
    val x by animateDpAsState(if (checked) w - thumb - 2.dp else 2.dp, tween(ZcMotion.base), label = "thumb")
    ControlRow(label, description, enabled, modifier.toggleable(checked, enabled = enabled, role = Role.Switch) { haptic(ZcHaptic.SELECTION); onCheckedChange(it) }, size == ZcControlSize.SM) {
        Box(Modifier.width(w).height(h).clip(RoundedCornerShape(50)).background(track)) {
            Box(Modifier.offset(x = x, y = 2.dp).size(thumb).shadow(1.dp, CircleShape).clip(CircleShape).background(c.thumb))
        }
    }
}

/** Caja de casilla de 22 (hlm-checkbox): marcada en `primary`; con error borde `danger`; deshabilitada punteada sobre `surface-2`. */
@Composable
internal fun CheckboxBox(state: ToggleableState, invalid: Boolean, disabled: Boolean) {
    val c = ZonacardsTheme.colors
    val on = state != ToggleableState.Off
    val fill by animateColorAsState(if (on) c.primary else if (disabled) c.surface2 else c.surface, tween(ZcMotion.fast), label = "fill")
    Box(Modifier.size(22.dp).then(if (on) Modifier.clip(RoundedCornerShape(ZcRadius.xs)).background(fill) else Modifier.zcControl(false, invalid, disabled, radius = ZcRadius.xs))) {
        if (on) Canvas(Modifier.fillMaxSize().padding(5.dp)) {
            val stroke = Stroke(2.dp.toPx(), cap = StrokeCap.Round)
            if (state == ToggleableState.On) {
                val p = Path().apply { moveTo(size.width * 0.1f, size.height * 0.52f); lineTo(size.width * 0.4f, size.height * 0.8f); lineTo(size.width * 0.92f, size.height * 0.2f) }
                drawPath(p, c.onPrimary, style = stroke)
            } else drawLine(c.onPrimary, Offset(size.width * 0.15f, size.height / 2), Offset(size.width * 0.85f, size.height / 2), stroke.width, StrokeCap.Round)
        }
    }
}

/** Casilla con estado mixto (padres de una lista con casillas). Sin etiqueta visible, `ariaLabel` la nombra (fila compacta). */
@Composable
fun ZcCheckbox(
    state: ToggleableState,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    description: String? = null,
    enabled: Boolean = true,
    invalid: Boolean = false,
    ariaLabel: String? = null,
) {
    val haptic = rememberZcHaptics()
    ControlRow(
        label, description, true,
        modifier.triStateToggleable(state, enabled = enabled, role = Role.Checkbox) { haptic(ZcHaptic.SELECTION); onClick() }
            .then(if (ariaLabel != null && label == null) Modifier.semantics { contentDescription = ariaLabel } else Modifier),
        small = label == null,
    ) { CheckboxBox(state, invalid, !enabled) }
}

/** Casilla simple (sí/no). */
@Composable
fun ZcCheckbox(checked: Boolean, onCheckedChange: (Boolean) -> Unit, modifier: Modifier = Modifier, label: String? = null, description: String? = null, enabled: Boolean = true, invalid: Boolean = false, ariaLabel: String? = null) =
    ZcCheckbox(if (checked) ToggleableState.On else ToggleableState.Off, { onCheckedChange(!checked) }, modifier, label, description, enabled, invalid, ariaLabel)

data class ZcRadioOption<T>(
    val value: T,
    val label: String,
    val description: String? = null,
    val enabled: Boolean = true,
    @DrawableRes val icon: Int? = null,
    val subtitle: String? = null,
    val aside: String? = null,
)

enum class ZcRadioVariant { LIST, CARD }

/** Círculo de 22 con punto de 10 en `primary` (hlm-radio). */
@Composable
private fun RadioDot(on: Boolean, invalid: Boolean, enabled: Boolean) {
    val c = ZonacardsTheme.colors
    Box(
        Modifier.size(22.dp).clip(CircleShape).background(if (enabled) c.surface else c.surface2)
            .border(if (on) 1.5.dp else 1.dp, if (invalid) c.dangerFg else if (on) c.primary else c.borderStrong, CircleShape),
        contentAlignment = Alignment.Center,
    ) { if (on) Box(Modifier.size(10.dp).clip(CircleShape).background(c.primary)) }
}

/**
 * Grupo de opciones excluyentes (2 a 6): etiqueta del grupo visible (14, medium), filas separadas 16, error del grupo.
 * `CARD`: tarjetas seleccionables con borde, fondo tintado al elegir, ícono y subtítulo.
 */
@Composable
fun <T> ZcRadioGroup(
    options: List<ZcRadioOption<T>>,
    selected: T?,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    variant: ZcRadioVariant = ZcRadioVariant.LIST,
    horizontal: Boolean = false,
    error: String? = null,
) {
    val c = ZonacardsTheme.colors
    val haptic = rememberZcHaptics()
    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (label != null) ZcText(label, style = ZcTextTw.sm, weight = FontWeight.Medium, modifier = Modifier.semantics { })
        val items: @Composable (Modifier) -> Unit = { m ->
            for (o in options) {
                val on = o.value == selected
                val select = Modifier.selectable(on, enabled = o.enabled, role = Role.RadioButton) { haptic(ZcHaptic.SELECTION); onSelect(o.value) }
                if (variant == ZcRadioVariant.CARD) {
                    Column(
                        m.clip(RoundedCornerShape(ZcRadius.md))
                            .background(if (on) androidx.compose.ui.graphics.lerp(c.surface, c.primary, 0.05f) else c.surface)
                            .border(if (on) 2.dp else 1.dp, if (on) c.primary else c.border, RoundedCornerShape(ZcRadius.md))
                            .then(select).alpha(if (o.enabled) 1f else 0.5f).padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
                            if (o.icon != null) Box(Modifier.size(40.dp).clip(RoundedCornerShape(ZcRadius.ms)).background(c.surface2), contentAlignment = Alignment.Center) { ZcIcon(o.icon, null, size = 16.dp) }
                            else RadioDot(on, error != null, o.enabled)
                            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                ZcText(o.label, weight = FontWeight.Medium)
                                if (o.subtitle != null) ZcText(o.subtitle, style = ZcType.caption, color = c.textMuted)
                            }
                            if (o.icon != null) Box(Modifier.padding(top = 10.dp)) { RadioDot(on, error != null, o.enabled) }
                            if (o.aside != null) ZcText(o.aside, weight = FontWeight.SemiBold)
                        }
                        if (o.description != null) ZcText(o.description, style = ZcType.caption, color = c.textMuted)
                    }
                } else {
                    Row(m.heightIn(min = ZcSize.target).then(select).alpha(if (o.enabled) 1f else 0.5f), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        RadioDot(on, error != null, o.enabled)
                        Column(Modifier.weight(1f, fill = !horizontal), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            ZcText(o.label)
                            if (o.description != null) ZcText(o.description, style = ZcType.caption, color = c.textMuted)
                        }
                        if (o.aside != null) ZcText(o.aside, color = c.textMuted)
                    }
                }
            }
        }
        val group = Modifier.selectableGroup().then(if (label != null) Modifier.semantics { contentDescription = label; if (error != null) error(error) } else Modifier)
        if (horizontal) Row(group, horizontalArrangement = Arrangement.spacedBy(16.dp)) { items(Modifier) }
        else Column(group, verticalArrangement = Arrangement.spacedBy(if (variant == ZcRadioVariant.CARD) 12.dp else 4.dp)) { items(Modifier.fillMaxWidth()) }
        if (error != null) Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            ZcIcon(com.zonacards.ui.tokens.ZcIcons.sDangerCircle, null, size = 16.dp, tint = c.dangerFg)
            ZcText(error, style = ZcType.caption, color = c.dangerFg)
        }
    }
}

enum class ZcProgressVariant { BAR, CIRCULAR, METER }

/**
 * Progreso (zc-progress). `value` entre 0 y 1; null = indeterminado (un segmento que cruza la pista, nunca parpadea).
 * BAR y CIRCULAR van en el color neutro del texto; METER (consumo de un cupo) cambia de color con `warnAt`/`dangerAt` (%).
 * Si no hay `valueText`, muestra el porcentaje.
 */
@Composable
fun ZcProgress(
    value: Float?,
    modifier: Modifier = Modifier,
    label: String? = null,
    valueText: String? = null,
    variant: ZcProgressVariant = ZcProgressVariant.BAR,
    tone: ZcTone? = null,
    warnAt: Int = 75,
    dangerAt: Int = 90,
) {
    val c = ZonacardsTheme.colors
    val loading = LocalContext.current.getString(R.string.zc_ui_cargando)
    val pct = value?.let { (it.coerceIn(0f, 1f) * 100).roundToInt() }
    val autoTone = tone ?: if (variant == ZcProgressVariant.METER && pct != null) (if (pct >= dangerAt) ZcTone.DANGER else if (pct >= warnAt) ZcTone.WARNING else ZcTone.SUCCESS) else null
    val bar = if (autoTone != null) toneColors(autoTone).fg else c.text
    val text = valueText ?: pct?.let { "$it %" }
    val sem = Modifier.semantics {
        contentDescription = label ?: loading
        progressBarRangeInfo = if (value == null) ProgressBarRangeInfo.Indeterminate else ProgressBarRangeInfo(value.coerceIn(0f, 1f), 0f..1f)
    }
    if (variant == ZcProgressVariant.CIRCULAR) {
        val spin by rememberInfiniteTransition(label = "c").animateFloat(0f, 360f, infiniteRepeatable(tween(1000, easing = LinearEasing)), label = "r")
        Box(modifier.size(56.dp).then(sem), contentAlignment = Alignment.Center) {
            Canvas(Modifier.fillMaxSize()) {
                val s = 6.dp.toPx()
                drawArc(c.surface2, 0f, 360f, false, style = Stroke(s))
                if (value == null) drawArc(bar, spin, 90f, false, style = Stroke(s, cap = StrokeCap.Round))
                else drawArc(bar, -90f, 360f * value.coerceIn(0f, 1f), false, style = Stroke(s, cap = StrokeCap.Round))
            }
            if (pct != null) ZcText("$pct%", style = ZcType.caption, weight = FontWeight.SemiBold, modifier = Modifier.clearAndSetSemantics { })
        }
        return
    }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        if (label != null || text != null) Row(Modifier.fillMaxWidth().clearAndSetSemantics { }, horizontalArrangement = Arrangement.SpaceBetween) {
            ZcText(label ?: "", style = ZcTextTw.sm, modifier = Modifier.weight(1f))
            if (text != null && value != null) ZcText(text, style = ZcTextTw.sm)
        }
        BoxWithConstraints(Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(50)).background(c.surface2).then(sem)) {
            if (value != null) {
                Box(Modifier.fillMaxHeight().fillMaxWidth(value.coerceIn(0f, 1f)).clip(RoundedCornerShape(50)).background(bar))
            } else {
                val t by rememberInfiniteTransition(label = "indet").animateFloat(-0.35f, 1f, infiniteRepeatable(tween(1400)), label = "x")
                Box(Modifier.fillMaxHeight().width(maxWidth * 0.35f).offset(x = maxWidth * t).clip(RoundedCornerShape(50)).background(bar))
            }
        }
    }
}

enum class ZcSkeletonVariant { LINE, BLOCK, CARD, TABLE_ROW }

/** Esqueleto de carga: brillo que recorre (1,4 s) sobre `surface-2`, radio 8; anuncia "Cargando" una vez. */
@Composable
fun ZcSkeleton(modifier: Modifier = Modifier, variant: ZcSkeletonVariant = ZcSkeletonVariant.LINE, lines: Int = 3, columns: Int = 4) {
    val c = ZonacardsTheme.colors
    val shift by rememberInfiniteTransition(label = "shimmer").animateFloat(-1f, 2f, infiniteRepeatable(tween(1400, easing = LinearEasing)), label = "s")
    val loading = LocalContext.current.getString(R.string.zc_ui_cargando)
    val bone = @Composable { m: Modifier, r: Dp ->
        BoxWithConstraints(m.clip(RoundedCornerShape(r)).background(c.surface2)) {
            val w = constraints.maxWidth.toFloat()
            Box(Modifier.fillMaxSize().background(Brush.horizontalGradient(listOf(Color.Transparent, c.surface3, Color.Transparent), startX = w * shift - w * 0.5f, endX = w * shift + w * 0.5f)))
        }
    }
    Box(modifier.clearAndSetSemantics { contentDescription = loading; liveRegion = LiveRegionMode.Polite }) {
        when (variant) {
            ZcSkeletonVariant.BLOCK -> bone(Modifier.fillMaxWidth().heightIn(min = 96.dp).fillMaxHeight(), ZcRadius.md)
            ZcSkeletonVariant.LINE -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                val widths = listOf(0.9f, 0.75f, 0.83f, 0.66f)
                repeat(lines) { i -> bone(Modifier.fillMaxWidth(if (i == 0) 0.6f else widths[(i - 1) % widths.size]).height(if (i == 0) 16.dp else 12.dp), ZcRadius.sm) }
            }
            ZcSkeletonVariant.CARD -> Column(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(ZcRadius.md)).border(1.dp, c.border, RoundedCornerShape(ZcRadius.md)).background(c.surface).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                bone(Modifier.fillMaxWidth(0.6f).height(16.dp), ZcRadius.sm)
                bone(Modifier.fillMaxWidth(0.92f).height(12.dp), ZcRadius.sm)
                bone(Modifier.fillMaxWidth(0.75f).height(12.dp), ZcRadius.sm)
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) { bone(Modifier.width(80.dp).height(28.dp), 50.dp); bone(Modifier.width(96.dp).height(28.dp), 50.dp) }
            }
            ZcSkeletonVariant.TABLE_ROW -> Column {
                Row(Modifier.fillMaxWidth().padding(vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    val widths = listOf(0.75f, 0.5f, 0.66f, 0.33f, 0.6f)
                    repeat(columns) { i -> Box(Modifier.weight(1f)) { bone(Modifier.fillMaxWidth(widths[i % widths.size]).height(12.dp), ZcRadius.sm) } }
                }
                ZcDivider()
            }
        }
    }
}

