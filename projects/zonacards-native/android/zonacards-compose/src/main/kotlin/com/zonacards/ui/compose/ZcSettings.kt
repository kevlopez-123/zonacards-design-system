package com.zonacards.ui.compose

import androidx.annotation.DrawableRes
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcOpacity
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType

/**
 * Una fila de ajustes (equivale a ItemCard, CellSwitch y CellSelect de HeroUI): ícono, título, descripción y, al final, lo que dice qué hace tocarla:
 * - `checked` + `onCheckedChange`: un interruptor; toda la fila alterna y TalkBack la anuncia como interruptor con su estado.
 * - `onClick`: abre algo (otra pantalla, un selector); lleva una flecha y, si hay, el `value` actual ("Español").
 * - Solo `value` (o `trailing`): informativa, sin acción.
 * `danger` pinta el texto de peligro (cerrar sesión, eliminar). `trailing` reemplaza lo que va al final.
 */
data class ZcSettingsItem(
    val title: String,
    val description: String? = null,
    @DrawableRes val icon: Int? = null,
    val value: String? = null,
    val onClick: (() -> Unit)? = null,
    val checked: Boolean? = null,
    val onCheckedChange: ((Boolean) -> Unit)? = null,
    val enabled: Boolean = true,
    val danger: Boolean = false,
    val trailing: (@Composable () -> Unit)? = null,
)

/** Una fila de ajustes sola (dentro de un [ZcSettingsGroup] se dibujan con sus separadores). Alto mínimo de 56 dp. */
@Composable
fun ZcSettingsRow(item: ZcSettingsItem, modifier: Modifier = Modifier) {
    val c = ZonacardsTheme.colors
    val haptic = rememberZcHaptics()
    val isSwitch = item.checked != null
    val acts = isSwitch || item.onClick != null
    val action: Modifier = when {
        isSwitch -> Modifier.toggleable(item.checked!!, enabled = item.enabled, role = Role.Switch) { haptic(ZcHaptic.SELECTION); item.onCheckedChange?.invoke(it) }
        item.onClick != null -> Modifier.clickable(enabled = item.enabled, role = Role.Button) { haptic(ZcHaptic.SELECTION); item.onClick.invoke() }
        else -> Modifier
    }
    // El valor actual se lee tras el título ("Idioma, Español"), no como un texto suelto.
    val spoken: Modifier = if (item.value != null && !isSwitch) Modifier.semantics(mergeDescendants = true) { stateDescription = item.value } else Modifier.semantics(mergeDescendants = true) { }
    Row(
        modifier.fillMaxWidth().heightIn(min = ZcSize.target + 8.dp).then(action).then(spoken).alpha(if (item.enabled) 1f else ZcOpacity.disabled).padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (item.icon != null) Box(Modifier.size(40.dp).clip(RoundedCornerShape(ZcRadius.ms)).background(c.surface2), contentAlignment = Alignment.Center) {
            ZcIcon(item.icon, null, size = ZcSize.iconMd, tint = if (item.danger) c.dangerFg else c.text)
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            ZcText(item.title, color = if (item.danger) c.dangerFg else c.text)
            if (item.description != null) ZcText(item.description, style = ZcType.caption, color = c.textMuted)
        }
        when {
            item.trailing != null -> item.trailing.invoke()
            isSwitch -> SwitchVisual(item.checked!!)
            else -> {
                if (item.value != null) ZcText(item.value, color = c.textMuted, style = ZcTextTw.sm)
                if (item.onClick != null) ZcIcon(ZcIcons.sAltArrowRight, null, size = ZcSize.iconSm, tint = c.textMuted)
            }
        }
    }
}

/**
 * Un grupo de filas de ajustes en una tarjeta, con separadores entre ellas, un encabezado opcional arriba y un texto de ayuda opcional abajo
 * (equivale a un grupo de ItemCard de HeroUI). El encabezado se anuncia como título de sección.
 */
@Composable
fun ZcSettingsGroup(items: List<ZcSettingsItem>, modifier: Modifier = Modifier, header: String? = null, footer: String? = null) {
    val c = ZonacardsTheme.colors
    val shape = RoundedCornerShape(ZonacardsTheme.shape.card)
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (header != null) ZcText(header, Modifier.padding(horizontal = 4.dp).semantics { heading() }, style = ZcTextTw.sm, color = c.textMuted)
        Column(Modifier.fillMaxWidth().clip(shape).border(1.dp, c.border, shape).background(c.surface)) {
            items.forEachIndexed { i, item ->
                if (i > 0) ZcDivider(Modifier.padding(start = if (item.icon != null) 68.dp else 16.dp))
                ZcSettingsRow(item)
            }
        }
        if (footer != null) ZcText(footer, Modifier.padding(horizontal = 4.dp), style = ZcType.caption, color = c.textMuted)
    }
}
