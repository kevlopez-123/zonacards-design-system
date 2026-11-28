package com.zonacards.ui.compose

import android.content.Context
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.calculateCentroid
import androidx.compose.foundation.gestures.calculatePan
import androidx.compose.foundation.gestures.calculateZoom
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChanged
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcBreakpoint
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcRadius
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/** Punto del mapa (ciudad): `value` es la cantidad y fija el tamaño. */
data class ZcMapPoint(val name: String, val lat: Double, val lng: Double, val value: Double)

internal class GeoRing(val lng: FloatArray, val lat: FloatArray)
internal class GeoCountry(val name: String, val cc: String, val rings: List<GeoRing>)

/** Lee `latam.json` (el mismo de la web: `properties.n` = nombre, `properties.cc` = código del alcance). */
internal fun zcParseGeo(json: String): List<GeoCountry> {
    val feats = JSONObject(json).getJSONArray("features")
    return List(feats.length()) { i ->
        val f = feats.getJSONObject(i)
        val p = f.getJSONObject("properties")
        val g = f.getJSONObject("geometry")
        val rings = ArrayList<GeoRing>()
        fun ring(a: JSONArray) {
            val n = a.length(); val lng = FloatArray(n); val lat = FloatArray(n)
            for (k in 0 until n) { val c = a.getJSONArray(k); lng[k] = c.getDouble(0).toFloat(); lat[k] = c.getDouble(1).toFloat() }
            rings += GeoRing(lng, lat)
        }
        val coords = g.getJSONArray("coordinates")
        if (g.getString("type") == "Polygon") for (r in 0 until coords.length()) ring(coords.getJSONArray(r))
        else for (pi in 0 until coords.length()) { val poly = coords.getJSONArray(pi); for (r in 0 until poly.length()) ring(poly.getJSONArray(r)) }
        GeoCountry(p.optString("n"), p.optString("cc"), rings)
    }
}

@Volatile private var geoCache: List<GeoCountry>? = null

/** Los países de la web, leídos una sola vez (205 KB, unos 13 mil puntos). Nulo si el recurso no se pudo leer. */
internal fun zcLatamGeo(ctx: Context): List<GeoCountry>? = geoCache ?: runCatching {
    ctx.resources.openRawResource(R.raw.zc_latam).bufferedReader().use { zcParseGeo(it.readText()) }
}.getOrNull()?.also { geoCache = it }

private const val MAP_MAX_ZOOM = 8f

/** Mapa del cuadro: la web lo dibuja con `aspectScale` 0,75 (el eje x se comprime) y el encuadre sale de los puntos ± 4°. */
private class MapLayout(val land: List<Pair<GeoCountry, Path>>, val base: List<Offset>)

private fun buildMapLayout(geo: List<GeoCountry>, points: List<ZcMapPoint>, w: Float, h: Float): MapLayout {
    val pad = 4.0
    val minLng: Double; val maxLng: Double; val minLat: Double; val maxLat: Double
    if (points.isEmpty()) { minLng = -120.0; maxLng = -30.0; minLat = -56.0; maxLat = 33.0 }
    else { minLng = points.minOf { it.lng } - pad; maxLng = points.maxOf { it.lng } + pad; minLat = points.minOf { it.lat } - pad; maxLat = points.maxOf { it.lat } + pad }
    val kx = 0.75
    val s = min(w / ((maxLng - minLng) * kx), h / (maxLat - minLat)).toDouble()
    val cLng = (minLng + maxLng) / 2; val cLat = (minLat + maxLat) / 2
    fun px(lng: Double) = w / 2f + ((lng - cLng) * kx * s).toFloat()
    fun py(lat: Double) = h / 2f - ((lat - cLat) * s).toFloat()
    val land = geo.map { c ->
        val path = Path().apply {
            fillType = PathFillType.EvenOdd
            for (r in c.rings) {
                if (r.lng.isEmpty()) continue
                moveTo(px(r.lng[0].toDouble()), py(r.lat[0].toDouble()))
                for (k in 1 until r.lng.size) lineTo(px(r.lng[k].toDouble()), py(r.lat[k].toDouble()))
                close()
            }
        }
        c to path
    }
    return MapLayout(land, points.map { Offset(px(it.lng), py(it.lat)) })
}

private fun plainNumber(v: Double) = if (v % 1.0 == 0.0) v.toLong().toString() else v.toString()

/**
 * Mapa de puntos (zc-map): los límites de países de la web (sin teselas externas), los países del `scope` en `map-scope` y un
 * punto por ciudad con tamaño según la cantidad. Pellizco para acercar y un dedo para mover (con zoom; sin zoom el dedo sigue
 * desplazando la página); los botones + y − hacen lo mismo con un solo toque. Tocar un punto abre el globo con su cantidad.
 * Para TalkBack, el resumen lista cada ciudad con su cantidad.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ZcMap(
    label: String,
    points: List<ZcMapPoint>,
    modifier: Modifier = Modifier,
    scope: List<String> = emptyList(),
    unit: String = "",
    format: (Double) -> String = ::plainNumber,
    initialZoom: Float = 1f,
    initialSelection: Int? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val geo = remember { zcLatamGeo(ctx) }
    var boxSize by remember { mutableStateOf(IntSize.Zero) }
    var zoom by remember { mutableFloatStateOf(initialZoom.coerceIn(1f, MAP_MAX_ZOOM)) }
    var pan by remember { mutableStateOf(Offset.Zero) }
    var sel by remember(points) { mutableStateOf(initialSelection) }
    val layout = remember(geo, points, boxSize) { if (geo == null || boxSize.width <= 0) null else buildMapLayout(geo, points, boxSize.width.toFloat(), boxSize.height.toFloat()) }
    val summary = remember(label, points, unit) { label + ". " + points.joinToString("; ") { "${it.name}: ${format(it.value)} $unit".trim() } }
    val h = when { zcScreenWidth() >= ZcBreakpoint.xl -> 440.dp; zcScreenWidth() >= ZcBreakpoint.md -> 380.dp; else -> 280.dp }
    val shape = RoundedCornerShape(ZcRadius.md)

    fun clampPan(p: Offset, z: Float, s: IntSize): Offset {
        val mx = (z - 1f) * s.width / 2f + s.width * 0.25f
        val my = (z - 1f) * s.height / 2f + s.height * 0.25f
        return Offset(p.x.coerceIn(-mx, mx), p.y.coerceIn(-my, my))
    }
    /** Acerca o aleja alrededor del punto `q` (el punto del mapa bajo `q` se queda donde está). */
    fun zoomBy(factor: Float, q: Offset, s: IntSize) {
        val z2 = (zoom * factor).coerceIn(1f, MAP_MAX_ZOOM)
        val center = Offset(s.width / 2f, s.height / 2f)
        pan = clampPan(q - center - (q - pan - center) * (z2 / zoom), z2, s)
        zoom = z2
    }
    fun screenOf(base: Offset): Offset {
        val center = Offset(boxSize.width / 2f, boxSize.height / 2f)
        return center + (base - center) * zoom + pan
    }
    fun radiusPx(p: ZcMapPoint, density: Float) = (10f + sqrt(p.value.toFloat().coerceAtLeast(0f)) * 1.8f) / 2f * density

    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Box(Modifier.fillMaxWidth().height(h).clip(shape).background(c.mapWater).border(1.dp, c.border, shape)) {
            if (layout == null && geo == null) {
                ZcText(ctx.getString(R.string.zc_mol_mapa_error), Modifier.align(Alignment.Center).padding(16.dp), style = ZcTextTw.sm, color = c.textMuted)
            }
            Box(
                Modifier.fillMaxSize().onSizeChanged { boxSize = it }
                    .pointerInput(Unit) {
                        awaitEachGesture {
                            awaitFirstDown(requireUnconsumed = false)
                            do {
                                val ev = awaitPointerEvent()
                                // Con un dedo y sin zoom el gesto es del desplazamiento de la página; con dos dedos o con zoom es del mapa.
                                if (ev.changes.count { it.pressed } >= 2 || zoom > 1.001f) {
                                    val z = ev.calculateZoom(); val p = ev.calculatePan(); val q = ev.calculateCentroid()
                                    if (z != 1f || p != Offset.Zero) {
                                        if (z != 1f) zoomBy(z, q, size)
                                        pan = clampPan(pan + p, zoom, size)
                                        ev.changes.forEach { if (it.positionChanged()) it.consume() }
                                    }
                                }
                            } while (ev.changes.any { it.pressed })
                        }
                    }
                    .pointerInput(layout) {
                        detectTapGestures { tap ->
                            val l = layout ?: return@detectTapGestures
                            var best: Int? = null; var bestD = Float.MAX_VALUE
                            points.forEachIndexed { i, p ->
                                val d = (screenOf(l.base[i]) - tap).getDistance()
                                if (d <= max(radiusPx(p, density), 22.dp.toPx()) && d < bestD) { best = i; bestD = d }
                            }
                            sel = if (best == sel) null else best
                        }
                    }
                    .clearAndSetSemantics { contentDescription = summary; role = Role.Image },
            ) {
                Canvas(Modifier.fillMaxSize()) {
                    val l = layout ?: return@Canvas
                    val ctr = Offset(size.width / 2f, size.height / 2f)
                    withTransform({
                        translate(ctr.x * (1 - zoom) + pan.x, ctr.y * (1 - zoom) + pan.y)
                        scale(zoom, zoom, Offset.Zero)
                    }) {
                        for ((country, path) in l.land) {
                            drawPath(path, if (country.cc in scope) c.mapScope else c.mapLand)
                            drawPath(path, c.mapLine, style = Stroke(1.dp.toPx() / zoom))
                        }
                    }
                    points.forEachIndexed { i, p ->
                        val at = screenOf(l.base[i]); val r = radiusPx(p, density)
                        drawCircle(c.brandAccent.copy(alpha = 0.9f), r, at)
                        drawCircle(c.chart1, r - 1.dp.toPx(), at, style = Stroke(2.dp.toPx()))
                        if (sel == i) drawCircle(c.text, r + 3.dp.toPx(), at, style = Stroke(2.dp.toPx()))
                    }
                }
                val i = sel
                val l = layout
                if (i != null && l != null && i < points.size) ChartTooltip(screenOf(l.base[i]), boxSize, points[i].name, listOf(TipRow(null, null, "${format(points[i].value)} $unit".trim())))
            }
            Column(Modifier.align(Alignment.TopEnd).padding(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ZcIconButton(ZcIcons.lPlus, ctx.getString(R.string.zc_mol_mapa_acercar), { zoomBy(1.6f, Offset(boxSize.width / 2f, boxSize.height / 2f), boxSize) }, variant = ZcButtonVariant.OUTLINE, enabled = zoom < MAP_MAX_ZOOM, small = true)
                ZcIconButton(ZcIcons.lMinus, ctx.getString(R.string.zc_mol_mapa_alejar), { zoomBy(1f / 1.6f, Offset(boxSize.width / 2f, boxSize.height / 2f), boxSize) }, variant = ZcButtonVariant.OUTLINE, enabled = zoom > 1.001f, small = true)
            }
        }
        FlowRow(Modifier.fillMaxWidth().clearAndSetSemantics { }, horizontalArrangement = Arrangement.spacedBy(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(12.dp).clip(CircleShape).background(c.brandAccent).border(2.dp, c.chart1, CircleShape))
                ZcText(ctx.getString(R.string.zc_mol_mapa_puntos, unit), style = ZcTextTw.xs, color = c.textMuted)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(12.dp).clip(CircleShape).background(c.mapScope))
                ZcText(ctx.getString(R.string.zc_mol_mapa_alcance), style = ZcTextTw.xs, color = c.textMuted)
            }
        }
    }
}
