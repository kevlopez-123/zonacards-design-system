package com.zonacards.ui.compose

import androidx.activity.compose.BackHandler
import androidx.annotation.DrawableRes
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcMotion
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType

/**
 * Tramos de ancho de la pantalla. Plantillas, encabezado, subnav y grilla del panel usan el ancho de la ventana (como los
 * breakpoints de la web); la grilla adaptable y lista/detalle, el del contenedor (como auto-fit y zc-split).
 * Navegación: teléfono < 600 (barra inferior), riel 600–1279, menú lateral ≥ 1280
 * (como zc-sidebar). Plantillas y grillas usan los cortes de la web: 768 y 1024.
 */
enum class ZcWidthClass { PHONE, TABLET, DESKTOP }

/** Ancho disponible del contenedor actual (lo provee ZcAppScaffold; fuera de él, el de la pantalla). */
val LocalZcContentWidth = compositionLocalOf<Dp?> { null }

@Composable
fun zcScreenWidth(): Dp = androidx.compose.ui.platform.LocalConfiguration.current.screenWidthDp.dp

fun zcWidthClass(w: Dp) = when { w < 600.dp -> ZcWidthClass.PHONE; w < 1280.dp -> ZcWidthClass.TABLET; else -> ZcWidthClass.DESKTOP }

data class ZcNavChild(val id: String, val label: String)
data class ZcNavEntry(val id: String, val label: String, @DrawableRes val icon: Int, @DrawableRes val activeIcon: Int = icon, val short: String? = null, val children: List<ZcNavChild> = emptyList(), val badge: String? = null)
data class ZcNavGroup(val label: String?, val items: List<ZcNavEntry>)

/**
 * Riel de navegación (zc-sidebar en modo riel): 76 de ancho, ítems en columna de alto mínimo 56 con ícono y etiqueta corta de
 * 11; el activo con fondo `surface-2` e ícono Bold. Los grupos se separan con una línea. Para tablets.
 */
@Composable
fun ZcNavRail(groups: List<ZcNavGroup>, current: String?, onSelect: (String) -> Unit, modifier: Modifier = Modifier, header: (@Composable () -> Unit)? = null) {
    val c = ZonacardsTheme.colors
    val haptic = rememberZcHaptics()
    val ctx = LocalContext.current
    Column(
        modifier.width(76.dp).fillMaxHeight().background(c.sidebarBg).verticalScroll(rememberScrollState()).navigationBarsPadding()
            .semantics { contentDescription = ctx.getString(R.string.zc_org_nav) }.padding(8.dp).selectableGroup(),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        header?.invoke()
        groups.forEachIndexed { gi, g ->
            if (gi > 0) Box(Modifier.padding(horizontal = 12.dp, vertical = 6.dp).fillMaxWidth().height(1.dp).background(c.sidebarBorder))
            for (it in g.items) {
                val on = it.id == current || it.children.any { ch -> ch.id == current }
                Column(
                    Modifier.fillMaxWidth().heightIn(min = 56.dp).clip(RoundedCornerShape(ZcRadius.sm)).background(if (on) c.sidebarActiveBg else c.sidebarBg)
                        .selectable(on) { haptic(ZcHaptic.SELECTION); onSelect(it.children.firstOrNull()?.id ?: it.id) }
                        .semantics { contentDescription = it.label }.padding(horizontal = 6.dp, vertical = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp, Alignment.CenterVertically),
                ) {
                    ZcIcon(if (on) it.activeIcon else it.icon, null, tint = if (on) c.sidebarFgActive else c.sidebarFg)
                    ZcText(it.short ?: it.label, style = ZcType.tiny.copy(lineHeight = ZcType.tiny.fontSize * 1.27f), weight = if (on) ZcWeight.medium else null, color = if (on) c.sidebarFgActive else c.sidebarFg, maxLines = 1, modifier = Modifier.clearAndSetSemantics { })
                }
            }
        }
    }
    Box(Modifier.width(1.dp).fillMaxHeight().background(c.sidebarBorder))
}

/**
 * Menú lateral expandido (zc-sidebar desde 1280): 264 de ancho, títulos de grupo, ítems de 48 con ícono y etiqueta, padres con
 * hijos que se abren (chevron que gira) y pie con "Contraer menú" (pasa a riel; la preferencia se recuerda).
 */
@Composable
fun ZcSidebar(groups: List<ZcNavGroup>, current: String?, onSelect: (String) -> Unit, onCollapse: (() -> Unit)?, modifier: Modifier = Modifier, header: (@Composable () -> Unit)? = null) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val haptic = rememberZcHaptics()
    val open = remember { mutableStateOf(groups.flatMap { g -> g.items.filter { it.children.any { ch -> ch.id == current } }.map { it.id } }.toSet()) }
    Row(modifier.fillMaxHeight()) {
        Column(Modifier.width(264.dp).fillMaxHeight().background(c.sidebarBg).navigationBarsPadding().semantics { contentDescription = ctx.getString(R.string.zc_org_nav) }) {
            header?.invoke()
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(8.dp).selectableGroup(), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                groups.forEachIndexed { gi, g ->
                    if (g.label != null) ZcText(g.label, style = ZcType.caption, weight = ZcWeight.semibold, color = c.sidebarFg, modifier = Modifier.padding(start = 12.dp, end = 12.dp, top = if (gi == 0) 4.dp else 16.dp, bottom = 4.dp).semantics { heading() })
                    for (it in g.items) {
                        val hasKids = it.children.isNotEmpty()
                        val on = it.id == current
                        val expanded = it.id in open.value
                        val turn by animateDpAsState(if (expanded) 1.dp else 0.dp, tween(ZcMotion.base), label = "chev")
                        Row(
                            Modifier.fillMaxWidth().heightIn(min = 48.dp).clip(RoundedCornerShape(ZcRadius.sm)).background(if (on) c.sidebarActiveBg else c.sidebarBg)
                                .then(if (hasKids) Modifier.clickable(role = Role.Button) { open.value = if (expanded) open.value - it.id else open.value + it.id }.semantics { stateDescription = if (expanded) "expandido" else "contraído" }
                                else Modifier.selectable(on) { haptic(ZcHaptic.SELECTION); onSelect(it.id) })
                                .padding(horizontal = 12.dp),
                            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            ZcIcon(if (on) it.activeIcon else it.icon, null, tint = if (on) c.sidebarFgActive else c.sidebarFg)
                            ZcText(it.label, style = ZcType.bodySm, weight = if (on) ZcWeight.medium else null, color = if (on) c.sidebarFgActive else c.sidebarFg, modifier = Modifier.weight(1f))
                            if (hasKids) ZcIcon(ZcIcons.sAltArrowDown, null, size = 16.dp, tint = c.sidebarFg, modifier = Modifier.rotate(if (turn > 0.5.dp) 180f else 0f))
                        }
                        if (hasKids && expanded) Column(Modifier.padding(start = 32.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            for (ch in it.children) {
                                val chOn = ch.id == current
                                Box(
                                    Modifier.fillMaxWidth().heightIn(min = 48.dp).clip(RoundedCornerShape(ZcRadius.sm)).background(if (chOn) c.sidebarActiveBg else c.sidebarBg)
                                        .selectable(chOn) { haptic(ZcHaptic.SELECTION); onSelect(ch.id) }.padding(horizontal = 12.dp),
                                    contentAlignment = Alignment.CenterStart,
                                ) { ZcText(ch.label, style = ZcTextTw.sm, weight = if (chOn) ZcWeight.medium else null, color = if (chOn) c.sidebarFgActive else c.sidebarFg) }
                            }
                        }
                    }
                }
            }
            if (onCollapse != null) Column {
                Box(Modifier.fillMaxWidth().height(1.dp).background(c.sidebarBorder))
                Row(
                    Modifier.padding(8.dp).fillMaxWidth().heightIn(min = 48.dp).clip(RoundedCornerShape(ZcRadius.sm)).clickable(role = Role.Button, onClick = onCollapse).padding(horizontal = 12.dp),
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    ZcIcon(ZcIcons.lPanelLeftClose, null, tint = c.sidebarFg)
                    ZcText(ctx.getString(R.string.zc_org_contraer), style = ZcType.bodySm, color = c.sidebarFg)
                }
            }
        }
        Box(Modifier.width(1.dp).fillMaxHeight().background(c.sidebarBorder))
    }
}

/**
 * Esqueleto de app adaptable: barra superior arriba y navegación según el ancho: barra inferior en teléfono (< 600), riel en
 * tablet (600–1279) y menú lateral desde 1280 (con "Contraer menú" que pasa a riel). El contenido se centra con ancho máximo
 * de 1200 y márgenes de 16 (32 desde 768), como el shell de la web. En el teléfono solo van los destinos principales (3 a 5).
 */
@Composable
fun ZcAppScaffold(
    groups: List<ZcNavGroup>,
    current: String?,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    topBar: (@Composable () -> Unit)? = null,
    phoneItems: List<ZcNavEntry> = groups.flatMap { it.items }.take(5),
    content: @Composable () -> Unit,
) {
    val c = ZonacardsTheme.colors
    BoxWithConstraints(modifier.fillMaxSize().background(c.bg)) {
        val cls = zcWidthClass(maxWidth)
        var collapsed by rememberSaveable { mutableStateOf(false) }
        val body = @Composable { navWidth: Dp ->
            Column(Modifier.fillMaxSize()) {
                topBar?.invoke()
                BoxWithConstraints(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.TopCenter) {
                    val pad = if (maxWidth >= 768.dp) 32.dp else 16.dp
                    CompositionLocalProvider(LocalZcContentWidth provides minOf(maxWidth, 1200.dp) - pad * 2) {
                        Box(Modifier.widthIn(max = 1200.dp).fillMaxWidth().padding(horizontal = pad)) { content() }
                    }
                }
            }
        }
        when {
            cls == ZcWidthClass.PHONE -> Column(Modifier.fillMaxSize()) {
                Box(Modifier.weight(1f)) { body(0.dp) }
                if (phoneItems.size >= 3) ZcBottomNav(phoneItems.take(5).map { ZcNavItem(it.id, it.short ?: it.label, it.icon, it.activeIcon, it.badge) }, current, onSelect)
            }
            cls == ZcWidthClass.DESKTOP && !collapsed -> Row(Modifier.fillMaxSize()) {
                ZcSidebar(groups, current, onSelect, onCollapse = { collapsed = true })
                Box(Modifier.weight(1f)) { body(264.dp) }
            }
            else -> Row(Modifier.fillMaxSize()) {
                ZcNavRail(groups, current, onSelect, header = if (cls == ZcWidthClass.DESKTOP) ({ ZcIconButton(ZcIcons.lPanelLeftOpen, LocalContext.current.getString(R.string.zc_org_expandir), { collapsed = false }) }) else null)
                Box(Modifier.weight(1f)) { body(76.dp) }
            }
        }
    }
}

/**
 * Grilla que se adapta al ancho como `repeat(auto-fit, minmax(min, 1fr))` de la web: tantas columnas como quepan de `min`
 * (128 para KPI, 168 para montos largos, 288 para tarjetas), gap 12; las celdas de la última fila conservan su ancho.
 */
@Composable
fun <T> ZcAdaptiveGrid(items: List<T>, modifier: Modifier = Modifier, minCell: Dp = 128.dp, gap: Dp = 12.dp, cell: @Composable (T) -> Unit) {
    BoxWithConstraints(modifier.fillMaxWidth()) {
        val cols = maxOf(1, ((maxWidth + gap) / (minCell + gap)).toInt()).coerceAtMost(maxOf(1, items.size))
        Column(verticalArrangement = Arrangement.spacedBy(gap)) {
            for (row in items.chunked(cols)) EqualHeightRow(List(cols) { 1f }, gap) { i -> if (i < row.size) cell(row[i]) }
        }
    }
}

/**
 * Encabezado de página (zc-page-header): título 24/32 semibold, subtítulo 14 muted (anunciado al cambiar), `lead` (avatar o
 * logo) y `meta` (chips). Acciones: a la derecha desde 768; en teléfono, debajo y a todo el ancho (botones iguales).
 */
@Composable
fun ZcPageHeader(title: String, modifier: Modifier = Modifier, subtitle: String? = null, lead: (@Composable () -> Unit)? = null, meta: (@Composable RowScope.() -> Unit)? = null, actions: (@Composable RowScope.() -> Unit)? = null) {
    val c = ZonacardsTheme.colors
    BoxWithConstraints(modifier.fillMaxWidth()) {
        // Como la web (md:), por el ancho de la ventana, no del contenedor.
        val wide = zcScreenWidth() >= 768.dp
        val titleBlock = @Composable { m: Modifier ->
            Row(m, horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                lead?.invoke()
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    ZcText(title, style = ZcTextTw.x2l, weight = ZcWeight.semibold, modifier = Modifier.semantics { heading() })
                    if (subtitle != null) ZcText(subtitle, style = ZcTextTw.sm.merge(Tabular), color = c.textMuted, modifier = Modifier.semantics { liveRegion = androidx.compose.ui.semantics.LiveRegionMode.Polite })
                    if (meta != null) Row(Modifier.padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), content = meta)
                }
            }
        }
        if (wide) Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            titleBlock(Modifier.weight(1f))
            if (actions != null) Row(horizontalArrangement = Arrangement.spacedBy(8.dp), content = actions)
        } else Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            titleBlock(Modifier)
            if (actions != null) Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), content = actions)
        }
    }
}

/** Botón de acción del encabezado: en teléfono ocupa su parte del ancho; desde 768, su ancho natural. */
@Composable
fun RowScope.ZcHeaderAction(text: String, onClick: () -> Unit, variant: ZcButtonVariant = ZcButtonVariant.PRIMARY, @DrawableRes icon: Int? = null) {
    val w = zcScreenWidth()
    ZcButton(text, onClick, if (w < 768.dp) Modifier.weight(1f) else Modifier, variant = variant, leadingIcon = icon, block = w < 768.dp)
}

/** Columna de página con desplazamiento y gap de 24 (16 en teléfono). */
@Composable
private fun PageColumn(modifier: Modifier, content: @Composable ColumnScope.() -> Unit) {
    BoxWithConstraints(modifier.fillMaxSize()) {
        val gap = if (zcScreenWidth() < 768.dp) 16.dp else 24.dp
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(vertical = 24.dp), verticalArrangement = Arrangement.spacedBy(gap), content = content)
    }
}

/** Plantilla de listado (zc-list-page): encabezado → KPI (grilla adaptable) → filtros → contenido → pie (paginador a la derecha). */
@Composable
fun ZcListPage(
    header: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    kpis: (@Composable () -> Unit)? = null,
    filters: (@Composable () -> Unit)? = null,
    footer: (@Composable RowScope.() -> Unit)? = null,
    content: @Composable () -> Unit,
) = PageColumn(modifier) {
    header(); kpis?.invoke(); filters?.invoke(); content()
    if (footer != null) Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End), verticalAlignment = Alignment.CenterVertically, content = footer)
}

/** Plantilla de ficha (zc-detail-page): encabezado → pestañas → contenido y, desde 1024, columna lateral (2/3 y 1/3); antes, debajo. */
@Composable
fun ZcDetailPage(
    header: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    tabs: (@Composable () -> Unit)? = null,
    aside: (@Composable ColumnScope.() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) = PageColumn(modifier) {
    header(); tabs?.invoke()
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        if (aside != null && zcScreenWidth() >= 1024.dp) Row(horizontalArrangement = Arrangement.spacedBy(24.dp), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(2f), verticalArrangement = Arrangement.spacedBy(24.dp), content = content)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(16.dp), content = aside)
        } else Column(verticalArrangement = Arrangement.spacedBy(24.dp)) {
            content()
            if (aside != null) Column(verticalArrangement = Arrangement.spacedBy(16.dp), content = aside)
        }
    }
}

/**
 * Plantilla de formulario (zc-form-page): ancho máximo 880 centrado, encabezado → pasos → secciones; acciones en un pie fijo
 * al fondo con borde superior, alineadas a la derecha (en teléfono, a todo el ancho con fondo `surface`).
 */
@Composable
fun ZcFormPage(
    header: @Composable () -> Unit,
    actions: @Composable RowScope.() -> Unit,
    modifier: Modifier = Modifier,
    steps: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = ZonacardsTheme.colors
    BoxWithConstraints(modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
        val phone = zcScreenWidth() < 768.dp
        Column(Modifier.widthIn(max = 880.dp).fillMaxSize()) {
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(vertical = 24.dp), verticalArrangement = Arrangement.spacedBy(24.dp)) {
                header(); steps?.invoke(); content()
            }
            Column(Modifier.fillMaxWidth().background(if (phone) c.surface else c.bg).navigationBarsPadding()) {
                ZcDivider()
                Row(Modifier.fillMaxWidth().padding(vertical = 12.dp, horizontal = if (phone) 0.dp else 0.dp), horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.End), verticalAlignment = Alignment.CenterVertically, content = actions)
            }
        }
    }
}

/** Plantilla de panel (zc-dashboard-page): encabezado → KPI → gráficos (2 columnas desde 1024, gap 16) → alertas a todo el ancho. */
@Composable
fun ZcDashboardPage(
    header: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    kpis: (@Composable () -> Unit)? = null,
    charts: List<@Composable () -> Unit> = emptyList(),
    aside: (@Composable ColumnScope.() -> Unit)? = null,
) = PageColumn(modifier) {
    header(); kpis?.invoke()
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        val cols = if (zcScreenWidth() >= 1024.dp) 2 else 1
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            for (row in charts.chunked(cols)) Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.Top) {
                for (ch in row) Box(Modifier.weight(1f)) { ch() }
                repeat(cols - row.size) { Box(Modifier.weight(1f)) }
            }
        }
    }
    if (aside != null) Column(verticalArrangement = Arrangement.spacedBy(16.dp), content = aside)
}

/** Widget del panel (zc-dashboard-grid): ancho de 1, 2 o 4 columnas. */
data class ZcWidget(val id: String, val title: String, @DrawableRes val icon: Int, val span: Int = 1)

/**
 * Grilla del panel (zc-dashboard-grid): 1 columna en teléfono, 2 desde 768 y 4 desde 1024; cada widget ocupa 1, 2 o 4
 * columnas (limitado a las disponibles) y las filas se llenan. Widget: radio 16, borde, padding 16, alto mínimo 132,
 * título con ícono en caja de 32 y `action` a la derecha.
 */
@Composable
fun ZcDashboardGrid(widgets: List<ZcWidget>, modifier: Modifier = Modifier, action: (@Composable (ZcWidget) -> Unit)? = null, body: @Composable (ZcWidget, Int) -> Unit) {
    val c = ZonacardsTheme.colors
    BoxWithConstraints(modifier.fillMaxWidth()) {
        val cols = zcScreenWidth().let { w -> when { w >= 1024.dp -> 4; w >= 768.dp -> 2; else -> 1 } }
        // Reparte en filas sin pasarse de las columnas.
        val rows = mutableListOf<MutableList<Pair<ZcWidget, Int>>>()
        var used = cols
        for (w in widgets) {
            val span = minOf(w.span, cols)
            if (used + span > cols) { rows += mutableListOf<Pair<ZcWidget, Int>>(); used = 0 }
            rows.last() += w to span; used += span
        }
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            for (row in rows) EqualHeightRow(row.map { it.second.toFloat() }, 12.dp) { i ->
                val (w, span) = row[i]
                Column(
                    Modifier.fillMaxSize().heightIn(min = 132.dp).clip(RoundedCornerShape(ZcRadius.md)).background(c.surface)
                        .border(1.dp, c.border, RoundedCornerShape(ZcRadius.md)).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(Modifier.size(32.dp).clip(RoundedCornerShape(ZcRadius.sm)).background(c.surface2), contentAlignment = Alignment.Center) { ZcIcon(w.icon, null, size = 16.dp) }
                        ZcText(w.title, style = ZcType.bodySm, weight = ZcWeight.semibold, modifier = Modifier.weight(1f).semantics { heading() })
                        action?.invoke(w)
                    }
                    body(w, span)
                }
            }
        }
    }
}

/**
 * Lista y detalle (zc-split): desde 768 dos paneles lado a lado con separador arrastrable (40 % por defecto, entre 20 y 80;
 * TalkBack lo ajusta como control de valor). En teléfono se apilan: la lista, y al elegir, el detalle con "Volver" (y Atrás).
 */
@Composable
fun ZcListDetail(
    selected: String?,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    detailTitle: String? = null,
    initial: Float = 0.4f,
    list: @Composable () -> Unit,
    detail: @Composable (String) -> Unit,
    empty: @Composable () -> Unit = {},
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    BoxWithConstraints(modifier.fillMaxSize()) {
        if (maxWidth < 768.dp) {
            BackHandler(enabled = selected != null, onBack = onBack)
            if (selected == null) list() else Column(Modifier.fillMaxSize()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ZcIconButton(ZcIcons.sAltArrowLeft, ctx.getString(R.string.zc_ui_volver), onBack)
                    if (detailTitle != null) ZcText(detailTitle, style = ZcType.titleSm, weight = ZcWeight.semibold, modifier = Modifier.semantics { heading() })
                }
                Box(Modifier.weight(1f)) { detail(selected) }
            }
            return@BoxWithConstraints
        }
        var ratio by rememberSaveable { mutableFloatStateOf(initial) }
        val total = with(LocalDensity.current) { maxWidth.toPx() }
        Row(Modifier.fillMaxSize()) {
            Box(Modifier.weight(ratio).fillMaxHeight()) { list() }
            Box(
                Modifier.width(16.dp).fillMaxHeight()
                    .draggable(rememberDraggableState { d -> ratio = (ratio + d / total).coerceIn(0.2f, 0.8f) }, Orientation.Horizontal)
                    .semantics {
                        contentDescription = ctx.getString(R.string.zc_mol_split_separador)
                        progressBarRangeInfo = ProgressBarRangeInfo(ratio, 0.2f..0.8f)
                        setProgress { v -> ratio = v.coerceIn(0.2f, 0.8f); true }
                    },
                contentAlignment = Alignment.Center,
            ) { Box(Modifier.width(1.dp).fillMaxHeight().background(c.border)); Box(Modifier.size(4.dp, 32.dp).clip(RoundedCornerShape(50)).background(c.borderStrong)) }
            Box(Modifier.weight(1f - ratio).fillMaxHeight().semantics { if (detailTitle != null) paneTitle = detailTitle }) { if (selected != null) detail(selected) else empty() }
        }
    }
}

data class ZcSubnavItem(val id: String, val label: String, @DrawableRes val icon: Int? = null)

/**
 * Navegación secundaria de configuración (zc-subnav): desde 768 una columna (encabezado en mayúsculas, filas de 44, la activa
 * con `surface-2`); en teléfono, pestañas con desplazamiento horizontal y subrayado de 2 en la activa.
 */
@Composable
fun ZcSubnav(items: List<ZcSubnavItem>, current: String?, onSelect: (String) -> Unit, label: String, modifier: Modifier = Modifier) {
    val c = ZonacardsTheme.colors
    BoxWithConstraints(modifier.semantics { contentDescription = label }) {
        if (zcScreenWidth() >= 768.dp) Column(Modifier.selectableGroup(), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            ZcText(label.uppercase(), style = ZcTextTw.xs.copy(letterSpacing = ZcTextTw.xs.fontSize * 0.04f), weight = ZcWeight.semibold, color = c.textMuted, modifier = Modifier.padding(start = 12.dp, end = 12.dp, top = 4.dp, bottom = 8.dp).clearAndSetSemantics { })
            for (it in items) {
                val on = it.id == current
                Row(
                    Modifier.fillMaxWidth().heightIn(min = 44.dp).clip(RoundedCornerShape(ZcRadius.sm)).background(if (on) c.surface2 else c.bg).selectable(on) { onSelect(it.id) }.padding(horizontal = 12.dp),
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    if (it.icon != null) ZcIcon(it.icon, null, size = 16.dp, tint = if (on) c.text else c.textMuted)
                    ZcText(it.label, style = ZcType.bodySm, weight = if (on) ZcWeight.medium else null, color = if (on) c.text else c.textMuted)
                }
            }
        } else Column {
            Row(Modifier.horizontalScroll(rememberScrollState()).selectableGroup()) {
                for (it in items) {
                    val on = it.id == current
                    Column(Modifier.heightIn(min = 48.dp).selectable(on, role = Role.Tab) { onSelect(it.id) }.padding(horizontal = 12.dp), verticalArrangement = Arrangement.Bottom) {
                        Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (it.icon != null) ZcIcon(it.icon, null, size = 16.dp, tint = if (on) c.text else c.textMuted)
                            ZcText(it.label, style = ZcType.bodySm, weight = if (on) ZcWeight.medium else null, color = if (on) c.text else c.textMuted, maxLines = 1)
                        }
                        Box(Modifier.fillMaxWidth().height(2.dp).background(if (on) c.text else androidx.compose.ui.graphics.Color.Transparent))
                    }
                }
            }
            ZcDivider()
        }
    }
}


/**
 * Fila de celdas del mismo alto (como una fila de CSS grid) sin medidas intrínsecas: mide cada celda, toma el alto mayor y
 * vuelve a componerlas con ese alto. Funciona con contenido que mide su propio ancho (KPI, montos), que con IntrinsicSize falla.
 */
@Composable
internal fun EqualHeightRow(weights: List<Float>, gap: Dp, modifier: Modifier = Modifier, cell: @Composable (Int) -> Unit) {
    androidx.compose.ui.layout.SubcomposeLayout(modifier.fillMaxWidth()) { cons ->
        val g = gap.roundToPx()
        val total = weights.sum()
        val free = cons.maxWidth - g * (weights.size - 1)
        val widths = weights.map { (free * it / total).toInt() }
        val probe = widths.mapIndexed { i, w -> subcompose("p$i") { cell(i) }.map { it.measure(androidx.compose.ui.unit.Constraints(minWidth = w, maxWidth = w)) } }
        val h = probe.maxOf { ps -> ps.maxOfOrNull { it.height } ?: 0 }
        val placed = widths.mapIndexed { i, w -> subcompose("c$i") { cell(i) }.map { it.measure(androidx.compose.ui.unit.Constraints.fixed(w, h)) } }
        layout(cons.maxWidth, h) {
            var x = 0
            placed.forEachIndexed { i, ps -> ps.forEach { it.place(x, 0) }; x += widths[i] + g }
        }
    }
}
