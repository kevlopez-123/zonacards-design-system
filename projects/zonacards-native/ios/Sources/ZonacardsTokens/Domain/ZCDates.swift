import Foundation

/// Estilos de formatDate de @zonacards/ui.
public enum ZCDateStyle: String, Sendable, CaseIterable {
    case short, medium, long, full, time
    case timePad = "time-pad", dtShort = "dt-short", dtMedium = "dt-medium"
    case month, iso
}

/// Fechas y horas como en la web: idioma ("es" | "en") y zona horaria del país de la operación.
/// Fechas de calendario (sin hora) como texto ISO "aaaa-mm-dd".
public enum ZCDates {
    public static let defaultTimeZone = "America/Lima"

    struct Parts { let year, month, day, hour, minute, weekday: Int } // weekday: 0 = domingo

    static func parts(_ date: Date, _ timeZone: String) -> Parts {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: timeZone)!
        let c = cal.dateComponents([.year, .month, .day, .hour, .minute, .weekday], from: date)
        return Parts(year: c.year!, month: c.month!, day: c.day!, hour: c.hour!, minute: c.minute!, weekday: c.weekday! - 1)
    }

    public static func format(_ date: Date, _ style: ZCDateStyle, lang: String = "es", timeZone: String = defaultTimeZone, hourCycle: String = "h12") -> String {
        let z = parts(date, timeZone)
        let spec = ZCLocaleSpec.dates(lang)
        let p = spec["patterns"] as! [String: String]
        switch style {
        case .short: return fill(p["short"]!, z, spec)
        case .long: return fill(p["long"]!, z, spec)
        case .full: return cap(fill(p["full"]!, z, spec))
        case .month: return cap(fill(p["month"]!, z, spec))
        case .time: return fill(p["time.\(hourCycle)"]!, z, spec)
        case .timePad: return fill(p["time-pad.\(hourCycle)"]!, z, spec)
        case .medium:
            var short = (spec["monthsShort"] as! [String])[z.month - 1]
            if let dot = short.firstIndex(of: ".") { short.remove(at: dot) }
            let mon = cap(short)
            return lang == "en" ? "\(mon) \(z.day), \(z.year)" : "\(z.day) \(mon), \(z.year)"
        case .dtShort:
            return "\(format(date, .short, lang: lang, timeZone: timeZone, hourCycle: hourCycle)) \(format(date, .timePad, lang: lang, timeZone: timeZone, hourCycle: hourCycle))"
        case .dtMedium:
            return "\(format(date, .medium, lang: lang, timeZone: timeZone, hourCycle: hourCycle)) · \(format(date, .time, lang: lang, timeZone: timeZone, hourCycle: hourCycle))"
        case .iso:
            let u = parts(date, "UTC")
            return iso(u.year, u.month, u.day)
        }
    }

    /// Rango compacto: "1 – 15 de mar de 2026", sin repetir mes ni año cuando coinciden.
    public static func formatRange(_ from: Date, _ to: Date, lang: String = "es", timeZone: String = defaultTimeZone) -> String {
        let a = parts(from, timeZone), b = parts(to, timeZone)
        let spec = ZCLocaleSpec.dates(lang)
        let ranges = spec["ranges"] as! [String: String]
        let key = a.year == b.year && a.month == b.month && a.day == b.day ? "sameDay"
            : a.year == b.year && a.month == b.month ? "sameMonth" : a.year == b.year ? "sameYear" : "other"
        let months = spec["monthsShort"] as! [String]
        return ranges[key]!
            .replacingOccurrences(of: "{d1}", with: "\(a.day)").replacingOccurrences(of: "{d2}", with: "\(b.day)")
            .replacingOccurrences(of: "{MMM1}", with: months[a.month - 1]).replacingOccurrences(of: "{MMM2}", with: months[b.month - 1])
            .replacingOccurrences(of: "{yyyy1}", with: "\(a.year)").replacingOccurrences(of: "{yyyy2}", with: "\(b.year)")
            .replacingOccurrences(of: ".", with: "")
    }

    /// "hace 3 horas", "mañana", "dentro de 3 días".
    public static func formatRelative(_ date: Date, now: Date = Date(), lang: String = "es") -> String {
        let s = (date.timeIntervalSince1970 * 1000).rounded() / 1000 - (now.timeIntervalSince1970 * 1000).rounded() / 1000
        let a = Swift.abs(s)
        let (unit, v): (String, Double) =
            a < 60 ? ("second", jsRound(s)) : a < 3600 ? ("minute", jsRound(s / 60)) : a < 86400 ? ("hour", jsRound(s / 3600))
            : a < 86400 * 30 ? ("day", jsRound(s / 86400)) : ("month", jsRound(s / 2592000))
        let t = (ZCLocaleSpec.dates(lang)["relative"] as! [String: [String: String]])[unit]!
        let n = Int(v)
        // -2 a 2 tienen texto propio ("pasado mañana", "ayer", "ahora").
        if let exact = t["\(n)"] { return exact }
        return n < 0 ? t["past"]!.replacingOccurrences(of: "#", with: "\(-n)") : t["future"]!.replacingOccurrences(of: "#", with: "\(n)")
    }

    // MARK: Fechas de calendario

    private static var utc: Calendar = { var c = Calendar(identifier: .gregorian); c.timeZone = TimeZone(identifier: "UTC")!; return c }()
    private static func iso(_ y: Int, _ m: Int, _ d: Int) -> String { String(format: "%04d-%02d-%02d", y, m, d) }
    private static func date(_ iso: String) -> Date {
        let p = iso.split(separator: "-").map { Int($0)! }
        return utc.date(from: DateComponents(year: p[0], month: p[1], day: p[2]))!
    }
    private static func iso(_ d: Date) -> String { let c = utc.dateComponents([.year, .month, .day], from: d); return iso(c.year!, c.month!, c.day!) }
    static func weekday(_ isoDate: String) -> Int { utc.component(.weekday, from: date(isoDate)) - 1 }
    static func dayOfMonth(_ isoDate: String) -> Int { Int(isoDate.suffix(2))! }

    public static func isIsoDate(_ s: String) -> Bool { s.range(of: #"^\d{4}-\d{2}-\d{2}$"#, options: .regularExpression) != nil }
    /// Hoy en la zona horaria del país de la operación.
    public static func todayIso(_ timeZone: String = defaultTimeZone, now: Date = Date()) -> String { let p = parts(now, timeZone); return iso(p.year, p.month, p.day) }
    public static func addDays(_ isoDate: String, _ n: Int) -> String { iso(utc.date(byAdding: .day, value: n, to: date(isoDate))!) }
    /// Primer día del mes sumando n meses (navegación del calendario).
    public static func addMonths(_ isoDate: String, _ n: Int) -> String { iso(utc.date(byAdding: .month, value: n, to: date(startOfMonth(isoDate)))!) }
    public static func startOfMonth(_ isoDate: String) -> String { String(isoDate.prefix(8)) + "01" }
    public static func endOfMonth(_ isoDate: String) -> String { addDays(addMonths(isoDate, 1), -1) }
    /// Lunes de la semana del día.
    public static func startOfWeek(_ isoDate: String) -> String { addDays(isoDate, -((weekday(isoDate) + 6) % 7)) }
    /// Días del rango contando ambos extremos.
    public static func daysInRange(_ from: String, _ to: String) -> Int { utc.dateComponents([.day], from: date(from), to: date(to)).day! + 1 }
    public static func sameMonth(_ a: String, _ b: String) -> Bool { a.prefix(7) == b.prefix(7) }
    /// 42 días (6 semanas, de lunes a domingo) que cubren el mes.
    public static func monthGrid(_ month: String) -> [String] { let first = startOfWeek(startOfMonth(month)); return (0..<42).map { addDays(first, $0) } }

    /// Máscara dd/mm/aaaa mientras se escribe.
    public static func maskDmy(_ raw: String) -> String {
        let d = String(raw.filter(\.isASCIIDigit).prefix(8))
        if d.count > 4 { return "\(d.prefix(2))/\(d.dropFirst(2).prefix(2))/\(d.dropFirst(4))" }
        if d.count > 2 { return "\(d.prefix(2))/\(d.dropFirst(2))" }
        return d
    }
    /// "dd/mm/aaaa" → ISO, o nil si el formato o la fecha no existen (31/02).
    public static func parseDmy(_ s: String) -> String? {
        guard s.range(of: #"^\d{2}/\d{2}/\d{4}$"#, options: .regularExpression) != nil else { return nil }
        let p = s.split(separator: "/").map { Int($0)! }
        guard (1...12).contains(p[1]), p[0] >= 1 else { return nil }
        let candidate = iso(p[2], p[1], p[0])
        guard let d = utc.date(from: DateComponents(year: p[2], month: p[1], day: p[0])) else { return nil }
        return iso(d) == candidate ? candidate : nil
    }
    public static func formatDmy(_ isoDate: String) -> String {
        let c = Array(isoDate)
        return "\(String(c[8...9]))/\(String(c[5...6]))/\(String(c[0...3]))"
    }
    /// Máscara hh:mm (24 h) mientras se escribe.
    public static func maskHm(_ raw: String) -> String {
        let d = String(raw.filter(\.isASCIIDigit).prefix(4))
        return d.count > 2 ? "\(d.prefix(2)):\(d.dropFirst(2))" : d
    }
    public static func isValidHm(_ s: String) -> Bool { s.range(of: #"^([01]\d|2[0-3]):[0-5]\d$"#, options: .regularExpression) != nil }
    /// Horas cada `step` minutos entre dos horas (incluidas).
    public static func timeSlots(from: String = "00:00", to: String = "23:30", step: Int = 30) -> [String] {
        func min(_ t: String) -> Int { Int(t.prefix(2))! * 60 + Int(t.suffix(2))! }
        return stride(from: min(from), through: min(to), by: step).map { String(format: "%02d:%02d", $0 / 60, $0 % 60) }
    }

    private static func cap(_ s: String) -> String { s.isEmpty ? s : s.prefix(1).uppercased() + s.dropFirst() }

    private static func fill(_ pattern: String, _ z: Parts, _ spec: [String: Any]) -> String {
        let h12 = z.hour % 12 == 0 ? 12 : z.hour % 12
        func two(_ n: Int) -> String { String(format: "%02d", n) }
        let values: [String: String] = [
            "d": "\(z.day)", "dd": two(z.day), "M": "\(z.month)",
            "MMM": (spec["monthsShort"] as! [String])[z.month - 1], "MMMM": (spec["monthsLong"] as! [String])[z.month - 1],
            "yy": two(z.year % 100), "yyyy": "\(z.year)", "EEEE": (spec["weekdaysLong"] as! [String])[z.weekday],
            "h": "\(h12)", "hh": two(h12), "H": "\(z.hour)", "HH": two(z.hour), "mm": two(z.minute),
            "a": (z.hour < 12 ? spec["am"] : spec["pm"]) as! String,
        ]
        var out = ""
        var token: String?
        for ch in pattern {
            if ch == "{" { token = ""; continue }
            if ch == "}", let t = token { out += values[t] ?? "{\(t)}"; token = nil; continue }
            if token != nil { token!.append(ch) } else { out.append(ch) }
        }
        return out
    }
}

extension Character { var isASCIIDigit: Bool { ("0"..."9").contains(self) } }
