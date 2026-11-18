package com.zonacards.ui.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.foundation.focusable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcMoney

data class ZcCheckoutStep(val id: String, val title: String, val summary: String? = null)

/**
 * Pasos del checkout (zc-checkout-steps): una sección por paso (radio 16, borde); el actual abierto, los futuros al 60 %.
 * Círculo de 28: completado en `success` con check, actual en `primary` con número, futuro solo con borde. Los completados
 * muestran su resumen y "Editar". TalkBack lee ", completado", ", paso actual" o ", bloqueado"; al cambiar de paso, el foco
 * va al título. El botón "Guardar y continuar" lo pone la pantalla dentro del cuerpo.
 */
@Composable
fun ZcCheckoutSteps(steps: List<ZcCheckoutStep>, current: Int, onCurrentChange: (Int) -> Unit, modifier: Modifier = Modifier, body: @Composable (index: Int) -> Unit) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val focus = remember(current) { FocusRequester() }
    LaunchedEffect(current) { runCatching { focus.requestFocus() } }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        steps.forEachIndexed { i, s ->
            val done = i < current; val now = i == current
            val status = ctx.getString(if (done) R.string.zc_mol_checkout_completo else if (now) R.string.zc_mol_checkout_actual else R.string.zc_mol_checkout_bloqueado)
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(ZcRadius.md)).background(c.surface).border(1.dp, c.border, RoundedCornerShape(ZcRadius.md)).alpha(if (i > current) 0.6f else 1f)) {
                Row(Modifier.fillMaxWidth().heightIn(min = 60.dp).padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(28.dp).clip(CircleShape).background(if (done) c.successFg else if (now) c.primary else c.surface)
                            .border(1.5.dp, if (done) c.successFg else if (now) c.primary else c.borderStrong, CircleShape).clearAndSetSemantics { },
                        contentAlignment = Alignment.Center,
                    ) {
                        if (done) ZcIcon(ZcIcons.lCheck, null, size = 16.dp, tint = c.surface)
                        else ZcText("${i + 1}", style = ZcType.caption, weight = FontWeight.SemiBold, color = if (now) c.onPrimary else c.text)
                    }
                    Column(Modifier.weight(1f).then(if (now) Modifier.focusRequester(focus).focusable() else Modifier).semantics(mergeDescendants = true) { heading(); contentDescription = "${s.title}, $status" }) {
                        ZcText(s.title, style = ZcType.body.copy(lineHeight = 22.sp), weight = FontWeight.SemiBold)
                        if (done && s.summary != null) ZcText(s.summary, style = ZcType.caption, color = c.textMuted)
                    }
                    if (done) Box(Modifier.semantics { contentDescription = ctx.getString(R.string.zc_mol_checkout_editar, s.title) }) {
                        ZcButton(ctx.getString(R.string.zc_mol_checkout_editar_corto), { onCurrentChange(i) }, variant = ZcButtonVariant.GHOST, size = ZcButtonSize.SM)
                    }
                }
                if (now) Column(Modifier.padding(start = 16.dp, end = 16.dp, bottom = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) { body(i) }
            }
        }
    }
}

data class ZcCartLine(val id: String, val name: String, val brand: String, val price: Double, val qty: Int, val note: String? = null, val category: String? = null)
data class ZcCartFee(val label: String, val amount: Double, val info: String? = null)

@OptIn(ExperimentalLayoutApi::class)
/**
 * Carrito (zc-cart): "Tu carrito (n)", líneas con miniatura de 56 (44 en pantallas angostas), nombre, "marca · nota · precio c/u",
 * cantidad de 1 a 10, quitar (aviso "Producto eliminado") y total de la línea; `coupon` debajo de las líneas; resumen con
 * subtotal, descuento en verde (tope el subtotal), cargos con su ayuda y total; "Pago 100 % seguro". Vacío: estado con acción.
 */
@Composable
fun ZcCart(
    lines: List<ZcCartLine>,
    onLinesChange: (List<ZcCartLine>) -> Unit,
    country: String,
    modifier: Modifier = Modifier,
    discount: Double = 0.0,
    fees: List<ZcCartFee> = emptyList(),
    toasts: ZcToastState? = null,
    onRemoved: ((ZcCartLine) -> Unit)? = null,
    coupon: (@Composable () -> Unit)? = null,
    empty: (@Composable () -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val shape = RoundedCornerShape(ZcRadius.md)
    if (lines.isEmpty()) {
        ZcState(ctx.getString(R.string.zc_mol_carrito_vacio), modifier, icon = ZcIcons.sCartLarge2, text = ctx.getString(R.string.zc_mol_carrito_vacio_texto), action = empty)
        return
    }
    val count = lines.sumOf { it.qty }
    val subtotal = lines.sumOf { it.price * it.qty }
    val disc = discount.coerceIn(0.0, subtotal)
    val total = maxOf(0.0, subtotal - disc + fees.sumOf { it.amount })
    val money = { a: Double -> ZcMoney.format(a, country) }
    Column(modifier.fillMaxWidth().clip(shape).background(c.surface).border(1.dp, c.border, shape).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.semantics(mergeDescendants = true) { heading() }) {
            ZcText(ctx.getString(R.string.zc_mol_carrito_titulo), style = ZcTextTw.lg, weight = FontWeight.Bold)
            ZcText(" ($count)", style = ZcTextTw.lg, color = c.textMuted)
        }
        BoxWithConstraints {
            val thumb = if (maxWidth < 480.dp) 44.dp else 56.dp
            Column(Modifier.semantics { contentDescription = ctx.getString(R.string.zc_mol_carrito_productos) }) {
                lines.forEachIndexed { i, l ->
                    Row(Modifier.padding(vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Box(Modifier.size(thumb).clip(RoundedCornerShape(10.dp)).background(c.surface2), contentAlignment = Alignment.Center) { ZcIcon(ZcIcons.sTicket, null, tint = c.textMuted) }
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Column {
                                ZcText(l.name, style = ZcType.body.copy(lineHeight = 21.sp), weight = FontWeight.Bold)
                                ZcText(listOfNotNull(l.brand, l.note, ctx.getString(R.string.zc_mol_carrito_cu, money(l.price))).joinToString(" · "), style = ZcType.caption, color = c.textMuted)
                            }
                            // Cantidad, quitar y total; si no cabe, el total baja entero a la línea siguiente (sin partir el monto).
                            FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                ZcNumberField(l.qty, { q -> onLinesChange(lines.map { if (it.id == l.id) it.copy(qty = q) else it }) }, Modifier.width(152.dp), min = 1, max = 10, label = ctx.getString(R.string.zc_mol_carrito_cantidad_de, l.name))
                                ZcTooltip(ctx.getString(R.string.zc_mol_carrito_eliminar_corto)) {
                                    ZcIconButton(ZcIcons.sTrashBinTrash, ctx.getString(R.string.zc_mol_carrito_eliminar, l.name), {
                                        onLinesChange(lines.filter { it.id != l.id })
                                        toasts?.success(ctx.getString(R.string.zc_mol_carrito_eliminado), l.name)
                                        onRemoved?.invoke(l)
                                    }, small = true)
                                }
                                Box(Modifier.weight(1f).heightIn(min = 44.dp), contentAlignment = Alignment.CenterEnd) { ZcText(money(l.price * l.qty), style = ZcType.body.merge(Tabular), weight = FontWeight.Bold, maxLines = 1) }
                            }
                        }
                    }
                    if (i < lines.lastIndex) ZcDivider()
                }
            }
        }
        coupon?.invoke()
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            val row = @Composable { label: String, value: String, color: androidx.compose.ui.graphics.Color, info: String? ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        ZcText(label, style = ZcType.bodySm.copy(lineHeight = 24.sp), color = c.textMuted)
                        if (info != null) ZcTooltip(info) { Box(Modifier.size(24.dp).semantics { contentDescription = "$label: $info" }, contentAlignment = Alignment.Center) { ZcIcon(ZcIcons.sQuestionCircle, null, size = 16.dp, tint = c.textSubtle) } }
                    }
                    ZcText(value, style = ZcType.bodySm.copy(lineHeight = 24.sp).merge(Tabular), color = color)
                }
            }
            row(ctx.getString(R.string.zc_mol_carrito_subtotal), money(subtotal), c.text, null)
            if (disc > 0) row(ctx.getString(R.string.zc_mol_carrito_descuento), "−" + money(disc), c.successFg, null)
            for (f in fees) row(f.label, money(f.amount), c.text, f.info)
            ZcDivider()
            Row(Modifier.padding(top = 8.dp)) {
                ZcText(ctx.getString(R.string.zc_mol_carrito_total), style = ZcType.titleSm, weight = FontWeight.Bold, modifier = Modifier.weight(1f))
                ZcText(money(total), style = ZcType.titleSm.merge(Tabular), weight = FontWeight.Bold)
            }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally), verticalAlignment = Alignment.CenterVertically) {
            ZcIcon(ZcIcons.sShieldCheck, null, size = 16.dp, tint = c.successFg)
            ZcText(ctx.getString(R.string.zc_mol_carrito_seguro), style = ZcType.caption, color = c.successFg)
        }
    }
}

