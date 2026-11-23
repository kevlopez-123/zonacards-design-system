package com.zonacards.ui.tokens.domain

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Base64

/**
 * Importar y exportar: corre los casos de domain-vectors.json que salen del motor de la web (`processMatrix`, `parseCsv`, `toCsv`,
 * `toXlsxSheets`, `readXlsx`, `bulkTemplate`, `exportFileName`). El XLSX que escribimos debe salir byte por byte igual que el de la web.
 */
class BulkVectorsTest {
    private val v: Map<String, Any?> = ZcJson.parse(
        javaClass.classLoader!!.getResourceAsStream("zonacards/domain-vectors.json")!!.bufferedReader(Charsets.UTF_8).use { it.readText() },
    ).obj()

    private fun cases(group: String) = v[group].list().map { it.obj() }

    /** Forma canónica para comparar (llaves ordenadas; 5.0 y 5 son lo mismo). */
    private fun canon(x: Any?): String = when (x) {
        null -> "null"
        is String -> "\"$x\""
        is Boolean -> x.toString()
        is Double -> if (!x.isInfinite() && x == Math.floor(x)) x.toLong().toString() else x.toString()
        is Number -> x.toString()
        is Map<*, *> -> x.entries.sortedBy { it.key as String }.joinToString(",", "{", "}") { "\"${it.key}\":${canon(it.value)}" }
        is List<*> -> x.joinToString(",", "[", "]") { canon(it) }
        else -> error("tipo no previsto: $x")
    }

    private fun check(group: String, run: (Map<String, Any?>) -> Pair<Any?, Any?>) {
        val fails = ArrayList<String>()
        val all = cases(group)
        for (c in all) {
            val (expected, actual) = try { run(c) } catch (e: Throwable) { c["out"] to "EXCEPCIÓN $e" }
            if (canon(expected) != canon(actual)) fails.add("${c["name"] ?: c["s"] ?: c["text"] ?: c}\n    esperado: ${canon(expected)}\n    obtenido: ${canon(actual)}")
        }
        assertTrue("$group: ${fails.size} de ${all.size} no coinciden\n" + fails.take(10).joinToString("\n"), fails.isEmpty())
    }

    private fun columns(list: Any?): List<ZcBulkColumn> = list.list().map { it.obj() }.map { c ->
        ZcBulkColumn(
            key = c["key"].str(), title = c["title"].str(),
            type = when (c["type"].str()) {
                "text" -> ZcBulkType.Text; "code" -> ZcBulkType.Code; "integer" -> ZcBulkType.Integer
                "date" -> ZcBulkType.Date; "option" -> ZcBulkType.Option; else -> ZcBulkType.Email
            },
            required = c["required"] == true,
            maxLength = (c["maxLength"] as Double?)?.toInt(),
            min = (c["min"] as Double?)?.toLong(), max = (c["max"] as Double?)?.toLong(),
            options = c["options"]?.list()?.map { it.str() } ?: emptyList(),
            help = c["help"] as String? ?: "", example = c["example"] ?: "",
            aliases = c["aliases"]?.list()?.map { it.str() } ?: emptyList(),
        )
    }

    private fun errorMap(e: ZcBulkError): Map<String, Any?> {
        val m = LinkedHashMap<String, Any?>()
        m["code"] = e.code.key
        e.field?.let { m["field"] = it }
        if (e.params.isNotEmpty()) m["params"] = e.params
        return m
    }

    @Test fun processMatrix() = check("bulk") { c ->
        val keyFields = c["keyFields"]?.list()?.map { it.str() }
        val keyOf: ((Map<String, Any>) -> String)? = keyFields?.let { f -> { values -> f.joinToString("|") { values[it]?.toString() ?: "" } } }
        val matrix = c["matrix"].list().map { r -> r.list().map { it.str() } }
        val result = ZcBulk.processMatrix(columns(c["columns"]), matrix, keyOf, (c["maxRows"] as Double?)?.toInt())
        val actual = LinkedHashMap<String, Any?>()
        actual["rows"] = result.rows.map { r ->
            val m = LinkedHashMap<String, Any?>()
            m["row"] = r.row; m["values"] = r.values
            r.error?.let { m["error"] = errorMap(it) }
            m
        }
        result.fileError?.let { actual["fileError"] = errorMap(it) }
        c["out"] to actual
    }

    @Test fun parseDate() = check("bulkDate") { c -> c["out"] to ZcBulk.parseDate(c["s"].str()) }

    @Test fun parseCsv() = check("csvParse") { c -> c["out"] to ZcBulk.parseCsv(c["text"].str()) }

    @Test fun toCsv() = check("csvOut") { c -> c["out"] to ZcExport.toCsv(c["rows"].list().map { it.list() }) }

    @Test fun fileName() = check("fileName") { c -> c["out"] to ZcExport.fileName(c["title"].str(), c["ext"].str(), c["iso"].str()) }

    @Test fun template() = check("template") { c ->
        val l = c["labels"].obj()
        val labels = ZcBulkTemplateLabels(l["data"].str(), l["instructions"].str(), l["column"].str(), l["required"].str(), l["whatToWrite"].str(), l["example"].str(), l["yes"].str(), l["no"].str())
        c["out"] to ZcBulk.template(columns(c["columns"]), labels).map { mapOf("name" to it.name, "rows" to it.rows) }
    }

    private fun sheets(list: Any?) = list.list().map { it.obj() }.map { s -> ZcXlsxSheet(s["name"].str(), s["rows"].list().map { it.list() }) }

    @Test fun xlsxIsByteForByteTheSameAsTheWeb() {
        val all = cases("xlsxOut")
        assertTrue(all.isNotEmpty())
        for (c in all) {
            val expected = Base64.getDecoder().decode(c["base64"].str())
            val actual = ZcExport.toXlsxSheets(sheets(c["sheets"]))
            assertArrayEquals("bytes del libro ${c["sheets"].list().map { it.obj()["name"] }}", expected, actual)
            assertEquals((c["crc"] as Double).toLong(), ZcExport.crc32(actual))
        }
    }

    @Test fun readXlsx() {
        val all = cases("xlsxRead")
        assertTrue(all.size >= 8)
        for (c in all) {
            val bytes = Base64.getDecoder().decode(c["base64"].str())
            if (c["out"] == "error") {
                assertThrows("${c["name"]}", ZcInvalidWorkbookException::class.java) { ZcXlsx.read(bytes) }
            } else {
                val actual = ZcXlsx.read(bytes).map { mapOf("name" to it.name, "rows" to it.rows) }
                assertEquals("${c["name"]}", canon(c["out"]), canon(actual))
            }
        }
    }

    @Test fun whatWeWriteWeCanRead() {
        val rows = listOf(listOf("Código", "Monto"), listOf("A-1", 10.5), listOf("ñandú & <b>", 0))
        val read = ZcXlsx.read(ZcExport.toXlsx(rows))
        assertEquals(listOf(listOf("Código", "Monto"), listOf("A-1", "10.5"), listOf("ñandú & <b>", "0")), read.single().rows)
    }
}
