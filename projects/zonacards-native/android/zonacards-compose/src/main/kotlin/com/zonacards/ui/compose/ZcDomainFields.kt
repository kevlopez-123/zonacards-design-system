package com.zonacards.ui.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcDomainData
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType
import com.zonacards.ui.tokens.domain.ZcMoney
import com.zonacards.ui.tokens.domain.ZcPhone
import com.zonacards.ui.tokens.domain.ZcTaxId
import java.math.BigDecimal

/**
 * Monto en la moneda del país (zc-money-field): símbolo a la izquierda ("S/", o el código si el símbolo sería "$") y el código
 * ISO a la derecha; solo dígitos y hasta los decimales del país (CLP y COP sin decimales).
 * Mientras se escribe se ve el número limpio; al salir, con separadores ("1,250.00").
 */
@Composable
fun ZcMoneyField(
    amount: Double?,
    onAmountChange: (Double?) -> Unit,
    label: String,
    country: String,
    modifier: Modifier = Modifier,
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
) {
    val decimals = ZcMoney.country(country).decimals
    val symbol = ZcMoney.currencySymbol(country)
    val code = ZcMoney.country(country).currency
    val ctx = LocalContext.current
    val flash = rememberZcFlash()
    var focused by remember { mutableStateOf(false) }
    var raw by remember(country) { mutableStateOf(amount?.let { plain(it, decimals) } ?: "") }
    val shown = if (!focused && amount != null) ZcMoney.format(amount, country).replace(symbol, "").trim().trim(' ') else raw
    ZcTextField(
        value = shown,
        onValueChange = { v ->
            // Acepta "," o "." como separador decimal; guarda con punto.
            val norm = v.replace(',', '.')
            val ok = if (decimals == 0) Regex("^\\d{0,13}$") else Regex("^\\d{0,13}(\\.\\d{0,$decimals})?$")
            if (ok.matches(norm)) { raw = norm; onAmountChange(norm.toBigDecimalOrNull()?.toDouble()) }
            else flash.show(ctx.getString(R.string.zc_ui_solo_monto)) // rechazo avisado, como la web
        },
        label = label, modifier = modifier.onFocusChanged { if (it.hasFocus && !focused) raw = amount?.let { a -> plain(a, decimals) } ?: ""; focused = it.hasFocus },
        hint = hint, error = error, required = required, enabled = enabled,
        keyboardType = if (decimals == 0) KeyboardType.Number else KeyboardType.Decimal, prefix = symbol, suffix = code, flash = flash,
    )
}

private fun plain(a: Double, decimals: Int) = BigDecimal.valueOf(a).setScale(decimals, java.math.RoundingMode.HALF_UP).stripTrailingZeros().toPlainString()

/** Agrupa los dígitos de a 3 al dibujar ("987 654 321") sin cambiar el valor. */
private object PhoneGrouping : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        val out = ZcPhone.format(text.text)
        return TransformedText(AnnotatedString(out), object : OffsetMapping {
            override fun originalToTransformed(offset: Int) = offset + (if (offset == 0) 0 else (offset - 1) / 3)
            override fun transformedToOriginal(offset: Int) = (offset - offset / 4).coerceIn(0, text.length)
        })
    }
}

/**
 * Teléfono, como en la web: a la izquierda bandera + prefijo + flecha (abre la lista en un sheet, con búsqueda por país o
 * prefijo; los 6 países del alcance primero y un separador antes de los demás), y los dígitos nacionales en grupos de 3.
 */
@Composable
fun ZcPhoneField(
    digits: String,
    onDigitsChange: (String) -> Unit,
    country: String,
    onCountryChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    var open by remember { mutableStateOf(false) }
    var q by remember { mutableStateOf("") }
    val host = LocalZcSubscreenHost.current
    val sheetTitle = ctx.getString(R.string.zc_ui_codigo_pais, "", "").substringBefore(",")
    val dial = ZcPhone.dialCountry(country)
    Column(modifier) {
        ZcTextField(
            value = digits, onValueChange = { onDigitsChange(ZcPhone.digits(it, country)) }, label = label,
            hint = hint, error = error, required = required, enabled = enabled, keyboardType = KeyboardType.Phone,
            visualTransformation = PhoneGrouping,
            leading = {
                Row(
                    Modifier.heightIn(min = ZcSize.target).clickable(enabled = enabled, role = Role.DropdownList) {
                        q = ""
                        // Dentro de otro sheet: subpantalla con Volver.
                        if (host != null) host.push(sheetTitle) { CountryList(country, digits, onCountryChange, onDigitsChange) { host.pop() } } else open = true
                    }
                        .semantics(mergeDescendants = true) { contentDescription = ctx.getString(R.string.zc_ui_codigo_pais, dial.name, dial.dial) }
                        .padding(start = 16.dp, end = 4.dp),
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    ZcFlagImage(country)
                    ZcText(dial.dial, modifier = Modifier.clearAndSetSemantics { })
                    ZcIcon(ZcIcons.sAltArrowDown, contentDescription = null, size = 16.dp, tint = c.textMuted)
                }
                Box(Modifier.size(width = 1.dp, height = 24.dp).background(c.border))
            },
        )
    }
    if (open) ZcBottomSheet(onDismiss = { open = false }, title = sheetTitle) {
        CountryList(country, digits, onCountryChange, onDigitsChange) { open = false }
    }
}

/** Lista de prefijos con búsqueda por país o prefijo; los 6 países del alcance primero y un separador. */
@Composable
private fun CountryList(country: String, digits: String, onCountryChange: (String) -> Unit, onDigitsChange: (String) -> Unit, close: () -> Unit) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    var q by remember { mutableStateOf("") }
        Column {
            Box(Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
                ZcSearchField(q, { q = it }, label = ctx.getString(R.string.zc_ui_pais_oprefijo))
            }
            val term = q.trim().removePrefix("+")
            val list = ZcDomainData.dialCountries.filter { term.isEmpty() || it.name.contains(term, true) || it.dial.removePrefix("+").startsWith(term) }
            val scope = ZcDomainData.countries.map { it.code }.toSet()
            if (list.isEmpty()) ZcText(ctx.getString(R.string.zc_ui_sin_resultados, q), color = c.textMuted, modifier = Modifier.padding(20.dp))
            list.forEachIndexed { i, d ->
                if (i > 0 && d.code !in scope && list[i - 1].code in scope) ZcDivider(Modifier.padding(vertical = 4.dp))
                Row(
                    Modifier.fillMaxWidth().heightIn(min = 56.dp).background(if (d.code == country) c.surface2 else Color.Transparent)
                        .clickable(role = Role.RadioButton) { onCountryChange(d.code); onDigitsChange(digits.take(d.phoneDigits)); close() }
                        .padding(horizontal = 20.dp),
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    ZcFlagImage(d.code)
                    ZcText(d.name, modifier = Modifier.weight(1f))
                    ZcText(d.dial, color = c.textMuted)
                    if (d.code == country) ZcIcon(ZcIcons.lCheck, contentDescription = null)
                }
            }
        }
}

/** Bandera 4:3 decorativa (siempre junto al nombre o el código). */
@Composable
fun ZcFlagImage(code: String, modifier: Modifier = Modifier) {
    val res = com.zonacards.ui.tokens.ZcFlags.of(code) ?: return
    androidx.compose.foundation.Image(
        androidx.compose.ui.res.painterResource(res), contentDescription = null,
        modifier = modifier.height(18.dp).aspectRatio(4f / 3f).clip(RoundedCornerShape(2.dp)),
    )
}

/**
 * Identificador tributario del país (zc-tax-id-field): segmento izquierdo con el tipo (RUC, NIT, RUT, RFC); rechaza caracteres no permitidos, corta al largo máximo,
 * teclado numérico o de texto según el país y normaliza al salir (mayúsculas, guion del verificador).
 */
@Composable
fun ZcTaxIdField(
    value: String,
    onValueChange: (String) -> Unit,
    country: String,
    modifier: Modifier = Modifier,
    label: String = ZcMoney.country(country).taxId,
    hint: String? = ZcMoney.country(country).taxIdHint,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
) {
    val rule = ZcTaxId.rule(country)
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    val type = ZcMoney.country(country).taxId
    // Al cambiar de país el documento anterior ya no aplica: se vacía (como la web).
    var lastCountry by remember { mutableStateOf(country) }
    if (lastCountry != country) { lastCountry = country; if (value.isNotEmpty()) onValueChange("") }
    val reject = ctx.getString(when (country) { "co" -> R.string.zc_ui_solo_numeros_guion; "cl" -> R.string.zc_ui_solo_numeros_kguion; "mx" -> R.string.zc_ui_solo_letras_numeros; else -> R.string.zc_ui_solo_numeros })
    ZcTextField(
        value = value, onValueChange = onValueChange, label = label, modifier = modifier, hint = hint, error = error, required = required, enabled = enabled,
        allowed = rule.allowed, rejectMessage = reject, maxLength = rule.maxLength,
        leading = {
            // Segmento con el tipo de documento (RUC, NIT, RUT, RFC) separado por una línea.
            Box(Modifier.heightIn(min = ZcSize.target).padding(horizontal = 12.dp).clearAndSetSemantics { }, contentAlignment = Alignment.Center) {
                ZcText(type, style = ZcTextTw.sm, weight = FontWeight.Medium, color = c.textMuted)
            }
            Box(Modifier.size(width = 1.dp, height = ZcSize.target).background(c.border))
        },
        keyboardType = if (rule.inputMode == "numeric") KeyboardType.Number else KeyboardType.Ascii,
        capitalization = KeyboardCapitalization.Characters,
        onBlur = { val n = ZcTaxId.normalize(country, value); if (n != value) onValueChange(n) },
    )
}

/** true si el valor es un identificador válido para el país (con verificador cuando existe). */
fun zcIsValidTaxId(country: String, value: String) = ZcTaxId.isValid(country, value)

/**
 * Código de un solo uso (zc-otp): casilleros de hasta 52 de ancho y 56 de alto, radio 8, dígito de 20; con 6 o más dígitos,
 * un guion separa las mitades (123 – 456). `valid` pinta el borde de éxito; rechaza lo que no es número con aviso.
 * Pegar el código completo funciona. Llama `onComplete` al llegar al largo.
 */
@Composable
fun ZcOtpField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    length: Int = 6,
    error: String? = null,
    hint: String? = null,
    valid: Boolean = false,
    enabled: Boolean = true,
    onComplete: ((String) -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val flash = rememberZcFlash()
    var focused by remember { mutableStateOf(false) }
    val split = if (length >= 6) length / 2 else -1
    ZcField(label, modifier, false, false, hint, error, null, enabled, flash = flash) {
        BasicTextField(
            value = TextFieldValue(value, TextRange(value.length)),
            onValueChange = { tf ->
                if (tf.text.any { it !in '0'..'9' }) flash.show(ctx.getString(R.string.zc_mol_otp_solo_numeros))
                val d = tf.text.filter { it in '0'..'9' }.take(length)
                if (d != value) { onValueChange(d); if (d.length == length) onComplete?.invoke(d) }
            },
            enabled = enabled,
            modifier = Modifier.fillMaxWidth().onFocusChanged { focused = it.isFocused }.semantics {
                contentDescription = label
                stateDescription = "${value.length}/$length"
                val e = flash.message ?: error
                if (e != null) error(e)
            },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            cursorBrush = SolidColor(Color.Transparent),
            textStyle = ZcType.body.copy(color = Color.Transparent),
            decorationBox = {
                Row(Modifier.widthIn(max = 380.dp).clearAndSetSemantics { }, horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    repeat(length) { i ->
                        if (i == split) ZcText("–", color = c.textSubtle)
                        val active = focused && (i == value.length || (i == length - 1 && value.length == length))
                        Box(
                            Modifier.weight(1f).widthIn(max = 52.dp).height(ZcSize.target)
                                .zcControl(active, error != null || flash.message != null, !enabled, valid),
                            contentAlignment = Alignment.Center,
                        ) { ZcText(value.getOrNull(i)?.toString() ?: "", style = ZcTextTw.xl, weight = FontWeight.SemiBold) }
                    }
                }
            },
        )
    }
}

/** Estado del teclado de PIN: `reject()` tiembla, vibra y limpia (PIN incorrecto), como `reject()` de la web. */
@Stable
class ZcPinPadState internal constructor() {
    internal var shake by mutableStateOf(0)
    fun reject() { shake++ }
}

@Composable
fun rememberZcPinPadState() = remember { ZcPinPadState() }

/**
 * Teclado de PIN en pantalla (zc-pin-pad): puntos de 16 con borde de 2 (anunciados como "PIN, 2 de 4 dígitos"), teclas de
 * 72×64 con radio 20 y número de 24, separadas 12; biometría y borrar. Vibra en cada tecla; el error lleva ícono.
 * El PIN nunca se muestra.
 */
@Composable
fun ZcPinPad(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    length: Int = 4,
    onComplete: ((String) -> Unit)? = null,
    onBiometric: (() -> Unit)? = null,
    error: String? = null,
    state: ZcPinPadState = rememberZcPinPadState(),
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val haptic = rememberZcHaptics()
    val shakeX = remember { androidx.compose.animation.core.Animatable(0f) }
    LaunchedEffect(state.shake) {
        if (state.shake > 0) {
            haptic(ZcHaptic.REJECT)
            for (x in listOf(10f, -10f, 6f, -6f, 0f)) shakeX.animateTo(x, androidx.compose.animation.core.tween(60))
            onValueChange("")
        }
    }
    fun press(k: Char) { if (value.length < length) { haptic(ZcHaptic.KEY); val v = value + k; onValueChange(v); if (v.length == length) onComplete?.invoke(v) } }
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            Modifier.padding(vertical = 8.dp).graphicsLayer { translationX = shakeX.value.dp.toPx() }
                .semantics { contentDescription = ctx.getString(R.string.zc_mol_pin_progreso, value.length.toString(), length.toString()); if (error != null) error(error) },
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            repeat(length) { i ->
                val filled = i < value.length
                val col = if (error != null) c.dangerFg else c.textMuted
                Box(Modifier.size(16.dp).clip(CircleShape).background(if (filled) (if (error != null) c.dangerFg else c.text) else Color.Transparent).border(2.dp, col, CircleShape))
            }
        }
        if (error != null) Row(Modifier.clearAndSetSemantics { }, horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            ZcIcon(ZcIcons.sDangerCircle, null, size = 16.dp, tint = c.dangerFg)
            ZcText(error, style = ZcType.caption, color = c.dangerFg)
        }
        Column(Modifier.semantics { contentDescription = ctx.getString(R.string.zc_mol_pin_teclado) }, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            for (r in listOf("123", "456", "789")) Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) { for (k in r) PinKey(k.toString(), k.toString()) { press(k) } }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                if (onBiometric != null) PinKey(null, ctx.getString(R.string.zc_mol_pin_biometria), ZcIcons.lKeyRound) { haptic(ZcHaptic.KEY); onBiometric() } else Box(Modifier.size(72.dp, 64.dp))
                PinKey("0", "0") { press('0') }
                PinKey(null, ctx.getString(R.string.zc_mol_pin_borrar), ZcIcons.lArrowLeft) { if (value.isNotEmpty()) { haptic(ZcHaptic.KEY); onValueChange(value.dropLast(1)) } }
            }
        }
    }
}

@Composable
private fun PinKey(text: String?, label: String, icon: Int? = null, onClick: () -> Unit) {
    val c = ZonacardsTheme.colors
    Box(
        Modifier.size(72.dp, 64.dp).clip(RoundedCornerShape(20.dp)).background(if (text != null) c.surface2 else Color.Transparent)
            .clickable(role = Role.Button, onClick = onClick).semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) {
        if (text != null) ZcText(text, style = ZcTextTw.x2l, weight = FontWeight.Medium, modifier = Modifier.clearAndSetSemantics { })
        else if (icon != null) ZcIcon(icon, contentDescription = null, size = 24.dp)
    }
}
