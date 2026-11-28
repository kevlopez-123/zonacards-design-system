package com.zonacards.ui.compose

import androidx.annotation.DrawableRes
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.selection.toggleable
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.invisibleToUser
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcOpacity
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcType

/** Tono semántico de estados y badges: siempre con ícono + texto, nunca solo color. */
enum class ZcTone { SUCCESS, WARNING, DANGER, INFO, ACCENT, NEUTRAL;
    companion object { fun of(key: String) = entries.firstOrNull { it.name.equals(key, true) } ?: NEUTRAL }
}

internal data class ToneColors(val bg: Color, val fg: Color, val border: Color)

@Composable
internal fun toneColors(tone: ZcTone): ToneColors {
    val c = ZonacardsTheme.colors
    return when (tone) {
        ZcTone.SUCCESS -> ToneColors(c.successBg, c.successFg, c.successBd)
        ZcTone.WARNING -> ToneColors(c.warningBg, c.warningFg, c.warningBd)
        ZcTone.DANGER -> ToneColors(c.dangerBg, c.dangerFg, c.dangerBd)
        ZcTone.INFO -> ToneColors(c.infoBg, c.infoFg, c.infoBd)
        ZcTone.ACCENT -> ToneColors(c.accentBg, c.accentFg, c.accentBd)
        ZcTone.NEUTRAL -> ToneColors(c.neutralBg, c.neutralFg, c.neutralBd)
    }
}

/** Ícono del sistema (Solar). Decorativo con `contentDescription = null`; toma el color del contenido. */
@Composable
fun ZcIcon(@DrawableRes icon: Int, contentDescription: String?, modifier: Modifier = Modifier, size: Dp = 20.dp, tint: Color = LocalZcContentColor.current) {
    Image(
        painter = painterResource(icon),
        contentDescription = contentDescription,
        modifier = modifier.size(size),
        colorFilter = ColorFilter.tint(tint),
    )
}

/** Indicador de carga (zc-spinner): aro de 2 dp con 3/4 visible, 18 por defecto. Anuncia "Cargando" salvo `decorative`. */
@Composable
fun ZcSpinner(modifier: Modifier = Modifier, size: Dp = 18.dp, color: Color = LocalZcContentColor.current, decorative: Boolean = false) {
    val rotation by rememberInfiniteTransition(label = "spin").animateFloat(0f, 360f, infiniteRepeatable(tween(900, easing = LinearEasing)), label = "rot")
    val label = LocalContext.current.getString(R.string.zc_ui_cargando)
    Canvas(modifier.size(size).then(if (decorative) Modifier.clearAndSetSemantics { } else Modifier.semantics { contentDescription = label })) {
        val stroke = 2.dp.toPx()
        drawArc(color, rotation, 270f, false, style = Stroke(stroke, cap = StrokeCap.Butt), topLeft = Offset(stroke / 2, stroke / 2), size = Size(this.size.width - stroke, this.size.height - stroke))
    }
}

/** Badge de estado: tono + texto (y un ícono opcional). Alto de 28 dp. */
@Composable
fun ZcBadge(text: String, modifier: Modifier = Modifier, tone: ZcTone = ZcTone.NEUTRAL, @DrawableRes icon: Int? = null) {
    val t = toneColors(tone)
    Row(
        modifier = modifier
            .height(28.dp)
            .clip(RoundedCornerShape(50))
            .background(t.bg)
            .border(1.dp, t.border, RoundedCornerShape(50))
            .padding(start = if (icon != null) 8.dp else 10.dp, end = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CompositionLocalProvider(LocalZcContentColor provides t.fg) {
            if (icon != null) ZcIcon(icon, contentDescription = null, size = ZcSize.iconSm)
            ZcText(text, style = ZcType.caption, weight = ZcWeight.medium, maxLines = 1)
        }
    }
}

enum class ZcAvatarSize(val dp: Dp) { SM(32.dp), MD(40.dp), LG(56.dp) }

/** Iniciales para avatares: primera letra de las dos primeras palabras ("Lucía Mendoza" → "LM"). */
fun zcInitials(name: String): String = name.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }.take(2).joinToString("") { it.substring(0, 1).uppercase(java.util.Locale.forLanguageTag("es")) }

/**
 * Avatar (zc-avatar): foto (`image`) o iniciales sobre `surface-3`; 32/40/56 con texto 12/14/18. `square` para empresas
 * (radio 12). `presence` agrega el punto verde y "En línea" al nombre que lee TalkBack.
 */
@Composable
fun ZcAvatar(
    name: String,
    modifier: Modifier = Modifier,
    size: ZcAvatarSize = ZcAvatarSize.MD,
    brand: Boolean = false,
    image: androidx.compose.ui.graphics.painter.Painter? = null,
    square: Boolean = false,
    presence: Boolean = false,
    initials: String? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val shape = if (square) RoundedCornerShape(com.zonacards.ui.tokens.ZcRadius.ms) else CircleShape
    val a11y = if (presence) "$name, ${ctx.getString(R.string.zc_ui_en_linea)}" else name
    Box(modifier.size(size.dp).clearAndSetSemantics { contentDescription = a11y }) {
        Box(Modifier.size(size.dp).clip(shape).background(if (brand) c.secondary else c.surface3), contentAlignment = Alignment.Center) {
            if (image != null) Image(image, contentDescription = null, contentScale = androidx.compose.ui.layout.ContentScale.Crop, modifier = Modifier.size(size.dp))
            else ZcText(initials ?: zcInitials(name), style = when (size) { ZcAvatarSize.SM -> ZcTextTw.xs; ZcAvatarSize.MD -> ZcTextTw.sm; ZcAvatarSize.LG -> ZcTextTw.lg }, color = if (brand) c.onSecondary else c.text, weight = ZcWeight.semibold)
        }
        if (presence) Box(
            Modifier.align(Alignment.BottomEnd).size(when (size) { ZcAvatarSize.SM -> 10.dp; ZcAvatarSize.MD -> 12.dp; ZcAvatarSize.LG -> 14.dp })
                .clip(CircleShape).background(c.surface).padding(2.dp).clip(CircleShape).background(c.successFg),
        )
    }
}

/** Grupo de avatares superpuestos (único solapamiento permitido) con "+N" si hay más de `max`. TalkBack lee el grupo. */
@Composable
fun ZcAvatarGroup(names: List<String>, label: String, modifier: Modifier = Modifier, size: ZcAvatarSize = ZcAvatarSize.SM, max: Int = 4) {
    val c = ZonacardsTheme.colors
    val shown = names.take(max)
    val extra = names.size - shown.size
    Row(modifier.clearAndSetSemantics { contentDescription = label }, horizontalArrangement = Arrangement.spacedBy(-(size.dp / 4))) {
        for (n in shown) Box(Modifier.clip(CircleShape).background(c.surface).padding(2.dp)) { ZcAvatar(n, size = size) }
        if (extra > 0) Box(Modifier.clip(CircleShape).background(c.surface).padding(2.dp)) {
            Box(Modifier.size(size.dp).clip(CircleShape).background(c.surface2), contentAlignment = Alignment.Center) {
                ZcText("+$extra", style = if (size == ZcAvatarSize.LG) ZcTextTw.lg else ZcTextTw.xs, weight = ZcWeight.semibold)
            }
        }
    }
}

/**
 * Chip: etiqueta (solo lectura), seleccionable (filtros) o con "Quitar". Alto visual de 32 dp con toque de 48 dp.
 * `invalid` lo marca como no válido con texto para TalkBack, no solo con color.
 */
@Composable
fun ZcChip(
    label: String,
    modifier: Modifier = Modifier,
    selected: Boolean? = null,
    onSelectedChange: ((Boolean) -> Unit)? = null,
    onRemove: (() -> Unit)? = null,
    invalid: Boolean = false,
    enabled: Boolean = true,
    @DrawableRes icon: Int? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val (bg, fg, bd) = when {
        invalid -> Triple(c.dangerBg, c.dangerFg, c.dangerBd)
        selected == true -> Triple(c.primary, c.onPrimary, c.primary)
        else -> Triple(c.surface2, c.text, c.border)
    }
    val selectable = selected != null && onSelectedChange != null
    Box(
        modifier = modifier
            .heightIn(min = 48.dp)
            .then(if (selectable) Modifier.toggleable(selected!!, enabled = enabled, role = Role.Button) { onSelectedChange!!(it) } else Modifier)
            .then(if (invalid) Modifier.semantics { contentDescription = "${ctx.getString(R.string.zc_ui_invalido)}: $label" } else Modifier),
        contentAlignment = Alignment.Center,
    ) {
        Row(
            modifier = Modifier
                .height(32.dp)
                .alpha(if (enabled) 1f else ZcOpacity.disabled)
                .background(bg, RoundedCornerShape(50))
                .border(1.dp, bd, RoundedCornerShape(50))
                .padding(start = 12.dp, end = if (onRemove != null) 4.dp else 12.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CompositionLocalProvider(LocalZcContentColor provides fg) {
                if (icon != null && !invalid && !selectable) ZcIcon(icon, contentDescription = null, size = ZcSize.iconSm)
                // Etiqueta larga (más de 28 caracteres): se trunca y el texto completo va en un tooltip.
                if (label.length > 28) ZcTooltip(label) { ZcText(label, style = ZcType.caption, maxLines = 1, modifier = Modifier.widthIn(max = 240.dp)) }
                else ZcText(label, style = ZcType.caption, maxLines = 1, modifier = Modifier.widthIn(max = 240.dp))
                if (onRemove != null) {
                    // El área de toque de "Quitar" crece hasta 48 dp sin agrandar el chip.
                    Box(
                        Modifier.requiredSize(48.dp).clip(CircleShape)
                            .clickable(enabled = enabled, role = Role.Button, onClick = onRemove)
                            .semantics { contentDescription = ctx.getString(R.string.zc_ui_quitar, label) },
                        contentAlignment = Alignment.Center,
                    ) { ZcIcon(ZcIcons.lX, contentDescription = null, size = ZcSize.iconSm) }
                }
            }
        }
    }
}

/** Separador de 1 dp con el color de borde. Decorativo por defecto; `decorative = false` lo anuncia como separación (zc-separator). */
@Composable
fun ZcDivider(modifier: Modifier = Modifier, vertical: Boolean = false, decorative: Boolean = true) {
    val color = ZonacardsTheme.colors.border
    Box(
        modifier
            .then(if (vertical) Modifier.fillMaxHeight().width(1.dp) else Modifier.fillMaxWidth().height(1.dp))
            .background(color)
            .semantics { if (decorative) invisibleToUser() },
    )
}

/** Px de 1 dp, para trazos de borde exactos. */
@Composable
internal fun hairline(): Float = with(LocalDensity.current) { 1.dp.toPx() }

internal fun Modifier.minTouch(): Modifier = this.defaultMinSize(minWidth = 48.dp, minHeight = 48.dp)
