package com.zonacards.ui.tokens.domain

import com.zonacards.ui.tokens.ZcDialCountry
import com.zonacards.ui.tokens.ZcDomainData
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/** Teléfonos nacionales e internacionales. */
object ZcPhone {
    fun dialCountry(code: String): ZcDialCountry = ZcDomainData.dialCountries.firstOrNull { it.code == code } ?: error("Prefijo no configurado: $code")
    /** Número nacional en grupos de 3 ("987 654 321"). */
    fun format(digits: String): String = digits.replace(Regex("""(\d{3})(?=\d)"""), "$1 ").trim()
    /** Solo dígitos, recortado al largo del país. */
    fun digits(raw: String, country: String): String = raw.filter { it.isDigit() }.take(dialCountry(country).phoneDigits)
    fun isValid(country: String, digits: String): Boolean = Regex("""^\d+$""").matches(digits) && digits.length == dialCountry(country).phoneDigits
    /** "+51 987 654 321". */
    fun formatIntl(country: String, digits: String): String = "${dialCountry(country).dial} ${format(digits)}"
}

/** Requisitos de contraseña. */
object ZcPassword {
    data class Checks(val len: Boolean, val case: Boolean, val num: Boolean, val sym: Boolean)
    fun checks(v: String) = Checks(
        len = v.length >= 8,
        case = v.any { it in 'a'..'z' } && v.any { it in 'A'..'Z' },
        num = v.any { it.isDigit() && it in '0'..'9' },
        sym = v.any { it in "#!$&@%*?._-" },
    )
    /** 0 = vacía · 1 a 4 = baja, media, buena, alta. */
    fun score(v: String): Int {
        if (v.isEmpty()) return 0
        val c = checks(v)
        return maxOf(1, listOf(c.len, c.case, c.num, c.sym).count { it })
    }
}

/** Identificador tributario por país (RUC, NIT, RUT, RFC) con dígito verificador cuando existe. */
object ZcTaxId {
    private fun digits(s: String) = s.filter { it in '0'..'9' }

    /** Perú · RUC: 11 dígitos, prefijo 10/15/16/17/20 y verificador módulo 11. */
    fun isValidRucPe(v: String): Boolean {
        if (!Regex("""^(10|15|16|17|20)\d{9}$""").matches(v)) return false
        val w = intArrayOf(5, 4, 3, 2, 7, 6, 5, 4, 3, 2)
        val sum = w.indices.sumOf { w[it] * (v[it] - '0') }
        return (11 - sum % 11) % 10 == v[10] - '0'
    }
    /** Ecuador · RUC: 13 dígitos, provincia 01–24 o 30 y establecimiento 001 en adelante. */
    fun isValidRucEc(v: String): Boolean {
        if (!Regex("""^\d{13}$""").matches(v)) return false
        val prov = v.substring(0, 2).toInt()
        return ((prov in 1..24) || prov == 30) && v.substring(10).toInt() >= 1
    }
    /** Colombia · NIT: verificador módulo 11 con los pesos de la DIAN. */
    fun nitCheckDigit(base: String): Int {
        val w = intArrayOf(3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71)
        val sum = base.reversed().withIndex().sumOf { (i, c) -> (c - '0') * w[i] }
        val r = sum % 11
        return if (r > 1) 11 - r else r
    }
    fun isValidNitCo(v: String): Boolean {
        val m = Regex("""^(\d{9})-?(\d)$""").find(v) ?: return false
        return nitCheckDigit(m.groupValues[1]) == m.groupValues[2].toInt()
    }
    /** Chile · RUT: verificador módulo 11 (0–9 o K). */
    fun rutCheckDigit(body: String): String {
        var sum = 0; var f = 2
        for (i in body.indices.reversed()) { sum += (body[i] - '0') * f; f = if (f == 7) 2 else f + 1 }
        val dv = 11 - sum % 11
        return when (dv) { 11 -> "0"; 10 -> "K"; else -> dv.toString() }
    }
    fun isValidRutCl(v: String): Boolean {
        val m = Regex("""^(\d{7,8})-([\dK])$""").find(v.replace(".", "").uppercase()) ?: return false
        return rutCheckDigit(m.groupValues[1]) == m.groupValues[2]
    }
    /** México · RFC: 3 o 4 letras, fecha AAMMDD válida y homoclave. */
    fun isValidRfcMx(v: String): Boolean {
        val m = Regex("""^([A-ZÑ&]{3,4})(\d{2})(\d{2})(\d{2})([A-Z\d]{2}[A\d])$""").find(v.uppercase()) ?: return false
        val month = m.groupValues[3].toInt(); val day = m.groupValues[4].toInt()
        return month in 1..12 && day in 1..31
    }

    fun isValid(country: String, v: String): Boolean = when (country) {
        "pe" -> isValidRucPe(v); "ec" -> isValidRucEc(v); "bo" -> Regex("""^\d{7,12}$""").matches(v)
        "co" -> isValidNitCo(v); "cl" -> isValidRutCl(v); "mx" -> isValidRfcMx(v)
        else -> error("País sin regla tributaria: $country")
    }
    /** Formato al salir del campo (mayúsculas, guion del verificador). */
    fun normalize(country: String, v: String): String = when (country) {
        "pe", "ec", "bo" -> digits(v)
        "co" -> digits(v).let { if (it.length == 10) it.substring(0, 9) + "-" + it[9] else v }
        "cl" -> v.replace(Regex("[.-]"), "").uppercase().let { if (it.length >= 8) it.dropLast(1) + "-" + it.last() else v.uppercase() }
        "mx" -> v.uppercase()
        else -> error("País sin regla tributaria: $country")
    }
    fun rule(country: String) = ZcDomainData.taxIdRules[country] ?: error("País sin regla tributaria: $country")
}

/** Regla de recurrencia para envíos, reportes y tareas programadas. */
data class ZcRecurRule(
    val freq: String, // none | daily | weekly | monthly | yearly
    val interval: Int = 1,
    val days: List<Int> = emptyList(), // 0 = domingo … 6 = sábado
    val monthMode: String = "day", // day | nth
    val end: String = "never", // never | until | count
    val until: String? = null,
    val count: Int = 10,
    val time: String = "09:00",
)

object ZcRecurrence {
    private fun ld(iso: String) = LocalDate.parse(iso)
    private fun dow(iso: String) = ld(iso).dayOfWeek.value % 7
    private fun dom(iso: String) = ld(iso).dayOfMonth
    private fun monthIndex(iso: String) = ld(iso).let { it.year * 12 + it.monthValue - 1 }
    private fun daysBetween(a: String, b: String) = ChronoUnit.DAYS.between(ld(a), ld(b)).toInt()

    /** Semana del mes del día (0 = primera … 4 = quinta o última). */
    fun nthOfMonth(iso: String) = minOf(4, (dom(iso) - 1) / 7)
    /** La regla no produce fechas (semanal sin días). */
    fun invalid(r: ZcRecurRule): String? = if (r.freq == "weekly" && r.days.isEmpty()) "days" else null

    /** Próximas fechas desde start (incluida); como máximo max. */
    fun occurrences(r: ZcRecurRule, start: String, max: Int): List<String> {
        if (r.freq == "none") return listOf(start)
        if (invalid(r) != null) return emptyList()
        val n = maxOf(1, r.interval)
        val out = ArrayList<String>()
        val startMonday = ZcDates.addDays(start, -((dow(start) + 6) % 7))
        val nth = nthOfMonth(start); val wd = dow(start)
        var d = start
        var guard = 0
        while (out.size < max && guard < 3700) {
            val ok = when (r.freq) {
                "daily" -> daysBetween(start, d) % n == 0
                "weekly" -> dow(d) in r.days && Math.floorDiv(daysBetween(startMonday, d), 7) % n == 0
                "monthly" -> {
                    val m = monthIndex(d) - monthIndex(start)
                    m % n == 0 && (if (r.monthMode == "day") dom(d) == dom(start) else dow(d) == wd && nthOfMonth(d) == nth)
                }
                "yearly" -> d.substring(5) == start.substring(5) && (d.substring(0, 4).toInt() - start.substring(0, 4).toInt()) % n == 0
                else -> false
            }
            if (ok) {
                if (r.end == "until" && r.until != null && d > r.until) break
                if (r.end == "count" && out.size >= r.count) break
                out.add(d)
            }
            guard++; d = ZcDates.addDays(d, 1)
        }
        return out
    }

    /** Días ordenados de lunes a domingo. */
    fun sortWeekdays(days: List<Int>) = days.sortedBy { (it + 6) % 7 }
}
