import XCTest
@testable import ZonacardsTokens

/// Corre los casos de domain-vectors.json (salidas reales de @zonacards/ui en la web).
final class DomainVectorsTests: XCTestCase {
    private static let v: [String: Any] = {
        let url = Bundle.module.url(forResource: "domain-vectors", withExtension: "json")!
        return try! JSONSerialization.jsonObject(with: Data(contentsOf: url)) as! [String: Any]
    }()
    private func cases(_ g: String) -> [[String: Any]] { Self.v[g] as! [[String: Any]] }
    private func date(_ s: Any?) -> Date { ISO8601DateFormatter.zc.date(from: s as! String) ?? ISO8601DateFormatter().date(from: s as! String)! }
    private func display(_ c: [String: Any]) -> ZCMoneyDisplay { ZCMoneyDisplay(rawValue: c["display"] as? String ?? "auto")! }
    private func int(_ x: Any?) -> Int { (x as! NSNumber).intValue }

    private func check(_ group: String, _ run: ([String: Any]) -> (NSObject?, NSObject?)) {
        var fails: [String] = []
        for c in cases(group) {
            let (expected, actual) = run(c)
            if expected != actual { fails.append("\(c)\n    esperado: «\(String(describing: expected))»\n    obtenido: «\(String(describing: actual))»") }
        }
        XCTAssert(fails.isEmpty, "\(group): \(fails.count) no coinciden\n" + fails.prefix(25).joined(separator: "\n"))
    }

    func testMoney() {
        check("money") { c in
            let country = c["country"] as! String, amount = (c["amount"] as? NSNumber)?.doubleValue ?? 0
            let out: String
            switch c["fn"] as! String {
            case "formatMoney": out = ZCMoney.format(amount, country: country, display: display(c))
            case "formatMoneyWhole": out = ZCMoney.formatWhole(amount, country: country, display: display(c))
            case "formatMoneyCompact": out = ZCMoney.formatCompact(amount, country: country, display: display(c))
            case "formatNumber": out = ZCMoney.formatNumber(amount, country: country)
            default: out = ZCMoney.currencySymbol(country, display: display(c))
            }
            return (c["out"] as! NSString, out as NSString)
        }
    }

    func testDates() {
        check("dates") { c in
            let lang = c["lang"] as! String
            let out: String
            switch c["fn"] as! String {
            case "formatDate": out = ZCDates.format(date(c["instant"]), ZCDateStyle(rawValue: c["style"] as! String)!, lang: lang, timeZone: c["timeZone"] as! String, hourCycle: c["hourCycle"] as! String)
            case "formatRange": out = ZCDates.formatRange(date(c["from"]), date(c["to"]), lang: lang, timeZone: c["timeZone"] as! String)
            default: out = ZCDates.formatRelative(date(c["instant"]), now: date(c["now"]), lang: lang)
            }
            return (c["out"] as! NSString, out as NSString)
        }
    }

    func testCalendar() {
        check("calendar") { c in
            let a = c["args"] as! [Any]
            let s = { (i: Int) in a[i] as! String }
            let out: Any?
            switch c["fn"] as! String {
            case "todayIso": out = ZCDates.todayIso(s(0), now: date(a[1]))
            case "addDays": out = ZCDates.addDays(s(0), int(a[1]))
            case "addMonths": out = ZCDates.addMonths(s(0), int(a[1]))
            case "startOfMonth": out = ZCDates.startOfMonth(s(0))
            case "endOfMonth": out = ZCDates.endOfMonth(s(0))
            case "startOfWeek": out = ZCDates.startOfWeek(s(0))
            case "daysInRange": out = ZCDates.daysInRange(s(0), s(1))
            case "monthGrid": out = ZCDates.monthGrid(s(0))
            case "maskDmy": out = ZCDates.maskDmy(s(0))
            case "parseDmy": out = ZCDates.parseDmy(s(0)) ?? NSNull()
            case "formatDmy": out = ZCDates.formatDmy(s(0))
            case "maskHm": out = ZCDates.maskHm(s(0))
            case "isValidHm": out = ZCDates.isValidHm(s(0))
            default: out = ZCDates.timeSlots(from: s(0), to: s(1), step: int(a[2]))
            }
            return (c["out"] as? NSObject, out as? NSObject)
        }
    }

    func testPhonePasswordTaxId() {
        check("phone") { c in
            let cc = c["country"] as! String
            let d = ZCPhone.digits(c["raw"] as! String, country: cc)
            return ([c["digits"]!, c["valid"]!, c["formatted"]!, c["intl"]!] as NSArray,
                    [d, ZCPhone.isValid(country: cc, digits: d), ZCPhone.format(d), ZCPhone.formatIntl(country: cc, digits: d)] as NSArray)
        }
        check("password") { c in
            let ch = c["checks"] as! [String: Bool], p = c["value"] as! String, k = ZCPassword.checks(p)
            return ([ch["len"]!, ch["case"]!, ch["num"]!, ch["sym"]!, int(c["score"])] as NSArray, [k.len, k.case, k.num, k.sym, ZCPassword.score(p)] as NSArray)
        }
        check("taxId") { c in
            let cc = c["country"] as! String, value = c["value"] as! String
            return ([c["valid"]!, c["normalized"]!] as NSArray, [ZCTaxId.isValid(country: cc, value), ZCTaxId.normalize(country: cc, value)] as NSArray)
        }
    }

    func testRecurrence() {
        check("recurrence") { c in
            let r = c["rule"] as! [String: Any]
            let rule = ZCRecurRule(freq: r["freq"] as! String, interval: int(r["interval"]), days: (r["days"] as! [NSNumber]).map(\.intValue),
                                   monthMode: r["monthMode"] as! String, end: r["end"] as! String, until: r["until"] as? String, count: int(r["count"]), time: r["time"] as! String)
            let start = c["start"] as! String
            return ([c["out"]!, int(c["nth"]), c["invalid"] ?? NSNull()] as NSArray,
                    [ZCRecurrence.occurrences(rule, start: start, max: int(c["max"])), ZCRecurrence.nthOfMonth(start), ZCRecurrence.invalid(rule) ?? NSNull()] as NSArray)
        }
    }

    func testStateMachines() {
        XCTAssertTrue(ZCDomainData.lot.canTransition(from: "activo", to: "agotado"))
        XCTAssertFalse(ZCDomainData.lot.canTransition(from: "anulado", to: "activo"))
        XCTAssertEqual(ZCDomainData.settlement.looks["pending_approval"]?.icon, "s:hourglass")
    }
}

extension ISO8601DateFormatter {
    static let zc: ISO8601DateFormatter = { let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]; return f }()
}
