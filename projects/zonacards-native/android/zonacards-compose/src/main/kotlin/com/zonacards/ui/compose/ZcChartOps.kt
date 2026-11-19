package com.zonacards.ui.compose

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.Hyphens
import androidx.compose.ui.text.style.LineBreak
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zonacards.ui.tokens.ZcColors
import java.time.LocalDate
import java.util.Locale
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/*
 * Gráficos de operación (o-charts2 de index.html). Misma forma de datos que el resto de zc-chart:
 * - FUNNEL, TREEMAP: categorías = etapas o categorías; series[0] = valores.
 * - WATERFALL: la primera y la última categoría son totales; las del medio, ajustes (negativos restan).
 * - HEATMAP: categorías = columnas (horas); cada serie es una fila (día) con un valor por columna.
 * - CALENDAR: categorías = fechas ISO (aaaa-mm-dd); series[0] = valor por día.
 * - SANKEY: categorías "Origen → Destino"; series[0] = valor del flujo.
 * - GAUGE: series[0].values = [logrado, meta]; muestra el porcentaje.
 */

/** Zona tocable: junto con el globo que abre. */
internal class OpsRegion(val anchor: Offset, val title: String?, val rows: List<TipRow>, val contains: (Offset) -> Boolean)

/** Regiones tocables y la función que dibuja (con la región elegida, si hay). */
internal class OpsGeo(val regions: List<OpsRegion>, val draw: DrawScope.(Int?) -> Unit)

internal class OpsEnv(
    val c: ZcColors, val palette: List<Color>, val format: (Double) -> String, val narrow: Boolean,
    val d: Density, val tm: TextMeasurer, val style: TextStyle, val size: IntSize, val en: Boolean,
) {
    val w get() = size.width.toFloat()
    val h get() = size.height.toFloat()
    fun px(v: Float): Float = with(d) { v.dp.toPx() }
    fun st(sp: Float, weight: FontWeight? = null, center: Boolean = false): TextStyle =
        style.copy(fontSize = sp.sp, lineHeight = TextUnit.Unspecified, fontWeight = weight ?: style.fontWeight, textAlign = if (center) TextAlign.Center else TextAlign.Unspecified)

    fun text(s: String, maxW: Int = Constraints.Infinity, ellipsis: Boolean = false, maxLines: Int = 1, fixedW: Int? = null, st: TextStyle = style): TextLayoutResult =
        tm.measure(s, st, if (ellipsis) TextOverflow.Ellipsis else TextOverflow.Clip, maxLines > 1, maxLines, if (fixedW != null) Constraints(minWidth = fixedW, maxWidth = fixedW) else Constraints(maxWidth = maxW))

    /** Texto sobre un relleno: el de `text` o el de `surface`, el que más contraste dé (el ámbar no admite texto claro). */
    fun onFill(fill: Color): Color {
        fun ratio(a: Color, b: Color): Float { val l1 = a.luminance(); val l2 = b.luminance(); return (max(l1, l2) + 0.05f) / (min(l1, l2) + 0.05f) }
        return if (ratio(fill, c.surface) >= ratio(fill, c.text)) c.surface else c.text
    }
}

private fun emptyGeo() = OpsGeo(emptyList()) { }

private fun firstSeries(data: ZcChartData, coerce: Boolean = true): List<Double> = List(data.categories.size) { i ->
    val v = data.series.firstOrNull()?.values?.getOrElse(i) { 0.0 } ?: 0.0
    if (coerce) v.coerceAtLeast(0.0) else v
}

// ---------- Embudo ----------

private fun buildFunnel(e: OpsEnv, data: ZcChartData): OpsGeo {
    val n = data.categories.size
    if (n == 0) return emptyGeo()
    val vals = firstSeries(data)
    val mx = vals.max().takeIf { it > 0 } ?: 1.0
    val left = e.w * 0.04f; val pw = e.w * 0.78f; val cx = left + pw / 2f
    val top = e.px(8f); val gap = e.px(3f)
    val band = (e.h - 2 * top - gap * (n - 1)) / n
    fun wAt(v: Double) = pw * max(0.3f, (v / mx).toFloat())
    class Stage(val y0: Float, val y1: Float, val tw: Float, val bw: Float)
    val stages = List(n) { i -> val y0 = top + i * (band + gap); Stage(y0, y0 + band, wAt(vals[i]), wAt(vals.getOrElse(i + 1) { vals[i] })) }
    fun path(s: Stage) = Path().apply { moveTo(cx - s.tw / 2, s.y0); lineTo(cx + s.tw / 2, s.y0); lineTo(cx + s.bw / 2, s.y1); lineTo(cx - s.bw / 2, s.y1); close() }
    val labels = stages.mapIndexed { i, s ->
        val one = band < e.px(32f)
        val txt = if (one) "${data.categories[i]}  ${e.format(vals[i])}" else "${data.categories[i]}\n${e.format(vals[i])}"
        e.text(txt, ellipsis = true, maxLines = if (one) 1 else 3, fixedW = (min(s.tw, s.bw) - e.px(8f)).toInt().coerceAtLeast(1), st = e.st(12f, center = true))
    }
    val regions = stages.mapIndexed { i, s ->
        OpsRegion(Offset(cx + s.tw / 2, (s.y0 + s.y1) / 2), data.categories[i], listOf(TipRow(e.palette[i % e.palette.size], null, e.format(vals[i])))) { p ->
            p.y in s.y0..s.y1 && abs(p.x - cx) <= max(s.tw, s.bw) / 2
        }
    }
    return OpsGeo(regions) { sel ->
        stages.forEachIndexed { i, s ->
            val fill = e.palette[i % e.palette.size]
            drawPath(path(s), fill)
            if (sel == i) drawPath(path(s), e.c.text, style = Stroke(2.dp.toPx()))
            val l = labels[i]
            drawText(l, e.onFill(fill), Offset(cx - l.size.width / 2f, (s.y0 + s.y1) / 2f - l.size.height / 2f))
        }
    }
}

// ---------- Cascada ----------

private fun buildWaterfall(e: OpsEnv, data: ZcChartData): OpsGeo {
    val n = data.categories.size
    if (n == 0) return emptyGeo()
    val vals = firstSeries(data, coerce = false)
    val lo = DoubleArray(n); val hi = DoubleArray(n)
    var acc = 0.0
    for (i in 0 until n) {
        val v = vals[i]
        if (i == 0 || i == n - 1) { lo[i] = min(0.0, v); hi[i] = max(0.0, v); acc = v }
        else { val prev = acc; acc += v; lo[i] = min(prev, acc); hi[i] = max(prev, acc) }
    }
    val scale = zcNiceScale(lo.min(), hi.max(), 4)
    val ticks = scale.ticks.map { it to e.text(zcAxisShort(it)) }
    val tickW = ticks.maxOf { it.second.size.width }
    val left = tickW + e.px(12f); val right = e.w - e.px(12f)
    val slot = (right - left) / n
    // Cada etiqueta usa el ancho de su columna (hasta 80 dp) y, si una palabra no cabe, se parte con guion y no a media letra.
    val catMax = min(e.px(80f).toInt(), slot.toInt() - 2).coerceAtLeast(1)
    val catStyle = e.st(11f, center = true).copy(hyphens = Hyphens.Auto, lineBreak = LineBreak.Paragraph)
    val cats = data.categories.map { e.text(it, ellipsis = true, maxLines = 2, fixedW = catMax, st = catStyle) }
    val top = e.px(22f); val bottom = max(e.h - cats.maxOf { it.size.height } - e.px(10f), top + 1f)
    fun y(v: Double) = bottom - ((v - scale.min) / (scale.max - scale.min)).toFloat() * (bottom - top)
    val barW = min(slot * 0.7f, e.px(40f))
    fun cxOf(i: Int) = left + (i + 0.5f) * slot
    fun colorOf(i: Int) = if (i == 0) e.palette[0] else if (i == n - 1) e.c.successFg else if (vals[i] < 0) e.c.dangerFg else e.c.successFg
    val labels = List(n) { i -> e.text((if (i in 1 until n - 1 && vals[i] < 0) "−" else "") + e.format(abs(vals[i]))) }
    val regions = List(n) { i ->
        OpsRegion(Offset(cxOf(i) + barW / 2, y(hi[i])), data.categories[i], listOf(TipRow(colorOf(i), null, e.format(vals[i])))) { p -> p.x in (left + i * slot)..(left + (i + 1) * slot) && p.y in top..bottom }
    }
    return OpsGeo(regions) { sel ->
        val dash = PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 4.dp.toPx()))
        if (sel != null) drawRect(e.c.surface2, Offset(left + sel * slot, top), Size(slot, bottom - top))
        ticks.forEach { (v, l) ->
            val yy = y(v)
            if (v != 0.0) drawLine(e.c.border, Offset(left, yy), Offset(right, yy), 1.dp.toPx(), pathEffect = dash)
            drawText(l, e.c.textMuted, Offset(left - 8.dp.toPx() - l.size.width, (yy - l.size.height / 2f).coerceIn(0f, max(size.height - l.size.height, 0f))))
        }
        drawLine(e.c.border, Offset(left, y(0.0).coerceIn(top, bottom)), Offset(right, y(0.0).coerceIn(top, bottom)), 1.dp.toPx())
        for (i in 0 until n) {
            val x = cxOf(i) - barW / 2f
            val yTop = y(hi[i]); val yBottom = y(lo[i])
            val r = min(4.dp.toPx(), min(barW / 2f, abs(yBottom - yTop) / 2f))
            drawRoundRect(colorOf(i), Offset(x, yTop), Size(barW, max(yBottom - yTop, 1f)), CornerRadius(r))
            val l = labels[i]
            drawText(l, e.c.text, Offset(cxOf(i) - l.size.width / 2f, yTop - 4.dp.toPx() - l.size.height))
            val cl = cats[i]
            drawText(cl, e.c.textMuted, Offset(cxOf(i) - cl.size.width / 2f, bottom + 6.dp.toPx()))
        }
    }
}

// ---------- Rampa (mapa de calor y calendario) ----------

private fun DrawScope.drawRamp(e: OpsEnv, end: Color, centerX: Float, top: Float, less: TextLayoutResult, more: TextLayoutResult) {
    val barW = 120.dp.toPx(); val barH = 10.dp.toPx(); val gap = 8.dp.toPx()
    val total = less.size.width + gap + barW + gap + more.size.width
    val x0 = centerX - total / 2f
    drawText(less, e.c.textMuted, Offset(x0, top + barH / 2f - less.size.height / 2f))
    val bx = x0 + less.size.width + gap
    drawRoundRect(Brush.horizontalGradient(listOf(e.c.surface3, end), startX = bx, endX = bx + barW), Offset(bx, top), Size(barW, barH), CornerRadius(3.dp.toPx()))
    drawText(more, e.c.textMuted, Offset(bx + barW + gap, top + barH / 2f - more.size.height / 2f))
}

// ---------- Mapa de calor ----------

private fun buildHeatmap(e: OpsEnv, data: ZcChartData): OpsGeo {
    val rows = data.series; val cols = data.categories.size
    if (rows.isEmpty() || cols == 0) return emptyGeo()
    val mx = max(1.0, rows.maxOf { s -> s.values.maxOrNull() ?: 0.0 })
    val rowLabels = rows.map { e.text(it.name, e.px(80f).toInt(), true) }
    val colLabels = data.categories.map { e.text(it) }
    val colStep = if (e.narrow) 3 else 2
    val less = e.text(if (e.en) "Less" else "Menos", st = e.st(11f)); val more = e.text(if (e.en) "More" else "Más", st = e.st(11f))
    val left = rowLabels.maxOf { it.size.width } + e.px(8f); val right = e.w - e.px(8f)
    val legendH = e.px(10f); val legendGap = e.px(10f); val colH = colLabels.maxOf { it.size.height }
    val top = e.px(4f); val bottom = max(e.h - colH - e.px(8f) - legendH - legendGap - e.px(6f), top + 1f)
    val cw = (right - left) / cols; val ch = (bottom - top) / rows.size
    fun cell(x: Int, y: Int) = Rect(left + x * cw, top + y * ch, left + (x + 1) * cw, top + (y + 1) * ch)
    fun v(x: Int, y: Int) = rows[y].values.getOrElse(x) { 0.0 }
    val regions = buildList {
        for (y in rows.indices) for (x in 0 until cols) {
            val r = cell(x, y)
            add(OpsRegion(r.center, "${rows[y].name} ${data.categories[x]}", listOf(TipRow(null, null, e.format(v(x, y))))) { p -> r.contains(p) })
        }
    }
    return OpsGeo(regions) { sel ->
        val inset = 1.dp.toPx()
        for (y in rows.indices) for (x in 0 until cols) {
            val r = cell(x, y)
            val t = (v(x, y) / mx).toFloat().coerceIn(0f, 1f)
            drawRoundRect(lerp(e.c.surface3, e.palette[0], t), Offset(r.left + inset, r.top + inset), Size(r.width - 2 * inset, r.height - 2 * inset), CornerRadius(3.dp.toPx()))
        }
        if (sel != null) { val r = cell(sel % cols, sel / cols); drawRoundRect(e.c.text, Offset(r.left + inset, r.top + inset), Size(r.width - 2 * inset, r.height - 2 * inset), CornerRadius(3.dp.toPx()), style = Stroke(2.dp.toPx())) }
        rowLabels.forEachIndexed { y, l -> drawText(l, e.c.textMuted, Offset(left - 8.dp.toPx() - l.size.width, top + (y + 0.5f) * ch - l.size.height / 2f)) }
        colLabels.forEachIndexed { x, l -> if (x % colStep == 0) drawText(l, e.c.textMuted, Offset(left + (x + 0.5f) * cw - l.size.width / 2f, bottom + 6.dp.toPx())) }
        drawRamp(e, e.palette[0], size.width / 2f, bottom + 6.dp.toPx() + colH + legendGap, less, more)
    }
}

// ---------- Treemap ----------

/** Treemap "squarified": devuelve un rectángulo por valor (en el mismo orden) dentro de `area`. Los valores van de mayor a menor. */
internal fun zcSquarify(values: List<Double>, area: Rect): List<Rect> {
    val n = values.size
    val total = values.sum()
    if (n == 0 || total <= 0) return List(n) { Rect.Zero }
    val scale = area.width * area.height / total
    val areas = values.map { (it * scale) }
    val out = MutableList(n) { Rect.Zero }
    var cx = area.left; var cy = area.top; var cw = area.width; var ch = area.height
    var i = 0
    while (i < n) {
        val side = min(cw, ch)
        fun worst(from: Int, to: Int, sum: Double): Double {
            var mx = 0.0; var mn = Double.MAX_VALUE
            for (k in from until to) { mx = max(mx, areas[k].toDouble()); mn = min(mn, areas[k].toDouble()) }
            return max(side * side * mx / (sum * sum), sum * sum / (side * side * mn))
        }
        var j = i; var sum = 0.0; var best = Double.MAX_VALUE
        while (j < n) {
            val s = sum + areas[j]
            val w = worst(i, j + 1, s)
            if (j > i && w > best) break
            best = w; sum = s; j++
        }
        val thick = (sum / side).toFloat()
        if (cw >= ch) {
            var yy = cy
            for (k in i until j) { val hh = (areas[k] / thick).toFloat(); out[k] = Rect(cx, yy, cx + thick, yy + hh); yy += hh }
            cx += thick; cw -= thick
        } else {
            var xx = cx
            for (k in i until j) { val ww = (areas[k] / thick).toFloat(); out[k] = Rect(xx, cy, xx + ww, cy + thick); xx += ww }
            cy += thick; ch -= thick
        }
        i = j
    }
    return out
}

private fun buildTreemap(e: OpsEnv, data: ZcChartData): OpsGeo {
    val vals = firstSeries(data)
    val order = vals.indices.filter { vals[it] > 0 }.sortedByDescending { vals[it] }
    if (order.isEmpty()) return emptyGeo()
    val rects = zcSquarify(order.map { vals[it] }, Rect(0f, 0f, e.w, e.h))
    val gap = e.px(1f)
    val inner = rects.map { Rect(it.left + gap, it.top + gap, it.right - gap, it.bottom - gap) }
    val labels = order.mapIndexed { k, idx ->
        val r = inner[k]
        if (r.width >= e.px(64f) && r.height >= e.px(36f)) e.text("${data.categories[idx]}\n${e.format(vals[idx])}", ellipsis = true, maxLines = 2, maxW = (r.width - e.px(16f)).toInt(), st = e.st(12f)) else null
    }
    val regions = order.mapIndexed { k, idx ->
        OpsRegion(inner[k].center, data.categories[idx], listOf(TipRow(e.palette[idx % e.palette.size], null, e.format(vals[idx])))) { p -> inner[k].contains(p) }
    }
    return OpsGeo(regions) { sel ->
        order.forEachIndexed { k, idx ->
            val r = inner[k]; val fill = e.palette[idx % e.palette.size]
            drawRect(fill, r.topLeft, r.size)
            if (sel == k) drawRect(e.c.text, r.topLeft, r.size, style = Stroke(2.dp.toPx()))
            labels[k]?.let { drawText(it, e.onFill(fill), Offset(r.left + 8.dp.toPx(), r.top + 6.dp.toPx())) }
        }
    }
}

// ---------- Calendario ----------

private fun buildCalendar(e: OpsEnv, data: ZcChartData): OpsGeo {
    val vals = firstSeries(data)
    val dates = data.categories.map { runCatching { LocalDate.parse(it) }.getOrNull() }
    val year = dates.firstOrNull { it != null }?.year ?: return emptyGeo()
    val jan1 = LocalDate.of(year, 1, 1)
    val offset = jan1.dayOfWeek.value - 1 // el lunes abre la semana
    val len = jan1.lengthOfYear()
    val weeks = (len - 1 + offset) / 7 + 1
    val cellH = e.px(if (e.narrow) 9f else 13f)
    val left = e.px(36f); val right = e.w - e.px(8f); val top = e.px(24f)
    val cw = (right - left) / weeks
    val mx = max(1.0, vals.max())
    fun rectAt(dayIndex: Int): Rect { val wk = (dayIndex + offset) / 7; val row = (dayIndex + offset) % 7; return Rect(left + wk * cw, top + row * cellH, left + (wk + 1) * cw, top + (row + 1) * cellH) }
    val months = if (e.en) listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec") else listOf("Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic")
    val monthLabels = (1..12).map { m -> (LocalDate.of(year, m, 1).dayOfYear - 1 + offset) / 7 to e.text(months[m - 1], st = e.st(11f)) }
    val dayNames = if (e.en) listOf("M", "T", "W", "T", "F", "S", "S") else listOf("L", "M", "X", "J", "V", "S", "D")
    val dayLabels = dayNames.map { e.text(it, st = e.st(10f)) }
    val less = e.text(if (e.en) "Less" else "Menos", st = e.st(11f)); val more = e.text(if (e.en) "More" else "Más", st = e.st(11f))
    val entries = dates.mapIndexedNotNull { i, d -> if (d != null && d.year == year) i to rectAt(d.dayOfYear - 1) else null }
    val slop = e.px(1f)
    val regions = entries.map { (i, r) -> OpsRegion(r.center, data.categories[i], listOf(TipRow(null, null, e.format(vals[i])))) { p -> r.inflate(slop).contains(p) } }
    return OpsGeo(regions) { sel ->
        val inset = 0.75f.dp.toPx()
        for (i in 0 until len) { val r = rectAt(i); drawRect(e.c.surface2, Offset(r.left + inset, r.top + inset), Size(r.width - 2 * inset, r.height - 2 * inset)) }
        entries.forEach { (i, r) ->
            drawRect(lerp(e.c.surface3, e.palette[1], (vals[i] / mx).toFloat().coerceIn(0f, 1f)), Offset(r.left + inset, r.top + inset), Size(r.width - 2 * inset, r.height - 2 * inset))
        }
        if (sel != null) entries.getOrNull(sel)?.second?.let { r -> drawRect(e.c.text, Offset(r.left, r.top), r.size, style = Stroke(1.5f.dp.toPx())) }
        dayLabels.forEachIndexed { row, l -> if (!e.narrow || row % 2 == 0) drawText(l, e.c.textMuted, Offset(left - 6.dp.toPx() - l.size.width, top + (row + 0.5f) * cellH - l.size.height / 2f)) }
        var lastEnd = -1f
        monthLabels.forEach { (wk, l) ->
            val x = left + wk * cw
            if (x >= lastEnd + 4.dp.toPx()) { drawText(l, e.c.textMuted, Offset(x, top - 6.dp.toPx() - l.size.height)); lastEnd = x + l.size.width }
        }
        drawRamp(e, e.palette[1], size.width / 2f, top + 7 * cellH + 14.dp.toPx(), less, more)
    }
}

// ---------- Sankey ----------

private fun bez(a: Float, b: Float, c: Float, d: Float, t: Float): Float { val u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d }

private fun buildSankey(e: OpsEnv, data: ZcChartData): OpsGeo {
    val vals = firstSeries(data)
    class L(val s: Int, val t: Int, val v: Double)
    val names = mutableListOf<String>()
    fun id(name: String): Int { val k = names.indexOf(name); if (k >= 0) return k; names.add(name); return names.size - 1 }
    val links = data.categories.mapIndexedNotNull { i, c ->
        val p = c.split(" → ")
        if (p.size == 2 && vals[i] > 0) { val s = id(p[0]); val t = id(p[1]); L(s, t, vals[i]) } else null
    }
    if (links.isEmpty()) return emptyGeo()
    val count = names.size
    val depth = IntArray(count)
    repeat(count) { for (l in links) if (depth[l.t] < depth[l.s] + 1) depth[l.t] = depth[l.s] + 1 }
    val outSum = DoubleArray(count); val inSum = DoubleArray(count)
    for (l in links) { outSum[l.s] += l.v; inSum[l.t] += l.v }
    val nodeV = DoubleArray(count) { max(outSum[it], inSum[it]) }
    val cols = depth.max() + 1
    val left = e.px(4f); val right = e.w - e.px(if (e.narrow) 70f else 100f); val top = e.px(8f); val bottom = e.h - e.px(8f)
    val nodeW = e.px(12f); val gap = e.px(12f)
    val k = (0 until cols).minOf { c ->
        val idx = (0 until count).filter { depth[it] == c }
        val sum = idx.sumOf { nodeV[it] }
        if (sum <= 0) Float.MAX_VALUE else (bottom - top - gap * (idx.size - 1)) / sum.toFloat()
    }
    val nx = FloatArray(count); val ny = FloatArray(count); val nh = FloatArray(count)
    for (c in 0 until cols) {
        var y = top
        for (i in (0 until count).filter { depth[it] == c }) {
            nx[i] = if (cols == 1) left else left + c * (right - left - nodeW) / (cols - 1)
            ny[i] = y; nh[i] = max(nodeV[i].toFloat() * k, e.px(2f)); y += nh[i] + gap
        }
    }
    val th = FloatArray(links.size) { links[it].v.toFloat() * k }
    val sy = FloatArray(links.size); val ey = FloatArray(links.size)
    for (i in 0 until count) {
        var o = ny[i]
        links.indices.filter { links[it].s == i }.sortedBy { ny[links[it].t] }.forEach { li -> sy[li] = o; o += th[li] }
        var q = ny[i]
        links.indices.filter { links[it].t == i }.sortedBy { ny[links[it].s] }.forEach { li -> ey[li] = q; q += th[li] }
    }
    val labels = names.mapIndexed { i, nm -> e.text(nm, ellipsis = true, maxW = max(1f, e.w - (nx[i] + nodeW + e.px(6f))).toInt(), st = e.st(12f)) }
    fun linkContains(li: Int, p: Offset): Boolean {
        val l = links[li]; val sx = nx[l.s] + nodeW; val ex = nx[l.t]
        if (ex <= sx || p.x < sx || p.x > ex) return false
        var lo = 0f; var hi = 1f
        repeat(20) { val t = (lo + hi) / 2; if (bez(sx, (sx + ex) / 2, (sx + ex) / 2, ex, t) < p.x) lo = t else hi = t }
        val yTop = bez(sy[li], sy[li], ey[li], ey[li], (lo + hi) / 2)
        return p.y in yTop..(yTop + th[li])
    }
    val nodeRegions = (0 until count).map { i ->
        val r = Rect(nx[i] - e.px(4f), ny[i], nx[i] + nodeW + e.px(4f), ny[i] + nh[i])
        OpsRegion(Offset(nx[i] + nodeW, ny[i] + nh[i] / 2f), names[i], listOf(TipRow(e.palette[i % e.palette.size], null, e.format(nodeV[i])))) { p -> r.contains(p) }
    }
    val linkRegions = links.indices.map { li ->
        val l = links[li]; val sx = nx[l.s] + nodeW; val ex = nx[l.t]
        OpsRegion(Offset((sx + ex) / 2, (sy[li] + ey[li] + th[li]) / 2), "${names[l.s]} → ${names[l.t]}", listOf(TipRow(null, null, e.format(l.v)))) { p -> linkContains(li, p) }
    }
    return OpsGeo(nodeRegions + linkRegions) { sel ->
        links.indices.forEach { li ->
            val l = links[li]; val sx = nx[l.s] + nodeW; val ex = nx[l.t]
            if (ex <= sx) return@forEach
            val mid = (sx + ex) / 2
            val path = Path().apply {
                moveTo(sx, sy[li]); cubicTo(mid, sy[li], mid, ey[li], ex, ey[li]); lineTo(ex, ey[li] + th[li])
                cubicTo(mid, ey[li] + th[li], mid, sy[li] + th[li], sx, sy[li] + th[li]); close()
            }
            val a = if (sel == count + li) 0.65f else 0.35f
            drawPath(path, Brush.horizontalGradient(listOf(e.palette[l.s % e.palette.size].copy(alpha = a), e.palette[l.t % e.palette.size].copy(alpha = a)), startX = sx, endX = ex))
        }
        for (i in 0 until count) {
            drawRect(e.palette[i % e.palette.size], Offset(nx[i], ny[i]), Size(nodeW, nh[i]))
            if (sel == i) drawRect(e.c.text, Offset(nx[i], ny[i]), Size(nodeW, nh[i]), style = Stroke(2.dp.toPx()))
            val l = labels[i]
            drawText(l, e.c.text, Offset(nx[i] + nodeW + 6.dp.toPx(), ny[i] + nh[i] / 2f - l.size.height / 2f))
        }
    }
}

// ---------- Medidor ----------

private fun buildGauge(e: OpsEnv, data: ZcChartData): OpsGeo {
    val vals = data.series.firstOrNull()?.values.orEmpty()
    val done = vals.getOrElse(0) { 0.0 }
    val goal = vals.getOrElse(1) { 1.0 }.takeIf { it != 0.0 } ?: 1.0
    val pct = (done / goal * 100).roundToInt()
    val r = 0.92f * min(e.w, e.h) / 2f
    val cx = e.w / 2f; val cy = e.h * 0.62f
    val sw = e.px(16f); val mid = r - sw / 2f
    val big = e.text("$pct %", st = e.st(28f, FontWeight.SemiBold))
    val detail = "${e.format(done)} / ${e.format(goal)}"
    val small = e.text(detail, st = e.st(13f))
    val region = OpsRegion(Offset(cx, cy - r), null, listOf(TipRow(e.palette[0], null, "$detail ($pct %)"))) { p ->
        val dist = hypot(p.x - cx, p.y - cy)
        var a = Math.toDegrees(atan2(p.y - cy, p.x - cx).toDouble()).toFloat(); if (a < 0) a += 360f
        dist in (r - sw - e.px(6f))..(r + e.px(6f)) && (a >= 160f || a <= 20f)
    }
    return OpsGeo(listOf(region)) { _ ->
        val tl = Offset(cx - mid, cy - mid); val sz = Size(mid * 2, mid * 2)
        drawArc(e.c.surface3, 160f, 220f, false, tl, sz, style = Stroke(sw, cap = StrokeCap.Round))
        val prog = 220f * pct.coerceIn(0, 100) / 100f
        if (prog > 0f) drawArc(e.palette[0], 160f, prog, false, tl, sz, style = Stroke(sw, cap = StrokeCap.Round))
        drawText(big, e.c.text, Offset(cx - big.size.width / 2f, cy - 0.05f * r - big.size.height / 2f))
        drawText(small, e.c.textMuted, Offset(cx - small.size.width / 2f, cy + 0.30f * r - small.size.height / 2f))
    }
}

private fun buildOps(kind: ZcChartKind, data: ZcChartData, e: OpsEnv): OpsGeo = when (kind) {
    ZcChartKind.FUNNEL -> buildFunnel(e, data)
    ZcChartKind.WATERFALL -> buildWaterfall(e, data)
    ZcChartKind.HEATMAP -> buildHeatmap(e, data)
    ZcChartKind.TREEMAP -> buildTreemap(e, data)
    ZcChartKind.CALENDAR -> buildCalendar(e, data)
    ZcChartKind.SANKEY -> buildSankey(e, data)
    ZcChartKind.GAUGE -> buildGauge(e, data)
    else -> emptyGeo()
}

internal fun zcOpsHeight(kind: ZcChartKind, data: ZcChartData, narrow: Boolean): Dp = when (kind) {
    ZcChartKind.FUNNEL -> (data.categories.size * 52 + 16).dp
    ZcChartKind.WATERFALL -> 240.dp
    ZcChartKind.HEATMAP -> (data.series.size * 30 + 96).dp
    ZcChartKind.CALENDAR -> (24 + 7 * (if (narrow) 9 else 13) + 48).dp
    ZcChartKind.SANKEY -> 260.dp
    ZcChartKind.GAUGE -> 200.dp
    else -> 220.dp
}

@Composable
internal fun OpsBody(data: ZcChartData, kind: ZcChartKind, narrow: Boolean, format: (Double) -> String, description: String?, height: Dp?, palette: List<Color>, initialSelection: Int?) {
    val c = ZonacardsTheme.colors
    val d = LocalDensity.current
    val tm = rememberTextMeasurer()
    val fam = LocalZcFontFamily.current
    val style = ZcTextTw.xs.copy(fontFamily = fam, fontSize = if (narrow) 11.sp else 12.sp)
    var boxSize by remember { mutableStateOf(IntSize.Zero) }
    var sel by remember(data, kind) { mutableStateOf(initialSelection) }
    val en = Locale.getDefault().language == "en"
    val geo = remember(kind, data, boxSize, narrow, d.density, d.fontScale, fam, format, c) {
        if (boxSize.width <= 0 || boxSize.height <= 0) null else buildOps(kind, data, OpsEnv(c, palette, format, narrow, d, tm, style, boxSize, en))
    }
    val summary = remember(description, data, kind, format) { chartSummary(description, data, kind, format) }
    Box(
        Modifier.fillMaxWidth().height(height ?: zcOpsHeight(kind, data, narrow)).onSizeChanged { boxSize = it }
            .pointerInput(geo) { detectTapGestures { p -> val i = geo?.regions?.indexOfFirst { it.contains(p) }?.takeIf { it >= 0 }; sel = if (i == sel) null else i } }
            .clearAndSetSemantics { contentDescription = summary; role = Role.Image },
    ) {
        Canvas(Modifier.fillMaxSize()) { geo?.let { g -> g.draw(this, sel?.takeIf { it < g.regions.size }) } }
        val g = geo
        val region = sel?.let { g?.regions?.getOrNull(it) }
        if (region != null) ChartTooltip(region.anchor, boxSize, region.title, region.rows)
    }
}
