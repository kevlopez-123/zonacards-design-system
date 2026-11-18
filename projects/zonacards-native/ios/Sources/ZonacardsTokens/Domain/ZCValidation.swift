import Foundation

private func matches(_ s: String, _ pattern: String) -> Bool { s.range(of: pattern, options: .regularExpression) != nil }
private func groups(_ s: String, _ pattern: String) -> [String]? {
    guard let re = try? NSRegularExpression(pattern: pattern),
          let m = re.firstMatch(in: s, range: NSRange(s.startIndex..., in: s)) else { return nil }
    return (0..<m.numberOfRanges).map { Range(m.range(at: $0), in: s).map { String(s[$0]) } ?? "" }
}
private func digitValue(_ c: Character) -> Int { Int(String(c))! }

/// Teléfonos nacionales e internacionales.
public enum ZCPhone {
    public static func dialCountry(_ code: String) -> ZCDialCountry {
        guard let c = ZCDomainData.dialCountries.first(where: { $0.code == code }) else { fatalError("Prefijo no configurado: \(code)") }
        return c
    }
    /// Número nacional en grupos de 3 ("987 654 321").
    public static func format(_ digits: String) -> String {
        var out = ""
        for (i, c) in digits.enumerated() { if i > 0 && i % 3 == 0 { out.append(" ") }; out.append(c) }
        return out
    }
    /// Solo dígitos, recortado al largo del país.
    public static func digits(_ raw: String, country: String) -> String { String(raw.filter(\.isASCIIDigit).prefix(dialCountry(country).phoneDigits)) }
    public static func isValid(country: String, digits: String) -> Bool { matches(digits, #"^\d+$"#) && digits.count == dialCountry(country).phoneDigits }
    /// "+51 987 654 321".
    public static func formatIntl(country: String, digits: String) -> String { "\(dialCountry(country).dial) \(format(digits))" }
}

/// Requisitos de contraseña.
public enum ZCPassword {
    public struct Checks: Equatable, Sendable { public let len, `case`, num, sym: Bool }
    public static func checks(_ v: String) -> Checks {
        Checks(len: v.count >= 8,
               case: v.contains { ("a"..."z").contains($0) } && v.contains { ("A"..."Z").contains($0) },
               num: v.contains(where: \.isASCIIDigit),
               sym: v.contains { "#!$&@%*?._-".contains($0) })
    }
    /// 0 = vacía · 1 a 4 = baja, media, buena, alta.
    public static func score(_ v: String) -> Int {
        if v.isEmpty { return 0 }
        let c = checks(v)
        return max(1, [c.len, c.case, c.num, c.sym].filter { $0 }.count)
    }
}

/// Identificador tributario por país (RUC, NIT, RUT, RFC) con dígito verificador cuando existe.
public enum ZCTaxId {
    private static func digits(_ s: String) -> String { s.filter(\.isASCIIDigit) }

    public static func isValidRucPe(_ v: String) -> Bool {
        guard matches(v, #"^(10|15|16|17|20)\d{9}$"#) else { return false }
        let w = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2], c = Array(v)
        let sum = w.indices.reduce(0) { $0 + w[$1] * digitValue(c[$1]) }
        return (11 - sum % 11) % 10 == digitValue(c[10])
    }
    public static func isValidRucEc(_ v: String) -> Bool {
        guard matches(v, #"^\d{13}$"#) else { return false }
        let prov = Int(v.prefix(2))!
        return ((1...24).contains(prov) || prov == 30) && Int(v.suffix(3))! >= 1
    }
    public static func nitCheckDigit(_ base: String) -> Int {
        let w = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]
        let sum = base.reversed().enumerated().reduce(0) { $0 + digitValue($1.element) * w[$1.offset] }
        let r = sum % 11
        return r > 1 ? 11 - r : r
    }
    public static func isValidNitCo(_ v: String) -> Bool {
        guard let g = groups(v, #"^(\d{9})-?(\d)$"#) else { return false }
        return nitCheckDigit(g[1]) == Int(g[2])!
    }
    public static func rutCheckDigit(_ body: String) -> String {
        var sum = 0, f = 2
        for c in body.reversed() { sum += digitValue(c) * f; f = f == 7 ? 2 : f + 1 }
        let dv = 11 - sum % 11
        return dv == 11 ? "0" : dv == 10 ? "K" : "\(dv)"
    }
    public static func isValidRutCl(_ v: String) -> Bool {
        guard let g = groups(v.replacingOccurrences(of: ".", with: "").uppercased(), #"^(\d{7,8})-([\dK])$"#) else { return false }
        return rutCheckDigit(g[1]) == g[2]
    }
    public static func isValidRfcMx(_ v: String) -> Bool {
        guard let g = groups(v.uppercased(), #"^([A-ZÑ&]{3,4})(\d{2})(\d{2})(\d{2})([A-Z\d]{2}[A\d])$"#) else { return false }
        let month = Int(g[3])!, day = Int(g[4])!
        return (1...12).contains(month) && (1...31).contains(day)
    }

    public static func isValid(country: String, _ v: String) -> Bool {
        switch country {
        case "pe": return isValidRucPe(v)
        case "ec": return isValidRucEc(v)
        case "bo": return matches(v, #"^\d{7,12}$"#)
        case "co": return isValidNitCo(v)
        case "cl": return isValidRutCl(v)
        case "mx": return isValidRfcMx(v)
        default: fatalError("País sin regla tributaria: \(country)")
        }
    }
    /// Formato al salir del campo (mayúsculas, guion del verificador).
    public static func normalize(country: String, _ v: String) -> String {
        switch country {
        case "pe", "ec", "bo": return digits(v)
        case "co": let d = digits(v); return d.count == 10 ? d.prefix(9) + "-" + d.suffix(1) : v
        case "cl":
            let s = v.replacingOccurrences(of: ".", with: "").replacingOccurrences(of: "-", with: "").uppercased()
            return s.count >= 8 ? s.dropLast() + "-" + s.suffix(1) : v.uppercased()
        case "mx": return v.uppercased()
        default: fatalError("País sin regla tributaria: \(country)")
        }
    }
}

/// Regla de recurrencia para envíos, reportes y tareas programadas.
public struct ZCRecurRule: Sendable, Equatable {
    public var freq: String          // none | daily | weekly | monthly | yearly
    public var interval = 1
    public var days: [Int] = []      // 0 = domingo … 6 = sábado
    public var monthMode = "day"     // day | nth
    public var end = "never"         // never | until | count
    public var until: String?
    public var count = 10
    public var time = "09:00"
    public init(freq: String, interval: Int = 1, days: [Int] = [], monthMode: String = "day", end: String = "never", until: String? = nil, count: Int = 10, time: String = "09:00") {
        self.freq = freq; self.interval = interval; self.days = days; self.monthMode = monthMode; self.end = end; self.until = until; self.count = count; self.time = time
    }
}

public enum ZCRecurrence {
    private static func monthIndex(_ iso: String) -> Int { Int(iso.prefix(4))! * 12 + Int(iso.dropFirst(5).prefix(2))! - 1 }
    private static func daysBetween(_ a: String, _ b: String) -> Int { ZCDates.daysInRange(a, b) - 1 }

    /// Semana del mes del día (0 = primera … 4 = quinta o última).
    public static func nthOfMonth(_ iso: String) -> Int { min(4, (ZCDates.dayOfMonth(iso) - 1) / 7) }
    /// La regla no produce fechas (semanal sin días).
    public static func invalid(_ r: ZCRecurRule) -> String? { r.freq == "weekly" && r.days.isEmpty ? "days" : nil }

    /// Próximas fechas desde start (incluida); como máximo max.
    public static func occurrences(_ r: ZCRecurRule, start: String, max: Int) -> [String] {
        if r.freq == "none" { return [start] }
        if invalid(r) != nil { return [] }
        let n = Swift.max(1, r.interval)
        var out: [String] = []
        let startMonday = ZCDates.startOfWeek(start)
        let nth = nthOfMonth(start), wd = ZCDates.weekday(start)
        var d = start
        var guardCount = 0
        while out.count < max && guardCount < 3700 {
            let ok: Bool
            switch r.freq {
            case "daily": ok = daysBetween(start, d) % n == 0
            case "weekly": ok = r.days.contains(ZCDates.weekday(d)) && (daysBetween(startMonday, d) / 7) % n == 0
            case "monthly":
                let m = monthIndex(d) - monthIndex(start)
                ok = m % n == 0 && (r.monthMode == "day" ? ZCDates.dayOfMonth(d) == ZCDates.dayOfMonth(start) : ZCDates.weekday(d) == wd && nthOfMonth(d) == nth)
            case "yearly": ok = d.dropFirst(5) == start.dropFirst(5) && (Int(d.prefix(4))! - Int(start.prefix(4))!) % n == 0
            default: ok = false
            }
            if ok {
                if r.end == "until", let until = r.until, d > until { break }
                if r.end == "count" && out.count >= r.count { break }
                out.append(d)
            }
            guardCount += 1
            d = ZCDates.addDays(d, 1)
        }
        return out
    }

    /// Días ordenados de lunes a domingo.
    public static func sortWeekdays(_ days: [Int]) -> [Int] { days.sorted { ($0 + 6) % 7 < ($1 + 6) % 7 } }
}
