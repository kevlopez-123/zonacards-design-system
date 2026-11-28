package com.zonacards.ui.compose

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcBulk
import com.zonacards.ui.tokens.domain.ZcBulkColumn
import com.zonacards.ui.tokens.domain.ZcBulkError
import com.zonacards.ui.tokens.domain.ZcBulkErrorCode
import com.zonacards.ui.tokens.domain.ZcBulkResult
import com.zonacards.ui.tokens.domain.ZcBulkRow
import com.zonacards.ui.tokens.domain.ZcBulkTemplateLabels
import com.zonacards.ui.tokens.domain.ZcExport
import java.time.LocalDate

/** Texto traducido de un error de importación (de una fila o del archivo). */
fun zcBulkErrorText(ctx: Context, e: ZcBulkError): String {
    fun p(k: String): String = e.params[k]?.toString() ?: ""
    return when (e.code) {
        ZcBulkErrorCode.Required -> ctx.getString(R.string.zc_mol_importar_err_required, p("title"))
        ZcBulkErrorCode.MaxLength -> ctx.getString(R.string.zc_mol_importar_err_max_length, p("title"), p("max"), p("len"))
        ZcBulkErrorCode.Code -> ctx.getString(R.string.zc_mol_importar_err_code, p("title"))
        ZcBulkErrorCode.Integer -> ctx.getString(R.string.zc_mol_importar_err_integer, p("title"))
        ZcBulkErrorCode.Min -> ctx.getString(R.string.zc_mol_importar_err_min, p("title"), p("min"))
        ZcBulkErrorCode.Max -> ctx.getString(R.string.zc_mol_importar_err_max, p("title"), p("max"))
        ZcBulkErrorCode.Date -> ctx.getString(R.string.zc_mol_importar_err_date, p("title"))
        ZcBulkErrorCode.Option -> ctx.getString(R.string.zc_mol_importar_err_option, p("title"), p("list"))
        ZcBulkErrorCode.Email -> ctx.getString(R.string.zc_mol_importar_err_email, p("title"))
        ZcBulkErrorCode.Duplicate -> ctx.getString(R.string.zc_mol_importar_err_duplicate, p("row"))
        ZcBulkErrorCode.EmptyFile -> ctx.getString(R.string.zc_mol_importar_err_empty_file)
        ZcBulkErrorCode.MissingColumns -> ctx.getString(R.string.zc_mol_importar_err_missing_columns, p("list"))
        ZcBulkErrorCode.TooManyRows -> ctx.getString(R.string.zc_mol_importar_err_too_many_rows, p("n"), p("max"))
        ZcBulkErrorCode.InvalidFile -> ctx.getString(R.string.zc_mol_importar_err_invalid_file)
    }
}

/** Rótulos de la plantilla en el idioma de la app. */
fun zcBulkTemplateLabels(ctx: Context) = ZcBulkTemplateLabels(
    data = ctx.getString(R.string.zc_mol_importar_plantilla_datos), instructions = ctx.getString(R.string.zc_mol_importar_plantilla_instrucciones),
    column = ctx.getString(R.string.zc_mol_importar_plantilla_columna), required = ctx.getString(R.string.zc_mol_importar_plantilla_obligatoria),
    whatToWrite = ctx.getString(R.string.zc_mol_importar_plantilla_que_escribir), example = ctx.getString(R.string.zc_mol_importar_plantilla_ejemplo),
    yes = ctx.getString(R.string.zc_mol_importar_plantilla_si), no = ctx.getString(R.string.zc_mol_importar_plantilla_no),
)

/** Tamaño máximo de un archivo de importación (10 MB): más que eso no se lee. */
private const val MAX_FILE_BYTES = 10 * 1024 * 1024

private fun displayName(ctx: Context, uri: Uri): String =
    runCatching {
        ctx.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { if (it.moveToFirst()) it.getString(0) else null }
    }.getOrNull() ?: (uri.lastPathSegment ?: "archivo")

/** Los bytes del archivo, o `null` si no se puede leer o pasa del límite. */
private fun readFile(ctx: Context, uri: Uri): ByteArray? = runCatching {
    ctx.contentResolver.openInputStream(uri)?.use { input ->
        val out = java.io.ByteArrayOutputStream()
        val buffer = ByteArray(8192)
        var total = 0
        while (true) {
            val n = input.read(buffer)
            if (n < 0) break
            total += n
            if (total > MAX_FILE_BYTES) return@use null
            out.write(buffer, 0, n)
        }
        out.toByteArray()
    }
}.getOrNull()

/**
 * Importación masiva desde un Excel o un CSV, en dos pasos: (1) descargar la plantilla con los encabezados de `columns`, (2) subir el archivo.
 * Cada fila se valida en el teléfono (`ZcBulk.processMatrix`; el servidor vuelve a validar): se muestran las filas válidas, los errores por fila
 * con su causa, y "Importar N filas" entrega solo las válidas a `onImport`. Las filas con errores se omiten, con aviso.
 *
 * El archivo lo elige el usuario con el selector de documentos del sistema (sin permisos de almacenamiento) y la plantilla se guarda con el selector
 * de "guardar como". `templateTitle` da el nombre del archivo de la plantilla ("plantilla-clientes-2026-11-23.xlsx").
 * `keyOf` arma la llave que identifica cada fila (las repetidas se rechazan desde la segunda).
 */
@Composable
fun ZcBulkImport(
    columns: List<ZcBulkColumn>,
    onImport: (List<ZcBulkRow>) -> Unit,
    modifier: Modifier = Modifier,
    templateTitle: String = "plantilla",
    keyOf: ((Map<String, Any>) -> String)? = null,
    maxRows: Int? = null,
) {
    val ctx = LocalContext.current
    var result by remember { mutableStateOf<ZcBulkResult?>(null) }
    var fileName by rememberSaveable { mutableStateOf<String?>(null) }

    val saveTemplate = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument(ZcExport.MIME_XLSX)) { uri ->
        if (uri != null) runCatching {
            val bytes = ZcExport.toXlsxSheets(ZcBulk.template(columns, zcBulkTemplateLabels(ctx)))
            ctx.contentResolver.openOutputStream(uri)?.use { it.write(bytes) }
        }
    }
    val pick = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            fileName = displayName(ctx, uri)
            val bytes = readFile(ctx, uri)
            result = if (bytes == null) ZcBulkResult(emptyList(), ZcBulkError(ZcBulkErrorCode.InvalidFile))
            else ZcBulk.processFile(fileName ?: "", bytes, columns, keyOf, maxRows)
        }
    }

    ZcBulkImportBody(
        result = result,
        onTemplate = { saveTemplate.launch(ZcExport.fileName(templateTitle, "xlsx", LocalDate.now().toString())) },
        onPick = { pick.launch(arrayOf(ZcExport.MIME_XLSX, "text/csv", "text/comma-separated-values", "application/csv", "text/plain", "application/octet-stream")) },
        onImport = { rows -> onImport(rows) },
        modifier = modifier,
    )
}

/** Cuántos errores se listan: el resto se resume ("y N más") para que la pantalla no se haga eterna con un archivo malo. */
private const val MAX_LISTED_ERRORS = 50

/** El cuerpo sin estado de la importación (lo usan la versión con selectores del sistema y las pruebas). */
@Composable
internal fun ZcBulkImportBody(
    result: ZcBulkResult?,
    onTemplate: () -> Unit,
    onPick: () -> Unit,
    onImport: (List<ZcBulkRow>) -> Unit,
    modifier: Modifier = Modifier,
) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    val shape = RoundedCornerShape(ZonacardsTheme.shape.card)
    Column(modifier.fillMaxWidth().clip(shape).border(1.dp, c.border, shape).background(c.surface).padding(20.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            ZcText(ctx.getString(R.string.zc_mol_importar_paso1), Modifier.semantics { heading() }, style = ZcTextTw.lg, weight = ZcWeight.semibold)
            ZcText(ctx.getString(R.string.zc_mol_importar_paso1_texto), color = c.textMuted)
            ZcButton(ctx.getString(R.string.zc_mol_importar_descargar_plantilla), onTemplate, variant = ZcButtonVariant.OUTLINE, block = true)
        }
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            ZcText(ctx.getString(R.string.zc_mol_importar_paso2), Modifier.semantics { heading() }, style = ZcTextTw.lg, weight = ZcWeight.semibold)
            ZcButton(ctx.getString(R.string.zc_mol_importar_subir), onPick, block = true)
        }
        if (result == null) return@Column
        val fileError = result.fileError
        if (fileError != null) {
            ZcAlert(zcBulkErrorText(ctx, fileError), tone = ZcAlertTone.DANGER)
            return@Column
        }
        val valid = result.rows.filter { it.error == null }
        val bad = result.rows.filter { it.error != null }
        ZcText(
            if (bad.isEmpty()) ctx.getString(R.string.zc_mol_importar_resumen_ok, valid.size) else ctx.getString(R.string.zc_mol_importar_resumen, valid.size, bad.size),
            Modifier.semantics { heading() }, weight = ZcWeight.semibold,
        )
        if (bad.isNotEmpty()) {
            ZcAlert(ctx.getString(R.string.zc_mol_importar_omitidas, bad.size), tone = ZcAlertTone.WARNING)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                for (row in bad.take(MAX_LISTED_ERRORS)) {
                    ZcText(ctx.getString(R.string.zc_mol_importar_fila, row.row, zcBulkErrorText(ctx, row.error!!)), style = ZcType.caption, color = c.dangerFg)
                }
                if (bad.size > MAX_LISTED_ERRORS) ZcText("… +${bad.size - MAX_LISTED_ERRORS}", style = ZcType.caption, color = c.textMuted)
            }
        }
        if (valid.isEmpty()) ZcAlert(ctx.getString(R.string.zc_mol_importar_sin_validas), tone = ZcAlertTone.WARNING)
        else ZcButton(ctx.getString(R.string.zc_mol_importar_importar, valid.size), { onImport(valid) }, block = true)
    }
}
