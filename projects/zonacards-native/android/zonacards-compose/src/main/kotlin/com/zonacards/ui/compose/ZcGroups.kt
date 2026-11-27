package com.zonacards.ui.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcType

/** Una opción de [ZcCheckboxGroup]. */
data class ZcCheckboxOption(
    val value: String,
    val label: String,
    val description: String? = null,
    val enabled: Boolean = true,
)

/**
 * Varias casillas con una sola etiqueta (equivale a `zc-checkbox-group`): el grupo se anuncia con su nombre, y el error o la ayuda quedan debajo.
 * `selected` es el conjunto de valores marcados. Con `selectAllLabel` aparece arriba "Seleccionar todo", que queda a medias cuando hay algunas
 * marcadas y no cambia las opciones deshabilitadas.
 */
@Composable
fun ZcCheckboxGroup(
    options: List<ZcCheckboxOption>,
    selected: Set<String>,
    onChange: (Set<String>) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    horizontal: Boolean = false,
    selectAllLabel: String? = null,
) {
    val c = ZonacardsTheme.colors
    val changeable = options.filter { it.enabled }.map { it.value }
    val all = changeable.isNotEmpty() && changeable.all { it in selected }
    val some = !all && changeable.any { it in selected }
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row {
            ZcText(label, style = ZcTextTw.sm, weight = FontWeight.Medium, modifier = Modifier.semantics { heading() })
            if (required) ZcText(" *", style = ZcTextTw.sm, color = c.dangerFg, modifier = Modifier.semantics { })
        }
        val group = Modifier.semantics { isTraversalGroup = true; contentDescription = label; if (error != null) error(error) }
        val rows: @Composable () -> Unit = {
            if (selectAllLabel != null) {
                ZcCheckbox(
                    if (all) ToggleableState.On else if (some) ToggleableState.Indeterminate else ToggleableState.Off,
                    { onChange(if (all) selected - changeable.toSet() else selected + changeable) },
                    label = selectAllLabel, enabled = enabled && changeable.isNotEmpty(),
                )
            }
            for (o in options) {
                ZcCheckbox(
                    o.value in selected, { on -> onChange(if (on) selected + o.value else selected - o.value) },
                    label = o.label, description = o.description, enabled = enabled && o.enabled, invalid = error != null,
                )
            }
        }
        if (horizontal) Row(group, horizontalArrangement = Arrangement.spacedBy(16.dp)) { rows() }
        else Column(group, verticalArrangement = Arrangement.spacedBy(4.dp)) { rows() }
        if (error != null) Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            ZcIcon(ZcIcons.sDangerCircle, null, size = 16.dp, tint = c.dangerFg)
            ZcText(error, style = ZcType.caption, color = c.dangerFg)
        } else if (hint != null) ZcText(hint, style = ZcType.caption, color = c.textMuted)
    }
}

/**
 * Agrupa campos relacionados con una leyenda que TalkBack anuncia como título del grupo (equivale a `zc-fieldset`). `bordered` lo dibuja como una
 * tarjeta suave. 16 dp entre la leyenda y cada campo.
 */
@Composable
fun ZcFieldset(
    legend: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    bordered: Boolean = false,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = ZonacardsTheme.colors
    val shape = RoundedCornerShape(ZonacardsTheme.shape.card)
    val frame = if (bordered) Modifier.clip(shape).border(1.dp, c.border, shape).background(c.surface).padding(16.dp) else Modifier
    Column(modifier.fillMaxWidth().then(frame).semantics { isTraversalGroup = true }, verticalArrangement = Arrangement.spacedBy(16.dp)) {
        ZcText(legend, style = ZcTextTw.sm, weight = FontWeight.Medium, modifier = Modifier.semantics { heading() })
        if (description != null) ZcText(description, style = ZcType.caption, color = c.textMuted)
        content()
    }
}
