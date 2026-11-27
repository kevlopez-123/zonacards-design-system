package com.zonacards.catalog

import android.graphics.Bitmap
import android.graphics.Paint
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import android.graphics.Canvas as AndroidCanvas

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.unit.dp
import com.zonacards.ui.compose.*
import kotlinx.coroutines.delay

/** Campos avanzados de la ola 5: pasos, resumen de errores, deslizadores, hora, contraseña, secreto y etiquetas. */
@Composable
fun FieldsMoreScreen(toasts: ZcToastState) {
    Page {
        Section("Pasos de un formulario largo") {
            var step by rememberSaveable { mutableStateOf(1) }
            ZcStepper(listOf("Empresa", "Contacto", "Comercial", "Resumen"), step, "Nuevo cliente")
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ZcButton(if (step < 3) "Siguiente paso" else "Volver al primero", { step = if (step < 3) step + 1 else 0 }, variant = ZcButtonVariant.OUTLINE, size = ZcButtonSize.SM)
            }
        }
        Section("Resumen de errores") {
            ZcFormSummary(
                listOf(ZcFormError("correo", "El correo no es válido."), ZcFormError("monto", "El monto debe estar entre S/ 50 y S/ 500.")),
                onGo = { toasts.info("Ir al campo: $it") }, focusRequester = FocusRequester(),
            )
        }
        Section("Deslizador y rango") {
            var fee by rememberSaveable { mutableStateOf(4.5f) }
            ZcField("Comisión del cliente", counter = "%.1f %%".format(fee), hint = "De 0 % a 15 %.") {
                ZcSlider(fee, { fee = it }, valueRange = 0f..15f, step = 0.5f, label = "Comisión del cliente", format = { "%.1f %%".format(it) })
            }
            var from by rememberSaveable { mutableStateOf(50f) }
            var to by rememberSaveable { mutableStateOf(500f) }
            ZcField("Rango de monto", counter = "S/ ${from.toInt()} – S/ ${to.toInt()}") {
                ZcRangeSlider(from..to, { from = it.start; to = it.endInclusive }, valueRange = 0f..1000f, step = 10f, minGap = 50f, minLabel = "Monto mínimo", maxLabel = "Monto máximo", format = { "S/ ${it.toInt()}" })
            }
        }
        Section("Hora") {
            var open by rememberSaveable { mutableStateOf<String?>("09:30") }
            ZcTimeField(open, { open = it }, "Hora de apertura", hint = "Se escribe o se elige con el reloj.")
        }
        Section("Contraseña con medidor y requisitos") {
            var pw by rememberSaveable { mutableStateOf("Zona#2026") }
            ZcPasswordField(pw, { pw = it }, "Crea una contraseña", required = true)
            ZcPasswordRules(pw)
        }
        Section("Credencial enmascarada") {
            ZcSecretField("zc_live_9f3a7c1d5b2e4a60b8d1", "API Key de la campaña", hint = "Se muestra completa solo a roles autorizados y queda auditado.", keepPrefix = "zc_live_", toasts = toasts)
            ZcSecretField("zc_live_9f3a7c1d5b2e4a60b8d1", "API Key (solo lectura)", canReveal = false, keepPrefix = "zc_live_", toasts = toasts)
        }
        Section("Varios correos en un campo") {
            var mails by rememberSaveable { mutableStateOf(listOf("ana@empresa.com", "luis@empresa.com", "sin-arroba")) }
            ZcTagsField(mails, { mails = it }, "Correos para el aviso", max = 5, placeholder = "nombre@empresa.com", hint = "Hasta 5. Enter, coma o espacio agregan.")
        }
        Section("Periodo de reportes") {
            val today = "2026-11-20"
            var range by remember { mutableStateOf<ZcDateRangeValue?>(zcPresetRange(ZcRangePreset.LAST30, today)!!.let { ZcDateRangeValue(it.first, it.second, ZcRangePreset.LAST30) }) }
            ZcDateRange(range, { range = it }, "Periodo", today = today, hint = "No se eligen fechas futuras.")
            ZcDateRange(null, {}, "Periodo sin elegir", today = today)
        }
        Section("Calendario con rango") {
            var month by remember { mutableStateOf("2026-11-01") }
            ZcCalendar(month, { month = it }, "2026-11-20", {}, rangeStart = "2026-11-10", rangeEnd = "2026-11-18", max = "2026-11-20")
        }
        Section("Fecha lejana en tres columnas") {
            var birth by remember { mutableStateOf<String?>("1990-05-14") }
            ZcDateWheelField(birth, { birth = it }, "Fecha de nacimiento", min = "1926-01-01", max = "2008-11-20", hint = "Para fechas lejanas: día, mes y año por separado.")
        }
        Section("Ubigeo del Perú") {
            var district by rememberSaveable { mutableStateOf<String?>("150122") }
            ZcUbigeoSelect(district, { district = it }, required = true)
            ZcText("Código: ${district ?: "—"}", style = com.zonacards.ui.tokens.ZcType.caption)
        }
        Section("Punto en el mapa") {
            var point by remember { mutableStateOf<ZcLatLng?>(ZcLatLng(-12.121667, -77.029167)) }
            // Teselas de ejemplo (sin red) para que la captura sea siempre la misma; en una app va el cargador de OpenStreetMap por defecto.
            ZcLocationPicker(point, { point = it }, "Ubica el punto de entrega", fetchTile = { demoTile(it) }, onUseMyLocation = {})
        }
        Section("Autocomplete con búsqueda en el servidor") {
            var query by remember { mutableStateOf("") }
            var loading by remember { mutableStateOf(false) }
            var picked by remember { mutableStateOf<ZcSelectOption<String>?>(null) }
            var extra by remember { mutableStateOf(emptyList<ZcSelectOption<String>>()) }
            // Respuesta simulada: tarda un momento y filtra una lista fija, como haría el servidor.
            LaunchedEffect(query) { loading = true; delay(400); loading = false }
            val results = (CLIENTS + extra).filter { query.length >= 2 && it.label.contains(query, ignoreCase = true) }
            ZcAutocomplete(
                results, picked, { picked = it }, { query = it }, label = "Cliente", placeholder = "Busca por nombre", loading = loading,
                hint = "Escribe al menos 2 letras.", onCreate = { name -> val o = ZcSelectOption(name.lowercase(), name); extra = extra + o; picked = o },
            )
        }
        Section("Grupo de casillas") {
            var chosen by rememberSaveable { mutableStateOf(setOf("mail")) }
            ZcCheckboxGroup(
                listOf(ZcCheckboxOption("mail", "Correo electrónico"), ZcCheckboxOption("wa", "WhatsApp", "Solo en Perú y Colombia"), ZcCheckboxOption("sms", "SMS (fuera de alcance)", enabled = false)),
                chosen, { chosen = it }, label = "Canales de aviso", hint = "Elige al menos uno.", selectAllLabel = "Todos los canales",
            )
        }
        Section("Conjunto de campos con leyenda") {
            var name by rememberSaveable { mutableStateOf("") }
            var mail by rememberSaveable { mutableStateOf("") }
            ZcFieldset("Datos de contacto", description = "Para avisarte cuando salga el envío.", bordered = true) {
                ZcTextField(name, { name = it }, label = "Nombre de contacto")
                ZcTextField(mail, { mail = it }, label = "Correo de contacto", hint = "Donde llega el aviso.")
            }
        }
    }
}

private val CLIENTS = listOf(ZcSelectOption("1", "Ana Pérez"), ZcSelectOption("2", "Ana Soto"), ZcSelectOption("3", "Luis Anaya"), ZcSelectOption("4", "Marta Ruiz"))

/** Tesela de ejemplo: fondo claro con la cuadrícula y un par de "calles". */
private fun demoTile(tile: ZcTile): ImageBitmap {
    val bmp = Bitmap.createBitmap(256, 256, Bitmap.Config.ARGB_8888)
    val cv = AndroidCanvas(bmp)
    cv.drawColor(if ((tile.x + tile.y) % 2 == 0) 0xFFF2EFE9.toInt() else 0xFFEDEAE3.toInt())
    val road = Paint().apply { color = 0xFFFFFFFF.toInt(); strokeWidth = 10f }
    val edge = Paint().apply { color = 0xFFD9D4C8.toInt(); strokeWidth = 2f }
    cv.drawLine(0f, 96f, 256f, 160f, road); cv.drawLine(128f, 0f, 96f, 256f, road)
    cv.drawRect(0f, 0f, 256f, 256f, edge.apply { style = Paint.Style.STROKE })
    return bmp.asImageBitmap()
}

