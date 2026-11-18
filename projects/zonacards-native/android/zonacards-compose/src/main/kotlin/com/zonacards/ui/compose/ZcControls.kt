package com.zonacards.ui.compose

import androidx.compose.animation.animateColorAsState
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcMotion
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcType

/** Fila de control con etiqueta (y descripción opcional) de al menos 48 dp; toda la fila es el área de toque. */
@Composable
private fun ControlRow(label: String?, description: String?, enabled: Boolean, modifier: Modifier, control: @Composable () -> Unit) {
    Row(
        modifier = modifier.heightIn(min = 48.dp).alpha(if (enabled) 1f else 0.5f),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        control()
        if (label != null) Column(Modifier.weight(1f, fill = false), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            ZcText(label)
            if (description != null) ZcText(description, style = ZcType.caption, color = ZonacardsTheme.colors.textMuted)
        }
    }
}

/** Interruptor: aplica al instante (sin "Guardar"). Para opciones que esperan confirmación, usa ZcCheckbox. */
@Composable
fun ZcSwitch(checked: Boolean, onCheckedChange: (Boolean) -> Unit, modifier: Modifier = Modifier, label: String? = null, description: String? = null, enabled: Boolean = true) {
    val c = ZonacardsTheme.colors
    val track by animateColorAsState(if (checked) c.primary else c.borderStrong, tween(ZcMotion.base), label = "track")
    val thumbX by animateDpAsState(if (checked) 20.dp else 2.dp, tween(ZcMotion.base), label = "thumb")
    ControlRow(label, description, enabled, modifier.toggleable(checked, enabled = enabled, role = Role.Switch, onValueChange = onCheckedChange)) {
        Box(Modifier.width(44.dp).height(24.dp).clip(RoundedCornerShape(50)).background(track)) {
            Box(Modifier.offset(x = thumbX, y = 2.dp).size(20.dp).clip(CircleShape).background(if (checked) c.onPrimary else c.surface))
        }
    }
}

/** Casilla con estado mixto (padres de una lista con casillas). */
@Composable
fun ZcCheckbox(
    state: ToggleableState,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    description: String? = null,
    enabled: Boolean = true,
    invalid: Boolean = false,
) {
    val c = ZonacardsTheme.colors
    val on = state != ToggleableState.Off
    val fill by animateColorAsState(if (on) c.primary else c.surface, tween(ZcMotion.fast), label = "fill")
    ControlRow(label, description, enabled, modifier.triStateToggleable(state, enabled = enabled, role = Role.Checkbox, onClick = onClick)) {
        Box(
            Modifier.size(20.dp).clip(RoundedCornerShape(ZcRadius.xs)).background(fill)
                .border(if (on) 0.dp else 1.5.dp, if (invalid) c.dangerFg else c.borderStrong, RoundedCornerShape(ZcRadius.xs)),
        ) {
            if (on) Canvas(Modifier.fillMaxWidth().fillMaxHeight().padding(4.dp)) {
                val stroke = Stroke(2.dp.toPx(), cap = StrokeCap.Round)
                if (state == ToggleableState.On) {
                    val p = Path().apply { moveTo(size.width * 0.1f, size.height * 0.52f); lineTo(size.width * 0.4f, size.height * 0.8f); lineTo(size.width * 0.92f, size.height * 0.2f) }
                    drawPath(p, c.onPrimary, style = stroke)
                } else {
                    drawLine(c.onPrimary, Offset(size.width * 0.15f, size.height / 2), Offset(size.width * 0.85f, size.height / 2), stroke.width, StrokeCap.Round)
                }
            }
        }
    }
}

/** Casilla simple (sí/no). */
@Composable
fun ZcCheckbox(checked: Boolean, onCheckedChange: (Boolean) -> Unit, modifier: Modifier = Modifier, label: String? = null, description: String? = null, enabled: Boolean = true, invalid: Boolean = false) =
    ZcCheckbox(if (checked) ToggleableState.On else ToggleableState.Off, { onCheckedChange(!checked) }, modifier, label, description, enabled, invalid)

data class ZcRadioOption<T>(val value: T, val label: String, val description: String? = null, val enabled: Boolean = true)

/** Grupo de opciones excluyentes (2 a 6). Más opciones: un select. */
@Composable
fun <T> ZcRadioGroup(options: List<ZcRadioOption<T>>, selected: T?, onSelect: (T) -> Unit, modifier: Modifier = Modifier, label: String? = null) {
    val c = ZonacardsTheme.colors
    Column(modifier.selectableGroup().then(if (label != null) Modifier.semantics { contentDescription = label } else Modifier)) {
        for (o in options) {
            val on = o.value == selected
            ControlRow(o.label, o.description, o.enabled, Modifier.fillMaxWidth().selectable(on, enabled = o.enabled, role = Role.RadioButton) { onSelect(o.value) }) {
                Box(Modifier.size(20.dp).clip(CircleShape).border(if (on) 6.dp else 1.5.dp, if (on) c.primary else c.borderStrong, CircleShape).background(c.surface))
            }
        }
    }
}

/**
 * Barra de progreso. `value` entre 0 y 1; null = indeterminado: un segmento que cruza la pista (nunca parpadea).
 * `tone` solo para medidores (cupo, uso); el avance de una tarea va en el color neutro del sistema.
 */
@Composable
fun ZcProgress(value: Float?, modifier: Modifier = Modifier, label: String? = null, valueText: String? = null, tone: ZcTone? = null) {
    val c = ZonacardsTheme.colors
    val bar = if (tone != null) toneColors(tone).fg else c.primary
    val loading = LocalContext.current.getString(R.string.zc_ui_cargando)
    Column(modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        if (label != null || valueText != null) Row(Modifier.fillMaxWidth().clearAndSetSemantics { }, horizontalArrangement = Arrangement.SpaceBetween) {
            ZcText(label ?: "", style = ZcType.bodySm)
            if (valueText != null) ZcText(valueText, style = ZcType.bodySm)
        }
        BoxWithConstraints(
            Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(50)).background(c.surface3).semantics {
                contentDescription = label ?: loading
                progressBarRangeInfo = if (value == null) ProgressBarRangeInfo.Indeterminate else ProgressBarRangeInfo(value.coerceIn(0f, 1f), 0f..1f)
            },
        ) {
            if (value != null) {
                Box(Modifier.fillMaxHeight().fillMaxWidth(value.coerceIn(0f, 1f)).clip(RoundedCornerShape(50)).background(bar))
            } else {
                val t by rememberInfiniteTransition(label = "indet").animateFloat(-0.35f, 1f, infiniteRepeatable(tween(1400)), label = "x")
                Box(Modifier.fillMaxHeight().width(maxWidth * 0.35f).offset(x = maxWidth * t).clip(RoundedCornerShape(50)).background(bar))
            }
        }
    }
}

enum class ZcSkeletonVariant { LINE, BLOCK, CARD }

/** Esqueleto de carga: anuncia "Cargando" una vez y dibuja la forma del contenido que viene. */
@Composable
fun ZcSkeleton(modifier: Modifier = Modifier, variant: ZcSkeletonVariant = ZcSkeletonVariant.LINE, lines: Int = 3) {
    val c = ZonacardsTheme.colors
    val alpha by rememberInfiniteTransition(label = "pulse").animateFloat(0.55f, 1f, infiniteRepeatable(tween(900), androidx.compose.animation.core.RepeatMode.Reverse), label = "a")
    val loading = LocalContext.current.getString(R.string.zc_ui_cargando)
    val bone = @Composable { m: Modifier -> Box(m.clip(RoundedCornerShape(ZcRadius.xs)).background(c.surface3).alpha(alpha)) }
    Box(modifier.clearAndSetSemantics { contentDescription = loading; liveRegion = LiveRegionMode.Polite }) {
        when (variant) {
            ZcSkeletonVariant.BLOCK -> bone(Modifier.fillMaxWidth().heightIn(min = 96.dp).fillMaxHeight())
            ZcSkeletonVariant.LINE -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                val widths = listOf(0.9f, 0.75f, 0.83f, 0.66f)
                repeat(lines) { i -> bone(Modifier.fillMaxWidth(if (i == 0) 0.6f else widths[(i - 1) % widths.size]).height(if (i == 0) 16.dp else 12.dp)) }
            }
            ZcSkeletonVariant.CARD -> Column(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(ZcRadius.md)).border(1.dp, c.border, RoundedCornerShape(ZcRadius.md)).background(c.surface).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                bone(Modifier.fillMaxWidth(0.6f).height(16.dp))
                bone(Modifier.fillMaxWidth(0.92f).height(12.dp))
                bone(Modifier.fillMaxWidth(0.75f).height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) { bone(Modifier.width(80.dp).height(28.dp)); bone(Modifier.width(96.dp).height(28.dp)) }
            }
        }
    }
}

