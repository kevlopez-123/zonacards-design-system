package com.zonacards.ui.compose

import android.content.Context
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

/** Un nivel del ubigeo (INEI): departamento (2 dígitos), provincia (4) o distrito (6). */
data class ZcUbigeoPlace(val code: String, val name: String, val parent: String? = null, val lat: Double? = null, val lng: Double? = null)

/**
 * Ubigeo del Perú (INEI): departamento › provincia › distrito, desde el mismo archivo que la web (`zc_ubigeo_pe.json`;
 * datos MIT © 2025 MichaelSuarez0). Consulta con índices por código.
 */
class ZcUbigeo internal constructor(
    val departments: List<ZcUbigeoPlace>,
    private val provinces: List<ZcUbigeoPlace>,
    private val districts: List<ZcUbigeoPlace>,
) {
    private val provByDep = provinces.groupBy { it.parent }
    private val distByProv = districts.groupBy { it.parent }
    private val distByCode = districts.associateBy { it.code }
    private val provByCode = provinces.associateBy { it.code }
    private val depByCode = departments.associateBy { it.code }

    val provinceCount get() = provinces.size
    val districtCount get() = districts.size

    fun provinces(department: String?): List<ZcUbigeoPlace> = provByDep[department].orEmpty()
    fun districts(province: String?): List<ZcUbigeoPlace> = distByProv[province].orEmpty()
    fun district(code: String?): ZcUbigeoPlace? = distByCode[code]

    /** "Miraflores, Lima, Lima" (distrito, provincia, departamento). */
    fun label(code: String?): String {
        if (code == null) return ""
        val d = distByCode[code]
        val p = provByCode[d?.parent ?: code.take(4)]
        val dep = depByCode[p?.parent ?: code.take(2)]
        return listOfNotNull(d?.name, p?.name, dep?.name).joinToString(", ")
    }

    companion object {
        @Volatile private var cache: ZcUbigeo? = null

        fun parse(json: String): ZcUbigeo {
            val o = JSONObject(json)
            fun list(key: String, parent: String?) = o.getJSONArray(key).let { a ->
                (0 until a.length()).map { i ->
                    val r = a.getJSONObject(i)
                    ZcUbigeoPlace(r.getString("codigo"), r.getString("nombre"), parent?.let { r.getString(it) }, r.optDouble("lat").takeIf { !it.isNaN() }, r.optDouble("lng").takeIf { !it.isNaN() })
                }
            }
            return ZcUbigeo(list("departamentos", null), list("provincias", "departamento"), list("distritos", "provincia"))
        }

        /** Lee el archivo una sola vez (en un hilo de E/S). */
        suspend fun load(context: Context): ZcUbigeo = cache ?: withContext(Dispatchers.IO) {
            parse(context.resources.openRawResource(R.raw.zc_ubigeo_pe).bufferedReader().use { it.readText() }).also { cache = it }
        }
    }
}

/**
 * Departamento › provincia › distrito del Perú. El valor es el código del distrito (6 dígitos) o null. Cambiar un nivel limpia los de
 * abajo. Cada nivel es un selector con búsqueda (más de 8 opciones). `onLocated` entrega el distrito con sus coordenadas (centro de mapa).
 */
@Composable
fun ZcUbigeoSelect(
    value: String?,
    onValueChange: (String?) -> Unit,
    modifier: Modifier = Modifier,
    required: Boolean = false,
    enabled: Boolean = true,
    error: String? = null,
    data: ZcUbigeo? = null,
    onLocated: (ZcUbigeoPlace) -> Unit = {},
) {
    val ctx = LocalContext.current
    var loaded by remember { mutableStateOf(data) }
    LaunchedEffect(data) { if (data != null) loaded = data else if (loaded == null) loaded = runCatching { ZcUbigeo.load(ctx) }.getOrNull() }
    val tree = data ?: loaded
    // Departamento y provincia siguen al valor cuando llega uno y los manda la persona al elegir.
    var dep by remember { mutableStateOf(value?.take(2)) }
    var prov by remember { mutableStateOf(value?.take(4)) }
    LaunchedEffect(value) { if (value != null) { dep = value.take(2); prov = value.take(4) } }

    Column(modifier, verticalArrangement = Arrangement.spacedBy(16.dp)) {
        ZcSelect(
            tree?.departments.orEmpty().map { ZcSelectOption(it.code, it.name) }, dep, { dep = it; prov = null; onValueChange(null) },
            ctx.getString(R.string.zc_ui_ubigeo_departamento), required = required, enabled = enabled && tree != null,
            placeholder = ctx.getString(if (tree != null) R.string.zc_ui_ubigeo_elige_departamento else R.string.zc_ui_cargando),
        )
        ZcSelect(
            tree?.provinces(dep).orEmpty().map { ZcSelectOption(it.code, it.name) }, prov, { prov = it; onValueChange(null) },
            ctx.getString(R.string.zc_ui_ubigeo_provincia), required = required, enabled = enabled && dep != null,
            placeholder = ctx.getString(R.string.zc_ui_ubigeo_elige_provincia),
        )
        ZcSelect(
            tree?.districts(prov).orEmpty().map { ZcSelectOption(it.code, it.name) }, value,
            { code -> onValueChange(code); tree?.district(code)?.let(onLocated) },
            ctx.getString(R.string.zc_ui_ubigeo_distrito), required = required, enabled = enabled && prov != null, error = error,
            placeholder = ctx.getString(R.string.zc_ui_ubigeo_elige_distrito),
        )
    }
}
