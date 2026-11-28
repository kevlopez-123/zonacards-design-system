package com.zonacards.ui.compose

import android.graphics.BitmapFactory
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.atan
import kotlin.math.floor
import kotlin.math.ln
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sinh

/** Punto del mapa en grados decimales (WGS 84). */
data class ZcLatLng(val lat: Double, val lng: Double) {
    val isValid get() = lat.isFinite() && lng.isFinite() && abs(lat) <= 90 && abs(lng) <= 180
    /** "-12.04640, -77.04280" (5 decimales). */
    fun format() = "%.5f, %.5f".format(java.util.Locale.US, lat, lng)
    /** Redondeado a 6 decimales (≈ 10 cm). */
    fun rounded() = ZcLatLng(Math.round(lat * 1e6) / 1e6, Math.round(lng * 1e6) / 1e6)
}

/** Proyección Web Mercator de las teselas (OpenStreetMap, 256 px por tesela). */
object ZcGeo {
    const val TILE = 256.0
    const val MIN_ZOOM = 3
    const val MAX_ZOOM = 19
    private fun size(zoom: Int) = TILE * 2.0.pow(zoom)
    fun worldX(lng: Double, zoom: Int) = (lng + 180.0) / 360.0 * size(zoom)
    fun worldY(lat: Double, zoom: Int): Double {
        val s = sin(Math.toRadians(lat.coerceIn(-85.0511, 85.0511)))
        return (0.5 - ln((1 + s) / (1 - s)) / (4 * PI)) * size(zoom)
    }
    fun lng(x: Double, zoom: Int) = x / size(zoom) * 360.0 - 180.0
    fun lat(y: Double, zoom: Int): Double = Math.toDegrees(atan(sinh(PI - 2 * PI * y / size(zoom))))
    /** Metros por píxel en esa latitud y zoom. */
    fun metersPerPixel(lat: Double, zoom: Int) = 156543.03392 * kotlin.math.cos(Math.toRadians(lat)) / 2.0.pow(zoom)
    /** "1" → 1 tesela; la columna y la fila dan la URL `{z}/{x}/{y}`. */
    fun tileCount(zoom: Int) = 1 shl zoom
}

/** Una tesela del mapa: zoom, columna y fila. */
data class ZcTile(val z: Int, val x: Int, val y: Int)

/** Descarga de teselas OpenStreetMap: identifica a la app (política de uso) y no se usa para descargas masivas. */
suspend fun zcFetchOsmTile(tile: ZcTile, urlTemplate: String = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"): ImageBitmap? = withContext(Dispatchers.IO) {
    runCatching {
        val url = urlTemplate.replace("{z}", tile.z.toString()).replace("{x}", tile.x.toString()).replace("{y}", tile.y.toString())
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = 8_000; readTimeout = 8_000
            setRequestProperty("User-Agent", "ZonacardsUI-Android (+https://zonacards.com)")
        }
        try { conn.inputStream.use { BitmapFactory.decodeStream(it)?.asImageBitmap() } } finally { conn.disconnect() }
    }.getOrNull()
}

private const val FAILS_WARN = 4
private const val NUDGE_PX = 40.0

/**
 * Mapa de calles con teselas dibujado a mano (sin SDK de mapas): arrastrar mueve el mapa, tocar coloca el punto, arrastrar el pin lo
 * mueve, y +/− acercan o alejan. TalkBack ve un grupo con el punto y acciones para moverlo al norte, sur, este u oeste. Si fallan las
 * teselas avisa con Reintentar. Atribución de OpenStreetMap siempre visible.
 */
@Composable
fun ZcTileMap(
    label: String,
    point: ZcLatLng?,
    onPointChange: (ZcLatLng) -> Unit,
    modifier: Modifier = Modifier,
    center: ZcLatLng = ZcLatLng(-12.0464, -77.0428),
    fetchTile: suspend (ZcTile) -> ImageBitmap? = { zcFetchOsmTile(it) },
    attribution: String = "© OpenStreetMap",
    mapHeight: androidx.compose.ui.unit.Dp = 256.dp,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val density = LocalDensityScale()
    var zoom by remember { mutableIntStateOf(if (point != null) 16 else 15) }
    // Centro del mapa en píxeles del mundo a ese zoom (la tesela se dibuja a 256 dp).
    var cx by remember { mutableStateOf(ZcGeo.worldX((point ?: center).lng, zoom)) }
    var cy by remember { mutableStateOf(ZcGeo.worldY((point ?: center).lat, zoom)) }
    var box by remember { mutableStateOf(IntSize.Zero) }
    val tiles = remember { mutableStateMapOf<ZcTile, ImageBitmap?>() }
    var fails by remember { mutableIntStateOf(0) }
    var attempt by remember { mutableIntStateOf(0) }
    
    // Si el centro de afuera cambia (otro distrito) y todavía no hay punto, el mapa se va allá.
    LaunchedEffect(center, point == null) { if (point == null) { cx = ZcGeo.worldX(center.lng, zoom); cy = ZcGeo.worldY(center.lat, zoom) } }
    // Si el punto cambia por texto o por los botones, el mapa lo sigue cuando queda fuera de vista.
    LaunchedEffect(point) {
        val p = point ?: return@LaunchedEffect
        val px = ZcGeo.worldX(p.lng, zoom); val py = ZcGeo.worldY(p.lat, zoom)
        if (box.width > 0 && (abs(px - cx) > box.width / density / 2 - 24 || abs(py - cy) > box.height / density / 2 - 24)) { cx = px; cy = py }
    }

    val wDp = if (box.width == 0) 0.0 else box.width / density
    val hDp = if (box.height == 0) 0.0 else box.height / density
    val visible = remember(cx, cy, zoom, box) {
        if (box.width == 0) emptyList() else {
            val n = ZcGeo.tileCount(zoom)
            val x0 = floor((cx - wDp / 2) / ZcGeo.TILE).toInt(); val x1 = floor((cx + wDp / 2) / ZcGeo.TILE).toInt()
            val y0 = floor((cy - hDp / 2) / ZcGeo.TILE).toInt(); val y1 = floor((cy + hDp / 2) / ZcGeo.TILE).toInt()
            buildList { for (ty in y0..y1) for (tx in x0..x1) if (ty in 0 until n) add(ZcTile(zoom, Math.floorMod(tx, n), ty) to (tx to ty)) }
        }
    }
    LaunchedEffect(visible, attempt) {
        for ((tile, _) in visible) {
            if (tiles.containsKey(tile) && tiles[tile] != null) continue
            launch {
                val img = fetchTile(tile)
                if (img != null) { tiles[tile] = img; fails = 0 } else if (!tiles.containsKey(tile)) { tiles[tile] = null; fails++ }
            }
        }
    }

    fun move(p: ZcLatLng) { if (p.isValid) onPointChange(p.rounded()) }
    fun nudge(dx: Double, dy: Double) {
        val base = point ?: center
        move(ZcLatLng(ZcGeo.lat(ZcGeo.worldY(base.lat, zoom) + dy * NUDGE_PX, zoom), ZcGeo.lng(ZcGeo.worldX(base.lng, zoom) + dx * NUDGE_PX, zoom)))
    }
    fun atScreen(offset: Offset) = ZcLatLng(
        ZcGeo.lat(cy + (offset.y / density - hDp / 2), zoom), ZcGeo.lng(cx + (offset.x / density - wDp / 2), zoom),
    )

    Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Box(
            Modifier.fillMaxWidth().height(mapHeight).clip(RoundedCornerShape(ZonacardsTheme.shape.card)).background(c.surface2)
                .border(1.dp, c.border, RoundedCornerShape(ZonacardsTheme.shape.card))
                .onSizeChanged { box = it }
                .semantics {
                    contentDescription = label
                    stateDescription = point?.format() ?: ctx.getString(R.string.zc_mol_ubicacion_sin_punto)
                    customActions = listOf(
                        CustomAccessibilityAction(ctx.getString(R.string.zc_mol_ubicacion_mover_norte)) { nudge(0.0, -1.0); true },
                        CustomAccessibilityAction(ctx.getString(R.string.zc_mol_ubicacion_mover_sur)) { nudge(0.0, 1.0); true },
                        CustomAccessibilityAction(ctx.getString(R.string.zc_mol_ubicacion_mover_este)) { nudge(1.0, 0.0); true },
                        CustomAccessibilityAction(ctx.getString(R.string.zc_mol_ubicacion_mover_oeste)) { nudge(-1.0, 0.0); true },
                    )
                }
                .pointerInput(zoom, box) {
                    detectTapGestures { move(atScreen(it)) }
                }
                .pointerInput(zoom, box, point) {
                    var movingPin = false
                    detectDragGestures(
                        onDragStart = { start ->
                            val p = point
                            movingPin = p != null && (start - Offset(((ZcGeo.worldX(p.lng, zoom) - cx + wDp / 2) * density).toFloat(), ((ZcGeo.worldY(p.lat, zoom) - cy + hDp / 2) * density).toFloat())).getDistance() < 28.dp.toPx()
                        },
                        onDrag = { change, drag ->
                            change.consume()
                            if (movingPin) move(atScreen(change.position)) else { cx -= drag.x / density; cy -= drag.y / density }
                        },
                    )
                },
        ) {
            Canvas(Modifier.fillMaxSize()) {
                val scale = density.toFloat()
                for ((tile, pos) in visible) {
                    val img = tiles[tile] ?: continue
                    val left = ((pos.first * ZcGeo.TILE - cx + wDp / 2) * scale).roundToInt()
                    val top = ((pos.second * ZcGeo.TILE - cy + hDp / 2) * scale).roundToInt()
                    val s = (ZcGeo.TILE * scale).roundToInt()
                    drawImage(img, dstOffset = IntOffset(left, top), dstSize = IntSize(s, s))
                }
                val p = point
                if (p != null) {
                    val o = Offset(((ZcGeo.worldX(p.lng, zoom) - cx + wDp / 2) * scale).toFloat(), ((ZcGeo.worldY(p.lat, zoom) - cy + hDp / 2) * scale).toFloat())
                    drawCircle(Color.Black.copy(alpha = 0.25f), 16.dp.toPx(), o + Offset(0f, 2.dp.toPx()))
                    drawCircle(c.surface, 14.dp.toPx(), o)
                    drawCircle(c.primary, 11.dp.toPx(), o)
                }
            }
            if (visible.isNotEmpty() && visible.none { tiles[it.first] != null } && fails < FAILS_WARN) {
                ZcText(ctx.getString(R.string.zc_ui_cargando), Modifier.align(Alignment.Center), style = ZcType.caption, color = c.textMuted)
            }
            Column(Modifier.align(Alignment.TopStart).padding(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                ZcIconButton(ZcIcons.lPlus, ctx.getString(R.string.zc_mol_mapa_acercar), {
                    if (zoom < ZcGeo.MAX_ZOOM) { cx *= 2; cy *= 2; zoom++ }
                }, variant = ZcButtonVariant.OUTLINE, enabled = zoom < ZcGeo.MAX_ZOOM, small = true)
                ZcIconButton(ZcIcons.lMinus, ctx.getString(R.string.zc_mol_mapa_alejar), {
                    if (zoom > ZcGeo.MIN_ZOOM) { cx /= 2; cy /= 2; zoom-- }
                }, variant = ZcButtonVariant.OUTLINE, enabled = zoom > ZcGeo.MIN_ZOOM, small = true)
            }
            ZcText(attribution, Modifier.align(Alignment.BottomEnd).background(c.surface.copy(alpha = 0.85f)).padding(horizontal = 6.dp, vertical = 2.dp), style = ZcType.caption.copy(fontSize = androidx.compose.ui.unit.TextUnit(10f, androidx.compose.ui.unit.TextUnitType.Sp)), color = c.textMuted)
        }
        if (fails >= FAILS_WARN) {
            ZcAlert(
                ctx.getString(R.string.zc_mol_geo_mapa_error_titulo), tone = ZcAlertTone.WARNING, text = ctx.getString(R.string.zc_mol_geo_mapa_error_texto),
                actions = { ZcAlertAction(ctx.getString(R.string.zc_mol_geo_mapa_error_reintentar), { fails = 0; tiles.entries.removeAll { it.value == null }; attempt++ }) },
            )
        }
    }
}

/** Densidad de pantalla (píxeles por dp) como Double, para convertir entre píxeles del mapa y dp. */
@Composable
private fun LocalDensityScale(): Double = androidx.compose.ui.platform.LocalDensity.current.density.toDouble()


/**
 * Punto exacto en el mapa (dirección de entrega, local): mapa con pin que se arrastra o se coloca con un toque, coordenadas escritas
 * como alternativa (latitud y longitud validadas) y, si la app lo pide, "Usar mi ubicación" (el permiso y la lectura los hace la app).
 * `center` centra el mapa mientras no hay punto (por ejemplo, el distrito elegido en [ZcUbigeoSelect]).
 */
@Composable
fun ZcLocationPicker(
    value: ZcLatLng?,
    onValueChange: (ZcLatLng) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    center: ZcLatLng = ZcLatLng(-12.0464, -77.0428),
    fetchTile: suspend (ZcTile) -> ImageBitmap? = { zcFetchOsmTile(it) },
    onUseMyLocation: (() -> Unit)? = null,
    locating: Boolean = false,
    locationError: String? = null,
) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    var latText by remember { mutableStateOf(value?.lat?.toString() ?: "") }
    var lngText by remember { mutableStateOf(value?.lng?.toString() ?: "") }
    var latError by remember { mutableStateOf<String?>(null) }
    var lngError by remember { mutableStateOf<String?>(null) }
    fun parse(t: String): Double? = t.trim().replace(',', '.').takeIf { Regex("^[-+]?\\d+(\\.\\d+)?$").matches(it) }?.toDouble()
    // Las cajas siguen al punto que llega de afuera (mapa o botón) sin pisar lo que se está escribiendo.
    LaunchedEffect(value) {
        val v = value ?: return@LaunchedEffect
        if (parse(latText) != v.lat) latText = v.lat.toString()
        if (parse(lngText) != v.lng) lngText = v.lng.toString()
        latError = null; lngError = null
    }
    fun typed(lat: String, lng: String) {
        latText = lat; lngText = lng
        val la = parse(lat); val ln = parse(lng)
        latError = if (lat.isNotBlank() && (la == null || abs(la) > 90)) ctx.getString(R.string.zc_mol_ubicacion_lat_rango) else null
        lngError = if (lng.isNotBlank() && (ln == null || abs(ln) > 180)) ctx.getString(R.string.zc_mol_ubicacion_lng_rango) else null
        if (la != null && ln != null && abs(la) <= 90 && abs(ln) <= 180) onValueChange(ZcLatLng(la, ln).rounded())
    }

    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            ZcIcon(ZcIcons.sMapPoint, null, size = ZcSize.iconMd)
            ZcText(label, style = ZcTextTw.base, weight = ZcWeight.semibold, modifier = Modifier.semantics { heading() })
        }
        ZcTileMap(label, value, { onValueChange(it) }, center = center, fetchTile = fetchTile)
        ZcText(
            value?.let { ctx.getString(R.string.zc_mol_ubicacion_coordenadas, it.format()) } ?: ctx.getString(R.string.zc_mol_ubicacion_sin_punto),
            Modifier.semantics { liveRegion = LiveRegionMode.Polite }, style = ZcTextTw.sm.copy(fontFeatureSettings = "tnum"), color = c.textMuted,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            ZcTextField(latText, { typed(it, lngText) }, ctx.getString(R.string.zc_mol_ubicacion_latitud), Modifier.weight(1f), error = latError, keyboardType = KeyboardType.Decimal)
            ZcTextField(lngText, { typed(latText, it) }, ctx.getString(R.string.zc_mol_ubicacion_longitud), Modifier.weight(1f), error = lngError, keyboardType = KeyboardType.Decimal)
        }
        if (onUseMyLocation != null) ZcButton(ctx.getString(R.string.zc_mol_ubicacion_usar_mia), onUseMyLocation, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM, loading = locating, leadingIcon = ZcIcons.sMapPoint)
        if (locationError != null) ZcAlert(ctx.getString(R.string.zc_mol_ubicacion_error_titulo), tone = ZcAlertTone.WARNING, text = locationError)
    }
}
