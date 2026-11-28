package com.zonacards.ui.compose

import androidx.annotation.DrawableRes
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.snapping.rememberSnapFlingBehavior
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcOpacity
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcMoney
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import kotlin.math.min

// ---------- Monto (zc-amount-picker) ----------

@Composable
private fun AmountChip(text: String, selected: Boolean, soldOut: Boolean = false, description: String? = null, onClick: () -> Unit) {
    val c = ZonacardsTheme.colors
    val shape = RoundedCornerShape(ZcRadius.sm)
    Box(
        Modifier.heightIn(min = ZcSize.target).widthIn(min = 76.dp).clip(shape).background(c.surface)
            .then(if (selected) Modifier.background(c.primary.copy(alpha = 0.08f)) else Modifier)
            .border(if (selected) 2.dp else 1.dp, if (selected) c.primary else c.borderStrong, shape)
            .alpha(if (soldOut) ZcOpacity.disabled else 1f)
            .then(
                if (soldOut) Modifier.semantics { disabled(); if (description != null) contentDescription = description }
                else Modifier.selectable(selected, role = Role.RadioButton, onClick = onClick),
            )
            .padding(horizontal = 16.dp),
        contentAlignment = Alignment.Center,
    ) {
        ZcText(
            text, style = ZcType.body.copy(fontFeatureSettings = "tnum", textDecoration = if (soldOut) TextDecoration.LineThrough else null),
            weight = if (selected) ZcWeight.semibold else null,
        )
    }
}

/**
 * Elegir un monto (zc-amount-picker): montos como grupo de opciones, "Otro" abre un monto libre entre `min` y `max`, y los
 * agotados van tachados y sin respuesta. El mensaje del campo muestra "Total: S/ 50.00"; con "Otro" vacío o fuera de rango
 * avisa. Los montos se dan en la moneda de `country`.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ZcAmountPicker(
    label: String,
    amounts: List<Double>,
    value: Double?,
    onValueChange: (Double?) -> Unit,
    modifier: Modifier = Modifier,
    soldOut: List<Double> = emptyList(),
    allowOther: Boolean = true,
    min: Double = 10.0,
    max: Double = 1000.0,
    country: String = "pe",
    required: Boolean = false,
) {
    val ctx = LocalContext.current
    var other by rememberSaveable { mutableStateOf(false) }
    var raw by rememberSaveable { mutableStateOf("") }
    var touched by rememberSaveable { mutableStateOf(false) }
    val focus = remember { FocusRequester() }
    fun whole(v: Double) = ZcMoney.formatWhole(v, country)
    val error = if (other && touched) {
        if (value == null) ctx.getString(R.string.zc_mol_monto_ingresa)
        else if (value < min || value > max) ctx.getString(R.string.zc_mol_monto_rango, whole(min), whole(max))
        else null
    } else null
    val total = ctx.getString(R.string.zc_mol_monto_total, value?.let { ZcMoney.format(it, country) } ?: "—")
    LaunchedEffect(other) { if (other) runCatching { focus.requestFocus() } }
    ZcField(label, modifier, required = required, hint = total, error = error) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            FlowRow(Modifier.fillMaxWidth().selectableGroup(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                amounts.forEach { a -> AmountChip(whole(a), !other && value == a) { other = false; touched = false; onValueChange(a) } }
                if (allowOther) AmountChip(ctx.getString(R.string.zc_mol_monto_otro), other) { other = true; onValueChange(raw.toDoubleOrNull()) }
                soldOut.forEach { s -> AmountChip(whole(s), false, soldOut = true, description = ctx.getString(R.string.zc_mol_monto_agotado, whole(s))) { } }
            }
            if (other) ZcTextField(
                raw, { raw = it; onValueChange(it.toDoubleOrNull()) }, ctx.getString(R.string.zc_mol_monto_otro_monto), Modifier.focusRequester(focus), hideLabel = true,
                prefix = ZcMoney.currencySymbol(country), allowed = Regex("[0-9]"), rejectMessage = ctx.getString(R.string.zc_ui_solo_enteros), keyboardType = KeyboardType.Number,
                placeholder = ctx.getString(R.string.zc_mol_monto_entre, ZcMoney.formatNumber(min, country), ZcMoney.formatNumber(max, country)),
                error = error, onBlur = { touched = true },
            )
        }
    }
}

// ---------- Cupones (zc-coupon-field) ----------

enum class ZcCouponKind { PCT, FIX, GC }

/** `PCT`: porcentaje del subtotal (0,10 = 10 %) · `FIX`: monto fijo · `GC`: gift card con saldo. `solo`: no se combina con otros. */
data class ZcCoupon(val code: String, val kind: ZcCouponKind, val value: Double, val description: String, val solo: Boolean = false)

sealed interface ZcCouponCheck {
    data class Valid(val coupon: ZcCoupon) : ZcCouponCheck
    data object NotFound : ZcCouponCheck
    data class Expired(val date: String) : ZcCouponCheck
}

/** Descuento de un código (nunca más que el subtotal). */
fun ZcCoupon.discountOf(subtotal: Double): Double = min(subtotal, if (kind == ZcCouponKind.PCT) subtotal * value else value)

/** Descuento total de los códigos aplicados (nunca más que el subtotal). */
fun zcCouponsTotal(coupons: List<ZcCoupon>, subtotal: Double): Double = min(subtotal, coupons.sumOf { it.discountOf(subtotal) })

/**
 * Cupones y gift cards (zc-coupon-field): hasta `max` códigos con las reglas de combinación. `validate` consulta el código
 * (en la app, el servicio); el campo resuelve repetidos, "no combinable" y el máximo, y avisa cada resultado. Los códigos
 * se escriben en mayúsculas; "Listo" del teclado también aplica.
 */
@Composable
fun ZcCouponField(
    label: String,
    value: List<ZcCoupon>,
    onValueChange: (List<ZcCoupon>) -> Unit,
    validate: suspend (String) -> ZcCouponCheck,
    modifier: Modifier = Modifier,
    subtotal: Double = 0.0,
    country: String = "pe",
    max: Int = 3,
    hint: String? = null,
    optional: Boolean = true,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    val haptic = rememberZcHaptics()
    var draft by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var success by remember { mutableStateOf<String?>(null) }
    var note by remember { mutableStateOf<String?>(null) }
    val full = value.size >= max

    fun apply() {
        val code = draft.trim()
        if (code.isEmpty() || busy) return
        fun fail(message: String) { error = message; success = null; haptic(ZcHaptic.REJECT) }
        if (value.any { it.code == code }) return fail(ctx.getString(R.string.zc_mol_cupon_repetido))
        busy = true
        scope.launch {
            val result = try { validate(code) } catch (e: CancellationException) { throw e } catch (e: Exception) { null }
            busy = false
            when (result) {
                null -> fail(ctx.getString(R.string.zc_mol_cupon_error_servicio))
                is ZcCouponCheck.Expired -> fail(ctx.getString(R.string.zc_mol_cupon_vencido, code, result.date))
                ZcCouponCheck.NotFound -> fail(ctx.getString(R.string.zc_mol_cupon_no_existe, code))
                is ZcCouponCheck.Valid -> when {
                    result.coupon.solo && value.isNotEmpty() -> fail(ctx.getString(R.string.zc_mol_cupon_no_combina, code))
                    value.any { it.solo } -> fail(ctx.getString(R.string.zc_mol_cupon_tiene_solo))
                    else -> {
                        onValueChange(value + result.coupon)
                        draft = ""; error = null; note = null
                        val left = max - (value.size + 1)
                        success = if (left > 0) ctx.getString(R.string.zc_mol_cupon_aplicado_quedan, code, left) else ctx.getString(R.string.zc_mol_cupon_aplicado_maximo, code)
                        haptic(ZcHaptic.CONFIRM)
                    }
                }
            }
        }
    }

    ZcField(label, modifier, optional = optional, hint = note ?: hint, error = error, success = success) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Top) {
                ZcTextField(
                    draft, { raw -> draft = raw.uppercase().filter { it in 'A'..'Z' || it in '0'..'9' || it == '-' }; error = null }, label, Modifier.weight(1f), hideLabel = true,
                    placeholder = if (full) ctx.getString(R.string.zc_mol_cupon_maximo_alcanzado, max) else ctx.getString(R.string.zc_mol_cupon_placeholder),
                    enabled = !full, capitalization = KeyboardCapitalization.Characters, imeAction = ImeAction.Done, onImeAction = { apply() }, error = error,
                    leading = { ZcIcon(ZcIcons.sTicketSale, null, Modifier.padding(start = 16.dp, end = 4.dp), size = ZcSize.iconSm, tint = c.textMuted) },
                )
                ZcButton(ctx.getString(R.string.zc_ui_aplicar), { apply() }, variant = ZcButtonVariant.OUTLINE, enabled = draft.isNotEmpty() && !busy, loading = busy)
            }
            if (value.isNotEmpty()) Column(Modifier.semantics { contentDescription = ctx.getString(R.string.zc_mol_cupon_aplicados) }, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                value.forEach { cp ->
                    Row(
                        Modifier.fillMaxWidth().clip(RoundedCornerShape(ZcRadius.sm)).background(c.successBg)
                            .drawBehind {
                                drawRoundRect(
                                    c.successBd, cornerRadius = CornerRadius(ZcRadius.sm.toPx()),
                                    style = Stroke(1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 3.dp.toPx()))),
                                )
                            }
                            .padding(start = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically,
                    ) {
                        ZcIcon(if (cp.kind == ZcCouponKind.GC) ZcIcons.sGift else ZcIcons.lBadgePercent, null, size = ZcSize.iconSm, tint = c.successFg)
                        Column(Modifier.weight(1f).padding(vertical = 6.dp)) {
                            ZcText(cp.code, style = ZcTextTw.sm.copy(letterSpacing = 0.02.em), weight = ZcWeight.bold)
                            ZcText(cp.description, style = ZcType.caption, color = c.textMuted)
                        }
                        ZcText("−${ZcMoney.format(cp.discountOf(subtotal), country)}", style = ZcTextTw.sm.copy(fontFeatureSettings = "tnum"), weight = ZcWeight.semibold, color = c.successFg)
                        FieldIconButton(ZcIcons.lX, ctx.getString(R.string.zc_mol_cupon_quitar, cp.code)) {
                            onValueChange(value.filter { it.code != cp.code })
                            success = null; error = null; note = ctx.getString(R.string.zc_mol_cupon_quitado, cp.code)
                        }
                    }
                }
            }
        }
    }
}

// ---------- Anuncio y guía de inicio (zc-announcement, zc-onboarding) ----------

@Composable
private fun HighlightText(text: String, highlight: String?, color: Color, modifier: Modifier, style: TextStyle) {
    val annotated = remember(text, highlight) {
        buildAnnotatedString {
            val i = if (highlight.isNullOrEmpty()) -1 else text.indexOf(highlight)
            if (i < 0) append(text)
            else { append(text.substring(0, i)); withStyle(SpanStyle(fontWeight = ZcWeight.bold)) { append(highlight!!) }; append(text.substring(i + highlight!!.length)) }
        }
    }
    BasicText(annotated, modifier, style = style.copy(color = color, fontFamily = LocalZcFontFamily.current))
}

/**
 * Anuncio con fondo de marca y cierre (zc-announcement). Al cerrar no vuelve: la app guarda el cierre por usuario (`open` viene
 * de fuera). `highlight` pone en negrita ese fragmento del texto.
 */
@Composable
fun ZcAnnouncement(
    label: String,
    text: String,
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    highlight: String? = null,
    @DrawableRes icon: Int = ZcIcons.lSparkles,
) {
    if (!open) return
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    Row(
        modifier.fillMaxWidth().clip(RoundedCornerShape(ZcRadius.md)).background(c.secondary).padding(start = 16.dp, end = 8.dp, top = 10.dp, bottom = 10.dp)
            .semantics { paneTitle = label },
        horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically,
    ) {
        ZcIcon(icon, null, size = ZcSize.iconMd, tint = c.onSecondary)
        HighlightText(text, highlight, c.onSecondary, Modifier.weight(1f), ZcType.body)
        Box(
            Modifier.size(ZcSize.targetSm).clip(RoundedCornerShape(ZcRadius.sm)).clickable(role = Role.Button) { onOpenChange(false) }
                .semantics { contentDescription = ctx.getString(R.string.zc_mol_anuncio_cerrar, label) },
            contentAlignment = Alignment.Center,
        ) { ZcIcon(ZcIcons.lX, null, size = ZcSize.iconSm, tint = c.onSecondary) }
    }
}

/** Guía de inicio con pasos numerados (zc-onboarding): fondo de marca, cierre arriba a la derecha; no vuelve al cerrarla. */
@Composable
fun ZcOnboarding(title: String, steps: List<String>, open: Boolean, onOpenChange: (Boolean) -> Unit, modifier: Modifier = Modifier) {
    if (!open) return
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val phone = zcScreenWidth() < 768.dp
    Box(modifier.fillMaxWidth().clip(RoundedCornerShape(ZcRadius.lg)).background(c.secondary).semantics { paneTitle = title }) {
        Column(Modifier.padding(start = if (phone) 16.dp else 24.dp, top = if (phone) 16.dp else 24.dp, bottom = if (phone) 16.dp else 24.dp, end = if (phone) 48.dp else 56.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            ZcText(title, Modifier.widthIn(max = 300.dp), style = ZcTextTw.xl, weight = ZcWeight.bold, color = c.onSecondary)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                steps.forEachIndexed { i, s ->
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Top) {
                        Box(Modifier.padding(top = 1.dp).size(22.dp).clip(CircleShape).background(c.brandAccent), contentAlignment = Alignment.Center) {
                            ZcText("${i + 1}", style = ZcTextTw.xs, weight = ZcWeight.bold, color = c.onBrandAccent)
                        }
                        ZcText(s, Modifier.weight(1f), style = ZcType.body, color = c.onSecondary)
                    }
                }
            }
        }
        Box(
            Modifier.align(Alignment.TopEnd).padding(top = 8.dp, end = 8.dp).size(ZcSize.targetSm).clip(RoundedCornerShape(ZcRadius.sm)).clickable(role = Role.Button) { onOpenChange(false) }
                .semantics { contentDescription = ctx.getString(R.string.zc_mol_anuncio_ocultar_guia) },
            contentAlignment = Alignment.Center,
        ) { ZcIcon(ZcIcons.lX, null, size = ZcSize.iconSm, tint = c.onSecondary) }
    }
}

// ---------- Ayuda (zc-help-card) ----------

/** Ayuda en el checkout y en flujos largos (zc-help-card): fondo informativo, la acción debajo del texto e ícono a la derecha. */
@Composable
fun ZcHelpCard(
    title: String,
    text: String,
    modifier: Modifier = Modifier,
    @DrawableRes icon: Int = ZcIcons.sHeadphonesRound,
    action: (@Composable () -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val shape = RoundedCornerShape(ZcRadius.md)
    val pad = if (zcScreenWidth() < 768.dp) 16.dp else 20.dp
    Row(
        modifier.fillMaxWidth().clip(shape).background(c.infoBg).border(1.dp, c.infoBd, shape).padding(pad),
        horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            ZcText(title, style = ZcType.body, weight = ZcWeight.bold)
            ZcText(text, style = ZcTextTw.sm)
            if (action != null) action()
        }
        Box(Modifier.size(64.dp).clip(CircleShape).background(c.surface), contentAlignment = Alignment.Center) { ZcIcon(icon, null, size = ZcSize.iconXl, tint = c.infoFg) }
    }
}

// ---------- Carrusel (zc-carousel) ----------

/**
 * Carrusel (zc-carousel): desliza con el dedo y encaja en cada diapositiva; botones Anterior y Siguiente y puntos (cada uno
 * con área de toque de 44 dp). Se ven 1,2 diapositivas en teléfono, 2 desde 768 dp y 3 desde 1280 dp; sin avance automático.
 * Cada diapositiva se anuncia como "N de M: nombre".
 */
@Composable
fun <T> ZcCarousel(
    items: List<T>,
    label: String,
    modifier: Modifier = Modifier,
    itemLabel: (T) -> String = { it.toString() },
    content: @Composable (item: T, index: Int) -> Unit,
) {
    if (items.isEmpty()) return
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    val state = rememberLazyListState()
    val shape = RoundedCornerShape(ZcRadius.md)
    val screen = zcScreenWidth()
    val current = state.firstVisibleItemIndex
    fun go(i: Int) { scope.launch { state.animateScrollToItem(i.coerceIn(0, items.lastIndex)) } }
    Column(modifier.fillMaxWidth().semantics { role = Role.Carousel; contentDescription = label }, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        BoxWithConstraints(Modifier.fillMaxWidth()) {
            val width = maxWidth
            val itemWidth = when { screen >= 1280.dp -> (width - 24.dp) / 3; screen >= 768.dp -> (width - 12.dp) / 2; else -> width * 0.85f }
            LazyRow(state = state, flingBehavior = rememberSnapFlingBehavior(state), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                itemsIndexed(items) { i, item ->
                    val name = "${i + 1} ${ctx.getString(R.string.zc_mol_carrusel_de)} ${items.size}: ${itemLabel(item)}"
                    Box(Modifier.width(itemWidth).clip(shape).background(c.surface).border(1.dp, c.border, shape).semantics { contentDescription = name }) { content(item, i) }
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Row(Modifier.weight(1f).horizontalScroll(rememberScrollState())) {
                items.indices.forEach { i ->
                    val on = i == current
                    val dotWidth by animateDpAsState(if (on) 24.dp else 10.dp, tween(200), label = "dot")
                    Box(
                        Modifier.size(44.dp).clickable(role = Role.Button) { go(i) }.semantics { contentDescription = ctx.getString(R.string.zc_mol_carrusel_ir, "${i + 1}") },
                        contentAlignment = Alignment.Center,
                    ) { Box(Modifier.height(10.dp).width(dotWidth).clip(CircleShape).background(if (on) c.text else c.borderStrong)) }
                }
            }
            ZcIconButton(ZcIcons.sAltArrowLeft, ctx.getString(R.string.zc_mol_carrusel_anterior), { go(current - 1) }, variant = ZcButtonVariant.OUTLINE, enabled = state.canScrollBackward)
            ZcIconButton(ZcIcons.sAltArrowRight, ctx.getString(R.string.zc_mol_carrusel_siguiente), { go(current + 1) }, variant = ZcButtonVariant.OUTLINE, enabled = state.canScrollForward)
        }
    }
}
