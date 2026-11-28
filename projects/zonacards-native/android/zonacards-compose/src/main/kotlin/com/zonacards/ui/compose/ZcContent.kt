package com.zonacards.ui.compose

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.annotation.DrawableRes
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInParent
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcOpacity
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcMotion
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType
import kotlinx.coroutines.delay

// ---------- Alert ----------

enum class ZcAlertTone { INFO, SUCCESS, WARNING, DANGER }

/**
 * Aviso dentro de la página (zc-alert): no se cierra solo. Siempre ícono y título, nunca solo color. `DANGER` se anuncia de
 * inmediato (alert); el resto, con calma (status). Error de servidor de un formulario: `DANGER` al tope, con la referencia en el texto.
 * Las acciones van en `actions` (usa [ZcAlertAction]: botón outline pequeño).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ZcAlert(
    title: String,
    modifier: Modifier = Modifier,
    tone: ZcAlertTone = ZcAlertTone.INFO,
    text: String? = null,
    actions: (@Composable () -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val (icon, fg, bg, bd) = when (tone) {
        ZcAlertTone.INFO -> Look(ZcIcons.sInfoCircle, c.infoFg, c.infoBg, c.infoBd)
        ZcAlertTone.SUCCESS -> Look(ZcIcons.sCheckCircle, c.successFg, c.successBg, c.successBd)
        ZcAlertTone.WARNING -> Look(ZcIcons.sDangerTriangle, c.warningFg, c.warningBg, c.warningBd)
        ZcAlertTone.DANGER -> Look(ZcIcons.sCloseCircle, c.dangerFg, c.dangerBg, c.dangerBd)
    }
    val shape = RoundedCornerShape(ZcRadius.md)
    Row(
        modifier.fillMaxWidth().clip(shape).background(bg).border(1.dp, bd, shape).padding(16.dp)
            .semantics(mergeDescendants = true) { liveRegion = if (tone == ZcAlertTone.DANGER) LiveRegionMode.Assertive else LiveRegionMode.Polite },
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ZcIcon(icon, null, Modifier.padding(top = 2.dp), tint = fg)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            ZcText(title, style = ZcTextTw.base, weight = FontWeight.SemiBold, color = fg)
            if (text != null) ZcText(text, style = ZcTextTw.sm, color = fg)
            if (actions != null) FlowRow(Modifier.padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                CompositionLocalProvider(LocalZcContentColor provides c.text) { actions() }
            }
        }
    }
}

private data class Look(val icon: Int, val fg: Color, val bg: Color, val bd: Color)

/** Botón de acción de un [ZcAlert]: outline, pequeño. */
@Composable
fun ZcAlertAction(text: String, onClick: () -> Unit, modifier: Modifier = Modifier) =
    ZcButton(text, onClick, modifier, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM)

// ---------- Tabs ----------

data class ZcTab(val value: String, val label: String, @DrawableRes val icon: Int? = null, val count: Int? = null, val enabled: Boolean = true)

enum class ZcTabsVariant { LINE, SEGMENTED }

/**
 * Pestañas (zc-tabs). `LINE`: subrayado, con ícono y contador (secciones de una ficha, estados de una lista). `SEGMENTED`:
 * pastilla con fondo (alternar vistas o periodos, 2 a 4 opciones). Si no caben, se desplazan en horizontal (nunca saltan de línea)
 * y la elegida se trae a la vista; el indicador se desliza a la pestaña nueva. El contenido de cada panel lo arma quien llama.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ZcTabs(
    tabs: List<ZcTab>,
    selected: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    variant: ZcTabsVariant = ZcTabsVariant.LINE,
    label: String? = null,
) {
    val c = ZonacardsTheme.colors
    val haptic = rememberZcHaptics()
    val density = LocalDensity.current
    val line = variant == ZcTabsVariant.LINE
    val pos = remember { mutableStateMapOf<String, Pair<Int, Int>>() }
    val at = pos[selected]
    val x by animateDpAsState(with(density) { (at?.first ?: 0).toDp() }, tween(ZcMotion.base), label = "tabX")
    val w by animateDpAsState(with(density) { (at?.second ?: 0).toDp() }, tween(ZcMotion.base), label = "tabW")
    val pill = RoundedCornerShape(ZcRadius.full)
    val triggerH = if (line) ZcSize.target else ZcSize.target - 8.dp
    Box(
        modifier.fillMaxWidth().then(if (line) Modifier.drawBehind { drawLine(c.border, Offset(0f, size.height - 0.5.dp.toPx()), Offset(size.width, size.height - 0.5.dp.toPx()), 1.dp.toPx()) } else Modifier),
    ) {
        Box(Modifier.horizontalScroll(rememberScrollState())) {
            Box(
                Modifier.then(if (line) Modifier else Modifier.clip(pill).background(c.surface2).padding(4.dp))
                    .selectableGroup().then(if (label != null) Modifier.semantics { contentDescription = label } else Modifier),
            ) {
                if (at != null) {
                    if (line) Box(Modifier.align(Alignment.BottomStart).offset(x = x).width(w).height(2.dp).clip(pill).background(c.text))
                    else Box(Modifier.align(Alignment.CenterStart).offset(x = x).width(w).height(triggerH).shadow(1.dp, pill).clip(pill).background(c.surface))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(if (line) 20.dp else 4.dp)) {
                    tabs.forEach { t ->
                        val on = t.value == selected
                        val requester = remember { BringIntoViewRequester() }
                        LaunchedEffect(on) { if (on) requester.bringIntoView() }
                        Row(
                            Modifier.bringIntoViewRequester(requester)
                                .onGloballyPositioned { pos[t.value] = it.positionInParent().x.toInt() to it.size.width }
                                .heightIn(min = triggerH)
                                .then(if (line) Modifier else Modifier.clip(pill))
                                .selectable(on, enabled = t.enabled, role = Role.Tab) { if (!on) { haptic(ZcHaptic.SELECTION); onSelect(t.value) } }
                                .padding(horizontal = if (line) 2.dp else 16.dp)
                                .alpha(if (t.enabled) 1f else ZcOpacity.disabled),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            val color = if (on) c.text else c.textMuted
                            if (t.icon != null) ZcIcon(t.icon, null, size = 16.dp, tint = color)
                            ZcText(t.label, style = ZcType.body, weight = if (on) FontWeight.Medium else null, color = color, maxLines = 1)
                            if (t.count != null) Box(Modifier.height(20.dp).widthIn(min = 20.dp).clip(pill).background(c.primary).padding(horizontal = 6.dp), contentAlignment = Alignment.Center) {
                                ZcText("${t.count}", style = ZcTextTw.xs, weight = FontWeight.SemiBold, color = c.onPrimary)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ---------- Accordion ----------

data class ZcAccordionItem(
    val id: String,
    val title: String,
    val subtitle: String? = null,
    @DrawableRes val icon: Int? = null,
    val enabled: Boolean = true,
    /** Estado u otro dato a la derecha del título (se oculta en pantallas de menos de 400 dp). */
    val aside: (@Composable () -> Unit)? = null,
    val content: @Composable () -> Unit,
)

enum class ZcAccordionVariant { CARD, FLUSH }

/**
 * Acordeón (zc-accordion). `multiple = false`: uno abierto a la vez (preguntas frecuentes); `true`: varios (formularios largos
 * por secciones) y, con `label`, el botón "Expandir todo / Contraer todo". `FLUSH`: sin bordes laterales, dentro de paneles y drawers.
 */
@Composable
fun ZcAccordion(
    items: List<ZcAccordionItem>,
    modifier: Modifier = Modifier,
    multiple: Boolean = false,
    variant: ZcAccordionVariant = ZcAccordionVariant.CARD,
    label: String? = null,
    initiallyOpen: Set<String> = emptySet(),
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    var open by rememberSaveable { mutableStateOf<List<String>>(ArrayList(initiallyOpen)) }
    val enabled = items.filter { it.enabled }.map { it.id }
    val allOpen = enabled.isNotEmpty() && enabled.all { it in open }
    val flush = variant == ZcAccordionVariant.FLUSH
    fun toggle(id: String) { open = ArrayList(if (multiple) (if (id in open) open - id else open + id) else (if (id in open) emptyList() else listOf(id))) }
    val shape = RoundedCornerShape(ZcRadius.md)
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (label != null) Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            ZcText(label, Modifier.weight(1f, fill = false), style = ZcTextTw.sm, weight = FontWeight.Medium)
            if (multiple) Box(Modifier.heightIn(min = ZcSize.targetSm).clickable(role = Role.Button) { open = ArrayList(if (allOpen) emptyList() else enabled) }.padding(horizontal = 4.dp), contentAlignment = Alignment.Center) {
                ZcText(ctx.getString(if (allOpen) R.string.zc_ui_contraer_todo else R.string.zc_ui_expandir_todo), style = ZcType.caption.copy(textDecoration = TextDecoration.Underline), color = c.text)
            }
        }
        Column(
            Modifier.fillMaxWidth()
                .then(if (flush) Modifier.drawBehind {
                    drawLine(c.border, Offset(0f, 0.5.dp.toPx()), Offset(size.width, 0.5.dp.toPx()), 1.dp.toPx())
                    drawLine(c.border, Offset(0f, size.height - 0.5.dp.toPx()), Offset(size.width, size.height - 0.5.dp.toPx()), 1.dp.toPx())
                } else Modifier.clip(shape).background(c.surface).border(1.dp, c.border, shape)),
        ) {
            items.forEachIndexed { i, item ->
                if (i > 0) ZcDivider()
                AccordionRow(item, item.id in open, flush) { toggle(item.id) }
            }
        }
    }
}

@Composable
private fun AccordionRow(item: ZcAccordionItem, open: Boolean, flush: Boolean, onToggle: () -> Unit) {
    val c = ZonacardsTheme.colors
    val rotation by animateFloatAsState(if (open) 180f else 0f, tween(ZcMotion.base), label = "chevron")
    val padX = if (flush) 0.dp else 16.dp
    val wide = zcScreenWidth() >= 400.dp
    Column {
        Row(
            Modifier.fillMaxWidth().heightIn(min = ZcSize.target)
                .semantics { heading() }
                .clickable(enabled = item.enabled, role = Role.Button, onClick = onToggle)
                .semantics { if (open) collapse { onToggle(); true } else expand { onToggle(); true } }
                .padding(horizontal = padX, vertical = 12.dp).alpha(if (item.enabled) 1f else 0.55f),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (item.icon != null) Box(Modifier.size(36.dp).clip(RoundedCornerShape(ZcRadius.ms)).background(c.surface2), contentAlignment = Alignment.Center) { ZcIcon(item.icon, null, size = 16.dp, tint = c.text) }
            Column(Modifier.weight(1f)) {
                ZcText(item.title, style = ZcType.body, weight = FontWeight.Medium)
                if (!item.subtitle.isNullOrEmpty()) ZcText(item.subtitle, style = ZcType.caption, color = c.textMuted)
            }
            if (wide && item.aside != null) item.aside.invoke()
            ZcIcon(ZcIcons.sAltArrowDown, null, Modifier.rotate(rotation), size = 16.dp, tint = c.textMuted)
        }
        AnimatedVisibility(open, enter = expandVertically(tween(ZcMotion.base)), exit = shrinkVertically(tween(ZcMotion.base))) {
            Box(Modifier.fillMaxWidth().padding(start = padX, end = padX, bottom = 16.dp)) {
                CompositionLocalProvider(LocalZcContentColor provides c.textMuted) { item.content() }
            }
        }
    }
}

// ---------- Description list ----------

data class ZcDescription(val term: String, val value: String, /** Código de país: bandera antes del valor. */ val flag: String? = null)

enum class ZcDescriptionLayout { GRID, ROWS }

/**
 * Pares dato–valor de una ficha (zc-description-list). `GRID`: dos columnas desde 448 dp de ancho (una, si no caben); `ROWS`: una
 * por fila con el valor a la derecha (resúmenes, drawers). Los montos ya vienen formateados por quien llama.
 */
@Composable
fun ZcDescriptionList(items: List<ZcDescription>, modifier: Modifier = Modifier, layout: ZcDescriptionLayout = ZcDescriptionLayout.GRID) {
    val c = ZonacardsTheme.colors
    val tabular = ZcType.body.copy(fontFeatureSettings = "tnum")
    @Composable fun Value(it: ZcDescription, align: TextAlign = TextAlign.Start) = Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        if (it.flag != null) ZcFlagImage(it.flag)
        ZcText(it.value, Modifier.weight(1f, fill = false), style = tabular, weight = FontWeight.Medium, textAlign = align)
    }
    BoxWithConstraints(modifier.fillMaxWidth()) {
        val two = layout == ZcDescriptionLayout.GRID && maxWidth >= 448.dp
        if (layout == ZcDescriptionLayout.ROWS) Column {
            items.forEachIndexed { i, it ->
                Row(
                    Modifier.fillMaxWidth().then(if (i < items.lastIndex) Modifier.drawBehind { drawLine(c.border, Offset(0f, size.height - 0.5.dp.toPx()), Offset(size.width, size.height - 0.5.dp.toPx()), 1.dp.toPx()) } else Modifier)
                        .padding(vertical = 8.dp).clearAndSetSemantics { contentDescription = "${it.term}: ${it.value}" },
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    ZcText(it.term, Modifier.weight(1f, fill = false).padding(end = 16.dp), style = ZcType.caption, color = c.textMuted)
                    Box(Modifier.weight(1f, fill = false)) { Value(it, TextAlign.End) }
                }
            }
        } else {
            val cell = @Composable { it: ZcDescription, m: Modifier ->
                Column(m.clearAndSetSemantics { contentDescription = "${it.term}: ${it.value}" }) {
                    ZcText(it.term, style = ZcType.caption, color = c.textMuted)
                    Value(it)
                }
            }
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                if (two) items.chunked(2).forEach { pair ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                        cell(pair[0], Modifier.weight(1f))
                        if (pair.size > 1) cell(pair[1], Modifier.weight(1f)) else Spacer(Modifier.weight(1f))
                    }
                } else items.forEach { cell(it, Modifier.fillMaxWidth()) }
            }
        }
    }
}

// ---------- Timeline ----------

data class ZcTimelineItem(@DrawableRes val icon: Int, val title: String, /** Fecha, autor, detalle: una línea en gris. */ val meta: String? = null)

/** Historial vertical (zc-timeline): círculo con ícono, conector y título con su detalle. */
@Composable
fun ZcTimeline(items: List<ZcTimelineItem>, modifier: Modifier = Modifier, label: String? = null) {
    val c = ZonacardsTheme.colors
    Column(modifier.fillMaxWidth().then(if (label != null) Modifier.semantics { contentDescription = label } else Modifier)) {
        items.forEachIndexed { i, it ->
            val last = i == items.lastIndex
            Row(
                Modifier.fillMaxWidth()
                    .drawBehind { if (!last) drawLine(c.border, Offset(17.dp.toPx(), 40.dp.toPx()), Offset(17.dp.toPx(), size.height - 4.dp.toPx()), 2.dp.toPx()) }
                    .padding(bottom = 16.dp)
                    .clearAndSetSemantics { contentDescription = if (it.meta.isNullOrEmpty()) it.title else "${it.title}. ${it.meta}" },
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Box(Modifier.size(36.dp).clip(CircleShape).background(c.surface2), contentAlignment = Alignment.Center) { ZcIcon(it.icon, null, size = 16.dp, tint = c.text) }
                Column(Modifier.weight(1f).padding(top = 6.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    ZcText(it.title, style = ZcType.body, weight = FontWeight.Medium)
                    if (!it.meta.isNullOrEmpty()) ZcText(it.meta, style = ZcType.caption, color = c.textMuted)
                }
            }
        }
    }
}

// ---------- Copy button ----------

private enum class CopyState { IDLE, DONE, ERROR }

/**
 * Copia un texto al portapapeles (zc-copy-button). Solo ícono por defecto (con su nombre para TalkBack); `showText` muestra el texto.
 * Al copiar: check y "Copiado" durante 2 s, anunciado; si el sistema lo impide, "No se pudo copiar". Una clave secreta va enmascarada, no aquí.
 */
@Composable
fun ZcCopyButton(
    value: String,
    modifier: Modifier = Modifier,
    label: String? = null,
    showText: Boolean = false,
    variant: ZcButtonVariant = ZcButtonVariant.GHOST,
    onCopied: (String) -> Unit = {},
    onFailed: () -> Unit = {},
) {
    val ctx = LocalContext.current
    val view = LocalView.current
    val haptic = rememberZcHaptics()
    var state by remember { mutableStateOf(CopyState.IDLE) }
    fun text(s: CopyState) = ctx.getString(when (s) { CopyState.DONE -> R.string.zc_ui_copiado; CopyState.ERROR -> R.string.zc_ui_no_se_copio; CopyState.IDLE -> R.string.zc_ui_copiar })
    LaunchedEffect(state) { if (state != CopyState.IDLE) { delay(2000); state = CopyState.IDLE } }
    val copy = {
        val next = try {
            (ctx.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText(label ?: text(CopyState.IDLE), value))
            haptic(ZcHaptic.CONFIRM); onCopied(value); CopyState.DONE
        } catch (e: Exception) { haptic(ZcHaptic.REJECT); onFailed(); CopyState.ERROR }
        state = next
        view.announceForAccessibility(text(next))
    }
    val icon = when (state) { CopyState.DONE -> ZcIcons.lCheck; CopyState.ERROR -> ZcIcons.sDangerCircle; CopyState.IDLE -> ZcIcons.sCopy }
    if (showText) ZcButton(text(state), copy, modifier, variant = variant, size = ZcButtonSize.SM, leadingIcon = icon)
    else ZcIconButton(icon, if (state == CopyState.IDLE) label ?: text(CopyState.IDLE) else text(state), copy, modifier, variant = variant, small = true)
}

// ---------- Error page ----------

/**
 * Página de error (zc-error-page): 404, 403, 500, 503, sin conexión y sesión expirada. Qué pasó, qué se conservó y qué hacer;
 * nunca solo un código. La referencia, solo cuando soporte la necesita (500, 404).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ZcErrorPage(
    title: String,
    text: String,
    @DrawableRes icon: Int,
    modifier: Modifier = Modifier,
    code: String? = null,
    reference: String? = null,
    actions: (@Composable () -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val shape = RoundedCornerShape(ZcRadius.md)
    Box(modifier.fillMaxWidth().clip(shape).background(c.bg).border(1.dp, c.border, shape)) {
        if (code != null) ZcText(code, Modifier.align(Alignment.TopStart).padding(top = 10.dp, start = 12.dp), style = ZcTextTw.xs.copy(fontFeatureSettings = "tnum"), color = c.textSubtle)
        Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(Modifier.size(56.dp).clip(RoundedCornerShape(ZcRadius.md)).background(c.surface2), contentAlignment = Alignment.Center) { ZcIcon(icon, null, size = 24.dp, tint = c.text) }
            ZcText(title, Modifier.semantics { heading() }, style = ZcTextTw.base.copy(lineHeight = ZcType.body.lineHeight), weight = FontWeight.SemiBold, textAlign = TextAlign.Center)
            ZcText(text, Modifier.widthIn(max = 280.dp), style = ZcType.caption, color = c.textMuted, textAlign = TextAlign.Center)
            if (actions != null) FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally), verticalArrangement = Arrangement.spacedBy(8.dp)) { actions() }
            if (reference != null) ZcText("${ctx.getString(R.string.zc_comun_referencia)} $reference", style = ZcTextTw.xs.copy(fontFeatureSettings = "tnum"), color = c.textMuted)
        }
    }
}

// ---------- Bullet ----------

/**
 * Medidor de stock (zc-bullet): franjas bajo el mínimo (peligro), rango sano (éxito) y sobre el máximo (aviso); la barra es el valor
 * y la marca, el punto de pedido. Los textos (cabecera y leyenda) los pone quien lo usa; el medidor se anuncia con `label`.
 * `scale` es el fin de la escala (por defecto 1,25 × máximo).
 */
@Composable
fun ZcBullet(
    value: Double,
    min: Double,
    max: Double,
    label: String,
    modifier: Modifier = Modifier,
    reorder: Double? = null,
    scale: Double? = null,
    head: (@Composable ColumnScope.() -> Unit)? = null,
    legend: (@Composable ColumnScope.() -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val end = scale ?: (max * 1.25)
    fun p(v: Double) = ((v / end) * 100).coerceIn(0.0, 100.0).toFloat() / 100f
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        head?.invoke(this)
        Box(
            Modifier.fillMaxWidth().height(14.dp)
                .drawBehind {
                    val r = ZcRadius.xs.toPx()
                    val clip = Path().apply { addRoundRect(RoundRect(Rect(0f, 0f, size.width, size.height), CornerRadius(r))) }
                    clipPath(clip) {
                        val a = size.width * p(min); val b = size.width * p(max)
                        drawRect(c.dangerBg, Offset(0f, 0f), Size(a, size.height))
                        drawRect(c.successBg, Offset(a, 0f), Size(b - a, size.height))
                        drawRect(c.warningBg, Offset(b, 0f), Size(size.width - b, size.height))
                    }
                    val inner = size.width - 2.dp.toPx()
                    val barW = inner * p(value)
                    if (barW > 0f) drawRoundRect(c.text, Offset(1.dp.toPx(), 4.dp.toPx()), Size(barW, size.height - 8.dp.toPx()), CornerRadius(2.dp.toPx()))
                    if (reorder != null) drawRect(c.text, Offset(1.dp.toPx() + inner * p(reorder), -4.dp.toPx()), Size(2.dp.toPx(), size.height + 8.dp.toPx()))
                }
                .border(1.dp, c.border, RoundedCornerShape(ZcRadius.xs))
                .clearAndSetSemantics { contentDescription = label; role = Role.Image },
        )
        legend?.invoke(this)
    }
}
