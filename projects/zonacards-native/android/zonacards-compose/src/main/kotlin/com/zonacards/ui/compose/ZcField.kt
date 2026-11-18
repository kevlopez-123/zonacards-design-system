package com.zonacards.ui.compose

import androidx.annotation.DrawableRes
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType

/** Estado visual del control según foco y error (borde de 1 dp; con foco o error, 2 dp). */
internal data class ControlLook(val border: androidx.compose.ui.graphics.Color, val width: androidx.compose.ui.unit.Dp)

@Composable
internal fun controlLook(focused: Boolean, invalid: Boolean): ControlLook {
    val c = ZonacardsTheme.colors
    return when {
        invalid -> ControlLook(c.dangerFg, if (focused) 2.dp else 1.5.dp)
        focused -> ControlLook(c.focus, 2.dp)
        else -> ControlLook(c.borderStrong, 1.dp)
    }
}

/** Texto que TalkBack lee como nombre del control: etiqueta + "obligatorio" (el asterisco es solo visual). */
@Composable
internal fun fieldName(label: String, required: Boolean): String {
    val ctx = LocalContext.current
    return if (required) "$label (${ctx.getString(R.string.zc_comun_obligatorio)})" else label
}

/**
 * Marco de un campo: etiqueta arriba, control y debajo el error (con ícono) o la ayuda, y el contador a la derecha.
 * El error reemplaza a la ayuda y TalkBack lo anuncia al aparecer.
 */
@Composable
fun ZcField(
    label: String,
    modifier: Modifier = Modifier,
    required: Boolean = false,
    optional: Boolean = false,
    hint: String? = null,
    error: String? = null,
    counter: String? = null,
    enabled: Boolean = true,
    control: @Composable () -> Unit,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    Column(modifier.fillMaxWidth().alpha(if (enabled) 1f else 0.6f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(Modifier.semantics(mergeDescendants = false) { }) {
            ZcText(label, style = ZcType.bodySm, weight = FontWeight.Medium)
            if (required) ZcText(" *", style = ZcType.bodySm, color = c.dangerFg)
            if (optional) ZcText(" ${ctx.getString(R.string.zc_comun_opcional)}", style = ZcType.bodySm, color = c.textMuted)
        }
        control()
        if (error != null || hint != null || counter != null) Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.Top) {
            if (error != null) {
                ZcIcon(ZcIcons.sDangerCircle, contentDescription = null, size = 16.dp, tint = c.dangerFg, modifier = Modifier.padding(top = 2.dp))
                ZcText(error, style = ZcType.caption, color = c.dangerFg, modifier = Modifier.weight(1f))
            } else if (hint != null) {
                ZcText(hint, style = ZcType.caption, color = c.textMuted, modifier = Modifier.weight(1f))
            } else Box(Modifier.weight(1f))
            if (counter != null) ZcText(counter, style = ZcType.caption, color = c.textMuted)
        }
    }
}

/**
 * Campo de texto. Un solo ícono, a la derecha (contraseña: mostrar/ocultar). `allowed` filtra cada carácter al escribir o pegar;
 * `maxLength` corta; `onBlur` normaliza al salir. Los placeholders solo muestran un formato de ejemplo.
 */
@Composable
fun ZcTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    optional: Boolean = false,
    enabled: Boolean = true,
    password: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    capitalization: KeyboardCapitalization = KeyboardCapitalization.Sentences,
    imeAction: ImeAction = ImeAction.Next,
    onImeAction: (() -> Unit)? = null,
    allowed: Regex? = null,
    maxLength: Int? = null,
    showCounter: Boolean = false,
    minLines: Int = 1,
    prefix: String? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    @DrawableRes trailingIcon: Int? = null,
    trailingLabel: String? = null,
    onTrailingClick: (() -> Unit)? = null,
    onBlur: (() -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    var reveal by remember { mutableStateOf(false) }
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    var wasFocused by remember { mutableStateOf(false) }
    val look = controlLook(focused, error != null)
    val name = fieldName(label, required)
    val multiline = minLines > 1
    val counter = if (showCounter && maxLength != null) "${value.length}/$maxLength" else null
    ZcField(label, modifier, required, optional, hint, error, counter, enabled) {
        Row(
            Modifier.fillMaxWidth().heightIn(min = ZcSize.target).clip(RoundedCornerShape(ZcRadius.ms)).background(c.surface)
                .border(look.width, look.border, RoundedCornerShape(ZcRadius.ms))
                .padding(start = 16.dp, end = if (trailingIcon != null || password) 4.dp else 16.dp),
            verticalAlignment = if (multiline) Alignment.Top else Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (prefix != null) ZcText(prefix, color = c.textMuted, modifier = Modifier.semantics { contentDescription = "" })
            BasicTextField(
                value = value,
                onValueChange = { raw ->
                    var v = if (allowed != null) raw.filter { allowed.matches(it.toString()) } else raw
                    if (maxLength != null) v = v.take(maxLength)
                    onValueChange(v)
                },
                modifier = Modifier.weight(1f).padding(vertical = if (multiline) 12.dp else 0.dp)
                    .onFocusChanged { if (wasFocused && !it.isFocused) onBlur?.invoke(); wasFocused = it.isFocused }
                    .semantics {
                        contentDescription = name
                        if (error != null) error(error)
                        if (hint != null && error == null) stateDescription = hint
                    },
                enabled = enabled,
                singleLine = !multiline,
                minLines = minLines,
                textStyle = ZcType.body.copy(color = c.text, fontFamily = LocalZcFontFamily.current),
                cursorBrush = SolidColor(c.text),
                interactionSource = source,
                visualTransformation = if (password && !reveal) PasswordVisualTransformation() else visualTransformation,
                keyboardOptions = KeyboardOptions(
                    keyboardType = if (password) KeyboardType.Password else keyboardType,
                    capitalization = capitalization, imeAction = if (multiline) ImeAction.Default else imeAction,
                ),
                keyboardActions = KeyboardActions(onAny = { onImeAction?.invoke() }),
                decorationBox = { inner ->
                    Box(contentAlignment = Alignment.CenterStart) {
                        if (value.isEmpty() && placeholder != null) ZcText(placeholder, color = c.textSubtle, maxLines = 1)
                        inner()
                    }
                },
            )
            if (password) {
                FieldIconButton(if (reveal) ZcIcons.sEyeClosed else ZcIcons.sEye, ctx.getString(if (reveal) R.string.zc_ui_ocultar_clave else R.string.zc_ui_mostrar_clave)) { reveal = !reveal }
            } else if (trailingIcon != null) {
                if (onTrailingClick != null && trailingLabel != null) FieldIconButton(trailingIcon, trailingLabel, onTrailingClick)
                else ZcIcon(trailingIcon, contentDescription = null, tint = c.textMuted, modifier = Modifier.padding(end = 12.dp))
            }
        }
    }
}

/** Botón de ícono dentro de un campo: 40 dp visibles y nombre para TalkBack. */
@Composable
internal fun FieldIconButton(@DrawableRes icon: Int, label: String, onClick: () -> Unit) {
    Box(
        Modifier.size(ZcSize.iconBtn).clip(CircleShape).clickable(role = Role.Button, onClick = onClick).semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) {
        CompositionLocalProvider(LocalZcContentColor provides ZonacardsTheme.colors.textMuted) { ZcIcon(icon, contentDescription = null) }
    }
}

/** Búsqueda: el ícono de lupa pasa a "Limpiar" cuando hay texto. La acción del teclado es "Buscar". */
@Composable
fun ZcSearchField(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String? = null,
    onSearch: ((String) -> Unit)? = null,
) {
    val ctx = LocalContext.current
    val name = label ?: ctx.getString(R.string.zc_ui_buscar)
    ZcTextField(
        value = query, onValueChange = onQueryChange, label = name, modifier = modifier, placeholder = placeholder,
        imeAction = ImeAction.Search, onImeAction = { onSearch?.invoke(query) },
        trailingIcon = if (query.isEmpty()) ZcIcons.sMagnifer else ZcIcons.lX,
        trailingLabel = if (query.isEmpty()) null else ctx.getString(R.string.zc_ui_limpiar),
        onTrailingClick = if (query.isEmpty()) null else ({ onQueryChange("") }),
    )
}
