package com.zonacards.ui.compose

import android.content.Context
import android.content.Intent
import android.view.HapticFeedbackConstants
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.onLongClick
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcType
import kotlinx.coroutines.delay

/**
 * Tamaños de texto de Tailwind que la web usa además de la escala propia (text-xs, text-sm, text-base, text-lg, text-xl, text-2xl).
 * Se mantienen para que cada componente mida lo mismo que en la web.
 */
object ZcTextTw {
    val xs = TextStyle(fontSize = 12.sp, lineHeight = 16.sp)
    val sm = TextStyle(fontSize = 14.sp, lineHeight = 20.sp)
    val base = TextStyle(fontSize = 16.sp, lineHeight = 24.sp)
    val lg = TextStyle(fontSize = 18.sp, lineHeight = 28.sp)
    val xl = TextStyle(fontSize = 20.sp, lineHeight = 28.sp)
    val x2l = TextStyle(fontSize = 24.sp, lineHeight = 32.sp)
}

/** Forma de los controles de formulario (input, select, OTP): `rounded-sm` = 8. */
internal val ControlShape @Composable get() = RoundedCornerShape(ZonacardsTheme.shape.control)

/**
 * Caja de control como CONTROL_BOX de la web: borde de 1 dp `border-strong`; con foco, borde `focus` y halo de 3 dp al 22 %;
 * con error, borde `danger`; deshabilitado, borde punteado y fondo `surface-2`.
 */
@Composable
internal fun Modifier.zcControl(focused: Boolean, invalid: Boolean = false, disabled: Boolean = false, valid: Boolean = false, radius: Dp = ZonacardsTheme.shape.control): Modifier {
    val c = ZonacardsTheme.colors
    val border = when { invalid -> c.dangerFg; valid -> c.successFg; focused -> c.focus; else -> c.fieldBd }
    val halo = if (focused && !disabled) (if (invalid) c.dangerFg else c.focus).copy(alpha = 0.22f) else Color.Transparent
    return this
        .drawBehind {
            if (halo != Color.Transparent) {
                val h = 3.dp.toPx()
                drawRoundRect(halo, topLeft = Offset(-h, -h), size = Size(size.width + 2 * h, size.height + 2 * h), cornerRadius = CornerRadius(radius.toPx() + h), style = Stroke(h * 2))
            }
        }
        .clip(RoundedCornerShape(radius))
        .background(if (disabled) c.surface2 else c.fieldBg)
        .drawBehind {
            val w = 1.dp.toPx()
            drawRoundRect(
                border, topLeft = Offset(w / 2, w / 2), size = Size(size.width - w, size.height - w), cornerRadius = CornerRadius(radius.toPx() - w / 2),
                style = Stroke(w, pathEffect = if (disabled) PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 3.dp.toPx())) else null),
            )
        }
}

/** Respuesta háptica del sistema (patrón móvil). Respeta el ajuste de vibración del teléfono. */
enum class ZcHaptic(internal val constant: Int) {
    /** Tecla del PIN, selección en una lista. */
    KEY(HapticFeedbackConstants.KEYBOARD_TAP),
    /** Interruptor, casilla, pestaña. */
    SELECTION(HapticFeedbackConstants.CLOCK_TICK),
    /** Acción confirmada (aprobar, guardar). */
    CONFIRM(if (android.os.Build.VERSION.SDK_INT >= 30) HapticFeedbackConstants.CONFIRM else HapticFeedbackConstants.VIRTUAL_KEY),
    /** Rechazo (PIN o código incorrecto). */
    REJECT(if (android.os.Build.VERSION.SDK_INT >= 30) HapticFeedbackConstants.REJECT else HapticFeedbackConstants.LONG_PRESS),
    /** Presión larga, inicio de arrastre. */
    LONG_PRESS(HapticFeedbackConstants.LONG_PRESS),
}

/** Devuelve una función que dispara la respuesta háptica: `val haptic = rememberZcHaptics(); haptic(ZcHaptic.CONFIRM)`. */
@Composable
fun rememberZcHaptics(): (ZcHaptic) -> Unit {
    val view = LocalView.current
    return remember(view) { { h: ZcHaptic -> view.performHapticFeedback(h.constant) } }
}

/** Hoja de compartir del sistema (patrón móvil): texto o enlace con título opcional. */
object ZcShare {
    fun text(context: Context, text: String, title: String? = null) {
        val send = Intent(Intent.ACTION_SEND).apply { type = "text/plain"; putExtra(Intent.EXTRA_TEXT, text); if (title != null) putExtra(Intent.EXTRA_TITLE, title) }
        context.startActivity(Intent.createChooser(send, title).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
}

/**
 * Tooltip del sistema de diseño (fondo oscuro): en táctil aparece con presión larga y se oculta solo a los 2,5 s.
 * TalkBack ya lee el texto como descripción del elemento, así que no depende del gesto.
 */
@Composable
fun ZcTooltip(text: String, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    var show by remember { mutableStateOf(false) }
    if (show) LaunchedEffect(Unit) { delay(2500); show = false }
    Box(
        modifier
            .pointerInput(text) { detectTapGestures(onLongPress = { show = true }) }
            .semantics { stateDescription = text; onLongClick(text) { show = true; true } },
    ) {
        content()
        if (show) Popup(popupPositionProvider = AboveProvider, onDismissRequest = { show = false }) {
            Box(Modifier.widthIn(max = 280.dp).clip(RoundedCornerShape(ZcRadius.sm)).background(ZonacardsTheme.colors.text).padding(horizontal = 10.dp, vertical = 6.dp)) {
                ZcText(text, style = ZcType.caption, color = ZonacardsTheme.colors.surface)
            }
        }
    }
}

/** Tooltip arriba del ancla (o abajo si no cabe), centrado y dentro de la pantalla. */
private object AboveProvider : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize): IntOffset {
        val gap = 8
        val x = (anchorBounds.center.x - popupContentSize.width / 2).coerceIn(8, (windowSize.width - popupContentSize.width - 8).coerceAtLeast(8))
        val above = anchorBounds.top - popupContentSize.height - gap
        return IntOffset(x, if (above >= 0) above else anchorBounds.bottom + gap)
    }
}

