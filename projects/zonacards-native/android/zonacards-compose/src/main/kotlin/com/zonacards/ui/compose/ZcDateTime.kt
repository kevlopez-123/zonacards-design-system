package com.zonacards.ui.compose

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcDates

private fun datePart(v: String?): String? = v?.substringBefore('T')?.takeIf { it.length == 10 }
private fun timePart(v: String?): String? = v?.substringAfter('T', "")?.takeIf { it.isNotEmpty() }

/**
 * Fecha y hora en un solo campo (equivale a `zc-datetime-field` y al `granularity` del DatePicker de HeroUI): el selector de fecha del sistema y el campo de
 * hora lado a lado, con un solo valor "aaaa-mm-ddThh:mm" (hora local de la operación). Mientras falte una de las dos partes el valor es `null` y la otra se
 * conserva en pantalla. `min` y `max` valen para la fecha. El selector de fecha del sistema no admite fechas no disponibles sueltas: para eso usa
 * `ZcCalendar` con `unavailable`.
 */
@Composable
fun ZcDateTimeField(
    value: String?,
    onValueChange: (String?) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    min: String? = null,
    max: String? = null,
    lang: String = "es",
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    var date by rememberSaveable { mutableStateOf(datePart(value)) }
    var time by rememberSaveable { mutableStateOf(timePart(value)) }
    var emitted by rememberSaveable { mutableStateOf(value) }
    // Un valor distinto que llega de afuera reemplaza las dos partes; lo que este campo mismo emitió no (así no pierde la parte ya elegida).
    LaunchedEffect(value) { if (value != emitted) { emitted = value; date = datePart(value); time = timePart(value) } }
    fun emit() {
        val d = date; val t = time
        val v = if (d != null && t != null && ZcDates.isValidHm(t)) "${d}T$t" else null
        emitted = v
        onValueChange(v)
    }
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row {
            ZcText(label, style = ZcTextTw.sm, weight = ZcWeight.medium, modifier = Modifier.semantics { heading() })
            if (required) ZcText(" *", style = ZcTextTw.sm, color = c.dangerFg, modifier = Modifier.semantics { })
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            ZcDateField(date, { date = it; emit() }, ctx.getString(R.string.zc_ui_fecha), Modifier.weight(1f), min = min, max = max, lang = lang, enabled = enabled)
            ZcTimeField(time, { time = it; emit() }, ctx.getString(R.string.zc_ui_hora), Modifier.weight(0.7f), enabled = enabled)
        }
        if (error != null) Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 2.dp)) {
            ZcIcon(ZcIcons.sDangerCircle, null, size = 16.dp, tint = c.dangerFg)
            ZcText(error, style = ZcType.caption, color = c.dangerFg)
        } else if (hint != null) ZcText(hint, style = ZcType.caption, color = c.textMuted)
    }
}
