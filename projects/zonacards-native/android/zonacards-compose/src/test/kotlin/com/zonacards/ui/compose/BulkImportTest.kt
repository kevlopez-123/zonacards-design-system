package com.zonacards.ui.compose

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.zonacards.ui.tokens.domain.ZcBulk
import com.zonacards.ui.tokens.domain.ZcBulkColumn
import com.zonacards.ui.tokens.domain.ZcBulkError
import com.zonacards.ui.tokens.domain.ZcBulkErrorCode
import com.zonacards.ui.tokens.domain.ZcBulkResult
import com.zonacards.ui.tokens.domain.ZcBulkRow
import com.zonacards.ui.tokens.domain.ZcBulkType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Importación masiva: dos pasos, resumen de filas, errores por fila y entrega de solo las válidas. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class BulkImportTest {
    @get:Rule val rule = createComposeRule()
    private fun has(text: String) = rule.onAllNodes(hasText(text, substring = true)).fetchSemanticsNodes().isNotEmpty()

    private val columns = listOf(
        ZcBulkColumn("code", "Código", ZcBulkType.Code, required = true, maxLength = 12),
        ZcBulkColumn("qty", "Cantidad", ZcBulkType.Integer, min = 1, max = 100),
    )

    private fun process(vararg rows: List<String>): ZcBulkResult =
        ZcBulk.processMatrix(columns, listOf(listOf("Código *", "Cantidad")) + rows.toList())

    @Test fun showsTheTwoStepsAndCallsTheirActions() {
        var template = 0
        var pick = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcBulkImportBody(null, { template++ }, { pick++ }, {}) } }
        rule.onNodeWithText("1. Descarga la plantilla").assertIsDisplayed()
        rule.onNodeWithText("2. Sube el archivo").assertIsDisplayed()
        rule.onNodeWithText("Descargar plantilla").performClick()
        rule.onNodeWithText("Subir archivo con los datos").performClick()
        assertEquals(1, template)
        assertEquals(1, pick)
        assertTrue(!has("filas válidas"))
    }

    @Test fun summarizesRowsListsErrorsAndImportsOnlyTheValidOnes() {
        var got: List<ZcBulkRow>? = null
        val result = process(listOf("A-1", "5"), listOf("", "3"), listOf("B-2", "999"), listOf("C-3", "7"))
        rule.setContent { ZonacardsTheme(dark = false) { ZcBulkImportBody(result, {}, {}, { got = it }) } }
        assertTrue(has("2 filas válidas, 2 con errores"))
        assertTrue(has("Se omitirán 2 filas con errores"))
        assertTrue(has("Fila 3: Falta Código."))
        assertTrue(has("Fila 4: Cantidad no puede ser mayor que 100."))
        rule.onNodeWithText("Importar 2 filas").performClick()
        assertEquals(listOf(2, 5), got!!.map { it.row })
        assertTrue(got!!.all { it.error == null })
    }

    @Test fun whenEverythingIsValidItOnlySaysSo() {
        val result = process(listOf("A-1", "5"), listOf("A-2", "6"))
        rule.setContent { ZonacardsTheme(dark = false) { ZcBulkImportBody(result, {}, {}, {}) } }
        assertTrue(has("2 filas válidas"))
        assertTrue(!has("con errores"))
        rule.onNodeWithText("Importar 2 filas").assertIsDisplayed()
    }

    @Test fun withoutValidRowsThereIsNothingToImport() {
        val result = process(listOf("", "1"), listOf("X", "0"))
        rule.setContent { ZonacardsTheme(dark = false) { ZcBulkImportBody(result, {}, {}, {}) } }
        assertTrue(has("No hay filas válidas para importar."))
        assertTrue(!has("Importar 0 filas"))
    }

    @Test fun aFileErrorReplacesTheSummary() {
        val result = ZcBulkResult(emptyList(), ZcBulkError(ZcBulkErrorCode.MissingColumns, params = mapOf("list" to "Código")))
        rule.setContent { ZonacardsTheme(dark = false) { ZcBulkImportBody(result, {}, {}, {}) } }
        assertTrue(has("Faltan columnas en el archivo: Código."))
        assertTrue(!has("filas válidas"))
    }

    @Test fun anInvalidFileGetsTheReadErrorText() {
        val result = ZcBulkResult(emptyList(), ZcBulkError(ZcBulkErrorCode.InvalidFile))
        rule.setContent { ZonacardsTheme(dark = false) { ZcBulkImportBody(result, {}, {}, {}) } }
        assertTrue(has("No pudimos leer el archivo."))
    }
}
