package com.zonacards.ui.tokens.domain

import java.text.Normalizer
import java.time.LocalDate

/**
 * Motor de las importaciones masivas (equivale a `processMatrix` de @zonacards/tokens/domain): convierte las filas de una hoja en valores
 * validados, fila por fila, sin que una fila mala frene a las demás. Es puro (sin Android ni red) y lo comprueban los mismos casos que la web
 * (domain-vectors.json). Los errores salen como códigos con parámetros; se traducen al dibujar con la clave `mol.importar.err.<key>`.
 *
 * Reglas: la primera fila es el encabezado (se reconoce sin tildes, sin «*» y sin importar mayúsculas); las filas totalmente vacías se
 * ignoran; las columnas obligatorias deben venir con dato; una llave (`keyOf`) repetida se rechaza a partir de la segunda.
 */
enum class ZcBulkType { Text, Code, Integer, Date, Option, Email }

/** Columna de una importación. `example` es texto o número (va en la plantilla). */
data class ZcBulkColumn(
    val key: String,
    val title: String,
    val type: ZcBulkType,
    val required: Boolean = false,
    val maxLength: Int? = null,
    val min: Long? = null,
    val max: Long? = null,
    /** Valores permitidos (tipo `Option`). */
    val options: List<String> = emptyList(),
    /** Qué escribir (va en la hoja de instrucciones de la plantilla). */
    val help: String = "",
    val example: Any = "",
    /** Otros nombres con los que se reconoce el encabezado. */
    val aliases: List<String> = emptyList(),
)

/** Códigos de error de una fila o del archivo; `key` es el de i18n (`mol.importar.err.<key>`). */
enum class ZcBulkErrorCode(val key: String) {
    Required("required"), MaxLength("maxLength"), Code("code"), Integer("integer"), Min("min"), Max("max"), Date("date"), Option("option"),
    Email("email"), Duplicate("duplicate"), EmptyFile("emptyFile"), MissingColumns("missingColumns"), TooManyRows("tooManyRows"), InvalidFile("invalidFile"),
}

/** Un error con sus parámetros (`title`, `max`, `len`, `min`, `list`, `row`, `n`) para completar el texto traducido. */
data class ZcBulkError(val code: ZcBulkErrorCode, val field: String? = null, val params: Map<String, Any> = emptyMap())

/** `row` es el número de fila en el archivo (2 = primera fila de datos); `values` trae solo las columnas con dato (texto o `Long`). */
data class ZcBulkRow(val row: Int, val values: Map<String, Any>, val error: ZcBulkError? = null)

/** `fileError` indica que el archivo no se puede procesar (faltan columnas, está vacío…). */
data class ZcBulkResult(val rows: List<ZcBulkRow>, val fileError: ZcBulkError? = null)

/** Rótulos de la plantilla (ya traducidos por quien la pide). */
data class ZcBulkTemplateLabels(
    val data: String, val instructions: String, val column: String, val required: String,
    val whatToWrite: String, val example: String, val yes: String, val no: String,
)

object ZcBulk {
    private val accents = Regex("[̀-ͯ]")
    private val codeRe = Regex("^[A-Za-z0-9][A-Za-z0-9._-]*$")
    private val integerRe = Regex("^-?[0-9]+(\\.0+)?$")
    private val emailRe = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
    private val isoRe = Regex("^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
    private val dmyRe = Regex("^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$")
    private val serialRe = Regex("^[0-9]{5}(\\.[0-9]+)?$")

    fun stripAccents(s: String): String = Normalizer.normalize(s, Normalizer.Form.NFD).replace(accents, "").trim().lowercase()

    /** Encabezado normalizado: sin tildes, sin «*», en minúsculas. */
    fun normalizeHeader(s: String): String = stripAccents(s.replace("*", ""))

    /** Fecha AAAA-MM-DD, dd/mm/aaaa o número de serie de Excel → «AAAA-MM-DD» (o `null`). */
    fun parseDate(s: String): String? {
        val iso: String = when {
            isoRe.matches(s) -> s
            dmyRe.matches(s) -> {
                val p = s.split("/")
                "${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}"
            }
            serialRe.matches(s) && s.toDouble() > 20000 && s.toDouble() < 90000 -> ZcXlsx.serialToDate(s.toDouble())
            else -> return null
        }
        val y = iso.substring(0, 4).toInt()
        val m = iso.substring(5, 7).toInt()
        val d = iso.substring(8, 10).toInt()
        if (m !in 1..12 || d < 1) return null
        val last = LocalDate.of(y, m, 1).lengthOfMonth()
        return if (d <= last) iso else null
    }

    private sealed interface Conversion {
        data class Ok(val value: Any) : Conversion
        data class Bad(val error: ZcBulkError) : Conversion
    }

    private fun bad(c: ZcBulkColumn, code: ZcBulkErrorCode, params: Map<String, Any> = emptyMap()) =
        Conversion.Bad(ZcBulkError(code, c.key, mapOf<String, Any>("title" to c.title) + params))

    private fun convert(c: ZcBulkColumn, raw: String): Conversion {
        val s = raw.trim()
        fun tooLong(t: String): Conversion? = if (c.maxLength != null && t.length > c.maxLength) bad(c, ZcBulkErrorCode.MaxLength, mapOf("max" to c.maxLength, "len" to t.length)) else null
        return when (c.type) {
            ZcBulkType.Text -> tooLong(s) ?: Conversion.Ok(s)
            ZcBulkType.Code -> if (!codeRe.matches(s)) bad(c, ZcBulkErrorCode.Code) else tooLong(s) ?: Conversion.Ok(s)
            ZcBulkType.Integer -> {
                if (!integerRe.matches(s)) return bad(c, ZcBulkErrorCode.Integer)
                val n = s.replace(Regex("\\.0+$"), "").toLongOrNull() ?: return bad(c, ZcBulkErrorCode.Integer)
                when {
                    c.min != null && n < c.min -> bad(c, ZcBulkErrorCode.Min, mapOf("min" to c.min))
                    c.max != null && n > c.max -> bad(c, ZcBulkErrorCode.Max, mapOf("max" to c.max))
                    else -> Conversion.Ok(n)
                }
            }
            ZcBulkType.Date -> parseDate(s)?.let { Conversion.Ok(it) } ?: bad(c, ZcBulkErrorCode.Date)
            ZcBulkType.Option -> {
                val found = c.options.firstOrNull { stripAccents(it) == stripAccents(s) }
                if (found != null) Conversion.Ok(found) else bad(c, ZcBulkErrorCode.Option, mapOf("list" to c.options.joinToString(", ")))
            }
            ZcBulkType.Email -> if (!emailRe.matches(s)) bad(c, ZcBulkErrorCode.Email) else tooLong(s) ?: Conversion.Ok(s.lowercase())
        }
    }

    private fun hasData(cells: List<String>) = cells.any { it.trim().isNotEmpty() }

    /**
     * Procesa la matriz de una hoja. `keyOf` arma la llave que identifica cada fila (las repetidas se rechazan desde la segunda);
     * `maxRows` limita las filas con datos.
     */
    fun processMatrix(columns: List<ZcBulkColumn>, matrix: List<List<String>>, keyOf: ((Map<String, Any>) -> String)? = null, maxRows: Int? = null): ZcBulkResult {
        val header = matrix.firstOrNull()
        if (header == null || !hasData(header)) return ZcBulkResult(emptyList(), ZcBulkError(ZcBulkErrorCode.EmptyFile))
        val data = matrix.drop(1)
        val normal = header.map { normalizeHeader(it) }
        val index = columns.map { c ->
            normal.indexOfFirst { h -> h == normalizeHeader(c.title) || h == normalizeHeader(c.key) || c.aliases.any { normalizeHeader(it) == h } }
        }
        val missing = columns.filterIndexed { i, c -> index[i] == -1 && c.required }.map { it.title }
        if (missing.isNotEmpty()) return ZcBulkResult(emptyList(), ZcBulkError(ZcBulkErrorCode.MissingColumns, params = mapOf("list" to missing.joinToString(", "))))
        val filled = data.count { hasData(it) }
        if (maxRows != null && filled > maxRows) return ZcBulkResult(emptyList(), ZcBulkError(ZcBulkErrorCode.TooManyRows, params = mapOf("max" to maxRows, "n" to filled)))

        val seen = HashMap<String, Int>()
        val rows = ArrayList<ZcBulkRow>()
        data.forEachIndexed { k, cells ->
            if (!hasData(cells)) return@forEachIndexed
            val row = k + 2
            val values = LinkedHashMap<String, Any>()
            var error: ZcBulkError? = null
            columns.forEachIndexed { i, c ->
                if (error != null) return@forEachIndexed
                val pos = index[i]
                val rawValue = if (pos >= 0) (cells.getOrNull(pos) ?: "").trim() else ""
                if (rawValue.isEmpty()) {
                    if (c.required) error = ZcBulkError(ZcBulkErrorCode.Required, c.key, mapOf("title" to c.title))
                    return@forEachIndexed
                }
                when (val r = convert(c, rawValue)) {
                    is Conversion.Ok -> values[c.key] = r.value
                    is Conversion.Bad -> error = r.error
                }
            }
            if (error == null && keyOf != null) {
                val key = keyOf(values).lowercase()
                val previous = seen[key]
                if (previous != null) error = ZcBulkError(ZcBulkErrorCode.Duplicate, params = mapOf("row" to previous)) else seen[key] = row
            }
            rows.add(ZcBulkRow(row, values, error))
        }
        return ZcBulkResult(rows)
    }

    /** Texto de un CSV (comillas dobles, coma o punto y coma como separador, BOM) → matriz de textos. */
    fun parseCsv(text: String): List<List<String>> {
        val src = text.removePrefix("﻿")
        val firstLine = src.split(Regex("\r?\n"), limit = 2).first()
        val sep = if (firstLine.split(";").size > firstLine.split(",").size) ';' else ','
        val rows = ArrayList<List<String>>()
        var row = ArrayList<String>()
        val cur = StringBuilder()
        var quoted = false
        var i = 0
        while (i < src.length) {
            val ch = src[i]
            if (quoted) {
                if (ch == '"') { if (i + 1 < src.length && src[i + 1] == '"') { cur.append('"'); i++ } else quoted = false } else cur.append(ch)
            } else if (ch == '"') quoted = true
            else if (ch == sep) { row.add(cur.toString().trim()); cur.setLength(0) }
            else if (ch == '\n' || ch == '\r') {
                if (ch == '\r' && i + 1 < src.length && src[i + 1] == '\n') i++
                row.add(cur.toString().trim()); rows.add(row); row = ArrayList(); cur.setLength(0)
            } else cur.append(ch)
            i++
        }
        if (cur.isNotEmpty() || row.isNotEmpty()) { row.add(cur.toString().trim()); rows.add(row) }
        return rows
    }

    /**
     * Plantilla descargable: hoja «Datos» (encabezados, con «*» en los obligatorios, y una fila de ejemplo) y hoja de instrucciones con qué
     * escribir en cada columna. Se escribe con `ZcExport.toXlsxSheets`.
     */
    fun template(columns: List<ZcBulkColumn>, l: ZcBulkTemplateLabels): List<ZcXlsxSheet> = listOf(
        ZcXlsxSheet(l.data, listOf(columns.map { it.title + if (it.required) " *" else "" }, columns.map { it.example })),
        ZcXlsxSheet(
            l.instructions,
            listOf(listOf(l.column, l.required, l.whatToWrite, l.example)) + columns.map { listOf(it.title, if (it.required) l.yes else l.no, it.help, it.example) },
        ),
    )
}
