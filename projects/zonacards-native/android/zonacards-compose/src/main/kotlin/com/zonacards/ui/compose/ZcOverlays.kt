package com.zonacards.ui.compose

import androidx.activity.compose.PredictiveBackHandler
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
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
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
import androidx.compose.runtime.mutableFloatStateOf
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
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
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcMotion
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcType
import kotlinx.coroutines.CancellationException
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

/** Encabezado del overlay como la web: título y subtítulo (14, muted) y la X de cerrar a la derecha; en el sheet, borde inferior. */
@Composable
private fun OverlayHeader(title: String?, subtitle: String?, closable: Boolean, border: Boolean, onClose: () -> Unit) {
    val ctx = LocalContext.current
    if (title == null && !closable) return
    Column {
        Row(Modifier.fillMaxWidth().padding(start = 16.dp, end = 8.dp, top = 8.dp, bottom = 12.dp), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f).padding(top = 6.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                if (title != null) ZcText(title, style = ZcType.title, weight = ZcWeight.semibold, modifier = Modifier.semantics { heading() })
                if (subtitle != null) ZcText(subtitle, style = ZcTextTw.sm, color = ZonacardsTheme.colors.textMuted)
            }
            if (closable) ZcIconButton(ZcIcons.lX, ctx.getString(R.string.zc_ui_cerrar), onClose)
        }
        if (border) ZcDivider()
    }
}

/** Encabezado de subpantalla: Volver + título (`title-sm`) con borde inferior. */
@Composable
private fun SubscreenHeader(title: String, onBack: () -> Unit) {
    val ctx = LocalContext.current
    Column {
        Row(Modifier.fillMaxWidth().padding(start = 4.dp, end = 16.dp, top = 4.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            ZcIconButton(ZcIcons.sAltArrowLeft, ctx.getString(R.string.zc_ui_volver), onBack)
            ZcText(title, style = ZcType.titleSm, weight = ZcWeight.semibold, modifier = Modifier.semantics { heading() })
        }
        ZcDivider()
    }
}

/** Cuerpo con subpantallas: anima una copia de la pila (la pantalla que sale sigue dibujándose aunque ya no esté en la pila). */
@Composable
private fun SubscreenBody(host: ZcSubscreenHost, header: @Composable () -> Unit, root: @Composable () -> Unit) {
    AnimatedContent(
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
            if (stack.isEmpty()) { header(); root() } else {
                val (t, content) = stack.last()
                SubscreenHeader(t) { host.pop() }
                content()
            }
        }
    }
}

/** Pie del overlay: botones del mismo ancho (usa `ZcFooterButton` o `Modifier.weight(1f)`). */
@Composable
private fun OverlayFooter(footer: @Composable RowScope.() -> Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), content = footer)
}

/** Botón del pie de un overlay: ocupa su parte del ancho (todos iguales, como la web). */
@Composable
fun RowScope.ZcFooterButton(text: String, onClick: () -> Unit, variant: ZcButtonVariant = ZcButtonVariant.PRIMARY, enabled: Boolean = true, loading: Boolean = false) =
    ZcButton(text, onClick, Modifier.weight(1f), variant = variant, enabled = enabled, loading = loading, block = true)

/**
 * Bottom sheet: asa de 40×5, encabezado con título y X, cuerpo con subpantallas y pie fijo con borde. Entra desde abajo, sale
 * animado, se cierra arrastrando (80 dp), tocando el fondo, con la X o con Atrás; Atrás predictivo acompaña el gesto.
 * Alto máximo del 90 %; con el teclado abierto el contenido sube (patrón móvil). `busy` bloquea el cierre.
 */
@Composable
fun ZcBottomSheet(
    onDismiss: () -> Unit,
    title: String? = null,
    subtitle: String? = null,
    closable: Boolean = true,
    busy: Boolean = false,
    dismissOnScrim: Boolean = true,
    /** Puntos de anclaje: fracciones del alto de la pantalla, de menor a mayor (por ejemplo, 0.5f y 0.9f). Abre en el primero y se arrastra al siguiente; sin ellos, el alto sigue al contenido (hasta 90 %). */
    detents: List<Float> = emptyList(),
    footer: (@Composable RowScope.() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    val c = ZonacardsTheme.colors
    val host = remember { ZcSubscreenHost() }
    val visible = remember { MutableTransitionState(false).apply { targetState = true } }
    var closing by remember { mutableStateOf(false) }
    val drag = remember { Animatable(0f) }
    var backProgress by remember { mutableFloatStateOf(0f) }
    val scope = rememberCoroutineScope()
    val density = LocalDensity.current
    val screenH = LocalConfiguration.current.screenHeightDp.dp
    val maxH = screenH * 0.9f
    val stops = remember(detents) { detents.filter { it in 0.2f..0.95f }.sorted() }
    val stopsPx = stops.map { with(density) { (screenH * it).toPx() } }
    val sheetH = remember { Animatable(stopsPx.firstOrNull() ?: 0f) }
    fun close() { if (!busy) { closing = true; visible.targetState = false } }
    fun back() { if (!host.pop()) close() }
    LaunchedEffect(visible.currentState, visible.isIdle) { if (closing && visible.isIdle && !visible.currentState) onDismiss() }
    Dialog(onDismissRequest = ::back, properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
        // Atrás predictivo (Android 14+): el sheet acompaña el gesto y se cierra (o vuelve de la subpantalla) al soltar.
        PredictiveBackHandler(enabled = !busy) { progress ->
            try {
                progress.collect { e -> backProgress = e.progress }
                backProgress = 0f
                back()
            } catch (e: CancellationException) { backProgress = 0f; throw e }
        }
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
            AnimatedVisibility(visible, enter = fadeIn(tween(ZcMotion.base)), exit = fadeOut(tween(ZcMotion.exit))) {
                Box(Modifier.fillMaxSize().background(c.overlay).clickable(MutableInteractionSource(), null) { if (dismissOnScrim) close() })
            }
            AnimatedVisibility(
                visible,
                enter = slideInVertically(tween(ZcMotion.slow, easing = ZcMotion.enterEasing)) { with(density) { 36.dp.roundToPx() } } + fadeIn(tween(ZcMotion.base)),
                exit = slideOutVertically(tween(ZcMotion.exit, easing = ZcMotion.exitEasing)) { it / 3 } + fadeOut(tween(ZcMotion.exit)),
            ) {
                CompositionLocalProvider(LocalZcSubscreenHost provides host) {
                    Column(
                        Modifier.fillMaxWidth().widthIn(max = 640.dp)
                            .then(if (stops.isEmpty()) Modifier.heightIn(max = maxH) else Modifier.height(with(density) { sheetH.value.toDp() }))
                            .offset { IntOffset(0, drag.value.roundToInt()) }
                            .graphicsLayer { val s = 1f - backProgress * 0.06f; scaleX = s; scaleY = s; translationY = backProgress * 24.dp.toPx() }
                            .clip(RoundedCornerShape(topStart = ZonacardsTheme.shape.sheet, topEnd = ZonacardsTheme.shape.sheet)).background(c.surface)
                            .clickable(MutableInteractionSource(), null) { }
                            .semantics { if (title != null) paneTitle = title }
                            .navigationBarsPadding().imePadding(),
                    ) {
                        val dragState = rememberDraggableState { d ->
                            if (stops.isEmpty()) scope.launch { drag.snapTo((drag.value + d).coerceAtLeast(0f)) }
                            // Con puntos de anclaje, arrastrar cambia el alto de la hoja (no su posición); puede bajar un poco del primer punto para avisar que se cierra.
                            else scope.launch { sheetH.snapTo((sheetH.value - d).coerceIn(stopsPx.first() * 0.4f, stopsPx.last())) }
                        }
                        val dragMod = Modifier.draggable(dragState, Orientation.Vertical, enabled = !busy, onDragStopped = { v ->
                            if (stops.isEmpty()) {
                                if (drag.value > with(density) { 80.dp.toPx() } || v > 1800f) close()
                                else scope.launch { drag.animateTo(0f, tween(ZcMotion.base)) }
                            } else if (sheetH.value < stopsPx.first() - with(density) { 80.dp.toPx() } || v > 1800f) close()
                            else {
                                // Suelta en el punto más cercano; un gesto rápido salta al siguiente en su dirección.
                                val target = when {
                                    v < -800f -> stopsPx.firstOrNull { it > sheetH.value + 1f } ?: stopsPx.last()
                                    v > 800f -> stopsPx.lastOrNull { it < sheetH.value - 1f } ?: stopsPx.first()
                                    else -> stopsPx.minBy { kotlin.math.abs(it - sheetH.value) }
                                }
                                scope.launch { sheetH.animateTo(target, tween(ZcMotion.base)) }
                            }
                        })
                        Box(Modifier.fillMaxWidth().testTag("zc-sheet-handle").then(dragMod).padding(top = 12.dp), contentAlignment = Alignment.Center) {
                            Box(Modifier.width(40.dp).height(5.dp).clip(RoundedCornerShape(50)).background(c.borderStrong))
                        }
                        Box(Modifier.weight(1f, fill = stops.isNotEmpty())) {
                            SubscreenBody(host, { Box(dragMod) { OverlayHeader(title, subtitle, closable, border = true, onClose = ::close) } }, content)
                        }
                        if (footer != null && host.depth == 0) { ZcDivider(); OverlayFooter(footer) }
                    }
                }
            }
        }
    }
}

enum class ZcModalSize(val maxWidth: Int) { MD(520), LG(760) }

/**
 * Modal: en teléfono es un bottom sheet; desde 600 dp, un diálogo centrado (fundido + zoom 98 %), ancho 520 (LG 760), con la X
 * y el pie alineado a la derecha. Título y subtítulo, sin ícono al costado; lo destructivo con el botón DANGER.
 */
@Composable
fun ZcModal(
    onDismiss: () -> Unit,
    title: String,
    subtitle: String? = null,
    size: ZcModalSize = ZcModalSize.MD,
    closable: Boolean = true,
    busy: Boolean = false,
    footer: (@Composable RowScope.() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    if (LocalConfiguration.current.screenWidthDp < 600) {
        ZcBottomSheet(onDismiss, title, subtitle, closable, busy, footer = footer) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) { content() }
        }
        return
    }
    val c = ZonacardsTheme.colors
    val host = remember { ZcSubscreenHost() }
    val visible = remember { MutableTransitionState(false).apply { targetState = true } }
    var closing by remember { mutableStateOf(false) }
    fun close() { if (!busy) { closing = true; visible.targetState = false } }
    LaunchedEffect(visible.currentState, visible.isIdle) { if (closing && visible.isIdle && !visible.currentState) onDismiss() }
    Dialog(onDismissRequest = { if (!host.pop()) close() }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        AnimatedVisibility(visible, enter = fadeIn(tween(ZcMotion.base)) + scaleIn(tween(ZcMotion.base), 0.98f), exit = fadeOut(tween(ZcMotion.exit)) + scaleOut(tween(ZcMotion.exit), 0.98f)) {
            CompositionLocalProvider(LocalZcSubscreenHost provides host) {
                Column(Modifier.widthIn(max = size.maxWidth.dp).padding(24.dp).clip(RoundedCornerShape(ZonacardsTheme.shape.sheet)).background(c.surface).semantics { paneTitle = title }.imePadding()) {
                    Column(Modifier.weight(1f, fill = false).verticalScroll(rememberScrollState())) {
                        SubscreenBody(host, { OverlayHeader(title, subtitle, closable, border = false, onClose = ::close) }) {
                            Column(Modifier.padding(horizontal = 24.dp).padding(bottom = 20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) { content() }
                        }
                    }
                    if (footer != null) Row(Modifier.fillMaxWidth().padding(start = 24.dp, end = 24.dp, bottom = 20.dp), horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.End), content = footer)
                }
            }
        }
    }
}

/** Drawer: panel lateral de 460 desde la derecha a partir de 600 dp; en teléfono, bottom sheet. Mismo encabezado, X y pie. */
@Composable
fun ZcDrawer(
    onDismiss: () -> Unit,
    title: String,
    subtitle: String? = null,
    busy: Boolean = false,
    footer: (@Composable RowScope.() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    if (LocalConfiguration.current.screenWidthDp < 600) {
        ZcBottomSheet(onDismiss, title, subtitle, true, busy, footer = footer) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) { content() }
        }
        return
    }
    val c = ZonacardsTheme.colors
    val host = remember { ZcSubscreenHost() }
    val visible = remember { MutableTransitionState(false).apply { targetState = true } }
    var closing by remember { mutableStateOf(false) }
    fun close() { if (!busy) { closing = true; visible.targetState = false } }
    LaunchedEffect(visible.currentState, visible.isIdle) { if (closing && visible.isIdle && !visible.currentState) onDismiss() }
    Dialog(onDismissRequest = { if (!host.pop()) close() }, properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.CenterEnd) {
            AnimatedVisibility(visible, enter = fadeIn(tween(ZcMotion.base)), exit = fadeOut(tween(ZcMotion.exit))) {
                Box(Modifier.fillMaxSize().background(c.overlay).clickable(MutableInteractionSource(), null, onClick = ::close))
            }
            AnimatedVisibility(
                visible,
                enter = slideInHorizontally(tween(ZcMotion.slow, easing = ZcMotion.enterEasing)) { it / 10 } + fadeIn(tween(ZcMotion.base)),
                exit = slideOutHorizontally(tween(ZcMotion.exit)) { it / 10 } + fadeOut(tween(ZcMotion.exit)),
            ) {
                CompositionLocalProvider(LocalZcSubscreenHost provides host) {
                    Column(Modifier.width(460.dp).fillMaxHeight().background(c.surface).statusBarsPadding().navigationBarsPadding().imePadding().semantics { paneTitle = title }) {
                        Box(Modifier.weight(1f)) {
                            SubscreenBody(host, { OverlayHeader(title, subtitle, true, border = true, onClose = ::close) }) {
                                Column(Modifier.verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) { content() }
                            }
                        }
                        if (footer != null && host.depth == 0) { ZcDivider(); OverlayFooter(footer) }
                    }
                }
            }
        }
    }
}

/**
 * Confirmación (zc-alert-dialog): en teléfono es un bottom sheet; desde 600 dp, diálogo centrado. Título, texto y dos botones
 * iguales; `danger` pinta la confirmación en rojo. `reasonLabel` pide un motivo (mínimo 5 caracteres) y `confirmWord` pide
 * escribir una palabra; la confirmación queda deshabilitada hasta completarlos. No se cierra tocando el fondo.
 */
@Composable
fun ZcAlertDialog(
    title: String,
    text: String,
    confirmLabel: String,
    onConfirm: (reason: String?) -> Unit,
    cancelLabel: String,
    onDismiss: () -> Unit,
    danger: Boolean = false,
    loading: Boolean = false,
    reasonLabel: String? = null,
    confirmWord: String? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    var reason by remember { mutableStateOf("") }
    var word by remember { mutableStateOf("") }
    val reasonOk = reasonLabel == null || reason.trim().length >= 5
    val wordOk = confirmWord == null || word.trim() == confirmWord
    val body = @Composable {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            ZcText(text, color = c.textMuted)
            if (reasonLabel != null) ZcTextArea(reason, { reason = it }, reasonLabel, hint = ctx.getString(R.string.zc_org_motivo_min, "5"), required = true)
            if (confirmWord != null) ZcTextField(word, { word = it }, ctx.getString(R.string.zc_org_escribe_para_confirmar, confirmWord), capitalization = androidx.compose.ui.text.input.KeyboardCapitalization.Characters)
        }
    }
    val footer: @Composable RowScope.() -> Unit = {
        ZcFooterButton(cancelLabel, onDismiss, ZcButtonVariant.OUTLINE, enabled = !loading)
        ZcFooterButton(confirmLabel, { onConfirm(if (reasonLabel != null) reason.trim() else null) }, if (danger) ZcButtonVariant.DANGER else ZcButtonVariant.PRIMARY, enabled = reasonOk && wordOk, loading = loading)
    }
    if (LocalConfiguration.current.screenWidthDp < 600) {
        ZcBottomSheet(onDismiss, title, closable = false, busy = loading, dismissOnScrim = false, footer = footer) { Box(Modifier.padding(16.dp)) { body() } }
        return
    }
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(dismissOnClickOutside = false, usePlatformDefaultWidth = false)) {
        Column(
            Modifier.padding(24.dp).widthIn(max = 420.dp).clip(RoundedCornerShape(ZonacardsTheme.shape.sheet)).background(c.surface).padding(20.dp).semantics { paneTitle = title }.imePadding(),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            ZcText(title, style = ZcType.title, weight = ZcWeight.semibold, modifier = Modifier.semantics { heading() })
            body()
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), content = footer)
        }
    }
}

// ---------------------------------------------------------------- Toasts

enum class ZcToastKind { SUCCESS, ERROR, INFO, LOADING }

/** El contenido de un aviso sin su tipo. */
data class ZcToastBody(val title: String, val text: String? = null, val actionLabel: String? = null, val onAction: (() -> Unit)? = null)

data class ZcToast(
    val id: Long,
    val kind: ZcToastKind,
    val title: String,
    val text: String? = null,
    val actionLabel: String? = null,
    val onAction: (() -> Unit)? = null,
    /** ms; null = no se cierra solo (errores con acción y avisos de "cargando"). */
    val duration: Long? = 6000,
)

/**
 * Avisos de resultado de una acción (ToastService de la web). Un solo `ZcToaster` en la raíz de la app. 6 s por defecto; los
 * errores con acción ("Reintentar") no se cierran solos; con más de 3, los demás esperan en cola.
 * Una operación que tarda: `state.promise(loading, success, error) { guardar() }` muestra un solo aviso que pasa de "cargando" a éxito o error en su lugar
 * (equivale a `toast.promise` de HeroUI y de la web).
 */
@Stable
class ZcToastState {
    internal val items = mutableStateListOf<ZcToast>()
    internal val queue = mutableStateListOf<ZcToast>()
    private var next = 0L
    fun show(kind: ZcToastKind, title: String, text: String? = null, actionLabel: String? = null, onAction: (() -> Unit)? = null, duration: Long? = null): Long {
        val id = ++next
        val d = duration ?: durationOf(kind, actionLabel)
        val t = ZcToast(id, kind, title, text, actionLabel, onAction, d)
        if (items.size < 3) items.add(t) else queue.add(t)
        return id
    }
    private fun durationOf(kind: ZcToastKind, actionLabel: String?): Long? = if (kind == ZcToastKind.LOADING || (kind == ZcToastKind.ERROR && actionLabel != null)) null else 6000L

    /** Aviso de "cargando" (con giro): no se cierra solo; se cambia con [update] cuando termina la operación. */
    fun loading(title: String, text: String? = null) = show(ZcToastKind.LOADING, title, text)

    /** Cambia un aviso en su lugar (por ejemplo, de "cargando" a éxito) y recalcula cuánto dura. Devuelve false si ya no está (la persona lo cerró). */
    fun update(id: Long, kind: ZcToastKind, title: String, text: String? = null, actionLabel: String? = null, onAction: (() -> Unit)? = null): Boolean {
        val new = ZcToast(id, kind, title, text, actionLabel, onAction, durationOf(kind, actionLabel))
        val i = items.indexOfFirst { it.id == id }
        if (i >= 0) { items[i] = new; return true }
        val q = queue.indexOfFirst { it.id == id }
        if (q >= 0) { queue[q] = new; return true }
        return false
    }

    /**
     * Muestra "cargando" mientras corre [block] y lo cambia en su lugar a éxito o error al terminar. Si la persona cerró el aviso antes, el resultado igual
     * se muestra en uno nuevo (un error nunca se pierde). Devuelve el valor de [block] o relanza su error; si se cancela, el aviso se cierra.
     */
    suspend fun <T> promise(loading: ZcToastBody, success: (T) -> ZcToastBody, error: (Throwable) -> ZcToastBody, block: suspend () -> T): T {
        val id = show(ZcToastKind.LOADING, loading.title, loading.text, loading.actionLabel, loading.onAction)
        fun finish(kind: ZcToastKind, b: ZcToastBody) { if (!update(id, kind, b.title, b.text, b.actionLabel, b.onAction)) show(kind, b.title, b.text, b.actionLabel, b.onAction) }
        return try {
            block().also { finish(ZcToastKind.SUCCESS, success(it)) }
        } catch (e: CancellationException) {
            dismiss(id); throw e
        } catch (e: Throwable) {
            finish(ZcToastKind.ERROR, error(e)); throw e
        }
    }

    /** [promise] con textos simples. */
    suspend fun <T> promise(loading: String, success: String, error: String, block: suspend () -> T): T =
        promise(ZcToastBody(loading), { ZcToastBody(success) }, { ZcToastBody(error) }, block)

    fun success(title: String, text: String? = null, actionLabel: String? = null, onAction: (() -> Unit)? = null) = show(ZcToastKind.SUCCESS, title, text, actionLabel, onAction)
    fun error(title: String, text: String? = null, actionLabel: String? = null, onAction: (() -> Unit)? = null) = show(ZcToastKind.ERROR, title, text, actionLabel, onAction)
    fun info(title: String, text: String? = null) = show(ZcToastKind.INFO, title, text)
    fun dismiss(id: Long) {
        items.removeAll { it.id == id }; queue.removeAll { it.id == id }
        while (items.size < 3 && queue.isNotEmpty()) items.add(queue.removeAt(0))
    }
}

@Composable
fun rememberZcToastState() = remember { ZcToastState() }

/**
 * Pila de avisos arriba (bajo la barra superior) en móvil, como en la web. TalkBack los lee al aparecer (los errores con
 * prioridad). El tiempo se detiene mientras se toca o se enfoca el aviso.
 */
@Composable
fun ZcToaster(state: ZcToastState, modifier: Modifier = Modifier) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    Box(modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 16.dp, vertical = 8.dp), contentAlignment = Alignment.TopCenter) {
        Column(Modifier.widthIn(max = 400.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            for (t in state.items) androidx.compose.runtime.key(t.id) {
                val source = remember { MutableInteractionSource() }
                val pressed by source.collectIsPressedAsState()
                val focused by source.collectIsFocusedAsState()
                if (t.duration != null) LaunchedEffect(t.id, t.duration) {
                    var left = t.duration
                    while (left > 0) { delay(100); if (!pressed && !focused) left -= 100 }
                    state.dismiss(t.id)
                }
                val (icon, tone) = when (t.kind) {
                    ZcToastKind.SUCCESS -> ZcIcons.sCheckCircle to c.successFg
                    ZcToastKind.ERROR -> ZcIcons.sDangerCircle to c.dangerFg
                    ZcToastKind.INFO -> ZcIcons.sInfoCircle to c.infoFg
                    ZcToastKind.LOADING -> ZcIcons.sInfoCircle to c.textMuted   // el de "cargando" se dibuja con el giro, no con el ícono
                }
                // Entrada: fundido + 8 dp desde arriba; el aviso está en el árbol desde el primer cuadro.
                val appear = remember { Animatable(0f) }
                LaunchedEffect(t.id) { appear.animateTo(1f, tween(ZcMotion.base, easing = ZcMotion.enterEasing)) }
                Row(
                    Modifier.fillMaxWidth().graphicsLayer { alpha = appear.value; translationY = (1f - appear.value) * -8.dp.toPx() }
                        .clip(RoundedCornerShape(ZcRadius.md)).background(c.surface).border(1.dp, c.border, RoundedCornerShape(ZcRadius.md))
                        .clickable(source, null) { }
                        .semantics { liveRegion = if (t.kind == ZcToastKind.ERROR) LiveRegionMode.Assertive else LiveRegionMode.Polite }
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top,
                ) {
                    if (t.kind == ZcToastKind.LOADING) ZcSpinner(Modifier.padding(top = 2.dp), size = 20.dp, color = c.textMuted)
                    else ZcIcon(icon, contentDescription = null, tint = tone, modifier = Modifier.padding(top = 2.dp))
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        ZcText(t.title, weight = ZcWeight.semibold)
                        if (t.text != null) ZcText(t.text, style = ZcTextTw.sm, color = c.textMuted)
                        if (t.actionLabel != null) ZcButton(t.actionLabel, { t.onAction?.invoke(); state.dismiss(t.id) }, variant = ZcButtonVariant.LINK, size = ZcButtonSize.SM)
                    }
                    Box(Modifier.offset(x = 8.dp, y = (-8).dp)) {
                        CloseSmall(ctx.getString(R.string.zc_ui_cerrar_notificacion)) { state.dismiss(t.id) }
                    }
                }
            }
        }
    }
}

/** X de 16 con área de toque de 40 (cerrar aviso). */
@Composable
private fun CloseSmall(label: String, onClick: () -> Unit) {
    Box(
        Modifier.width(40.dp).height(40.dp).clip(RoundedCornerShape(50)).clickable(role = androidx.compose.ui.semantics.Role.Button, onClick = onClick)
            .semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) { ZcIcon(ZcIcons.lX, contentDescription = null, size = 16.dp, tint = ZonacardsTheme.colors.textMuted) }
}
