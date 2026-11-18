package com.zonacards.ui.compose

import androidx.annotation.DrawableRes
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcMotion
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcType
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

/** Barra superior de la app: Volver opcional, título (y subtítulo) y como máximo una acción a la derecha. */
@Composable
fun ZcTopBar(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    action: (@Composable () -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    Column(modifier.fillMaxWidth().background(c.surface).statusBarsPadding()) {
        Row(Modifier.fillMaxWidth().heightIn(min = 56.dp).padding(horizontal = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            if (onBack != null) ZcIconButton(ZcIcons.sAltArrowLeft, ctx.getString(R.string.zc_mol_movil_volver), onBack)
            Column(Modifier.weight(1f).padding(start = if (onBack != null) 4.dp else 12.dp, end = 8.dp).semantics(mergeDescendants = true) { heading() }) {
                ZcText(title, style = ZcType.titleSm, weight = FontWeight.SemiBold)
                if (subtitle != null) ZcText(subtitle, style = ZcType.caption, color = c.textMuted)
            }
            action?.invoke()
        }
        ZcDivider()
    }
}

data class ZcNavItem(val id: String, val label: String, @DrawableRes val icon: Int, @DrawableRes val iconActive: Int = icon, val badge: String? = null)

/** Navegación inferior: 3 a 5 destinos con ícono y texto; el activo en Bold y color de marca. */
@Composable
fun ZcBottomNav(items: List<ZcNavItem>, current: String?, onSelect: (String) -> Unit, modifier: Modifier = Modifier) {
    require(items.size in 3..5) { "ZcBottomNav lleva de 3 a 5 destinos" }
    val c = ZonacardsTheme.colors
    Column(modifier.fillMaxWidth().background(c.surface)) {
        ZcDivider()
        Row(Modifier.fillMaxWidth().navigationBarsPadding().selectableGroup()) {
            for (it in items) {
                val on = it.id == current
                Column(
                    Modifier.weight(1f).heightIn(min = 56.dp).selectable(on, role = Role.Tab) { onSelect(it.id) }.padding(top = 8.dp, bottom = 6.dp),
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Box {
                        ZcIcon(if (on) it.iconActive else it.icon, contentDescription = null, tint = if (on) c.primary else c.textMuted, size = 24.dp)
                        if (it.badge != null) Box(
                            Modifier.align(Alignment.TopEnd).offset(x = 8.dp, y = (-4).dp).heightIn(min = 16.dp).widthIn(min = 16.dp)
                                .clip(RoundedCornerShape(50)).background(c.dangerFg).padding(horizontal = 4.dp),
                            contentAlignment = Alignment.Center,
                        ) { ZcText(it.badge, style = ZcType.xxs, color = Color.White, weight = FontWeight.SemiBold) }
                    }
                    ZcText(it.label, style = ZcType.tiny, color = if (on) c.primary else c.textMuted, weight = if (on) FontWeight.SemiBold else null, maxLines = 1)
                }
            }
        }
    }
}

enum class ZcBannerTone { OFFLINE, UPDATE }

/** Banda bajo la barra superior (sin conexión o actualización disponible). TalkBack la anuncia. */
@Composable
fun ZcSystemBanner(text: String, modifier: Modifier = Modifier, tone: ZcBannerTone = ZcBannerTone.OFFLINE, action: (@Composable () -> Unit)? = null) {
    val c = ZonacardsTheme.colors
    val (bg, fg) = if (tone == ZcBannerTone.OFFLINE) c.text to c.surface else c.infoBg to c.infoFg
    Row(
        modifier.fillMaxWidth().background(bg).semantics { liveRegion = LiveRegionMode.Polite }.padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        ZcIcon(if (tone == ZcBannerTone.OFFLINE) ZcIcons.lWifiOff else ZcIcons.lRotateCw, contentDescription = null, size = 16.dp, tint = fg)
        ZcText(text, style = ZcType.caption, color = fg, modifier = Modifier.weight(1f))
        action?.invoke()
    }
}

/** Banner de sin conexión con los cambios pendientes ("Sin conexión. 3 cambios pendientes se guardarán al reconectar."). */
@Composable
fun ZcOfflineBanner(pending: Int, modifier: Modifier = Modifier) =
    ZcSystemBanner(LocalContext.current.getString(R.string.zc_mol_offline_texto, pending.toString()), modifier)

enum class ZcStateKind { EMPTY, ERROR }

/**
 * Estado de bloque: vacío, sin resultados o error. Qué pasó (título), por qué o qué se conservó (texto),
 * la referencia en errores y una acción para salir (Reintentar, Limpiar filtros).
 */
@Composable
fun ZcState(
    title: String,
    modifier: Modifier = Modifier,
    kind: ZcStateKind = ZcStateKind.EMPTY,
    @DrawableRes icon: Int = if (kind == ZcStateKind.ERROR) ZcIcons.sDangerTriangle else ZcIcons.sBox,
    text: String? = null,
    reference: String? = null,
    action: (@Composable () -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    Column(
        modifier.fillMaxWidth().clip(RoundedCornerShape(ZcRadius.md)).border(1.dp, c.borderStrong.copy(alpha = 0.6f), RoundedCornerShape(ZcRadius.md))
            .padding(horizontal = 16.dp, vertical = 20.dp)
            .semantics(mergeDescendants = false) { if (kind == ZcStateKind.ERROR) liveRegion = LiveRegionMode.Assertive },
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(Modifier.size(44.dp).clip(RoundedCornerShape(ZcRadius.ms)).background(if (kind == ZcStateKind.ERROR) c.dangerBg else c.surface2), contentAlignment = Alignment.Center) {
            ZcIcon(icon, contentDescription = null, size = 24.dp, tint = if (kind == ZcStateKind.ERROR) c.dangerFg else c.text)
        }
        Column(Modifier.semantics(mergeDescendants = true) { }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            ZcText(title, style = ZcType.titleSm, weight = FontWeight.SemiBold, modifier = Modifier.semantics { heading() })
            if (text != null) ZcText(text, style = ZcType.bodySm, color = c.textMuted)
            if (reference != null) ZcText("${ctx.getString(R.string.zc_comun_referencia)} $reference", style = ZcType.tiny, color = c.textMuted)
        }
        action?.invoke()
    }
}

/**
 * Deslizar hacia abajo para actualizar. TalkBack ofrece la acción "Actualizar" (no depende del gesto);
 * la barra superior debería tener además un botón Actualizar.
 */
@Composable
fun ZcPullRefresh(refreshing: Boolean, onRefresh: () -> Unit, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    val threshold = with(LocalDensity.current) { 72.dp.toPx() }
    var pull by remember { mutableFloatStateOf(0f) }
    val connection = remember(refreshing) {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                // Subiendo mientras hay tirón: primero se recoge el tirón.
                if (available.y < 0 && pull > 0) { val used = maxOf(available.y, -pull); pull += used; return Offset(0f, used) }
                return Offset.Zero
            }
            override fun onPostScroll(consumed: Offset, available: Offset, source: NestedScrollSource): Offset {
                if (refreshing || available.y <= 0 || source != NestedScrollSource.UserInput) return Offset.Zero
                pull = (pull + available.y * 0.5f).coerceAtMost(threshold * 1.5f)
                return Offset(0f, available.y)
            }
            override suspend fun onPreFling(available: androidx.compose.ui.unit.Velocity): androidx.compose.ui.unit.Velocity {
                if (pull >= threshold && !refreshing) onRefresh()
                pull = 0f
                return androidx.compose.ui.unit.Velocity.Zero
            }
        }
    }
    Box(
        modifier.nestedScroll(connection).semantics {
            customActions = listOf(CustomAccessibilityAction(ctx.getString(R.string.zc_ui_actualizar)) { onRefresh(); true })
            if (refreshing) stateDescription = ctx.getString(R.string.zc_ui_actualizando)
        },
    ) {
        content()
        val show = refreshing || pull > 0
        if (show) Box(
            Modifier.align(Alignment.TopCenter).offset { IntOffset(0, (if (refreshing) threshold * 0.5f else pull * 0.6f).roundToInt()) }
                .size(40.dp).clip(RoundedCornerShape(50)).background(c.surface).border(1.dp, c.border, RoundedCornerShape(50)),
            contentAlignment = Alignment.Center,
        ) { ZcSpinner(size = 20.dp, decorative = true) }
    }
}

data class ZcAction(val id: String, val label: String, @DrawableRes val icon: Int, val danger: Boolean = false)

/**
 * Menú de acciones (⋮): botón de solo ícono que abre la lista en un bottom sheet
 * (o como subpantalla si ya está dentro de uno). Lo destructivo en rojo.
 */
@Composable
fun ZcMenu(actions: List<ZcAction>, onAction: (String) -> Unit, label: String, modifier: Modifier = Modifier) {
    val host = LocalZcSubscreenHost.current
    var open by remember { mutableStateOf(false) }
    val list = @Composable { close: () -> Unit ->
        Column(Modifier.padding(bottom = 8.dp)) {
            for (a in actions) {
                val c = ZonacardsTheme.colors
                Row(
                    Modifier.fillMaxWidth().heightIn(min = 56.dp).clickable(role = Role.Button) { close(); onAction(a.id) }.padding(horizontal = 20.dp),
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    val tint = if (a.danger) c.dangerFg else c.text
                    ZcIcon(a.icon, contentDescription = null, tint = tint)
                    ZcText(a.label, color = tint)
                }
            }
        }
    }
    ZcIconButton(ZcIcons.sMenuDotsVerticalBold, label, { if (host != null) host.push(label) { list { host.pop() } } else open = true }, modifier)
    if (open) ZcBottomSheet(onDismiss = { open = false }, title = label) { list { open = false } }
}

/**
 * Fila deslizable: a la izquierda muestra hasta 2 acciones. Las mismas acciones están en el menú ⋮ y como acciones de
 * TalkBack, así nadie depende del gesto.
 */
@Composable
fun ZcSwipeItem(actions: List<ZcAction>, onAction: (String) -> Unit, menuLabel: String, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    require(actions.size in 1..2) { "ZcSwipeItem muestra 1 o 2 acciones" }
    val c = ZonacardsTheme.colors
    val density = LocalDensity.current
    val reveal = with(density) { (76.dp * actions.size).toPx() }
    val offset = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()
    fun settle(open: Boolean) = scope.launch { offset.animateTo(if (open) -reveal else 0f, tween(ZcMotion.base)) }
    // Alto = el de la fila (IntrinsicSize.Min): las acciones de fondo lo llenan sin estirar la fila a la pantalla.
    Box(modifier.fillMaxWidth().height(androidx.compose.foundation.layout.IntrinsicSize.Min).clip(RoundedCornerShape(ZcRadius.md)).background(c.surface2)) {
        Row(Modifier.align(Alignment.CenterEnd).fillMaxHeight().clearAndSetSemantics { }, horizontalArrangement = Arrangement.End) {
            for (a in actions) Column(
                Modifier.width(76.dp).fillMaxHeight().background(if (a.danger) c.dangerFg else c.infoFg)
                    .clickable { settle(false); onAction(a.id) },
                horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center,
            ) {
                ZcIcon(a.icon, contentDescription = null, tint = c.surface)
                ZcText(a.label, style = ZcType.tiny, color = c.surface, textAlign = TextAlign.Center)
            }
        }
        Row(
            Modifier.fillMaxWidth().offset { IntOffset(offset.value.roundToInt(), 0) }
                .clip(RoundedCornerShape(ZcRadius.md)).background(c.surface).border(1.dp, c.border, RoundedCornerShape(ZcRadius.md))
                .draggable(
                    rememberDraggableState { d -> scope.launch { offset.snapTo((offset.value + d).coerceIn(-reveal, 0f)) } },
                    Orientation.Horizontal,
                    onDragStopped = { v -> settle(offset.value < -reveal / 2 || v < -1200f) },
                )
                .semantics { customActions = actions.map { a -> CustomAccessibilityAction(a.label) { onAction(a.id); true } } }
                .padding(start = 12.dp, top = 10.dp, bottom = 10.dp, end = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.weight(1f)) { content() }
            ZcMenu(actions, onAction, menuLabel)
        }
    }
}


