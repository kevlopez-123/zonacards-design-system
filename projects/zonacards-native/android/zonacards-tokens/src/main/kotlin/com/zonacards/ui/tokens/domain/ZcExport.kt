package com.zonacards.ui.tokens.domain

import java.io.ByteArrayOutputStream
import java.math.BigDecimal
import java.text.Normalizer

/** Una hoja de un libro de Excel: nombre (máx. 31 caracteres) y filas. Las celdas son texto, número, `null` o vacío. */
data class ZcXlsxSheet(val name: String, val rows: List<List<Any?>>)

/**
 * Exportación de datos tabulares sin librerías (equivale a `toCsv`, `toXlsxSheets` y `exportFileName` de @zonacards/tokens/domain):
 * CSV (UTF-8 con BOM, para que Excel respete tildes) y XLSX mínimo (Office Open XML con cadenas en línea, en un ZIP sin compresión).
 * Las cifras van sin formato (número puro) y las fechas en ISO 8601. El XLSX sale byte por byte igual que el de la web (lo comprueban los vectores).
 * La app guarda o comparte los bytes con su propio selector de archivos.
 */
object ZcExport {
    const val MIME_CSV = "text/csv;charset=utf-8"
    const val MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    /** El texto de un número como lo escribe JavaScript: `2.5`, `10`, `1e+21`. */
    internal fun numberText(v: Number): String {
        if (v is Int || v is Long || v is Short || v is Byte) return v.toString()
        val x = v.toDouble()
        if (x.isNaN()) return "NaN"
        if (x.isInfinite()) return if (x > 0) "Infinity" else "-Infinity"
        if (x == 0.0) return "0"
        val abs = Math.abs(x)
        val shortest = java.lang.Double.toString(x)   // dígitos más cortos que ida y vuelta, como JavaScript
        return if (abs >= 1e21 || abs < 1e-6) {
            val (mantissa, exp) = shortest.split("E").let { it[0] to (it.getOrNull(1)?.toInt() ?: 0) }
            val m = BigDecimal(mantissa).stripTrailingZeros().toPlainString()
            "${m}e${if (exp >= 0) "+" else "-"}${Math.abs(exp)}"
        } else BigDecimal(shortest).stripTrailingZeros().toPlainString()
    }

    private fun cellText(v: Any?): String = when (v) {
        null -> ""
        is Number -> numberText(v)
        else -> v.toString()
    }

    fun toCsv(rows: List<List<Any?>>): String {
        fun esc(v: Any?): String {
            val s = cellText(v)
            return if (s.any { it == '"' || it == ',' || it == '\n' || it == '\r' }) "\"" + s.replace("\"", "\"\"") + "\"" else s
        }
        return "﻿" + rows.joinToString("\r\n") { r -> r.joinToString(",") { esc(it) } }
    }

    private fun xml(s: String) = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;")

    private fun colName(i: Int): String {
        var s = ""
        var n = i + 1
        while (n > 0) { s = ('A' + ((n - 1) % 26)) + s; n = (n - 1) / 26 }
        return s
    }

    private fun sheetXml(rows: List<List<Any?>>): String {
        val body = StringBuilder()
        rows.forEachIndexed { ri, r ->
            body.append("<row r=\"${ri + 1}\">")
            r.forEachIndexed { ci, v ->
                val ref = colName(ci) + (ri + 1)
                when {
                    v is Number && (v is Int || v is Long || v.toDouble().isFinite()) -> body.append("<c r=\"$ref\"><v>${numberText(v)}</v></c>")
                    v == null || v == "" -> Unit
                    else -> body.append("<c r=\"$ref\" t=\"inlineStr\"><is><t xml:space=\"preserve\">${xml(cellText(v))}</t></is></c>")
                }
            }
            body.append("</row>")
        }
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>$body</sheetData></worksheet>"
    }

    private val crcTable = IntArray(256) { n ->
        var c = n
        repeat(8) { c = if (c and 1 != 0) 0xedb88320.toInt() xor (c ushr 1) else c ushr 1 }
        c
    }

    /** CRC-32 de un ZIP, sin signo (como `Long`). */
    fun crc32(data: ByteArray): Long {
        var c = -1
        for (b in data) c = crcTable[(c xor b.toInt()) and 0xff] xor (c ushr 8)
        return (c xor -1).toLong() and 0xffffffffL
    }

    private fun ByteArrayOutputStream.u16(v: Int) { write(v and 0xff); write((v ushr 8) and 0xff) }
    private fun ByteArrayOutputStream.u32(v: Long) { u16((v and 0xffff).toInt()); u16(((v ushr 16) and 0xffff).toInt()) }

    /** ZIP sin compresión (método 0): suficiente para un XLSX de pocas filas y sin dependencias. */
    fun zipStore(files: List<Pair<String, String>>): ByteArray {
        val parts = ByteArrayOutputStream()
        val central = ByteArrayOutputStream()
        for ((nameText, dataText) in files) {
            val name = nameText.toByteArray(Charsets.UTF_8)
            val data = dataText.toByteArray(Charsets.UTF_8)
            val crc = crc32(data)
            val offset = parts.size().toLong()
            parts.u32(0x04034b50); parts.u16(20); parts.u16(0); parts.u16(0); parts.u16(0); parts.u16(0)
            parts.u32(crc); parts.u32(data.size.toLong()); parts.u32(data.size.toLong()); parts.u16(name.size); parts.u16(0)
            parts.write(name); parts.write(data)
            central.u32(0x02014b50); central.u16(20); central.u16(20); central.u16(0); central.u16(0); central.u16(0); central.u16(0)
            central.u32(crc); central.u32(data.size.toLong()); central.u32(data.size.toLong()); central.u16(name.size); central.u16(0); central.u16(0)
            central.u16(0); central.u16(0); central.u32(0); central.u32(offset)
            central.write(name)
        }
        val cenSize = central.size().toLong()
        val offset = parts.size().toLong()
        val out = ByteArrayOutputStream()
        out.write(parts.toByteArray()); out.write(central.toByteArray())
        out.u32(0x06054b50); out.u16(0); out.u16(0); out.u16(files.size); out.u16(files.size); out.u32(cenSize); out.u32(offset); out.u16(0)
        return out.toByteArray()
    }

    /** Libro de Excel con una o más hojas (Office Open XML con cadenas en línea, ZIP sin compresión). */
    fun toXlsxSheets(sheets: List<ZcXlsxSheet>): ByteArray {
        val head = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
        val rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
        val types = head + "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>" +
            sheets.indices.joinToString("") { "<Override PartName=\"/xl/worksheets/sheet${it + 1}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" } + "</Types>"
        val book = head + "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"$rel\"><sheets>" +
            sheets.mapIndexed { i, sh -> "<sheet name=\"${xml(sh.name.take(31))}\" sheetId=\"${i + 1}\" r:id=\"rId${i + 1}\"/>" }.joinToString("") + "</sheets></workbook>"
        val bookRels = head + "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
            sheets.indices.joinToString("") { "<Relationship Id=\"rId${it + 1}\" Type=\"$rel/worksheet\" Target=\"worksheets/sheet${it + 1}.xml\"/>" } + "</Relationships>"
        return zipStore(
            listOf(
                "[Content_Types].xml" to types,
                "_rels/.rels" to (head + "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"$rel/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>"),
                "xl/workbook.xml" to book,
                "xl/_rels/workbook.xml.rels" to bookRels,
            ) + sheets.mapIndexed { i, sh -> "xl/worksheets/sheet${i + 1}.xml" to sheetXml(sh.rows) },
        )
    }

    /** Libro de una sola hoja. */
    fun toXlsx(rows: List<List<Any?>>, sheetName: String = "Datos"): ByteArray = toXlsxSheets(listOf(ZcXlsxSheet(sheetName, rows)))

    /** Nombre de archivo seguro: minúsculas, sin tildes, con fecha ISO. "ventas-por-dia-2026-10-10.xlsx". */
    fun fileName(title: String, ext: String, isoDate: String): String {
        val slug = Normalizer.normalize(title, Normalizer.Form.NFD).replace(Regex("[̀-ͯ]"), "").lowercase()
            .replace(Regex("[^a-z0-9]+"), "-").replace(Regex("^-|-$"), "").take(60)
        return "${slug.ifEmpty { "datos" }}-$isoDate.$ext"
    }
}
