package com.zonacards.ui.compose

import androidx.compose.foundation.border
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcOpacity
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcType
import java.text.NumberFormat
import kotlin.math.floor
import kotlin.math.min
import kotlin.math.roundToInt

enum class ZcRatingSize(val icon: Dp) { SM(16.dp), MD(20.dp), LG(32.dp) }

/**
 * Estrellas para dar o mostrar una calificación (equivale a Rating de HeroUI y a `zc-rating`).
 * - Solo lectura (`onValueChange` nulo): TalkBack la lee como una imagen con su texto ("Calificación del producto: 4,5 de 5, 128 opiniones");
 *   acepta fracciones (4,3 llena el 30 % de la quinta estrella). Con `count` muestra el número de opiniones y con `showValue`, la nota.
 * - Interactiva: un solo control (deslizador). Toque o arrastre eligen la estrella (con `allowHalf`, la mitad izquierda vale 0,5); TalkBack
 *   la ajusta con deslizar arriba o abajo; con teclado, flechas ±1 (±0,5 con medias), Re Pág y Av Pág ±1, Inicio la quita y Fin pone el máximo.
 * `label` es obligatorio: es el nombre del control. 0 es "sin calificar". El color es el de advertencia del sistema; la nota va en el texto
 * accesible y, con `showValue`, a la vista (nunca solo color).
 */
@Composable
fun ZcRating(
    value: Float,
    label: String,
    modifier: Modifier = Modifier,
    onValueChange: ((Float) -> Unit)? = null,
    max: Int = 5,
    allowHalf: Boolean = false,
    size: ZcRatingSize = ZcRatingSize.MD,
    count: Int? = null,
    showValue: Boolean = false,
    enabled: Boolean = true,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val stars = max.coerceAtLeast(1)
    val v = value.coerceIn(0f, stars.toFloat())
    val step = if (allowHalf) 0.5f else 1f
    val interactive = onValueChange != null && enabled
    val valueText = NumberFormat.getNumberInstance(ctx.resources.configuration.locales[0]).apply { maximumFractionDigits = 1 }.format(v)
    val base = if (v > 0f) ctx.getString(R.string.zc_ui_calificacion, label, valueText, stars.toString()) else ctx.getString(R.string.zc_ui_sin_calificar, label)
    val text = if (count != null) base + ", " + ctx.getString(R.string.zc_ui_n_opiniones, count.toString()) else base

    val update = rememberUpdatedState(onValueChange)
    var widthPx by remember { mutableIntStateOf(0) }
    var focused by remember { mutableStateOf(false) }
    fun set(next: Float) { update.value?.invoke(next.coerceIn(0f, stars.toFloat())) }
    /** Valor bajo un punto del control: la estrella sobre la que está y, con medias, si es su mitad izquierda. */
    fun at(x: Float): Float {
        if (widthPx <= 0) return v
        val slot = widthPx / stars.toFloat()
        val px = x.coerceIn(0f, widthPx.toFloat())
        val idx = min(stars - 1, floor(px / slot).toInt())
        val inside = (px - idx * slot) / slot
        return idx + if (allowHalf && inside <= 0.5f) 0.5f else 1f
    }

    Row(modifier.alpha(if (enabled) 1f else ZcOpacity.disabled), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            Modifier
                .onSizeChanged { widthPx = it.width }
                .then(if (focused) Modifier.border(2.dp, c.focus, RoundedCornerShape(4.dp)) else Modifier)
                .then(
                    if (interactive) Modifier
                        .pointerInput(stars, allowHalf) { detectTapGestures { set(at(it.x)) } }
                        .pointerInput(stars, allowHalf) { detectHorizontalDragGestures(onDragStart = { set(at(it.x)) }) { change, _ -> change.consume(); set(at(change.position.x)) } }
                        .onFocusChanged { focused = it.isFocused }
                        .focusable()
                        .onKeyEvent { e ->
                            if (e.type != KeyEventType.KeyDown) return@onKeyEvent false
                            val next = when (e.key) {
                                Key.DirectionRight, Key.DirectionUp -> v + step
                                Key.DirectionLeft, Key.DirectionDown -> v - step
                                Key.PageUp -> v + 1f
                                Key.PageDown -> v - 1f
                                Key.MoveHome -> 0f
                                Key.MoveEnd -> stars.toFloat()
                                else -> return@onKeyEvent false
                            }
                            set(next); true
                        } else Modifier,
                )
                .semantics {
                    if (interactive) {
                        contentDescription = label
                        stateDescription = text
                        progressBarRangeInfo = ProgressBarRangeInfo(v, 0f..stars.toFloat(), steps = (stars / step).toInt() - 1)
                        setProgress { target -> set((target / step).roundToInt() * step); true }
                    } else {
                        role = Role.Image
                        contentDescription = text
                        if (!enabled) disabled()
                    }
                },
        ) {
            repeat(stars) { i -> Star(fill = (v - i).coerceIn(0f, 1f), size = size.icon) }
        }
        if (showValue) ZcText(valueText, Modifier.clearAndSetSemantics { }, style = ZcType.bodySm, weight = ZcWeight.medium)
        if (count != null) ZcText("($count)", Modifier.clearAndSetSemantics { }, style = ZcType.caption, color = c.textMuted)
    }
}

/** Una estrella: el contorno siempre y, encima, el relleno recortado a la fracción que le toca. */
@Composable
private fun Star(fill: Float, size: Dp) {
    val c = ZonacardsTheme.colors
    Box(Modifier.size(size)) {
        ZcIcon(ZcIcons.sStar, contentDescription = null, size = size, tint = c.textSubtle)
        // Relleno y contorno en el mismo color: el aro gris solo se ve en la parte sin llenar.
        if (fill > 0f) Box(Modifier.width(size * fill).height(size).clipToBounds()) {
            Box(Modifier.requiredSize(size)) {
                ZcIcon(ZcIcons.sStarBold, contentDescription = null, size = size, tint = c.warningFg)
                ZcIcon(ZcIcons.sStar, contentDescription = null, size = size, tint = c.warningFg)
            }
        }
    }
}
