package com.zonacards.ui.compose

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcMotion
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcType
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

/**
 * Pila de subpantallas dentro de un sheet, drawer o modal: el segundo nivel se abre aquí con "Volver",
 * nunca como otro sheet encima (equivale a SUBSCREEN_HOST de la web).
 */
@Stable
class ZcSubscreenHost internal constructor() {
    internal val stack = mutableStateListOf<Pair<String, @Composable () -> Unit>>()
    /** Abre una subpantalla con título y botón Volver dentro del mismo contenedor. */
    fun push(title: String, content: @Composable () -> Unit) { stack.add(title to content) }
    fun pop(): Boolean = if (stack.isEmpty()) false else { stack.removeAt(stack.lastIndex); true }
    val depth: Int get() = stack.size
}

/** Contenedor actual; null fuera de un sheet o modal. Los selectores lo usan para no abrir un sheet sobre otro. */
val LocalZcSubscreenHost = compositionLocalOf<ZcSubscreenHost?> { null }

/** Encabezado de subpantalla: Volver + título. */
@Composable
private fun SubscreenHeader(title: String, onBack: () -> Unit) {
    val ctx = LocalContext.current
    Row(Modifier.fillMaxWidth().padding(start = 8.dp, end = 20.dp, top = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        ZcIconButton(ZcIcons.sAltArrowLeft, ctx.getString(R.string.zc_mol_movil_volver), onBack)
        ZcText(title, style = ZcType.title, weight = FontWeight.SemiBold, modifier = Modifier.semantics { heading() })
    }
}

/** Cuerpo con subpantallas: muestra la pila del host (con transición lateral) o el contenido raíz. */
@Composable
private fun SubscreenBody(host: ZcSubscreenHost, title: String?, root: @Composable () -> Unit) {
    AnimatedContent(
        // Se anima una copia de la pila: la pantalla que sale sigue dibujándose aunque ya no esté en la pila.
        targetState = host.stack.toList(),
        contentKey = { it.size },
        transitionSpec = {
            val forward = targetState.size > initialState.size
            (slideInHorizontally(tween(ZcMotion.base)) { if (forward) it / 6 else -it / 6 } + fadeIn(tween(ZcMotion.base)))
                .togetherWith(slideOutHorizontally(tween(ZcMotion.exit)) { if (forward) -it / 6 else it / 6 } + fadeOut(tween(ZcMotion.exit)))
        },
        label = "subscreen",
    ) { stack ->
        Column {
            if (stack.isEmpty()) {
                if (title != null) ZcText(title, style = ZcType.title, weight = FontWeight.SemiBold, modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 8.dp).semantics { heading() })
                root()
            } else {
                val (t, content) = stack.last()
                SubscreenHeader(t) { host.pop() }
                content()
            }
        }
    }
}

/**
 * Bottom sheet: entra desde abajo con fundido, sale con animación, se cierra arrastrando hacia abajo, tocando el fondo
 * o con Atrás (que primero cierra la subpantalla abierta). Alto máximo del 85 %; el pie queda fijo.
 */
@Composable
fun ZcBottomSheet(onDismiss: () -> Unit, title: String? = null, footer: (@Composable () -> Unit)? = null, content: @Composable () -> Unit) {
    val c = ZonacardsTheme.colors
    val host = remember { ZcSubscreenHost() }
    val visible = remember { MutableTransitionState(false).apply { targetState = true } }
    var closing by remember { mutableStateOf(false) }
    val drag = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()
    val density = LocalDensity.current
    val maxH = LocalConfiguration.current.screenHeightDp.dp * 0.85f
    fun close() { closing = true; visible.targetState = false }
    fun back() { if (!host.pop()) close() }
    // Al terminar la salida, avisa al dueño.
    LaunchedEffect(visible.currentState, visible.isIdle) { if (closing && visible.isIdle && !visible.currentState) onDismiss() }
    Dialog(onDismissRequest = ::back, properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
            AnimatedVisibility(visible, enter = fadeIn(tween(ZcMotion.base)), exit = fadeOut(tween(ZcMotion.exit))) {
                Box(Modifier.fillMaxSize().background(c.overlay).clickable(MutableInteractionSource(), null, onClick = ::close))
            }
            AnimatedVisibility(
                visible,
                enter = slideInVertically(tween(ZcMotion.slow, easing = ZcMotion.enterEasing)) { with(density) { 36.dp.roundToPx() } } + fadeIn(tween(ZcMotion.base)),
                exit = slideOutVertically(tween(ZcMotion.exit, easing = ZcMotion.exitEasing)) { it / 3 } + fadeOut(tween(ZcMotion.exit)),
            ) {
                CompositionLocalProvider(LocalZcSubscreenHost provides host) {
                    Column(
                        Modifier.fillMaxWidth().widthIn(max = 640.dp).heightIn(max = maxH)
                            .offset { IntOffset(0, drag.value.roundToInt()) }
                            .clip(RoundedCornerShape(topStart = ZcRadius.lg, topEnd = ZcRadius.lg)).background(c.surface)
                            .clickable(MutableInteractionSource(), null) { }
                            .semantics { if (title != null) paneTitle = title }
                            .navigationBarsPadding(),
                    ) {
                        // Asa: arrastrar hacia abajo más de 96 dp (o rápido) cierra; si no, vuelve a su lugar.
                        Box(
                            Modifier.fillMaxWidth().height(24.dp).draggable(
                                rememberDraggableState { d -> scope.launch { drag.snapTo((drag.value + d).coerceAtLeast(0f)) } },
                                Orientation.Vertical,
                                onDragStopped = { v ->
                                    if (drag.value > with(density) { 96.dp.toPx() } || v > 1800f) close()
                                    else scope.launch { drag.animateTo(0f, tween(ZcMotion.base)) }
                                },
                            ),
                            contentAlignment = Alignment.Center,
                        ) { Box(Modifier.width(36.dp).height(4.dp).clip(RoundedCornerShape(50)).background(c.borderStrong)) }
                        Box(Modifier.weight(1f, fill = false)) { SubscreenBody(host, title, content) }
                        if (footer != null && host.depth == 0) {
                            ZcDivider()
                            Box(Modifier.padding(16.dp)) { footer() }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Modal: en teléfono es un bottom sheet; desde 600 dp, un diálogo centrado (fundido + zoom 98 %).
 * Título y subtítulo, sin ícono al costado; acciones en `footer` (lo destructivo con el botón DANGER).
 */
@Composable
fun ZcModal(onDismiss: () -> Unit, title: String, subtitle: String? = null, footer: (@Composable () -> Unit)? = null, content: @Composable () -> Unit) {
    val wide = LocalConfiguration.current.screenWidthDp >= 600
    if (!wide) {
        ZcBottomSheet(onDismiss, title, footer) {
            Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                if (subtitle != null) ZcText(subtitle, color = ZonacardsTheme.colors.textMuted)
                content()
            }
        }
        return
    }
    val c = ZonacardsTheme.colors
    val host = remember { ZcSubscreenHost() }
    val visible = remember { MutableTransitionState(false).apply { targetState = true } }
    var closing by remember { mutableStateOf(false) }
    fun close() { closing = true; visible.targetState = false }
    LaunchedEffect(visible.currentState, visible.isIdle) { if (closing && visible.isIdle && !visible.currentState) onDismiss() }
    Dialog(onDismissRequest = { if (!host.pop()) close() }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        AnimatedVisibility(visible, enter = fadeIn(tween(ZcMotion.base)) + scaleIn(tween(ZcMotion.base), 0.98f), exit = fadeOut(tween(ZcMotion.exit)) + scaleOut(tween(ZcMotion.exit), 0.98f)) {
            CompositionLocalProvider(LocalZcSubscreenHost provides host) {
                Column(Modifier.widthIn(max = 520.dp).padding(24.dp).clip(RoundedCornerShape(ZcRadius.lg)).background(c.surface).semantics { paneTitle = title }) {
                    Column(Modifier.weight(1f, fill = false).verticalScroll(rememberScrollState())) {
                        SubscreenBody(host, title) {
                            Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                if (subtitle != null) ZcText(subtitle, color = c.textMuted)
                                content()
                            }
                        }
                    }
                    if (footer != null) { ZcDivider(); Box(Modifier.padding(16.dp)) { footer() } }
                }
            }
        }
    }
}

/**
 * Confirmación (alert dialog): título, texto y dos botones iguales. `danger` pinta la confirmación en rojo.
 * No se cierra tocando el fondo: hay que elegir.
 */
@Composable
fun ZcAlertDialog(
    title: String,
    text: String,
    confirmLabel: String,
    onConfirm: () -> Unit,
    cancelLabel: String,
    onDismiss: () -> Unit,
    danger: Boolean = false,
    loading: Boolean = false,
) {
    val c = ZonacardsTheme.colors
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(dismissOnClickOutside = false, usePlatformDefaultWidth = false)) {
        Column(
            Modifier.padding(24.dp).widthIn(max = 420.dp).clip(RoundedCornerShape(ZcRadius.lg)).background(c.surface).padding(20.dp)
                .semantics { paneTitle = title },
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            ZcText(title, style = ZcType.title, weight = FontWeight.SemiBold, modifier = Modifier.semantics { heading() })
            ZcText(text, color = c.textMuted)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ZcButton(cancelLabel, onDismiss, variant = ZcButtonVariant.OUTLINE, modifier = Modifier.weight(1f), block = true, enabled = !loading)
                ZcButton(confirmLabel, onConfirm, variant = if (danger) ZcButtonVariant.DANGER else ZcButtonVariant.PRIMARY, modifier = Modifier.weight(1f), block = true, loading = loading)
            }
        }
    }
}

// ---------------------------------------------------------------- Toasts

enum class ZcToastKind { SUCCESS, ERROR, WARNING, INFO }

data class ZcToast(
    val id: Long,
    val kind: ZcToastKind,
    val title: String,
    val text: String? = null,
    val actionLabel: String? = null,
    val onAction: (() -> Unit)? = null,
    /** ms; null = no se cierra solo (errores con acción). */
    val duration: Long? = 5000,
)

/**
 * Avisos de resultado de una acción. Un solo `ZcToaster` en la raíz de la app; las pantallas llaman `success`, `error`…
 * Los errores con acción ("Reintentar") no se cierran solos.
 */
@Stable
class ZcToastState {
    internal val items = mutableStateListOf<ZcToast>()
    private var next = 0L
    fun show(kind: ZcToastKind, title: String, text: String? = null, actionLabel: String? = null, onAction: (() -> Unit)? = null, duration: Long? = null): Long {
        val id = ++next
        val d = duration ?: if (kind == ZcToastKind.ERROR && actionLabel != null) null else 5000L
        items.add(ZcToast(id, kind, title, text, actionLabel, onAction, d))
        while (items.size > 3) items.removeAt(0)
        return id
    }
    fun success(title: String, text: String? = null, actionLabel: String? = null, onAction: (() -> Unit)? = null) = show(ZcToastKind.SUCCESS, title, text, actionLabel, onAction)
    fun error(title: String, text: String? = null, actionLabel: String? = null, onAction: (() -> Unit)? = null) = show(ZcToastKind.ERROR, title, text, actionLabel, onAction)
    fun info(title: String, text: String? = null) = show(ZcToastKind.INFO, title, text)
    fun warning(title: String, text: String? = null) = show(ZcToastKind.WARNING, title, text)
    fun dismiss(id: Long) { items.removeAll { it.id == id } }
}

@Composable
fun rememberZcToastState() = remember { ZcToastState() }

/** Pila de avisos arriba (bajo la barra superior) en móvil, como en la web. TalkBack los lee al aparecer. */
@Composable
fun ZcToaster(state: ZcToastState, modifier: Modifier = Modifier) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    Box(modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 16.dp, vertical = 8.dp), contentAlignment = Alignment.TopCenter) {
        Column(Modifier.widthIn(max = 400.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            for (t in state.items) androidx.compose.runtime.key(t.id) {
                if (t.duration != null) LaunchedEffect(t.id) { delay(t.duration); state.dismiss(t.id) }
                val (icon, tone) = when (t.kind) {
                    ZcToastKind.SUCCESS -> ZcIcons.sCheckCircle to c.successFg
                    ZcToastKind.ERROR -> ZcIcons.sDangerCircle to c.dangerFg
                    ZcToastKind.WARNING -> ZcIcons.sDangerTriangle to c.warningFg
                    ZcToastKind.INFO -> ZcIcons.sInfoCircle to c.infoFg
                }
                // Entrada: fundido + 8 dp desde arriba. El aviso está en el árbol desde el primer cuadro (TalkBack lo anuncia de inmediato).
                val appear = remember { Animatable(0f) }
                LaunchedEffect(t.id) { appear.animateTo(1f, tween(ZcMotion.base, easing = ZcMotion.enterEasing)) }
                run {
                    Row(
                        Modifier.fillMaxWidth().graphicsLayer { alpha = appear.value; translationY = (1f - appear.value) * -8.dp.toPx() }.clip(RoundedCornerShape(ZcRadius.md)).background(c.surface)
                            .border(1.dp, c.border, RoundedCornerShape(ZcRadius.md))
                            .semantics { liveRegion = if (t.kind == ZcToastKind.ERROR) LiveRegionMode.Assertive else LiveRegionMode.Polite }
                            .padding(start = 16.dp, top = 12.dp, bottom = 12.dp, end = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top,
                    ) {
                        ZcIcon(icon, contentDescription = null, tint = tone, modifier = Modifier.padding(top = 2.dp))
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            ZcText(t.title, weight = FontWeight.SemiBold)
                            if (t.text != null) ZcText(t.text, style = ZcType.bodySm, color = c.textMuted)
                            if (t.actionLabel != null) ZcButton(t.actionLabel, { t.onAction?.invoke(); state.dismiss(t.id) }, variant = ZcButtonVariant.LINK, size = ZcButtonSize.SM)
                        }
                        ZcIconButton(ZcIcons.lX, ctx.getString(R.string.zc_ui_cerrar_notificacion), { state.dismiss(t.id) })
                    }
                }
            }
        }
    }
}

