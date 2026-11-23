package com.zonacards.ui.tokens.domain

import org.w3c.dom.Document
import org.w3c.dom.Element
import java.io.ByteArrayInputStream
import java.time.LocalDate
import java.util.zip.Inflater
import javax.xml.parsers.DocumentBuilderFactory

/** El archivo no es un ZIP o un XLSX legible. */
class ZcInvalidWorkbookException(message: String) : Exception(message)

/** Una hoja leída: nombre y filas con todas las columnas como texto (vacío si la celda no tiene valor). */
data class ZcSheetRead(val name: String, val rows: List<List<String>>)

/**
 * Lector de libros de Excel (.xlsx) sin librerías (equivale a `readXlsx` de @zonacards/tokens/domain): abre el ZIP, descomprime con `java.util.zip`
 * y devuelve cada hoja como una matriz de textos. No evalúa fórmulas: lee el último valor guardado. La app le pasa los bytes del archivo que
 * eligió el usuario (selector de documentos del sistema). Lanza [ZcInvalidWorkbookException] si no es un Excel válido.
 */
object ZcXlsx {
    private class ZipEntry(val method: Int, val compressed: Int, val uncompressed: Int, val offset: Int)

    private fun u16(b: ByteArray, o: Int) = (b[o].toInt() and 0xff) or ((b[o + 1].toInt() and 0xff) shl 8)
    private fun u32(b: ByteArray, o: Int): Long = (u16(b, o).toLong()) or (u16(b, o + 2).toLong() shl 16)

    private fun zipEntries(buf: ByteArray): Map<String, ZipEntry> {
        var end = -1
        var i = buf.size - 22
        val lowest = maxOf(0, buf.size - 65557)
        while (i >= lowest) {
            if (u32(buf, i) == 0x06054b50L) { end = i; break }
            i--
        }
        if (end < 0) throw ZcInvalidWorkbookException("zip")
        val total = u16(buf, end + 10)
        var o = u32(buf, end + 16).toInt()
        val map = LinkedHashMap<String, ZipEntry>()
        repeat(total) {
            if (o < 0 || o + 46 > buf.size || u32(buf, o) != 0x02014b50L) throw ZcInvalidWorkbookException("zip")
            val method = u16(buf, o + 10)
            val compressed = u32(buf, o + 20).toInt()
            val uncompressed = u32(buf, o + 24).toInt()
            val nameLen = u16(buf, o + 28)
            val extraLen = u16(buf, o + 30)
            val commentLen = u16(buf, o + 32)
            val offset = u32(buf, o + 42).toInt()
            if (o + 46 + nameLen > buf.size) throw ZcInvalidWorkbookException("zip")
            val name = String(buf, o + 46, nameLen, Charsets.UTF_8)
            map[name] = ZipEntry(method, compressed, uncompressed, offset)
            o += 46 + nameLen + extraLen + commentLen
        }
        return map
    }

    private fun entryBytes(buf: ByteArray, e: ZipEntry): ByteArray {
        if (e.offset < 0 || e.offset + 30 > buf.size || u32(buf, e.offset) != 0x04034b50L) throw ZcInvalidWorkbookException("zip")
        val start = e.offset + 30 + u16(buf, e.offset + 26) + u16(buf, e.offset + 28)
        if (e.compressed < 0 || start + e.compressed > buf.size) throw ZcInvalidWorkbookException("zip")
        val data = buf.copyOfRange(start, start + e.compressed)
        if (e.method == 0) return data
        if (e.method != 8) throw ZcInvalidWorkbookException("zip")
        // Límite de tamaño: un libro de importación no pasa de 64 MB descomprimido (protege de archivos que se expanden sin medida).
        if (e.uncompressed < 0 || e.uncompressed > 64 * 1024 * 1024) throw ZcInvalidWorkbookException("zip")
        val inflater = Inflater(true)   // true = sin cabecera zlib (deflate crudo, como en un ZIP)
        try {
            inflater.setInput(data)
            val out = ByteArray(e.uncompressed)
            var n = 0
            while (n < out.size) {
                val k = inflater.inflate(out, n, out.size - n)
                if (k == 0 && (inflater.finished() || inflater.needsInput() || inflater.needsDictionary())) break
                n += k
            }
            if (n != out.size) throw ZcInvalidWorkbookException("zip")
            return out
        } catch (e: java.util.zip.DataFormatException) {
            throw ZcInvalidWorkbookException("zip")
        } finally {
            inflater.end()
        }
    }

    private fun parse(xml: String): Document = try {
        val f = DocumentBuilderFactory.newInstance()
        f.isNamespaceAware = false
        try { f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true) } catch (_: Exception) { /* el analizador de Android no lo trae */ }
        f.isExpandEntityReferences = false
        f.newDocumentBuilder().parse(ByteArrayInputStream(xml.toByteArray(Charsets.UTF_8)))
    } catch (e: Exception) {
        throw ZcInvalidWorkbookException("xml")
    }

    private fun tags(el: Element, name: String): List<Element> {
        val list = el.getElementsByTagName(name)
        return (0 until list.length).map { list.item(it) as Element }
    }

    /** Índice de columna (0 = A) de una referencia de celda («C12»). */
    fun columnIndex(ref: String): Int {
        var n = 0
        for (ch in ref) {
            if (ch.code < 65 || ch.code > 90) break
            n = n * 26 + (ch.code - 64)
        }
        return n - 1
    }

    /** Fecha de un número de serie de Excel (días desde 1899-12-30) en formato AAAA-MM-DD. */
    fun serialToDate(n: Double): String = LocalDate.of(1899, 12, 30).plusDays(Math.floor(n + 0.5).toLong()).toString()

    /** Lee todas las hojas del libro. */
    fun read(data: ByteArray): List<ZcSheetRead> {
        val entries = zipEntries(data)
        fun text(path: String): String = entries[path]?.let { String(entryBytes(data, it), Charsets.UTF_8) } ?: ""
        val book = text("xl/workbook.xml")
        if (book.isEmpty()) throw ZcInvalidWorkbookException("xlsx")
        val target = HashMap<String, String>()
        val rels = text("xl/_rels/workbook.xml.rels")
        if (rels.isNotEmpty()) for (r in tags(parse(rels).documentElement, "Relationship")) {
            target[r.getAttribute("Id")] = r.getAttribute("Target").replace(Regex("^/?(xl/)?"), "xl/")
        }
        val shared = ArrayList<String>()
        val ss = text("xl/sharedStrings.xml")
        if (ss.isNotEmpty()) for (si in tags(parse(ss).documentElement, "si")) shared.add(tags(si, "t").joinToString("") { it.textContent ?: "" })

        val sheets = ArrayList<ZcSheetRead>()
        for (s in tags(parse(book).documentElement, "sheet")) {
            val rid = s.getAttribute("r:id")
            val path = target[rid]
            val body = if (path != null) text(path) else ""
            if (body.isEmpty()) continue
            val rows = ArrayList<List<String>>()   // filas con huecos se rellenan con listas vacías
            for (row in tags(parse(body).documentElement, "row")) {
                val attr = row.getAttribute("r")
                val r = (attr.toIntOrNull() ?: (rows.size + 1)) - 1
                val cells = ArrayList<String>()
                for (c in tags(row, "c")) {
                    val col = columnIndex(c.getAttribute("r"))
                    if (col < 0) continue
                    val type = c.getAttribute("t")
                    val v = tags(c, "v").firstOrNull()?.textContent ?: ""
                    var value = v
                    when (type) {
                        "s" -> value = shared.getOrNull(v.trim().toIntOrNull() ?: -1) ?: ""
                        "inlineStr" -> value = tags(c, "t").joinToString("") { it.textContent ?: "" }
                        "b" -> value = if (v == "1") "VERDADERO" else "FALSO"
                    }
                    while (cells.size <= col) cells.add("")
                    cells[col] = value.trim()
                }
                while (cells.isNotEmpty() && cells.last().isEmpty()) cells.removeAt(cells.size - 1)
                if (r < 0) continue
                while (rows.size <= r) rows.add(emptyList())
                rows[r] = cells
            }
            sheets.add(ZcSheetRead(s.getAttribute("name").ifEmpty { "Hoja ${sheets.size + 1}" }, rows))
        }
        if (sheets.isEmpty()) throw ZcInvalidWorkbookException("xlsx")
        return sheets
    }
}
