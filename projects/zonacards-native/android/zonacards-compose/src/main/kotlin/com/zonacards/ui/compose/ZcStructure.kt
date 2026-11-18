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
import androidx.compose.foundation.layout.IntrinsicSize
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalClipboardManager
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
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.Velocity
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcMotion
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcType
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

/** Barra superior (zc-mobile-bar): Volver cuadrado de 40 (radio 8, toque 48), título `title-sm` y subtítulo de 12, una acción. */
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
        Row(Modifier.fillMaxWidth().heightIn(min = 56.dp).padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            if (onBack != null) Box(
                Modifier.size(48.dp).clickable(role = Role.Button, onClick = onBack).semantics { contentDescription = ctx.getString(R.string.zc_mol_movil_volver) },
                contentAlignment = Alignment.Center,
            ) { Box(Modifier.size(40.dp).clip(RoundedCornerShape(ZcRadius.sm)), contentAlignment = Alignment.Center) { ZcIcon(ZcIcons.sAltArrowLeft, null) } }
            Column(Modifier.weight(1f).padding(start = 4.dp).semantics(mergeDescendants = true) { heading() }) {
                ZcText(title, style = ZcType.titleSm, weight = FontWeight.SemiBold)
                if (subtitle != null) ZcText(subtitle, style = ZcTextTw.xs, color = c.textMuted)
            }
            action?.invoke()
        }
        ZcDivider()
    }
}

data class ZcNavItem(val id: String, val label: String, @DrawableRes val icon: Int, @DrawableRes val iconActive: Int = icon, val badge: String? = null)

/**
 * Navegación inferior (zc-bottom-nav): 3 a 5 destinos con ícono de 20 y texto `tiny`; el activo en Bold y color de marca,
 * marcado como seleccionado (aria-current de la web). Margen inferior mínimo de 14 o el del sistema.
 */
@Composable
fun ZcBottomNav(items: List<ZcNavItem>, current: String?, onSelect: (String) -> Unit, modifier: Modifier = Modifier) {
    require(items.size in 3..5) { "ZcBottomNav lleva de 3 a 5 destinos" }
    val c = ZonacardsTheme.colors
    val haptic = rememberZcHaptics()
    Column(modifier.fillMaxWidth().background(c.surface)) {
        ZcDivider()
        Row(Modifier.fillMaxWidth().navigationBarsPadding().padding(bottom = 14.dp).selectableGroup()) {
            for (it in items) {
                val on = it.id == current
                Column(
                    Modifier.weight(1f).heightIn(min = 56.dp).selectable(on) { haptic(ZcHaptic.SELECTION); onSelect(it.id) }.padding(top = 8.dp, bottom = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp),
                ) {
                    Box {
                        ZcIcon(if (on) it.iconActive else it.icon, contentDescription = null, tint = if (on) c.primary else c.textMuted, size = 20.dp)
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

/** Banda bajo la barra superior (zc-system-banner): sin conexión o actualización disponible. TalkBack la anuncia. */
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

/** Aviso de sin conexión con cambios pendientes (zc-offline-banner): bloque con radio 8, texto de 14. */
@Composable
fun ZcOfflineBanner(pending: Int, modifier: Modifier = Modifier) {
    val c = ZonacardsTheme.colors
    Row(
        modifier.fillMaxWidth().clip(RoundedCornerShape(ZcRadius.sm)).background(c.text).semantics { liveRegion = LiveRegionMode.Polite }.padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        ZcIcon(ZcIcons.lWifiOff, null, size = 16.dp, tint = c.surface)
        ZcText(LocalContext.current.getString(R.string.zc_mol_offline_texto, pending.toString()), style = ZcTextTw.sm, color = c.surface, modifier = Modifier.weight(1f))
    }
}

enum class ZcStateKind { EMPTY, ERROR }

/** Detalles técnicos de un error para soporte (código, servicio, fecha). */
data class ZcTechDetails(val code: String, val service: String, val date: String)

/**
 * Estado de bloque (zc-state): borde punteado, ícono en recuadro de 44 con radio 16, qué pasó (título), por qué o qué se
 * conservó (texto), la acción para salir y luego la referencia. En errores, "Ver detalles técnicos" con "Copiar detalles".
 */
@Composable
fun ZcState(
    title: String,
    modifier: Modifier = Modifier,
    kind: ZcStateKind = ZcStateKind.EMPTY,
    @DrawableRes icon: Int = if (kind == ZcStateKind.ERROR) ZcIcons.sDangerTriangle else ZcIcons.sBox,
    text: String? = null,
    reference: String? = null,
    details: ZcTechDetails? = null,
    onCopied: (() -> Unit)? = null,
    action: (@Composable () -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val clipboard = LocalClipboardManager.current
    var open by remember { mutableStateOf(false) }
    Column(
        modifier.fillMaxWidth().drawBehind {
            drawRoundRect(c.borderStrong, cornerRadius = CornerRadius(ZcRadius.md.toPx()), style = Stroke(1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(6.dp.toPx(), 4.dp.toPx()))))
        }.padding(horizontal = 16.dp, vertical = 20.dp).semantics { if (kind == ZcStateKind.ERROR) liveRegion = LiveRegionMode.Assertive },
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(Modifier.size(44.dp).clip(RoundedCornerShape(16.dp)).background(if (kind == ZcStateKind.ERROR) c.dangerBg else c.surface2), contentAlignment = Alignment.Center) {
            ZcIcon(icon, contentDescription = null, size = 24.dp, tint = if (kind == ZcStateKind.ERROR) c.dangerFg else c.text)
        }
        Column(Modifier.semantics(mergeDescendants = true) { }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            ZcText(title, style = ZcType.titleSm, weight = FontWeight.SemiBold, textAlign = TextAlign.Center, modifier = Modifier.semantics { heading() })
            if (text != null) ZcText(text, style = ZcType.bodySm, color = c.textMuted, textAlign = TextAlign.Center)
        }
        action?.invoke()
        if (reference != null) ZcText("${ctx.getString(R.string.zc_comun_referencia)} $reference", style = ZcTextTw.xs, color = c.textMuted)
        if (details != null) {
            Row(
                Modifier.heightIn(min = 44.dp).clickable(role = Role.Button) { open = !open },
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                ZcText(ctx.getString(R.string.zc_org_ver_detalles_tecnicos), style = ZcTextTw.sm.copy(textDecoration = TextDecoration.Underline), color = c.textMuted)
                ZcIcon(ZcIcons.sAltArrowDown, null, size = 16.dp, tint = c.textMuted, modifier = Modifier.rotate(if (open) 180f else 0f))
            }
            if (open) Column(Modifier.fillMaxWidth().widthIn(max = 420.dp).clip(RoundedCornerShape(ZcRadius.sm)).background(c.surface2).padding(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                val rows = listOf(
                    ctx.getString(R.string.zc_comun_referencia) to (reference ?: "—"),
                    ctx.getString(R.string.zc_org_codigo) to details.code,
                    ctx.getString(R.string.zc_org_servicio) to details.service,
                    ctx.getString(R.string.zc_org_fecha) to details.date,
                )
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    for ((k, v) in rows) Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        ZcText(k, style = ZcType.caption, color = c.textMuted, modifier = Modifier.width(88.dp)); ZcText(v, style = ZcType.caption, modifier = Modifier.weight(1f))
                    }
                }
                ZcButton(ctx.getString(R.string.zc_org_copiar_detalles), {
                    clipboard.setText(AnnotatedString(rows.joinToString("\n") { "${it.first}: ${it.second}" }))
                    onCopied?.invoke()
                }, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM, leadingIcon = ZcIcons.lClipboardCopy)
            }
        }
    }
}

/**
 * Deslizar para actualizar (zc-pull-refresh): umbral de 60 (máximo 90); el indicador empuja el contenido y se queda en 48
 * mientras carga. TalkBack ofrece la acción "Actualizar" (no depende del gesto).
 */
@Composable
fun ZcPullRefresh(refreshing: Boolean, onRefresh: () -> Unit, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val ctx = LocalContext.current
    val density = LocalDensity.current
    val haptic = rememberZcHaptics()
    val threshold = with(density) { 60.dp.toPx() }
    val maxPull = with(density) { 90.dp.toPx() }
    var pull by remember { mutableFloatStateOf(0f) }
    val connection = remember(refreshing) {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                if (available.y < 0 && pull > 0) { val used = maxOf(available.y, -pull); pull += used; return Offset(0f, used) }
                return Offset.Zero
            }
            override fun onPostScroll(consumed: Offset, available: Offset, source: NestedScrollSource): Offset {
                if (refreshing || available.y <= 0 || source != NestedScrollSource.UserInput) return Offset.Zero
                val before = pull
                pull = (pull + available.y * 0.5f).coerceAtMost(maxPull)
                if (before < threshold && pull >= threshold) haptic(ZcHaptic.SELECTION)
                return Offset(0f, available.y)
            }
            override suspend fun onPreFling(available: Velocity): Velocity {
                if (pull >= threshold && !refreshing) onRefresh()
                pull = 0f
                return Velocity.Zero
            }
        }
    }
    val indicator = if (refreshing) 48.dp else with(density) { pull.toDp() }
    Column(
        modifier.nestedScroll(connection).semantics {
            customActions = listOf(CustomAccessibilityAction(ctx.getString(R.string.zc_ui_actualizar)) { onRefresh(); true })
            if (refreshing) stateDescription = ctx.getString(R.string.zc_ui_actualizando)
        },
    ) {
        if (indicator > 0.dp) Box(Modifier.fillMaxWidth().height(indicator), contentAlignment = Alignment.Center) {
            ZcSpinner(decorative = true, modifier = Modifier.alpha(if (refreshing) 1f else (pull / threshold).coerceIn(0f, 1f)))
        }
        Box(Modifier.weight(1f, fill = false)) { content() }
    }
}

/** Acción de menú o de deslizamiento. `disabledReason` explica por qué no se puede (se lee y se muestra). */
data class ZcAction(
    val id: String,
    val label: String,
    @DrawableRes val icon: Int? = null,
    val danger: Boolean = false,
    val description: String? = null,
    val disabledReason: String? = null,
    val checked: Boolean? = null,
    val separatorBefore: Boolean = false,
)

/**
 * Menú de acciones (zc-menu, kebab Bold): filas de 48 con ícono de 16 en muted (rojo si es destructiva), descripción,
 * marca de elegido, separadores y deshabilitadas con su motivo. Se abre en un bottom sheet (o subpantalla si ya está en uno).
 * `dense`: kebab de 36 visibles (toque 48).
 */
@Composable
fun ZcMenu(actions: List<ZcAction>, onAction: (String) -> Unit, label: String, modifier: Modifier = Modifier, dense: Boolean = false) {
    val host = LocalZcSubscreenHost.current
    var open by remember { mutableStateOf(false) }
    val list = @Composable { close: () -> Unit ->
        val c = ZonacardsTheme.colors
        Column(Modifier.padding(horizontal = 8.dp, vertical = 8.dp)) {
            for (a in actions) {
                if (a.separatorBefore) ZcDivider(Modifier.padding(vertical = 4.dp))
                val enabled = a.disabledReason == null
                Row(
                    Modifier.fillMaxWidth().heightIn(min = 48.dp).clip(RoundedCornerShape(ZcRadius.sm))
                        .clickable(enabled = enabled, role = Role.Button) { close(); onAction(a.id) }
                        .alpha(if (enabled) 1f else 0.45f).padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    if (a.icon != null) ZcIcon(a.icon, contentDescription = null, size = 16.dp, tint = if (a.danger) c.dangerFg else c.textMuted)
                    Column(Modifier.weight(1f)) {
                        ZcText(a.label, color = if (a.danger) c.dangerFg else c.text)
                        val sub = a.disabledReason ?: a.description
                        if (sub != null) ZcText(sub, style = ZcType.caption, color = c.textMuted)
                    }
                    if (a.checked == true) ZcIcon(ZcIcons.lCheck, contentDescription = null, size = 16.dp)
                }
            }
        }
    }
    Box(
        modifier.size(48.dp).clickable(role = Role.Button) { if (host != null) host.push(label) { list { host.pop() } } else open = true }
            .semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) {
        Box(Modifier.size(if (dense) 36.dp else 48.dp).clip(RoundedCornerShape(50)), contentAlignment = Alignment.Center) {
            ZcIcon(ZcIcons.sMenuDotsVerticalBold, contentDescription = null, size = 20.dp)
        }
    }
    if (open) ZcBottomSheet(onDismiss = { open = false }, title = label) { list { open = false } }
}

/**
 * Fila deslizable (zc-swipe-item): al deslizar a la izquierda más de 70 se abren las acciones en 152 (texto de 12).
 * Las mismas acciones están en el menú ⋮ (denso) y como acciones de TalkBack, así nadie depende del gesto.
 */
@Composable
fun ZcSwipeItem(actions: List<ZcAction>, onAction: (String) -> Unit, menuLabel: String, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    require(actions.size in 1..2) { "ZcSwipeItem muestra 1 o 2 acciones" }
    val c = ZonacardsTheme.colors
    val density = LocalDensity.current
    val haptic = rememberZcHaptics()
    val reveal = with(density) { 152.dp.toPx() }
    val openAt = with(density) { 70.dp.toPx() }
    val offset = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()
    fun settle(open: Boolean) = scope.launch { if (open && offset.value > -reveal) haptic(ZcHaptic.SELECTION); offset.animateTo(if (open) -reveal else 0f, tween(ZcMotion.base)) }
    // Alto = el de la fila (IntrinsicSize.Min): las acciones de fondo lo llenan sin estirar la fila a la pantalla.
    Box(modifier.fillMaxWidth().height(IntrinsicSize.Min).clip(RoundedCornerShape(ZcRadius.md)).background(c.surface2)) {
        Row(Modifier.align(Alignment.CenterEnd).width(152.dp).fillMaxHeight().clearAndSetSemantics { }) {
            for (a in actions) Column(
                Modifier.weight(1f).fillMaxHeight().background(if (a.danger) c.dangerFg else c.infoFg).clickable { settle(false); onAction(a.id) },
                horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterVertically),
            ) {
                if (a.icon != null) ZcIcon(a.icon, contentDescription = null, tint = c.surface)
                ZcText(a.label, style = ZcTextTw.xs, color = c.surface, textAlign = TextAlign.Center)
            }
        }
        Row(
            Modifier.fillMaxWidth().offset { IntOffset(offset.value.roundToInt(), 0) }
                .clip(RoundedCornerShape(ZcRadius.md)).background(c.surface).border(1.dp, c.border, RoundedCornerShape(ZcRadius.md))
                .draggable(
                    rememberDraggableState { d -> scope.launch { offset.snapTo((offset.value + d).coerceIn(-reveal, 0f)) } },
                    Orientation.Horizontal,
                    onDragStopped = { v -> settle(offset.value < -openAt || v < -1200f) },
                )
                .semantics { customActions = actions.map { a -> CustomAccessibilityAction(a.label) { onAction(a.id); true } } }
                .padding(start = 12.dp, top = 10.dp, bottom = 10.dp, end = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.weight(1f)) { content() }
            ZcMenu(actions, onAction, menuLabel, dense = true)
        }
    }
}
