package com.zonacards.ui.compose

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.hypot
import kotlin.math.log10
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt

/** Serie de un gráfico. `dashed`: periodo anterior (línea punteada en gris). */
data class ZcChartSeries(val name: String, val values: List<Double>, val dashed: Boolean = false)

/** Mismos datos que `ChartData` de la web: categorías y series con un valor por categoría. */
data class ZcChartData(val categories: List<String>, val series: List<ZcChartSeries>)

/**
 * Tipos de la web: línea, barras horizontales (una serie, el mayor destacado), apiladas y dona; y los de operación
 * (embudo, cascada, mapa de calor, treemap, calendario, sankey y medidor), con la misma forma de datos (ver ZcChartOps.kt).
 */
enum class ZcChartKind { LINE, BAR_H, STACKED, DONUT, FUNNEL, WATERFALL, HEATMAP, TREEMAP, CALENDAR, SANKEY, GAUGE }

/** `hasData` de la web: hay categorías y al menos un valor distinto de cero. */
fun zcChartHasData(d: ZcChartData?): Boolean = d != null && d.categories.isNotEmpty() && d.series.any { s -> s.values.any { it != 0.0 } }

private fun chartLocale() = if (Locale.getDefault().language == "en") Locale.US else Locale.forLanguageTag("es-PE")

/** Abrevia ejes como la web: 1 240 → 1,2K; 3 500 000 → 3,5M. */
fun zcAxisShort(v: Double): String {
    val f = NumberFormat.getNumberInstance(chartLocale()).apply { maximumFractionDigits = 1 }
    val abs = kotlin.math.abs(v)
    return when {
        abs >= 1e6 -> f.format(v / 1e6) + "M"
        abs >= 1e3 -> f.format(v / 1e3) + "K"
        else -> f.format(v)
    }
}

internal class ZcScale(val min: Double, val max: Double, val step: Double) {
    val ticks: List<Double> get() = (0..((max - min) / step).roundToInt()).map { min + it * step }
}

/** Escala "bonita": el paso es 1, 2, 5 o 10 por una potencia de 10 y el rango siempre incluye el cero. */
internal fun zcNiceScale(lo: Double, hi: Double, target: Int): ZcScale {
    val min0 = min(lo, 0.0)
    val max0 = max(hi, 0.0)
    val span = (max0 - min0).takeIf { it > 0 } ?: 1.0
    val raw = span / target
    val mag = 10.0.pow(floor(log10(raw)))
    val n = raw / mag
    val step = (if (n <= 1) 1.0 else if (n <= 2) 2.0 else if (n <= 5) 5.0 else 10.0) * mag
    val lowest = floor(min0 / step) * step
    var highest = ceil(max0 / step) * step
    if (highest <= lowest) highest = lowest + step // todo en cero: un rango vacío dividiría por cero al dibujar
    return ZcScale(lowest, highest, step)
}

private val ZcColorsPalette @Composable get() = ZonacardsTheme.colors.let { listOf(it.chart1, it.chart2, it.chart3, it.chart4, it.chart5, it.chart6) }

private fun seriesColor(palette: List<Color>, i: Int, s: ZcChartSeries) = if (s.dashed) palette[5] else palette[i % palette.size]

internal fun chartSummary(title: String?, data: ZcChartData, kind: ZcChartKind, format: (Double) -> String): String = buildString {
    if (!title.isNullOrBlank()) append(title).append(". ")
    fun top(pairs: List<Pair<String, Double>>) = pairs.sortedByDescending { it.second }.take(8).joinToString("; ") { "${it.first}: ${format(it.second)}" }
    when (kind) {
        // Una celda por hora y día (o por día del año): el resumen solo nombra las mayores; la tabla Datos lo trae completo.
        ZcChartKind.HEATMAP -> append(top(data.series.flatMap { s -> data.categories.mapIndexed { i, c -> "${s.name} $c" to s.values.getOrElse(i) { 0.0 } } }))
        ZcChartKind.CALENDAR -> { val v = data.series.firstOrNull()?.values.orEmpty(); append(top(data.categories.mapIndexed { i, c -> c to v.getOrElse(i) { 0.0 } })) }
        ZcChartKind.GAUGE -> {
            val v = data.series.firstOrNull()?.values.orEmpty()
            val pct = (v.getOrElse(0) { 0.0 } / (v.getOrElse(1) { 1.0 }.takeIf { it != 0.0 } ?: 1.0) * 100).roundToInt()
            append(data.categories.mapIndexed { i, c -> "$c: ${format(v.getOrElse(i) { 0.0 })}" }.joinToString("; ")).append(" ($pct %)")
        }
        ZcChartKind.FUNNEL, ZcChartKind.WATERFALL, ZcChartKind.TREEMAP, ZcChartKind.SANKEY -> {
            val s = data.series.firstOrNull()
            append(data.categories.mapIndexed { i, c -> "$c: ${format(s?.values?.getOrElse(i) { 0.0 } ?: 0.0)}" }.joinToString("; "))
        }
        ZcChartKind.DONUT -> {
            val v = data.series.firstOrNull()?.values.orEmpty()
            val total = v.sum()
            append(data.categories.mapIndexed { i, c -> val x = v.getOrElse(i) { 0.0 }; "$c: ${format(x)}" + if (total > 0) " (${(x / total * 100).roundToInt()} %)" else "" }.joinToString("; "))
        }
        ZcChartKind.BAR_H -> {
            val s = data.series.firstOrNull()
            append(data.categories.mapIndexed { i, c -> "$c: ${format(s?.values?.getOrElse(i) { 0.0 } ?: 0.0)}" }.joinToString("; "))
        }
        else -> append(data.categories.mapIndexed { i, c -> c + ": " + data.series.joinToString(", ") { s -> "${s.name} ${format(s.values.getOrElse(i) { 0.0 })}" } }.joinToString("; "))
    }
}

internal class TipRow(val color: Color?, val label: String?, val value: String)

/** Globo al tocar: junto al punto, a la derecha si cabe y a la izquierda si no; nunca fuera del gráfico. */
@Composable
internal fun BoxScope.ChartTooltip(anchor: Offset, bounds: IntSize, title: String?, rows: List<TipRow>) {
    val c = ZonacardsTheme.colors
    val gap = with(LocalDensity.current) { 12.dp.roundToPx() }
    var sz by remember { mutableStateOf(IntSize.Zero) }
    val x = (if (anchor.x + gap + sz.width <= bounds.width) anchor.x + gap else anchor.x - gap - sz.width).toInt().coerceIn(0, (bounds.width - sz.width).coerceAtLeast(0))
    val y = (anchor.y - sz.height / 2f).toInt().coerceIn(0, (bounds.height - sz.height).coerceAtLeast(0))
    val shape = RoundedCornerShape(ZcRadius.sm)
    Column(
        Modifier.align(Alignment.TopStart).offset { IntOffset(x, y) }.onSizeChanged { sz = it }
            .shadow(4.dp, shape).clip(shape).background(c.surface).border(1.dp, c.border, shape)
            .padding(horizontal = 12.dp, vertical = 8.dp).widthIn(max = 220.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        if (title != null) ZcText(title, style = ZcTextTw.xs, color = c.textMuted)
        rows.forEach { r ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                if (r.color != null) Box(Modifier.size(8.dp).clip(CircleShape).background(r.color))
                if (r.label != null) ZcText(r.label, Modifier.weight(1f, fill = false), style = ZcTextTw.xs, color = c.textMuted)
                ZcText(r.value, style = ZcTextTw.xs, weight = ZcWeight.semibold, color = c.text)
            }
        }
    }
}

// ---------- Geometría de los gráficos con ejes ----------

private class AxisGeo(
    val kind: ZcChartKind,
    val n: Int,
    val plot: Rect,
    val scale: ZcScale,
    val ticks: List<Pair<Double, TextLayoutResult>>,
    val catLabels: List<Pair<Int, TextLayoutResult>>,
    val vals: List<Double>,
    val valueLabels: List<TextLayoutResult>,
) {
    /** Valor → coordenada: y en los verticales, x en las barras horizontales. */
    fun at(v: Double): Float {
        val k = ((v - scale.min) / (scale.max - scale.min)).toFloat()
        return if (kind == ZcChartKind.BAR_H) plot.left + k * plot.width else plot.bottom - k * plot.height
    }

    fun cx(i: Int): Float = when {
        kind == ZcChartKind.LINE -> if (n == 1) plot.center.x else plot.left + i * plot.width / (n - 1)
        else -> plot.left + (i + 0.5f) * plot.width / n
    }

    fun cy(i: Int): Float = plot.top + (i + 0.5f) * plot.height / n

    fun hit(p: Offset): Int? = when (kind) {
        ZcChartKind.LINE -> if (p.x < plot.left - 12f || p.x > plot.right + 12f) null else if (n == 1) 0 else ((p.x - plot.left) / (plot.width / (n - 1))).roundToInt().coerceIn(0, n - 1)
        ZcChartKind.STACKED -> if (p.x < plot.left || p.x > plot.right) null else ((p.x - plot.left) / (plot.width / n)).toInt().coerceIn(0, n - 1)
        ZcChartKind.BAR_H -> if (p.y < plot.top || p.y > plot.bottom) null else ((p.y - plot.top) / (plot.height / n)).toInt().coerceIn(0, n - 1)
        else -> null
    }

    fun anchor(i: Int): Offset = when (kind) {
        ZcChartKind.BAR_H -> Offset(at(vals[i]), cy(i))
        else -> Offset(cx(i), plot.top + plot.height / 3f)
    }
}

private fun buildAxisGeo(kind: ZcChartKind, data: ZcChartData, size: IntSize, d: Density, tm: TextMeasurer, style: TextStyle, narrow: Boolean, format: (Double) -> String): AxisGeo? = with(d) {
    val n = data.categories.size
    if (size.width <= 0 || size.height <= 0 || n == 0) return null
    fun measure(s: String, maxW: Int = Constraints.Infinity, ellipsis: Boolean = false) =
        tm.measure(s, style, if (ellipsis) TextOverflow.Ellipsis else TextOverflow.Clip, false, 1, Constraints(maxWidth = maxW))

    if (kind == ZcChartKind.BAR_H) {
        val vals = List(n) { (data.series.firstOrNull()?.values?.getOrElse(it) { 0.0 } ?: 0.0).coerceAtLeast(0.0) }
        val scale = zcNiceScale(0.0, vals.max(), if (narrow) 3 else 5)
        val ticks = scale.ticks.map { it to measure(zcAxisShort(it)) }
        val cats = data.categories.map { measure(it, (if (narrow) 80 else 120).dp.toPx().toInt(), true) }
        val valueLabels = vals.map { measure(format(it)) }
        val left = cats.maxOf { it.size.width } + 12.dp.toPx()
        val right = max(size.width - (valueLabels.maxOf { it.size.width } + 12.dp.toPx()), left + 1f)
        val bottom = max(size.height - ticks.first().second.size.height - 10.dp.toPx(), 8.dp.toPx() + 1f)
        return AxisGeo(kind, n, Rect(left, 4.dp.toPx(), right, bottom), scale, ticks, cats.mapIndexed { i, l -> i to l }, vals, valueLabels)
    }

    val all = data.series.flatMap { it.values }
    val lo: Double
    val hi: Double
    if (kind == ZcChartKind.STACKED) {
        lo = 0.0; hi = (0 until n).maxOf { i -> data.series.sumOf { s -> s.values.getOrElse(i) { 0.0 }.coerceAtLeast(0.0) } }
    } else { lo = all.minOrNull() ?: 0.0; hi = all.maxOrNull() ?: 0.0 }
    val scale = zcNiceScale(lo, hi, 4)
    val ticks = scale.ticks.map { it to measure(zcAxisShort(it)) }
    val labelW = ticks.maxOf { it.second.size.width }
    val labelH = ticks.first().second.size.height
    val left = labelW + 12.dp.toPx()
    val right = size.width - (if (narrow) 8 else 16).dp.toPx()
    val top = labelH / 2f + 2.dp.toPx()
    val bottom = max(size.height - labelH - 10.dp.toPx(), top + 1f)
    val plot = Rect(left, top, max(right, left + 1f), bottom)
    val cats = data.categories.map { measure(it) }
    val slot = if (kind == ZcChartKind.LINE && n > 1) plot.width / (n - 1) else plot.width / n
    val maxCw = cats.maxOf { it.size.width }
    val lineCap = if (kind == ZcChartKind.LINE) ceil(n / (if (narrow) 4f else 7f)).toInt() else 1
    val every = max(1, max(lineCap, ceil((maxCw + 8.dp.toPx()) / slot).toInt()))
    return AxisGeo(kind, n, plot, scale, ticks, cats.mapIndexedNotNull { i, l -> if (i % every == 0) i to l else null }, emptyList(), emptyList())
}

private fun smoothPath(into: Path, pts: List<Offset>) {
    if (pts.isEmpty()) return
    into.moveTo(pts[0].x, pts[0].y)
    for (i in 0 until pts.size - 1) {
        val p0 = pts.getOrElse(i - 1) { pts[i] }; val p1 = pts[i]; val p2 = pts[i + 1]; val p3 = pts.getOrElse(i + 2) { p2 }
        val lo = min(p1.y, p2.y); val hi = max(p1.y, p2.y)
        val s = 0.15f
        into.cubicTo(p1.x + (p2.x - p0.x) * s, (p1.y + (p2.y - p0.y) * s).coerceIn(lo, hi), p2.x - (p3.x - p1.x) * s, (p2.y - (p3.y - p1.y) * s).coerceIn(lo, hi), p2.x, p2.y)
    }
}

private fun DrawScope.drawAxes(g: AxisGeo, border: Color, label: Color) {
    val dash = PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 4.dp.toPx()))
    val sw = 1.dp.toPx()
    if (g.kind == ZcChartKind.BAR_H) {
        g.ticks.forEach { (v, l) ->
            val x = g.at(v)
            if (v != 0.0) drawLine(border, Offset(x, g.plot.top), Offset(x, g.plot.bottom), sw, pathEffect = dash)
            drawText(l, label, Offset((x - l.size.width / 2f).coerceIn(0f, max(size.width - l.size.width, 0f)), g.plot.bottom + 6.dp.toPx()))
        }
        drawLine(border, Offset(g.plot.left, g.plot.top), Offset(g.plot.left, g.plot.bottom), sw)
        g.catLabels.forEach { (i, l) -> drawText(l, label, Offset(g.plot.left - 8.dp.toPx() - l.size.width, g.cy(i) - l.size.height / 2f)) }
        return
    }
    g.ticks.forEach { (v, l) ->
        val y = g.at(v)
        if (v != 0.0) drawLine(border, Offset(g.plot.left, y), Offset(g.plot.right, y), sw, pathEffect = dash)
        drawText(l, label, Offset(g.plot.left - 8.dp.toPx() - l.size.width, (y - l.size.height / 2f).coerceIn(0f, max(size.height - l.size.height, 0f))))
    }
    val y0 = g.at(0.0).coerceIn(g.plot.top, g.plot.bottom)
    drawLine(border, Offset(g.plot.left, y0), Offset(g.plot.right, y0), sw)
    g.catLabels.forEach { (i, l) -> drawText(l, label, Offset((g.cx(i) - l.size.width / 2f).coerceIn(0f, max(size.width - l.size.width, 0f)), g.plot.bottom + 6.dp.toPx())) }
}

private fun roundedTop(l: Float, t: Float, r: Float, b: Float, rad: Float): Path = Path().apply {
    val k = min(rad, min((r - l) / 2f, (b - t) / 2f)).coerceAtLeast(0f)
    addRoundRect(RoundRect(Rect(l, t, r, b), topLeft = CornerRadius(k), topRight = CornerRadius(k)))
}

private fun roundedRight(l: Float, t: Float, r: Float, b: Float, rad: Float): Path = Path().apply {
    val k = min(rad, min((r - l) / 2f, (b - t) / 2f)).coerceAtLeast(0f)
    addRoundRect(RoundRect(Rect(l, t, r, b), topRight = CornerRadius(k), bottomRight = CornerRadius(k)))
}

@Composable
private fun ChartMark(kind: String, color: Color) {
    when (kind) {
        "dash" -> Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) { repeat(2) { Box(Modifier.width(7.dp).height(3.dp).clip(CircleShape).background(color)) } }
        "box" -> Box(Modifier.size(10.dp).clip(RoundedCornerShape(2.dp)).background(color))
        else -> Box(Modifier.width(16.dp).height(3.dp).clip(CircleShape).background(color))
    }
}

/** Leyenda sobre el gráfico de línea y apiladas (marca de línea, guion o cuadro y nombre). Decorativa: el resumen del gráfico ya nombra las series. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ChartLegend(data: ZcChartData, kind: ZcChartKind, palette: List<Color>) {
    val c = ZonacardsTheme.colors
    FlowRow(Modifier.fillMaxWidth().clearAndSetSemantics { }, horizontalArrangement = Arrangement.spacedBy(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        data.series.forEachIndexed { i, s ->
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                ChartMark(if (kind == ZcChartKind.LINE) (if (s.dashed) "dash" else "line") else "box", seriesColor(palette, i, s))
                ZcText(s.name, style = ZcTextTw.xs, color = c.textMuted)
            }
        }
    }
}

/**
 * Gráfico (zc-chart) dibujado a mano con los tokens `chart-1…6`: línea (con área suave en la primera serie y punteada para el
 * periodo anterior), barras horizontales (el mayor en el color principal y el resto en neutro), apiladas y dona (total al centro).
 * Al tocar o deslizar aparece el globo con los valores. El ejemplo de lectura para TalkBack es el resumen (`description` + valores);
 * la alternativa completa es la vista Datos de [ZcChartPanel].
 */
@Composable
fun ZcChart(
    data: ZcChartData,
    kind: ZcChartKind,
    modifier: Modifier = Modifier,
    format: (Double) -> String = ::zcAxisShort,
    description: String? = null,
    totalLabel: String = "",
    height: Dp? = null,
    initialSelection: Int? = null,
) {
    val palette = ZcColorsPalette
    BoxWithConstraints(modifier.fillMaxWidth()) {
        val avail = maxWidth
        val narrow = avail < 480.dp
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (kind == ZcChartKind.LINE || kind == ZcChartKind.STACKED) ChartLegend(data, kind, palette)
            when (kind) {
                ZcChartKind.DONUT -> DonutBody(data, narrow, avail, format, description, totalLabel, palette, initialSelection)
                ZcChartKind.LINE, ZcChartKind.BAR_H, ZcChartKind.STACKED -> AxisBody(data, kind, narrow, format, description, height, palette, initialSelection)
                else -> OpsBody(data, kind, narrow, format, description, height, palette, initialSelection)
            }
        }
    }
}

@Composable
private fun AxisBody(data: ZcChartData, kind: ZcChartKind, narrow: Boolean, format: (Double) -> String, description: String?, height: Dp?, palette: List<Color>, initialSelection: Int?) {
    val c = ZonacardsTheme.colors
    val d = LocalDensity.current
    val tm = rememberTextMeasurer()
    val fam = LocalZcFontFamily.current
    val style = ZcTextTw.xs.copy(fontFamily = fam, fontSize = if (narrow) 11.sp else 12.sp)
    var boxSize by remember { mutableStateOf(IntSize.Zero) }
    var sel by remember(data, kind) { mutableStateOf(initialSelection) }
    val geo = remember(kind, data, boxSize, narrow, d.density, d.fontScale, fam, format) { buildAxisGeo(kind, data, boxSize, d, tm, style, narrow, format) }
    val summary = remember(description, data, kind, format) { chartSummary(description, data, kind, format) }
    val h = height ?: if (kind == ZcChartKind.BAR_H) 36.dp * data.categories.size + 32.dp else 220.dp
    Box(
        Modifier.fillMaxWidth().height(h).onSizeChanged { boxSize = it }
            .pointerInput(geo) { detectTapGestures { p -> val i = geo?.hit(p); sel = if (i == sel) null else i } }
            .pointerInput(geo) { detectHorizontalDragGestures(onDragStart = { sel = geo?.hit(it) }, onHorizontalDrag = { ch, _ -> sel = geo?.hit(ch.position); ch.consume() }) }
            .clearAndSetSemantics { contentDescription = summary; role = Role.Image },
    ) {
        Canvas(Modifier.fillMaxSize()) {
            val g = geo ?: return@Canvas
            val selected = sel?.takeIf { it < g.n }
            val label = c.textMuted
            // Fondo de la categoría elegida
            if (selected != null) when (kind) {
                ZcChartKind.STACKED -> { val w = g.plot.width / g.n; drawRect(c.surface2, Offset(g.plot.left + selected * w, g.plot.top), Size(w, g.plot.height)) }
                ZcChartKind.BAR_H -> { val rh = g.plot.height / g.n; drawRect(c.surface2, Offset(g.plot.left, g.plot.top + selected * rh), Size(this.size.width - g.plot.left, rh)) }
                else -> Unit
            }
            drawAxes(g, c.border, label)
            when (kind) {
                ZcChartKind.LINE -> {
                    data.series.forEachIndexed { si, s ->
                        val pts = List(g.n) { i -> Offset(g.cx(i), g.at(s.values.getOrElse(i) { 0.0 })) }
                        val color = seriesColor(palette, si, s)
                        if (si == 0 && !s.dashed && pts.size > 1) {
                            val area = Path().also { smoothPath(it, pts) }.apply { lineTo(pts.last().x, g.plot.bottom); lineTo(pts.first().x, g.plot.bottom); close() }
                            drawPath(area, palette[0].copy(alpha = 0.08f))
                        }
                        if (pts.size == 1) drawCircle(color, 3.dp.toPx(), pts[0])
                        val line = Path().also { smoothPath(it, pts) }
                        drawPath(line, color, style = Stroke(
                            width = (if (s.dashed) 1.5f else 2.5f).dp.toPx(), cap = StrokeCap.Round,
                            pathEffect = if (s.dashed) PathEffect.dashPathEffect(floatArrayOf(6.dp.toPx(), 4.dp.toPx())) else null,
                        ))
                    }
                    if (selected != null) {
                        val x = g.cx(selected)
                        drawLine(c.borderStrong, Offset(x, g.plot.top), Offset(x, g.plot.bottom), 1.dp.toPx())
                        data.series.forEachIndexed { si, s ->
                            val p = Offset(x, g.at(s.values.getOrElse(selected) { 0.0 }))
                            drawCircle(c.surface, 5.5f.dp.toPx(), p)
                            drawCircle(seriesColor(palette, si, s), 3.5f.dp.toPx(), p)
                        }
                    }
                }
                ZcChartKind.STACKED -> {
                    val barW = min(g.plot.width / g.n * 0.6f, (if (narrow) 20 else 32).dp.toPx())
                    for (i in 0 until g.n) {
                        var acc = 0.0
                        val topIdx = data.series.indexOfLast { it.values.getOrElse(i) { 0.0 } > 0 }
                        data.series.forEachIndexed { si, s ->
                            val v = s.values.getOrElse(i) { 0.0 }
                            if (v <= 0) return@forEachIndexed
                            val yTop = g.at(acc + v); val yBottom = g.at(acc); acc += v
                            val l = g.cx(i) - barW / 2f
                            val color = palette[si % palette.size]
                            if (si == topIdx) drawPath(roundedTop(l, yTop, l + barW, yBottom, 6.dp.toPx()), color)
                            else drawRect(color, Offset(l, yTop), Size(barW, yBottom - yTop))
                        }
                    }
                }
                else -> {
                    val peak = g.vals.indices.maxByOrNull { g.vals[it] } ?: 0
                    val rowH = g.plot.height / g.n
                    val bar = min((if (narrow) 14 else 18).dp.toPx(), rowH * 0.8f)
                    for (i in 0 until g.n) {
                        val cy = g.cy(i); val x1 = g.at(g.vals[i])
                        if (x1 > g.plot.left) drawPath(roundedRight(g.plot.left, cy - bar / 2f, x1, cy + bar / 2f, 6.dp.toPx()), if (i == peak) palette[0] else c.surface3)
                        val l = g.valueLabels[i]
                        drawText(l, c.text, Offset(x1 + 6.dp.toPx(), cy - l.size.height / 2f))
                    }
                }
            }
        }
        val g = geo
        val i = sel
        if (g != null && i != null && i < g.n) {
            val rows = if (kind == ZcChartKind.BAR_H) listOf(TipRow(palette[0], data.series.firstOrNull()?.name, format(g.vals[i])))
            else data.series.mapIndexed { si, s -> TipRow(seriesColor(palette, si, s), s.name, format(s.values.getOrElse(i) { 0.0 })) }
            ChartTooltip(g.anchor(i), boxSize, data.categories[i], rows)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun DonutBody(data: ZcChartData, narrow: Boolean, maxW: Dp, format: (Double) -> String, description: String?, totalLabel: String, palette: List<Color>, initialSelection: Int?) {
    val c = ZonacardsTheme.colors
    val values = remember(data) { data.categories.indices.map { (data.series.firstOrNull()?.values?.getOrElse(it) { 0.0 } ?: 0.0).coerceAtLeast(0.0) } }
    val total = values.sum()
    var sel by remember(data) { mutableStateOf(initialSelection) }
    var anchor by remember { mutableStateOf(Offset.Zero) }
    var box by remember { mutableStateOf(IntSize.Zero) }
    val summary = remember(description, data, format) { chartSummary(description, data, ZcChartKind.DONUT, format) }
    val ringSize = if (narrow) min(maxW.value, 180f).dp else 200.dp
    val ring = @Composable {
        Box(
            Modifier.size(ringSize).onSizeChanged { box = it }
                .pointerInput(values) {
                    detectTapGestures { p ->
                        val s = size.width.toFloat()
                        val outer = s / 2f - 4.dp.toPx(); val th = outer * 0.32f
                        val dx = p.x - s / 2f; val dy = p.y - s / 2f; val r = hypot(dx, dy)
                        val hit = if (total <= 0 || r < outer - th - 8.dp.toPx() || r > outer + 8.dp.toPx()) null else {
                            var deg = Math.toDegrees(atan2(dy, dx).toDouble()).toFloat() + 90f
                            if (deg < 0) deg += 360f
                            var acc = 0f; var idx: Int? = null
                            for (i in values.indices) { val sw = (values[i] / total * 360.0).toFloat(); if (sw > 0 && deg < acc + sw) { idx = i; break }; acc += sw }
                            idx ?: values.indices.lastOrNull { values[it] > 0 }
                        }
                        sel = if (hit == sel) null else hit; anchor = p
                    }
                }
                .clearAndSetSemantics { contentDescription = summary; role = Role.Image },
            contentAlignment = Alignment.Center,
        ) {
            Canvas(Modifier.fillMaxSize()) {
                val outer = size.minDimension / 2f - 4.dp.toPx(); val th = outer * 0.32f; val mid = outer - th / 2f
                val tl = center - Offset(mid, mid)
                if (total <= 0) { drawCircle(c.surface3, mid, style = Stroke(th)); return@Canvas }
                val gap = if (values.count { it > 0 } > 1) (3.dp.toPx() / mid) * 180f / PI.toFloat() else 0f
                var start = -90f
                values.forEachIndexed { i, v ->
                    if (v <= 0) return@forEachIndexed
                    val sweep = (v / total * 360.0).toFloat()
                    drawArc(palette[i % palette.size], start + gap / 2f, (sweep - gap).coerceAtLeast(0.5f), false, tl, Size(mid * 2, mid * 2), style = Stroke(th + if (sel == i) 6.dp.toPx() else 0f))
                    start += sweep
                }
            }
            Column(Modifier.widthIn(max = ringSize * 0.55f), horizontalAlignment = Alignment.CenterHorizontally) {
                ZcText(format(total), style = if (narrow) ZcTextTw.base else ZcTextTw.lg, weight = ZcWeight.semibold, color = c.text, maxLines = 1)
                if (totalLabel.isNotEmpty()) ZcText(totalLabel, style = TextStyle(fontSize = 11.sp, lineHeight = 16.sp), color = c.textMuted, maxLines = 1)
            }
            val i = sel
            if (i != null && i < values.size) {
                val pct = if (total > 0) (values[i] / total * 100).roundToInt() else 0
                ChartTooltip(anchor, box, null, listOf(TipRow(palette[i % palette.size], data.categories[i], "${format(values[i])} ($pct %)")))
            }
        }
    }
    val legend = @Composable { mod: Modifier ->
        val items = @Composable {
            data.categories.forEachIndexed { i, name ->
                val pct = if (total > 0) (values[i] / total * 100).roundToInt() else 0
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.width(12.dp).height(8.dp).clip(RoundedCornerShape(2.dp)).background(palette[i % palette.size]))
                    ZcText(name, style = ZcTextTw.xs, color = c.textMuted)
                    ZcText("$pct %", style = ZcTextTw.xs, color = c.text)
                }
            }
        }
        if (narrow) FlowRow(mod.clearAndSetSemantics { }, horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally), verticalArrangement = Arrangement.spacedBy(4.dp)) { items() }
        else Column(mod.clearAndSetSemantics { }, verticalArrangement = Arrangement.spacedBy(6.dp)) { items() }
    }
    if (narrow) Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) { ring(); legend(Modifier.fillMaxWidth()) }
    else Row(horizontalArrangement = Arrangement.spacedBy(32.dp), verticalAlignment = Alignment.CenterVertically) { ring(); legend(Modifier.weight(1f)) }
}

// ---------- Vista de datos, segmentado y panel ----------

/** Vista Datos (alternativa accesible del gráfico): una fila por categoría y una columna por serie (la dona y las barras, solo la primera). */
@Composable
fun ZcChartTable(
    data: ZcChartData,
    kind: ZcChartKind,
    modifier: Modifier = Modifier,
    categoryLabel: String = "",
    format: (Double) -> String = ::zcAxisShort,
) {
    val c = ZonacardsTheme.colors
    val series = if (kind == ZcChartKind.LINE || kind == ZcChartKind.STACKED || kind == ZcChartKind.HEATMAP) data.series else data.series.take(1)
    Column(modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth().heightIn(min = 40.dp).padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            ZcText(categoryLabel, Modifier.weight(1.4f), style = ZcTextTw.xs, weight = ZcWeight.semibold, color = c.textMuted)
            series.forEach { s -> ZcText(s.name, Modifier.weight(1f), style = ZcTextTw.xs, weight = ZcWeight.semibold, color = c.textMuted, textAlign = androidx.compose.ui.text.style.TextAlign.End) }
        }
        ZcDivider()
        data.categories.forEachIndexed { i, cat ->
            Row(Modifier.fillMaxWidth().heightIn(min = 44.dp).padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                ZcText(cat, Modifier.weight(1.4f), style = ZcTextTw.sm)
                series.forEach { s -> ZcText(format(s.values.getOrElse(i) { 0.0 }), Modifier.weight(1f), style = ZcTextTw.sm, textAlign = androidx.compose.ui.text.style.TextAlign.End) }
            }
            ZcDivider()
        }
    }
}

data class ZcSegmentOption(val id: String, val label: String)

/**
 * Segmentado (zc-segmented): pista `surface-2`, el elegido sobre `surface` con sombra. Cada opción mide al menos `targetSm`
 * (44) de alto con el dedo; `small` es el tamaño de las barras de gráficos y listados.
 */
@Composable
fun ZcSegmented(
    options: List<ZcSegmentOption>,
    selected: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    small: Boolean = true,
) {
    val c = ZonacardsTheme.colors
    val haptic = rememberZcHaptics()
    val h = if (small) ZcSize.targetSm else ZcSize.target
    val shape = RoundedCornerShape(ZcRadius.sm)
    Row(
        modifier.selectableGroup().then(if (label != null) Modifier.semantics { contentDescription = label } else Modifier)
            .clip(shape).background(c.surface2).padding(horizontal = 2.dp),
    ) {
        options.forEach { o ->
            val on = o.id == selected
            Box(
                Modifier.heightIn(min = h).selectable(on, role = Role.RadioButton) { if (!on) { haptic(ZcHaptic.SELECTION); onSelect(o.id) } }.padding(vertical = 4.dp, horizontal = 0.dp),
                contentAlignment = Alignment.Center,
            ) {
                val pill = RoundedCornerShape(ZcRadius.sm - 2.dp)
                Box(Modifier.heightIn(min = h - 8.dp).then(if (on) Modifier.shadow(1.dp, pill).clip(pill).background(c.surface) else Modifier).padding(horizontal = 12.dp), contentAlignment = Alignment.Center) {
                    ZcText(o.label, style = ZcTextTw.sm, weight = ZcWeight.medium, color = if (on) c.text else c.textMuted)
                }
            }
        }
    }
}

/**
 * Gráfico con su barra de herramientas: "Vista" (Gráfico | Datos) y, a continuación, los filtros del llamador (periodo,
 * métrica, país, Comparar). Sin datos muestra el estado vacío; la vista Datos lleva el título como en la web ("Datos: …").
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ZcChartPanel(
    title: String,
    data: ZcChartData?,
    kind: ZcChartKind,
    modifier: Modifier = Modifier,
    format: (Double) -> String = ::zcAxisShort,
    totalLabel: String = "",
    categoryLabel: String = "",
    toolbar: (@Composable () -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    var view by rememberSaveable { mutableStateOf("chart") }
    val has = zcChartHasData(data)
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (has || toolbar != null) FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (has) ZcSegmented(
                listOf(ZcSegmentOption("chart", ctx.getString(R.string.zc_org_grafico)), ZcSegmentOption("data", ctx.getString(R.string.zc_org_datos))),
                view, { view = it }, label = ctx.getString(R.string.zc_org_vista),
            )
            toolbar?.invoke()
        }
        when {
            !has || data == null -> ZcState(ctx.getString(R.string.zc_org_sin_datos), text = ctx.getString(R.string.zc_org_sin_datos_texto))
            view == "data" -> {
                ZcText(ctx.getString(R.string.zc_org_datos_de, title), style = ZcTextTw.xs, color = c.textMuted)
                ZcChartTable(data, kind, categoryLabel = categoryLabel, format = format)
            }
            else -> ZcChart(data, kind, format = format, description = title, totalLabel = totalLabel)
        }
    }
}
