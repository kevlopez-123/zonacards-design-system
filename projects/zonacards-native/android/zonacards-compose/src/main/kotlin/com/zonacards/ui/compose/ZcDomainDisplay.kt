package com.zonacards.ui.compose

import android.annotation.SuppressLint
import androidx.annotation.DrawableRes
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcDomainData
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcStateMachine
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcMoney
import java.text.NumberFormat
import java.util.Locale

/** Números tabulares (como la clase `num` de la web): los montos no bailan al cambiar. */
internal val Tabular = TextStyle(fontFeatureSettings = "tnum")

/**
 * Tarjeta de listado (zc-card): radio 16, borde, padding 16, gap 16. Encabezado con ícono en recuadro de 36 (o `lead`),
 * título 16 semibold y subtítulo caption muted, y `aside` a la derecha (menú ⋮ o badge, con su propio toque); `media` a sangre
 * arriba en 16:9, cuerpo libre y `footer` con borde superior. Con `onClick`, toda la tarjeta abre el detalle.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ZcCard(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    @DrawableRes icon: Int? = null,
    onClick: (() -> Unit)? = null,
    media: (@Composable () -> Unit)? = null,
    lead: (@Composable () -> Unit)? = null,
    aside: (@Composable () -> Unit)? = null,
    footer: (@Composable () -> Unit)? = null,
    content: (@Composable () -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val source = androidx.compose.runtime.remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val shape = RoundedCornerShape(ZcRadius.md)
    Column(
        modifier.fillMaxWidth()
            .then(if (pressed) Modifier.shadow(2.dp, shape) else Modifier)
            .clip(shape).background(c.surface).border(1.dp, if (pressed) c.borderStrong else c.border, shape)
            .then(if (onClick != null) Modifier.clickable(source, null, role = Role.Button, onClick = onClick) else Modifier),
    ) {
        if (media != null) Box(Modifier.fillMaxWidth().aspectRatio(16f / 9f)) { media() }
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
                if (icon != null) Box(Modifier.size(36.dp).clip(RoundedCornerShape(ZcRadius.ms)).background(c.surface2), contentAlignment = Alignment.Center) { ZcIcon(icon, null) }
                lead?.invoke()
                Column(Modifier.weight(1f)) {
                    ZcText(title, style = TextStyle(fontSize = 16.sp, lineHeight = 22.sp), weight = FontWeight.SemiBold)
                    if (subtitle != null) ZcText(subtitle, style = ZcType.caption.merge(Tabular), color = c.textMuted)
                }
                aside?.invoke()
            }
            content?.invoke()
            if (footer != null) Column {
                ZcDivider()
                FlowRow(Modifier.fillMaxWidth().heightIn(min = 44.dp).padding(top = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    androidx.compose.runtime.CompositionLocalProvider(LocalZcContentColor provides c.textMuted) { footer() }
                }
            }
        }
    }
}

/** Variación de un KPI como la web: "+8,2 %" o "−3 %" (signo menos tipográfico, 1 decimal máximo). */
fun zcFormatDelta(delta: Double): String {
    val f = NumberFormat.getNumberInstance(Locale.forLanguageTag("es-PE")).apply { maximumFractionDigits = 1 }
    return (if (delta >= 0) "+" else "−") + f.format(kotlin.math.abs(delta)) + " %"
}

/** Línea de tendencia mínima (sparkline) para KPI. */
@Composable
fun ZcSparkline(values: List<Double>, color: Color, modifier: Modifier = Modifier) {
    if (values.size < 2) return
    Canvas(modifier.size(72.dp, 28.dp).clearAndSetSemantics { }) {
        val min = values.min(); val max = values.max(); val span = (max - min).takeIf { it > 0 } ?: 1.0
        val stepX = size.width / (values.size - 1)
        val p = Path()
        values.forEachIndexed { i, v ->
            val x = i * stepX; val y = size.height - ((v - min) / span * (size.height - 4.dp.toPx())).toFloat() - 2.dp.toPx()
            if (i == 0) p.moveTo(x, y) else p.lineTo(x, y)
        }
        drawPath(p, color, style = Stroke(2.dp.toPx(), cap = StrokeCap.Round))
    }
}

@OptIn(ExperimentalLayoutApi::class)
/**
 * KPI (zc-kpi): radio 16, borde, padding 16, gap 8. Etiqueta 14 muted e ícono en recuadro de 32 (se oculta si la tarjeta mide
 * 150 o menos); valor 24 semibold tabular. Con `trend`: píldora de variación (verde o roja según `invert`) y sparkline;
 * solo con `delta`: la variación en línea. `filter` lo vuelve un filtro que se marca (borde `primary` de 2).
 */
@Composable
fun ZcKpi(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    @DrawableRes icon: Int? = null,
    delta: Double? = null,
    deltaLabel: String? = null,
    trend: List<Double>? = null,
    invert: Boolean = false,
    filter: Boolean = false,
    pressed: Boolean = false,
    onPressedChange: ((Boolean) -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val good = delta == null || ((delta >= 0) xor invert)
    val tone = toneColors(if (good) ZcTone.SUCCESS else ZcTone.DANGER)
    val shape = RoundedCornerShape(ZcRadius.md)
    BoxWithConstraints(
        modifier.clip(shape).background(c.surface).border(if (filter && pressed) 2.dp else 1.dp, if (filter && pressed) c.primary else c.border, shape)
            .then(if (filter && onPressedChange != null) Modifier.toggleable(pressed, role = Role.Button, onValueChange = onPressedChange) else Modifier),
    ) {
        val showIcon = maxWidth > 150.dp
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                ZcText(label, style = ZcTextTw.sm, color = c.textMuted, modifier = Modifier.weight(1f))
                if (icon != null && showIcon) Box(Modifier.size(32.dp).clip(RoundedCornerShape(ZcRadius.sm)).background(c.surface2), contentAlignment = Alignment.Center) { ZcIcon(icon, null, size = 16.dp) }
            }
            ZcText(value, style = ZcTextTw.x2l.merge(Tabular), weight = FontWeight.SemiBold, maxLines = 1)
            // Como la web: la fila se envuelve completa (flex-wrap) en lugar de aplastar el texto.
            if (trend != null && delta != null) FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(Modifier.clip(RoundedCornerShape(50)).background(tone.bg).padding(horizontal = 8.dp, vertical = 2.dp), horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                    ZcIcon(if (delta >= 0) ZcIcons.lTrendingUp else ZcIcons.lTrendingDown, null, size = 16.dp, tint = tone.fg)
                    ZcText(zcFormatDelta(delta), style = ZcType.caption, weight = FontWeight.Medium, color = tone.fg, maxLines = 1)
                }
                if (deltaLabel != null) ZcText(deltaLabel, style = ZcType.caption, color = c.textMuted, maxLines = 1, modifier = Modifier.align(Alignment.CenterVertically))
                ZcSparkline(trend, tone.fg)
            } else if (delta != null) Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
                ZcIcon(if (delta >= 0) ZcIcons.lTrendingUp else ZcIcons.lTrendingDown, null, size = 16.dp, tint = tone.fg)
                ZcText(zcFormatDelta(delta), style = ZcType.caption, color = tone.fg)
                if (deltaLabel != null) ZcText(deltaLabel, style = ZcType.caption, color = c.textMuted)
            }
        }
    }
}

/**
 * Monto (zc-money): una línea con la moneda del país, números tabulares y la tipografía del contexto. Si el monto completo no
 * cabe, muestra el abreviado (K, M, MM) con subrayado punteado y un tooltip con la cifra completa; TalkBack siempre lee la
 * cifra completa. No usar en tablas ni exportaciones.
 */
@Composable
fun ZcMoneyText(amount: Double, country: String, modifier: Modifier = Modifier, style: TextStyle = ZcType.body, weight: FontWeight? = null, color: Color = LocalZcContentColor.current) {
    val full = ZcMoney.format(amount, country)
    val measurer = rememberTextMeasurer()
    val font = LocalZcFontFamily.current
    val ts = style.merge(Tabular).copy(fontFamily = font, fontWeight = weight ?: style.fontWeight, color = color)
    BoxWithConstraints(modifier.semantics { contentDescription = full }) {
        val fits = measurer.measure(full, ts, maxLines = 1).size.width <= constraints.maxWidth
        if (fits) BasicText(full, Modifier.clearAndSetSemantics { }, style = ts, maxLines = 1)
        else ZcTooltip(full) {
            BasicText(
                ZcMoney.formatCompact(amount, country),
                Modifier.clearAndSetSemantics { }.drawBehind {
                    val y = size.height - 1.dp.toPx()
                    drawLine(color.copy(alpha = 0.35f), Offset(0f, y), Offset(size.width, y), 1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(2.dp.toPx(), 2.dp.toPx())))
                },
                style = ts, maxLines = 1,
            )
        }
    }
}

/**
 * Badge de un estado de dominio (como `<zc-badge [tone] [icon]>` con los mapas *_LOOK de la web): tono, ícono y texto salen
 * de la máquina de estados, así lote, envío o giftcard se ven igual en web y app. Siempre ícono + texto.
 */
@SuppressLint("DiscouragedApi")
@Composable
fun ZcStateBadge(machine: ZcStateMachine, state: String, modifier: Modifier = Modifier) {
    val ctx = LocalContext.current
    val look = machine.looks[state] ?: return ZcBadge(state, modifier)
    val pkg = "com.zonacards.ui.tokens"
    val strKey = "zc_" + look.labelKey.replace(Regex("([a-z0-9])([A-Z])"), "$1_$2").replace('.', '_').lowercase()
    val text = ctx.resources.getIdentifier(strKey, "string", ctx.packageName).takeIf { it != 0 }?.let { ctx.getString(it) }
        ?: ctx.resources.getIdentifier(strKey, "string", pkg).takeIf { it != 0 }?.let { ctx.getString(it) } ?: state
    val iconKey = "zc_ic_" + look.icon.replace(':', '_').replace('-', '_')
    val icon = ctx.resources.getIdentifier(iconKey, "drawable", ctx.packageName).takeIf { it != 0 }
        ?: ctx.resources.getIdentifier(iconKey, "drawable", pkg).takeIf { it != 0 }
    ZcBadge(text, modifier, ZcTone.of(look.tone), icon)
}

/** Atajos a las máquinas de estado del dominio. */
object ZcStates {
    val giftcard get() = ZcDomainData.giftcard
    val lot get() = ZcDomainData.lot
    val shipment get() = ZcDomainData.shipment
    val approval get() = ZcDomainData.approval
    val settlement get() = ZcDomainData.settlement
    val transfer get() = ZcDomainData.transfer
}

/** Medios de pago locales (zc-pay-badge): 22 de alto, radio 4, texto 10 bold; colores de marca desde tokens `--pay-*`. Decorativo. */
enum class ZcPayMethod(val text: String) { YAPE("YAPE"), PLIN("PLIN"), PAGOEFECTIVO("PE"), PUNTOS("PTS") }

@Composable
fun ZcPayBadge(method: ZcPayMethod, modifier: Modifier = Modifier) {
    val c = ZonacardsTheme.colors
    val (bg, fg) = when (method) {
        ZcPayMethod.YAPE -> c.payYape to c.onPayYape
        ZcPayMethod.PLIN -> c.payPlin to c.onPayPlin
        ZcPayMethod.PAGOEFECTIVO -> c.payPagoefectivo to c.onPayPagoefectivo
        ZcPayMethod.PUNTOS -> c.payPuntos to c.onPayPuntos
    }
    Box(modifier.height(22.dp).widthIn(min = 34.dp).clip(RoundedCornerShape(4.dp)).background(bg).padding(horizontal = 4.dp).clearAndSetSemantics { }, contentAlignment = Alignment.Center) {
        ZcText(method.text, style = TextStyle(fontSize = 10.sp, letterSpacing = 0.2.sp), weight = FontWeight.Bold, color = fg)
    }
}

/**
 * Número con − y + (zc-number-field): caja de control de 56, botones de paso con borde, rango `min`..`max`.
 * TalkBack lo trata como control de valor ajustable.
 */
@Composable
fun ZcNumberField(value: Int, onValueChange: (Int) -> Unit, modifier: Modifier = Modifier, min: Int = 0, max: Int = Int.MAX_VALUE, label: String? = null, enabled: Boolean = true) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val haptic = rememberZcHaptics()
    Row(
        modifier.height(ZcSize.target).zcControl(false, disabled = !enabled).semantics {
            if (label != null) contentDescription = label
            progressBarRangeInfo = ProgressBarRangeInfo(value.toFloat(), min.toFloat()..max.toFloat())
            setProgress { v -> val n = v.toInt().coerceIn(min, max); if (n != value) onValueChange(n); true }
        },
        verticalAlignment = Alignment.CenterVertically,
    ) {
        val step = @Composable { icon: Int, desc: String, can: Boolean, delta: Int ->
            Box(
                Modifier.size(ZcSize.target).clickable(enabled = enabled && can, role = Role.Button) { haptic(ZcHaptic.KEY); onValueChange(value + delta) }
                    .semantics { contentDescription = desc },
                contentAlignment = Alignment.Center,
            ) { ZcIcon(icon, null, size = 16.dp, tint = if (can) c.text else c.textSubtle) }
        }
        step(ZcIcons.lMinus, ctx.getString(R.string.zc_ui_disminuir), value > min, -1)
        Box(Modifier.width(1.dp).height(ZcSize.target).background(c.border))
        ZcText(value.toString(), style = ZcTextTw.base.merge(Tabular), modifier = Modifier.weight(1f).clearAndSetSemantics { }, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        Box(Modifier.width(1.dp).height(ZcSize.target).background(c.border))
        step(ZcIcons.lPlus, ctx.getString(R.string.zc_ui_aumentar), value < max, 1)
    }
}


/**
 * Tarjeta de producto (zc-product-card): imagen 16:10 con cinta "Nueva" y favorito (40, colores `--media-control-*`), nombre,
 * descripción, "Desde" + monto y botón de compra de solo ícono.
 */
@Composable
fun ZcProductCard(
    name: String,
    price: Double,
    country: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    image: Painter? = null,
    isNew: Boolean = false,
    favorite: Boolean = false,
    onFavoriteChange: ((Boolean) -> Unit)? = null,
    onBuy: () -> Unit,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val shape = RoundedCornerShape(ZcRadius.md)
    Column(modifier.clip(shape).background(c.surface).border(1.dp, c.border, shape)) {
        Box(Modifier.fillMaxWidth().aspectRatio(16f / 10f).background(c.surface2)) {
            if (image != null) Image(image, null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
            if (isNew) Box(
                Modifier.padding(top = 10.dp).clip(RoundedCornerShape(topEnd = 50.dp, bottomEnd = 50.dp)).background(c.brandAccent).padding(start = 12.dp, end = 10.dp, top = 4.dp, bottom = 4.dp),
            ) { ZcText(ctx.getString(R.string.zc_mol_producto_nueva), style = ZcTextTw.xs, weight = FontWeight.SemiBold, color = c.onBrandAccent) }
            if (onFavoriteChange != null) Box(
                // Círculo de 40 visible (como la web) con área de toque de 48: el toque va antes del recorte.
                Modifier.align(Alignment.TopEnd).padding(4.dp).size(48.dp)
                    .toggleable(favorite, role = Role.Button, onValueChange = onFavoriteChange)
                    .semantics { contentDescription = ctx.getString(if (favorite) R.string.zc_mol_producto_fav_quitar else R.string.zc_mol_producto_fav_agregar, name) }
                    .padding(4.dp).clip(CircleShape).background(c.mediaControlBg),
                contentAlignment = Alignment.Center,
            ) { ZcIcon(if (favorite) ZcIcons.sHeartBold else ZcIcons.sHeart, null, tint = if (favorite) c.dangerFg else c.mediaControlFg) }
        }
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            ZcText(name, weight = FontWeight.SemiBold)
            if (description != null) ZcText(description, style = ZcType.caption.copy(lineHeight = 20.sp), color = c.textMuted)
        }
        Row(Modifier.padding(start = 16.dp, end = 16.dp, bottom = 16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Column(Modifier.weight(1f)) {
                ZcText(ctx.getString(R.string.zc_mol_producto_desde), style = ZcType.caption, color = c.textMuted)
                ZcMoneyText(price, country, style = ZcType.titleSm, weight = FontWeight.Bold)
            }
            ZcIconButton(ZcIcons.sAltArrowRight, ctx.getString(R.string.zc_mol_producto_comprar, name), onBuy, variant = ZcButtonVariant.PRIMARY, small = true)
        }
    }
}

/** Tarjeta de llamado (zc-cta-card): fondo con 18 % del acento de marca, título, texto y botón; esquina con ícono sobre `secondary`. */
@Composable
fun ZcCtaCard(title: String, text: String, @DrawableRes icon: Int, modifier: Modifier = Modifier, action: (@Composable () -> Unit)? = null) {
    val c = ZonacardsTheme.colors
    Box(modifier.fillMaxWidth().heightIn(min = 160.dp).clip(RoundedCornerShape(ZcRadius.md)).background(lerp(c.surface, c.brandAccent, 0.18f))) {
        Column(Modifier.padding(start = 20.dp, top = 20.dp, end = 20.dp, bottom = 64.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            ZcText(title, weight = FontWeight.SemiBold)
            ZcText(text, style = ZcTextTw.sm, modifier = Modifier.widthIn(max = 240.dp))
            action?.invoke()
        }
        Box(Modifier.align(Alignment.BottomEnd).size(64.dp, 56.dp).clip(RoundedCornerShape(topStart = 18.dp)).background(c.secondary), contentAlignment = Alignment.Center) {
            ZcIcon(icon, null, size = 32.dp, tint = c.onSecondary)
        }
    }
}

