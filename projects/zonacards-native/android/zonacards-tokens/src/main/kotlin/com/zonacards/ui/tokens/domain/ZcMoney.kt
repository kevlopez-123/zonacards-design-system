package com.zonacards.ui.tokens.domain

import com.zonacards.ui.tokens.ZcCountry
import com.zonacards.ui.tokens.ZcDomainData
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Especificación de idioma generada desde la web (domain-spec.json): separadores, patrones de moneda,
 * nombres de meses y patrones de fecha. Así el formato no depende de la versión de ICU del teléfono.
 */
internal object ZcLocaleSpec {
    val root: Map<String, Any?> by lazy {
        val stream = ZcLocaleSpec::class.java.classLoader!!.getResourceAsStream("zonacards/domain-spec.json")
            ?: error("Falta zonacards/domain-spec.json (npm run native)")
        ZcJson.parse(stream.bufferedReader(Charsets.UTF_8).use { it.readText() }).obj()
    }
    fun money(country: String) = root["money"].obj()[country]?.obj() ?: error("País sin formato de moneda: $country")
    fun dates(lang: String) = root["dates"].obj()[lang]?.obj() ?: error("Idioma sin formato de fecha: $lang")
}

/** Cómo se escribe la moneda: AUTO usa el código ISO cuando el símbolo del país sería "$" (CLP, COP, MXN, USD de Ecuador). */
enum class ZcMoneyDisplay(val key: String) { AUTO("auto"), SYMBOL("symbol"), CODE("code") }

/** Montos con la moneda, decimales y separadores del país, idénticos a formatMoney de @zonacards/ui. */
object ZcMoney {
    private val UNITS = listOf(1e9 to "MM", 1e6 to "M", 1e3 to "K")

    fun country(code: String): ZcCountry = ZcDomainData.countries.firstOrNull { it.code == code } ?: error("País no configurado: $code")

    /** Monto completo con los decimales del país ("S/ 1,250.00", "CLP 12.345"). */
    fun format(amount: Double, country: String, display: ZcMoneyDisplay = ZcMoneyDisplay.AUTO): String =
        apply(amount, country, display, country(country).decimals)

    /** Monto entero, sin decimales (chips de monto: "S/ 50"). */
    fun formatWhole(amount: Double, country: String, display: ZcMoneyDisplay = ZcMoneyDisplay.AUTO): String =
        apply(amount, country, display, 0)

    /** Número con los separadores del país, sin moneda ("1,000"). */
    fun formatNumber(n: Double, country: String): String {
        val spec = ZcLocaleSpec.money(country)
        val digits = number(n, 0, spec)
        return if (n.compareTo(0.0) < 0) "-$digits" else digits
    }

    /** Prefijo de un campo de monto: "S/", "Bs" o el código cuando el símbolo sería "$" (con AUTO). */
    fun currencySymbol(country: String, display: ZcMoneyDisplay = ZcMoneyDisplay.AUTO): String =
        pattern(country, display, "pos").replace("#", "").trim().trim(' ', ' ')

    /** Monto abreviado (K, M, MM) con un decimal. Nunca en tablas, exportaciones ni documentos. */
    fun formatCompact(amount: Double, country: String, display: ZcMoneyDisplay = ZcMoneyDisplay.AUTO): String {
        val abs = Math.abs(amount)
        if (abs < 1000) return formatWhole(amount, country, display)
        var i = UNITS.indexOfFirst { abs >= it.first }
        var value = abs / UNITS[i].first
        if (jsRound(value * 10) / 10 >= 1000 && i > 0) { i--; value = abs / UNITS[i].first }
        val rounded = jsRound(value * 10) / 10
        val spec = ZcLocaleSpec.money(country)
        val num = groupDigits(BigDecimal.valueOf(rounded).setScale(1, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString(), spec)
        val sign = if (amount < 0) "−" else ""
        return sign + pattern(country, display, "compact").replace("#", num + UNITS[i].second)
    }

    private fun apply(amount: Double, country: String, display: ZcMoneyDisplay, decimals: Int): String {
        val spec = ZcLocaleSpec.money(country)
        val negative = amount.compareTo(0.0) < 0
        return pattern(country, display, if (negative) "neg" else "pos").replace("#", number(amount, decimals, spec))
    }

    private fun pattern(country: String, display: ZcMoneyDisplay, kind: String): String =
        ZcLocaleSpec.money(country)["patterns"].obj()[display.key].obj()[kind].str()

    /** Valor absoluto redondeado "mitad hacia afuera" (como Intl) con los separadores del país. */
    private fun number(amount: Double, decimals: Int, spec: Map<String, Any?>): String {
        val plain = BigDecimal.valueOf(Math.abs(amount)).setScale(decimals, RoundingMode.HALF_UP).toPlainString()
        return groupDigits(plain, spec)
    }

    private fun groupDigits(plain: String, spec: Map<String, Any?>): String {
        val group = spec["group"].str()
        val decimal = spec["decimal"].str()
        val minGrouping = (spec["minGrouping"] as Double).toInt()
        val int = plain.substringBefore('.')
        val frac = plain.substringAfter('.', "")
        val grouped = if (int.length >= 4 + (minGrouping - 1)) int.reversed().chunked(3).joinToString(group).reversed() else int
        return if (frac.isEmpty()) grouped else grouped + decimal + frac
    }
}

/** Math.round de JavaScript: la mitad redondea hacia +∞ (-2.5 → -2). */
internal fun jsRound(x: Double): Double = Math.floor(x + 0.5)
