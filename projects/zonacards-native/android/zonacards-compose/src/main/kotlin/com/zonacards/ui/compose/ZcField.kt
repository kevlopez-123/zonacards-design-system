package com.zonacards.ui.compose

import androidx.annotation.DrawableRes
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
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.liveRegion
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
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** Texto que TalkBack lee como nombre del control: etiqueta + "obligatorio" (el asterisco es solo visual). */
@Composable
internal fun fieldName(label: String, required: Boolean): String {
    val ctx = LocalContext.current
    return if (required) "$label (${ctx.getString(R.string.zc_comun_obligatorio)})" else label
}

/** Aviso temporal de un campo (como `field.flash()` de la web): reemplaza la ayuda 1,6 s, en tono de error. */
@Stable
class ZcFlash internal constructor() {
    internal var message by mutableStateOf<String?>(null)
    internal var seq by mutableStateOf(0)
    fun show(text: String) { message = text; seq++ }
}

@Composable
fun rememberZcFlash() = remember { ZcFlash() }

/**
 * Marco de un campo, como zc-field: etiqueta (14/20, medium) con * o "(opcional)" y botón de ayuda "?", el control,
 * y una línea de mensaje que reserva su alto (salvo dentro de un sheet o modal): error con ícono, éxito con ícono, aviso
 * temporal (`flash`) o ayuda, y el contador a la derecha.
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
    success: String? = null,
    info: String? = null,
    flash: ZcFlash? = null,
    reserve: Boolean = true,
    control: @Composable () -> Unit,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val inOverlay = LocalZcSubscreenHost.current != null
    if (flash != null) LaunchedEffect(flash.seq) { if (flash.message != null) { delay(1600); flash.message = null } }
    val shownError = flash?.message ?: error
    Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(Modifier.heightIn(min = 20.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(Modifier.weight(1f, fill = false).clearAndSetSemantics { }) {
                ZcText(label, style = ZcTextTw.sm, weight = FontWeight.Medium, maxLines = 1)
                if (required) ZcText(" *", style = ZcTextTw.sm, color = c.dangerFg)
                if (optional) ZcText(" ${ctx.getString(R.string.zc_comun_opcional)}", style = ZcTextTw.sm, color = c.textMuted)
            }
            if (info != null) ZcTooltip(info) {
                Box(
                    Modifier.size(24.dp).clip(CircleShape).semantics { contentDescription = "${ctx.getString(R.string.zc_comun_mas_info)}: $info" },
                    contentAlignment = Alignment.Center,
                ) { ZcIcon(ZcIcons.sQuestionCircle, contentDescription = null, size = 16.dp, tint = c.textSubtle) }
            }
        }
        Box(Modifier.alphaIf(!enabled)) { control() }
        val show = shownError != null || success != null || hint != null || counter != null || (reserve && !inOverlay)
        if (show) Row(
            Modifier.fillMaxWidth().heightIn(min = 20.dp).semantics { liveRegion = LiveRegionMode.Polite },
            horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.Top,
        ) {
            when {
                shownError != null -> {
                    ZcIcon(ZcIcons.sDangerCircle, contentDescription = null, size = 16.dp, tint = c.dangerFg, modifier = Modifier.padding(top = 2.dp))
                    ZcText(shownError, style = ZcType.caption.copy(lineHeight = ZcTextTw.sm.lineHeight), color = c.dangerFg, modifier = Modifier.weight(1f))
                }
                success != null -> {
                    ZcIcon(ZcIcons.sCheckCircle, contentDescription = null, size = 16.dp, tint = c.successFg, modifier = Modifier.padding(top = 2.dp))
                    ZcText(success, style = ZcType.caption.copy(lineHeight = ZcTextTw.sm.lineHeight), color = c.successFg, modifier = Modifier.weight(1f))
                }
                else -> ZcText(hint ?: "", style = ZcType.caption.copy(lineHeight = ZcTextTw.sm.lineHeight), color = c.textMuted, modifier = Modifier.weight(1f))
            }
            if (counter != null) ZcText(counter, style = ZcType.caption.copy(lineHeight = ZcTextTw.sm.lineHeight), color = c.textMuted)
        }
    }
}

private fun Modifier.alphaIf(dim: Boolean) = if (dim) this.then(Modifier.semantics { }) else this

/**
 * Campo de texto (input de la web): caja de 56 dp (táctil), radio 8, texto 16, un solo ícono a la derecha
 * (contraseña: mostrar/ocultar). `allowed` rechaza caracteres y avisa con `rejectMessage` (flash); `onBlur` normaliza.
 * Con el teclado abierto, el campo enfocado se desplaza para quedar visible (patrón móvil).
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
    success: String? = null,
    info: String? = null,
    required: Boolean = false,
    optional: Boolean = false,
    enabled: Boolean = true,
    password: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    capitalization: KeyboardCapitalization = KeyboardCapitalization.Sentences,
    imeAction: ImeAction = ImeAction.Next,
    onImeAction: (() -> Unit)? = null,
    allowed: Regex? = null,
    rejectMessage: String? = null,
    maxLength: Int? = null,
    showCounter: Boolean = false,
    minLines: Int = 1,
    prefix: String? = null,
    suffix: String? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    @DrawableRes trailingIcon: Int? = null,
    trailingLabel: String? = null,
    onTrailingClick: (() -> Unit)? = null,
    onBlur: (() -> Unit)? = null,
    /** Control a la izquierda dentro del campo (selector de país del teléfono, tipo de documento). */
    leading: (@Composable () -> Unit)? = null,
    /** Sin etiqueta visible (buscadores): la etiqueta queda como nombre para TalkBack. */
    hideLabel: Boolean = false,
    flash: ZcFlash = rememberZcFlash(),
    /** Contenido bajo la caja y sobre el mensaje del campo (medidor de seguridad de la contraseña). */
    below: (@Composable () -> Unit)? = null,
    /** false: no reserva la línea del mensaje (formularios cortos, como el acceso). */
    reserve: Boolean = true,
    /** Para llevar el foco al campo desde afuera (por ejemplo, al primer campo con error del servidor: `ZcServerErrors`). */
    focusRequester: FocusRequester? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    var reveal by remember { mutableStateOf(false) }
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    var wasFocused by remember { mutableStateOf(false) }
    val bring = remember { BringIntoViewRequester() }
    val scope = rememberCoroutineScope()
    val name = fieldName(label, required)
    val multiline = minLines > 1
    val counter = if (showCounter && maxLength != null) "${value.length}/$maxLength" else null
    val box = @Composable {
        Row(
            Modifier.fillMaxWidth().heightIn(min = if (multiline) 96.dp else ZonacardsTheme.shape.fieldH).bringIntoViewRequester(bring)
                .zcControl(focused, error != null || flash.message != null, !enabled, success != null)
                .padding(start = if (leading != null) 0.dp else 16.dp, end = if (trailingIcon != null || password) 4.dp else if (suffix != null) 0.dp else 16.dp),
            verticalAlignment = if (multiline) Alignment.Top else Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            leading?.invoke()
            if (prefix != null) ZcText(prefix, color = c.textMuted, modifier = Modifier.clearAndSetSemantics { })
            BasicTextField(
                value = value,
                onValueChange = { raw ->
                    var v = if (allowed != null) raw.filter { allowed.matches(it.toString()) } else raw
                    if (v.length < raw.length) flash.show(rejectMessage ?: ctx.getString(R.string.zc_ui_solo_numeros))
                    if (maxLength != null) v = v.take(maxLength)
                    onValueChange(v)
                },
                modifier = Modifier.weight(1f).heightIn(min = if (multiline) 96.dp else ZonacardsTheme.shape.fieldH).padding(vertical = if (multiline) 12.dp else 0.dp)
                    .then(if (focusRequester != null) Modifier.focusRequester(focusRequester) else Modifier)
                    .onFocusChanged {
                        if (it.isFocused) scope.launch { delay(250); bring.bringIntoView() } // espera a que suba el teclado
                        if (wasFocused && !it.isFocused) onBlur?.invoke()
                        wasFocused = it.isFocused
                    }
                    .semantics {
                        contentDescription = name
                        val e = flash.message ?: error
                        if (e != null) error(e)
                        if (hint != null && e == null) stateDescription = hint
                    },
                enabled = enabled,
                singleLine = !multiline,
                minLines = minLines,
                textStyle = ZcTextTw.base.copy(color = c.text, fontFamily = LocalZcFontFamily.current),
                cursorBrush = SolidColor(c.text),
                interactionSource = source,
                visualTransformation = if (password && !reveal) PasswordVisualTransformation() else visualTransformation,
                keyboardOptions = KeyboardOptions(
                    keyboardType = if (password) KeyboardType.Password else keyboardType,
                    capitalization = capitalization, imeAction = if (multiline) ImeAction.Default else imeAction,
                ),
                keyboardActions = KeyboardActions(onAny = { onImeAction?.invoke() }),
                decorationBox = { inner ->
                    Box(Modifier.heightIn(min = if (multiline) 72.dp else ZonacardsTheme.shape.fieldH), contentAlignment = if (multiline) Alignment.TopStart else Alignment.CenterStart) {
                        if (value.isEmpty() && placeholder != null) ZcText(placeholder, style = ZcTextTw.base, color = c.textSubtle, maxLines = 1)
                        inner()
                    }
                },
            )
            if (suffix != null) ZcText(suffix, style = ZcType.caption, weight = FontWeight.Medium, color = c.textMuted, modifier = Modifier.padding(end = 16.dp).clearAndSetSemantics { })
            if (password) {
                FieldIconButton(if (reveal) ZcIcons.sEyeClosed else ZcIcons.sEye, ctx.getString(if (reveal) R.string.zc_ui_ocultar_clave else R.string.zc_ui_mostrar_clave)) { reveal = !reveal }
            } else if (trailingIcon != null) {
                if (onTrailingClick != null && trailingLabel != null) FieldIconButton(trailingIcon, trailingLabel, onTrailingClick)
                else ZcIcon(trailingIcon, contentDescription = null, tint = c.textMuted, modifier = Modifier.padding(end = 12.dp))
            }
        }
    }
    if (hideLabel) Box(modifier) { box() }
    else ZcField(label, modifier, required, optional, hint, error, counter, enabled, success, info, flash, reserve) {
        if (below == null) box() else Column(verticalArrangement = Arrangement.spacedBy(8.dp)) { box(); below() }
    }
}

/** Área de texto: mínimo 96 dp, crece con el contenido; contador opcional. */
@Composable
fun ZcTextArea(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    optional: Boolean = false,
    maxLength: Int? = null,
    enabled: Boolean = true,
) = ZcTextField(
    value, onValueChange, label, modifier, placeholder = placeholder, hint = hint, error = error, required = required, optional = optional,
    enabled = enabled, maxLength = maxLength, showCounter = maxLength != null, minLines = 3,
)

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

/**
 * Buscador (como el de los paneles de la web): lupa de 16 a la izquierda, sin etiqueta visible (la etiqueta es el nombre
 * para TalkBack), placeholder y "Limpiar" a la derecha cuando hay texto. La acción del teclado es "Buscar".
 */
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
    val c = ZonacardsTheme.colors
    val name = label ?: ctx.getString(R.string.zc_ui_buscar)
    ZcTextField(
        value = query, onValueChange = onQueryChange, label = name, modifier = modifier, placeholder = placeholder ?: name,
        imeAction = ImeAction.Search, onImeAction = { onSearch?.invoke(query) }, hideLabel = true,
        leading = { ZcIcon(ZcIcons.sMagnifer, contentDescription = null, size = 16.dp, tint = c.textMuted, modifier = Modifier.padding(start = 16.dp)) },
        trailingIcon = if (query.isEmpty()) null else ZcIcons.lX,
        trailingLabel = ctx.getString(R.string.zc_ui_limpiar),
        onTrailingClick = { onQueryChange("") },
    )
}
