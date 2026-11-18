package com.zonacards.ui.tokens.domain

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit

/** Estilos de formatDate de @zonacards/ui. */
enum class ZcDateStyle(val key: String) {
    SHORT("short"), MEDIUM("medium"), LONG("long"), FULL("full"), TIME("time"), TIME_PAD("time-pad"),
    DT_SHORT("dt-short"), DT_MEDIUM("dt-medium"), MONTH("month"), ISO("iso");
    companion object { fun of(key: String) = entries.first { it.key == key } }
}

/**
 * Fechas y horas como en la web: idioma del usuario ("es" | "en") y zona horaria del país de la operación.
 * Fechas de calendario (sin hora) como texto ISO "aaaa-mm-dd".
 */
object ZcDates {
    const val DEFAULT_TIME_ZONE = "America/Lima"

    fun format(instant: Instant, style: ZcDateStyle, lang: String = "es", timeZone: String = DEFAULT_TIME_ZONE, hourCycle: String = "h12"): String {
        val z = instant.atZone(ZoneId.of(timeZone))
        val spec = ZcLocaleSpec.dates(lang)
        val p = spec["patterns"].obj()
        return when (style) {
            ZcDateStyle.SHORT -> fill(p["short"].str(), z, spec)
            ZcDateStyle.LONG -> fill(p["long"].str(), z, spec)
            ZcDateStyle.FULL -> cap(fill(p["full"].str(), z, spec))
            ZcDateStyle.MONTH -> cap(fill(p["month"].str(), z, spec))
            ZcDateStyle.TIME -> fill(p["time.$hourCycle"].str(), z, spec)
            ZcDateStyle.TIME_PAD -> fill(p["time-pad.$hourCycle"].str(), z, spec)
            ZcDateStyle.MEDIUM -> {
                val mon = cap(spec["monthsShort"].list()[z.monthValue - 1].str().replaceFirst(".", ""))
                if (lang == "en") "$mon ${z.dayOfMonth}, ${z.year}" else "${z.dayOfMonth} $mon, ${z.year}"
            }
            ZcDateStyle.DT_SHORT -> "${format(instant, ZcDateStyle.SHORT, lang, timeZone, hourCycle)} ${format(instant, ZcDateStyle.TIME_PAD, lang, timeZone, hourCycle)}"
            ZcDateStyle.DT_MEDIUM -> "${format(instant, ZcDateStyle.MEDIUM, lang, timeZone, hourCycle)} · ${format(instant, ZcDateStyle.TIME, lang, timeZone, hourCycle)}"
            // Como toISOString(): el día en UTC.
            ZcDateStyle.ISO -> instant.atZone(ZoneId.of("UTC")).toLocalDate().toString()
        }
    }

    /** Rango compacto: "1 – 15 de mar de 2026", sin repetir mes ni año cuando coinciden. */
    fun formatRange(from: Instant, to: Instant, lang: String = "es", timeZone: String = DEFAULT_TIME_ZONE): String {
        val zone = ZoneId.of(timeZone)
        val a = from.atZone(zone); val b = to.atZone(zone)
        val spec = ZcLocaleSpec.dates(lang)
        val r = spec["ranges"].obj()
        val key = when {
            a.toLocalDate() == b.toLocalDate() -> "sameDay"
            a.year == b.year && a.monthValue == b.monthValue -> "sameMonth"
            a.year == b.year -> "sameYear"
            else -> "other"
        }
        val months = spec["monthsShort"].list()
        return r[key].str()
            .replace("{d1}", a.dayOfMonth.toString()).replace("{d2}", b.dayOfMonth.toString())
            .replace("{MMM1}", months[a.monthValue - 1].str()).replace("{MMM2}", months[b.monthValue - 1].str())
            .replace("{yyyy1}", a.year.toString()).replace("{yyyy2}", b.year.toString())
            .replace(".", "")
    }

    /** "hace 3 horas", "mañana", "dentro de 3 días". */
    fun formatRelative(instant: Instant, now: Instant = Instant.now(), lang: String = "es"): String {
        val s = (instant.toEpochMilli() - now.toEpochMilli()) / 1000.0
        val a = Math.abs(s)
        val (unit, v) = when {
            a < 60 -> "second" to jsRound(s)
            a < 3600 -> "minute" to jsRound(s / 60)
            a < 86400 -> "hour" to jsRound(s / 3600)
            a < 86400 * 30 -> "day" to jsRound(s / 86400)
            else -> "month" to jsRound(s / 2592000)
        }
        val t = ZcLocaleSpec.dates(lang)["relative"].obj()[unit].obj()
        val n = v.toLong()
        return when {
            // -2 a 2 tienen texto propio ("pasado mañana", "ayer", "ahora").
            t.containsKey(n.toString()) -> t[n.toString()].str()
            n < 0 -> t["past"].str().replace("#", (-n).toString())
            else -> t["future"].str().replace("#", n.toString())
        }
    }

    // ---------- Fechas de calendario ----------
    private fun d(iso: String) = LocalDate.parse(iso)

    fun isIsoDate(s: String) = Regex("""^\d{4}-\d{2}-\d{2}$""").matches(s)
    /** Hoy en la zona horaria del país de la operación. */
    fun todayIso(timeZone: String = DEFAULT_TIME_ZONE, now: Instant = Instant.now()): String = now.atZone(ZoneId.of(timeZone)).toLocalDate().toString()
    fun addDays(iso: String, n: Int): String = d(iso).plusDays(n.toLong()).toString()
    /** Primer día del mes sumando n meses (navegación del calendario). */
    fun addMonths(iso: String, n: Int): String = d(iso).withDayOfMonth(1).plusMonths(n.toLong()).toString()
    fun startOfMonth(iso: String): String = iso.substring(0, 8) + "01"
    fun endOfMonth(iso: String): String = d(iso).let { it.withDayOfMonth(it.lengthOfMonth()) }.toString()
    /** Lunes de la semana del día. */
    fun startOfWeek(iso: String): String = d(iso).let { it.minusDays((it.dayOfWeek.value - 1).toLong()) }.toString()
    /** Días del rango contando ambos extremos. */
    fun daysInRange(from: String, to: String): Int = ChronoUnit.DAYS.between(d(from), d(to)).toInt() + 1
    fun sameMonth(a: String, b: String) = a.substring(0, 7) == b.substring(0, 7)
    /** 42 días (6 semanas, de lunes a domingo) que cubren el mes. */
    fun monthGrid(month: String): List<String> { val first = startOfWeek(startOfMonth(month)); return (0 until 42).map { addDays(first, it) } }

    /** Máscara dd/mm/aaaa mientras se escribe. */
    fun maskDmy(raw: String): String {
        val x = raw.filter { it.isDigit() }.take(8)
        return when { x.length > 4 -> "${x.substring(0, 2)}/${x.substring(2, 4)}/${x.substring(4)}"; x.length > 2 -> "${x.substring(0, 2)}/${x.substring(2)}"; else -> x }
    }
    /** "dd/mm/aaaa" → ISO, o null si el formato o la fecha no existen (31/02). */
    fun parseDmy(s: String): String? {
        val m = Regex("""^(\d{2})/(\d{2})/(\d{4})$""").find(s) ?: return null
        val (dd, mm, yyyy) = m.destructured
        return runCatching { LocalDate.of(yyyy.toInt(), mm.toInt(), dd.toInt()).toString() }.getOrNull()
    }
    fun formatDmy(iso: String) = "${iso.substring(8, 10)}/${iso.substring(5, 7)}/${iso.substring(0, 4)}"
    /** Máscara hh:mm (24 h) mientras se escribe. */
    fun maskHm(raw: String): String { val x = raw.filter { it.isDigit() }.take(4); return if (x.length > 2) "${x.substring(0, 2)}:${x.substring(2)}" else x }
    fun isValidHm(s: String) = Regex("""^([01]\d|2[0-3]):[0-5]\d$""").matches(s)
    /** Horas cada `step` minutos entre dos horas (incluidas). */
    fun timeSlots(from: String = "00:00", to: String = "23:30", step: Int = 30): List<String> {
        fun min(t: String) = t.substring(0, 2).toInt() * 60 + t.substring(3).toInt()
        return (min(from)..min(to) step step).map { "%02d:%02d".format(it / 60, it % 60) }
    }

    private fun cap(s: String) = if (s.isEmpty()) s else s[0].uppercaseChar() + s.substring(1)

    private fun fill(pattern: String, z: ZonedDateTime, spec: Map<String, Any?>): String {
        val h12 = if (z.hour % 12 == 0) 12 else z.hour % 12
        val two = { n: Int -> n.toString().padStart(2, '0') }
        return Regex("\\{(\\w+)}").replace(pattern) { m ->
            when (m.groupValues[1]) {
                "d" -> z.dayOfMonth.toString(); "dd" -> two(z.dayOfMonth)
                "M" -> z.monthValue.toString()
                "MMM" -> spec["monthsShort"].list()[z.monthValue - 1].str()
                "MMMM" -> spec["monthsLong"].list()[z.monthValue - 1].str()
                "yy" -> two(z.year % 100); "yyyy" -> z.year.toString()
                "EEEE" -> spec["weekdaysLong"].list()[z.dayOfWeek.value % 7].str()
                "h" -> h12.toString(); "hh" -> two(h12)
                "H" -> z.hour.toString(); "HH" -> two(z.hour)
                "mm" -> two(z.minute)
                "a" -> (if (z.hour < 12) spec["am"] else spec["pm"]).str()
                else -> error("Token de fecha desconocido: ${m.value}")
            }
        }
    }
}
