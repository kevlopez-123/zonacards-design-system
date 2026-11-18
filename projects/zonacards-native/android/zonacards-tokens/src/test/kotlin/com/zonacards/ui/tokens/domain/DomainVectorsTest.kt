package com.zonacards.ui.tokens.domain

import com.zonacards.ui.tokens.ZcDomainData
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant

/**
 * Corre los casos de domain-vectors.json (salidas reales de @zonacards/ui en la web).
 * Cada caso que no coincide se lista; la prueba falla si hay alguno.
 */
class DomainVectorsTest {
    private val v: Map<String, Any?> = ZcJson.parse(
        javaClass.classLoader!!.getResourceAsStream("zonacards/domain-vectors.json")!!.bufferedReader(Charsets.UTF_8).use { it.readText() },
    ).obj()

    private fun cases(group: String) = v[group].list().map { it.obj() }
    private fun display(c: Map<String, Any?>) = ZcMoneyDisplay.entries.first { it.key == (c["display"] ?: "auto") }
    private fun num(x: Any?) = (x as Double)
    private fun int(x: Any?) = (x as Double).toInt()

    private fun check(group: String, run: (Map<String, Any?>) -> Pair<Any?, Any?>) {
        val fails = ArrayList<String>()
        val all = cases(group)
        for (c in all) {
            val (expected, actual) = try { run(c) } catch (e: Throwable) { c["out"] to "EXCEPCIÓN ${e.message}" }
            if (expected != actual) fails.add("$c\n    esperado: «$expected»\n    obtenido: «$actual»")
        }
        assertTrue("$group: ${fails.size} de ${all.size} no coinciden\n" + fails.take(25).joinToString("\n"), fails.isEmpty())
    }

    @Test fun money() = check("money") { c ->
        val country = c["country"].str()
        c["out"] to when (c["fn"].str()) {
            "formatMoney" -> ZcMoney.format(num(c["amount"]), country, display(c))
            "formatMoneyWhole" -> ZcMoney.formatWhole(num(c["amount"]), country, display(c))
            "formatMoneyCompact" -> ZcMoney.formatCompact(num(c["amount"]), country, display(c))
            "formatNumber" -> ZcMoney.formatNumber(num(c["amount"]), country)
            "currencySymbol" -> ZcMoney.currencySymbol(country, display(c))
            else -> error("fn ${c["fn"]}")
        }
    }

    @Test fun dates() = check("dates") { c ->
        val lang = c["lang"].str()
        c["out"] to when (c["fn"].str()) {
            "formatDate" -> ZcDates.format(Instant.parse(c["instant"].str()), ZcDateStyle.of(c["style"].str()), lang, c["timeZone"].str(), c["hourCycle"].str())
            "formatRange" -> ZcDates.formatRange(Instant.parse(c["from"].str()), Instant.parse(c["to"].str()), lang, c["timeZone"].str())
            "formatRelative" -> ZcDates.formatRelative(Instant.parse(c["instant"].str()), Instant.parse(c["now"].str()), lang)
            else -> error("fn ${c["fn"]}")
        }
    }

    @Test fun calendar() = check("calendar") { c ->
        val a = c["args"].list()
        val out = c["out"]
        val expected: Any? = if (out is Double) out.toInt() else out
        expected to when (c["fn"].str()) {
            "todayIso" -> ZcDates.todayIso(a[0].str(), Instant.parse(a[1].str()))
            "addDays" -> ZcDates.addDays(a[0].str(), int(a[1]))
            "addMonths" -> ZcDates.addMonths(a[0].str(), int(a[1]))
            "startOfMonth" -> ZcDates.startOfMonth(a[0].str())
            "endOfMonth" -> ZcDates.endOfMonth(a[0].str())
            "startOfWeek" -> ZcDates.startOfWeek(a[0].str())
            "daysInRange" -> ZcDates.daysInRange(a[0].str(), a[1].str())
            "monthGrid" -> ZcDates.monthGrid(a[0].str())
            "maskDmy" -> ZcDates.maskDmy(a[0].str())
            "parseDmy" -> ZcDates.parseDmy(a[0].str())
            "formatDmy" -> ZcDates.formatDmy(a[0].str())
            "maskHm" -> ZcDates.maskHm(a[0].str())
            "isValidHm" -> ZcDates.isValidHm(a[0].str())
            "timeSlots" -> ZcDates.timeSlots(a[0].str(), a[1].str(), int(a[2]))
            else -> error("fn ${c["fn"]}")
        }
    }

    @Test fun phone() = check("phone") { c ->
        val cc = c["country"].str()
        val digits = ZcPhone.digits(c["raw"].str(), cc)
        listOf(c["digits"], c["valid"], c["formatted"], c["intl"]) to listOf(digits, ZcPhone.isValid(cc, digits), ZcPhone.format(digits), ZcPhone.formatIntl(cc, digits))
    }

    @Test fun password() = check("password") { c ->
        val ch = c["checks"].obj()
        val p = c["value"].str()
        val k = ZcPassword.checks(p)
        listOf(ch["len"], ch["case"], ch["num"], ch["sym"], int(c["score"])) to listOf(k.len, k.case, k.num, k.sym, ZcPassword.score(p))
    }

    @Test fun taxId() = check("taxId") { c ->
        val cc = c["country"].str(); val value = c["value"].str()
        listOf(c["valid"], c["normalized"]) to listOf(ZcTaxId.isValid(cc, value), ZcTaxId.normalize(cc, value))
    }

    @Test fun recurrence() = check("recurrence") { c ->
        val r = c["rule"].obj()
        val rule = ZcRecurRule(
            freq = r["freq"].str(), interval = int(r["interval"]), days = r["days"].list().map { int(it) }, monthMode = r["monthMode"].str(),
            end = r["end"].str(), until = r["until"] as String?, count = int(r["count"]), time = r["time"].str(),
        )
        val start = c["start"].str()
        listOf(c["out"], int(c["nth"]), c["invalid"]) to listOf(ZcRecurrence.occurrences(rule, start, int(c["max"])), ZcRecurrence.nthOfMonth(start), ZcRecurrence.invalid(rule))
    }

    @Test fun stateMachines() {
        assertTrue(ZcDomainData.lot.canTransition("activo", "agotado"))
        assertTrue(!ZcDomainData.lot.canTransition("anulado", "activo"))
        assertEquals("s:hourglass", ZcDomainData.settlement.looks["pending_approval"]?.icon)
        assertEquals(6, ZcDomainData.countries.size)
    }
}
