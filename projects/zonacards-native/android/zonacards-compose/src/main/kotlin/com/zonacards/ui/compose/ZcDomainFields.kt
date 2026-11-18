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
 * Monto en la moneda del país: prefijo ("S/", "CLP"), solo dígitos y hasta los decimales del país (CLP y COP sin decimales).
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
        },
        label = label, modifier = modifier.onFocusChanged { if (it.hasFocus && !focused) raw = amount?.let { a -> plain(a, decimals) } ?: ""; focused = it.hasFocus },
        hint = hint, error = error, required = required, enabled = enabled,
        keyboardType = if (decimals == 0) KeyboardType.Number else KeyboardType.Decimal, prefix = symbol,
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
    val dial = ZcPhone.dialCountry(country)
    Column(modifier) {
        ZcTextField(
            value = digits, onValueChange = { onDigitsChange(ZcPhone.digits(it, country)) }, label = label,
            hint = hint, error = error, required = required, enabled = enabled, keyboardType = KeyboardType.Phone,
            visualTransformation = PhoneGrouping,
            leading = {
                Row(
                    Modifier.heightIn(min = ZcSize.target).clickable(enabled = enabled, role = Role.DropdownList) { q = ""; open = true }
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
    if (open) ZcBottomSheet(onDismiss = { open = false }, title = ctx.getString(R.string.zc_ui_codigo_pais, "", "").substringBefore(",")) {
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
                        .clickable(role = Role.RadioButton) { onCountryChange(d.code); onDigitsChange(digits.take(d.phoneDigits)); open = false }
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
 * Identificador tributario del país (RUC, NIT, RUT, RFC): rechaza caracteres no permitidos, corta al largo máximo,
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
    ZcTextField(
        value = value, onValueChange = onValueChange, label = label, modifier = modifier, hint = hint, error = error, required = required, enabled = enabled,
        allowed = rule.allowed, maxLength = rule.maxLength,
        keyboardType = if (rule.inputMode == "numeric") KeyboardType.Number else KeyboardType.Ascii,
        capitalization = KeyboardCapitalization.Characters,
        onBlur = { val n = ZcTaxId.normalize(country, value); if (n != value) onValueChange(n) },
    )
}

/** true si el valor es un identificador válido para el país (con verificador cuando existe). */
fun zcIsValidTaxId(country: String, value: String) = ZcTaxId.isValid(country, value)

/**
 * Código de un solo uso (OTP): casillas de un dígito sobre un único campo (pegar el código completo funciona).
 * Llama `onComplete` al llegar al largo.
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
    onComplete: ((String) -> Unit)? = null,
) {
    val c = ZonacardsTheme.colors
    var focused by remember { mutableStateOf(false) }
    ZcField(label, modifier, false, false, hint, error, null, true) {
        BasicTextField(
            value = TextFieldValue(value, TextRange(value.length)),
            onValueChange = { tf ->
                val d = tf.text.filter { it in '0'..'9' }.take(length)
                if (d != value) { onValueChange(d); if (d.length == length) onComplete?.invoke(d) }
            },
            modifier = Modifier.onFocusChanged { focused = it.isFocused }.semantics {
                contentDescription = label
                stateDescription = "${value.length}/$length"
                if (error != null) error(error)
            },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            cursorBrush = SolidColor(Color.Transparent),
            textStyle = ZcType.body.copy(color = Color.Transparent),
            decorationBox = {
                Row(Modifier.clearAndSetSemantics { }, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    repeat(length) { i ->
                        val active = focused && (i == value.length || (i == length - 1 && value.length == length))
                        val look = controlLook(active, error != null)
                        Box(
                            Modifier.size(width = 44.dp, height = ZcSize.target + 8.dp).clip(RoundedCornerShape(ZcRadius.ms)).background(c.surface)
                                .border(look.width, look.border, RoundedCornerShape(ZcRadius.ms)),
                            contentAlignment = Alignment.Center,
                        ) { ZcText(value.getOrNull(i)?.toString() ?: "", style = ZcType.heading, weight = FontWeight.SemiBold) }
                    }
                }
            },
        )
    }
}

/**
 * Teclado de PIN en pantalla: puntos de avance (anunciados como "PIN, 2 de 4 dígitos"), teclas de 64 dp,
 * borrar y biometría opcional. El PIN nunca se muestra.
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
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    fun press(k: Char) { if (value.length < length) { val v = value + k; onValueChange(v); if (v.length == length) onComplete?.invoke(v) } }
    Column(modifier.widthIn(max = 320.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(20.dp)) {
        Row(
            Modifier.semantics { contentDescription = ctx.getString(R.string.zc_mol_pin_progreso, value.length.toString(), length.toString()); if (error != null) error(error) },
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            repeat(length) { i ->
                val filled = i < value.length
                Box(Modifier.size(14.dp).clip(CircleShape).background(if (filled) (if (error != null) c.dangerFg else c.text) else Color.Transparent)
                    .border(1.5.dp, if (error != null) c.dangerFg else c.borderStrong, CircleShape))
            }
        }
        if (error != null) ZcText(error, style = ZcType.caption, color = c.dangerFg, modifier = Modifier.clearAndSetSemantics { })
        val rows = listOf("123", "456", "789")
        for (r in rows) Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) { for (k in r) PinKey(k.toString(), k.toString()) { press(k) } }
        Row(horizontalArrangement = Arrangement.spacedBy(24.dp), verticalAlignment = Alignment.CenterVertically) {
            if (onBiometric != null) PinKey(null, ctx.getString(R.string.zc_mol_pin_biometria), ZcIcons.lFingerprintPattern, onBiometric) else Box(Modifier.size(64.dp))
            PinKey("0", "0") { press('0') }
            PinKey(null, ctx.getString(R.string.zc_mol_pin_borrar), ZcIcons.sBackspace) { if (value.isNotEmpty()) onValueChange(value.dropLast(1)) }
        }
    }
}

@Composable
private fun PinKey(text: String?, label: String, icon: Int? = null, onClick: () -> Unit) {
    val c = ZonacardsTheme.colors
    Box(
        Modifier.size(64.dp).clip(CircleShape).background(if (text != null) c.surface2 else Color.Transparent)
            .clickable(role = Role.Button, onClick = onClick).semantics { contentDescription = label },
        contentAlignment = Alignment.Center,
    ) {
        if (text != null) ZcText(text, style = ZcType.heading, weight = FontWeight.Medium, modifier = Modifier.clearAndSetSemantics { })
        else if (icon != null) ZcIcon(icon, contentDescription = null, size = 26.dp)
    }
}

