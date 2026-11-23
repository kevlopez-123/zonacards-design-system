package com.zonacards.ui.tokens.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** `processFile`: elige CSV o Excel según el contenido y devuelve "archivo inválido" en lo demás. */
class BulkFileTest {
    private val columns = listOf(
        ZcBulkColumn("code", "Código", ZcBulkType.Code, required = true, maxLength = 12),
        ZcBulkColumn("qty", "Cantidad", ZcBulkType.Integer, min = 1),
    )

    @Test fun readsACsvByExtension() {
        val r = ZcBulk.processFile("datos.csv", "Código;Cantidad\nA-1;5\nB-2;0\n".toByteArray(), columns)
        assertNull(r.fileError)
        assertEquals(listOf(null, ZcBulkErrorCode.Min), r.rows.map { it.error?.code })
        assertEquals(mapOf<String, Any>("code" to "A-1", "qty" to 5L), r.rows[0].values)
    }

    @Test fun readsTheFirstSheetOfAnExcelFile() {
        val bytes = ZcExport.toXlsx(listOf(listOf("Código *", "Cantidad"), listOf("X1", 3), listOf("X2", 4)))
        val r = ZcBulk.processFile("clientes.xlsx", bytes, columns)
        assertNull(r.fileError)
        assertEquals(2, r.rows.size)
        assertTrue(r.rows.all { it.error == null })
    }

    @Test fun readsAnExcelEvenWithoutAnExtension() {
        val bytes = ZcExport.toXlsx(listOf(listOf("Código", "Cantidad"), listOf("X1", 3)))
        assertEquals(1, ZcBulk.processFile("document:1234", bytes, columns).rows.size)
    }

    @Test fun anythingElseIsAnInvalidFile() {
        val binary = byteArrayOf(0x25, 0x50, 0x44, 0x46, 0x00, 0x01, 0x02)   // un PDF
        assertEquals(ZcBulkErrorCode.InvalidFile, ZcBulk.processFile("x.pdf", binary, columns).fileError?.code)
        val brokenZip = byteArrayOf('P'.code.toByte(), 'K'.code.toByte(), 3, 4, 0, 0)
        assertEquals(ZcBulkErrorCode.InvalidFile, ZcBulk.processFile("x.xlsx", brokenZip, columns).fileError?.code)
    }

    @Test fun anEmptyFileIsReportedAsEmpty() {
        assertEquals(ZcBulkErrorCode.EmptyFile, ZcBulk.processFile("vacio.csv", ByteArray(0), columns).fileError?.code)
    }
}
