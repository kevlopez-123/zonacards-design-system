import Foundation

/// Especificación de idioma generada desde la web (domain-spec.json): separadores, patrones de moneda,
/// nombres de meses y patrones de fecha. Así el formato no depende de la versión de ICU del teléfono.
enum ZCLocaleSpec {
    static let root: [String: Any] = {
        guard let url = Bundle.module.url(forResource: "domain-spec", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { fatalError("Falta domain-spec.json (npm run native)") }
        return json
    }()
    static func money(_ country: String) -> [String: Any] {
        guard let m = (root["money"] as? [String: Any])?[country] as? [String: Any] else { fatalError("País sin formato de moneda: \(country)") }
        return m
    }
    static func dates(_ lang: String) -> [String: Any] {
        guard let d = (root["dates"] as? [String: Any])?[lang] as? [String: Any] else { fatalError("Idioma sin formato de fecha: \(lang)") }
        return d
    }
}

/// Cómo se escribe la moneda: `.auto` usa el código ISO cuando el símbolo del país sería "$".
public enum ZCMoneyDisplay: String, Sendable { case auto, symbol, code }

/// Montos con la moneda, decimales y separadores del país, idénticos a formatMoney de @zonacards/ui.
public enum ZCMoney {
    private static let units: [(Double, String)] = [(1e9, "MM"), (1e6, "M"), (1e3, "K")]

    public static func country(_ code: String) -> ZCCountry {
        guard let c = ZCDomainData.countries.first(where: { $0.code == code }) else { fatalError("País no configurado: \(code)") }
        return c
    }

    /// Monto completo con los decimales del país ("S/ 1,250.00", "CLP 12.345").
    public static func format(_ amount: Double, country: String, display: ZCMoneyDisplay = .auto) -> String {
        apply(amount, country: country, display: display, decimals: Self.country(country).decimals)
    }

    /// Monto entero, sin decimales ("S/ 50").
    public static func formatWhole(_ amount: Double, country: String, display: ZCMoneyDisplay = .auto) -> String {
        apply(amount, country: country, display: display, decimals: 0)
    }

    /// Número con los separadores del país, sin moneda ("1,000").
    public static func formatNumber(_ n: Double, country: String) -> String {
        let digits = number(n, decimals: 0, spec: ZCLocaleSpec.money(country))
        return n < 0 || (n == 0 && n.sign == .minus) ? "-" + digits : digits
    }

    /// Prefijo de un campo de monto: "S/", "Bs" o el código cuando el símbolo sería "$" (con `.auto`).
    public static func currencySymbol(_ country: String, display: ZCMoneyDisplay = .auto) -> String {
        pattern(country, display, "pos").replacingOccurrences(of: "#", with: "")
            .trimmingCharacters(in: CharacterSet(charactersIn: " \u{00A0}\u{202F}"))
    }

    /// Monto abreviado (K, M, MM) con un decimal. Nunca en tablas, exportaciones ni documentos.
    public static func formatCompact(_ amount: Double, country: String, display: ZCMoneyDisplay = .auto) -> String {
        let abs = Swift.abs(amount)
        if abs < 1000 { return formatWhole(amount, country: country, display: display) }
        var i = units.firstIndex { abs >= $0.0 }!
        var value = abs / units[i].0
        if jsRound(value * 10) / 10 >= 1000 && i > 0 { i -= 1; value = abs / units[i].0 }
        let rounded = jsRound(value * 10) / 10
        var plain = decimalString(rounded, decimals: 1)
        if plain.hasSuffix(".0") { plain.removeLast(2) }
        let num = group(plain, spec: ZCLocaleSpec.money(country))
        return (amount < 0 ? "\u{2212}" : "") + pattern(country, display, "compact").replacingOccurrences(of: "#", with: num + units[i].1)
    }

    private static func apply(_ amount: Double, country: String, display: ZCMoneyDisplay, decimals: Int) -> String {
        let negative = amount < 0 || (amount == 0 && amount.sign == .minus)
        return pattern(country, display, negative ? "neg" : "pos")
            .replacingOccurrences(of: "#", with: number(amount, decimals: decimals, spec: ZCLocaleSpec.money(country)))
    }

    private static func pattern(_ country: String, _ display: ZCMoneyDisplay, _ kind: String) -> String {
        let p = ZCLocaleSpec.money(country)["patterns"] as! [String: Any]
        return (p[display.rawValue] as! [String: String])[kind]!
    }

    private static func number(_ amount: Double, decimals: Int, spec: [String: Any]) -> String {
        group(decimalString(Swift.abs(amount), decimals: decimals), spec: spec)
    }

    /// Redondeo "mitad hacia afuera" (como Intl) sobre la representación decimal más corta del Double.
    static func decimalString(_ x: Double, decimals: Int) -> String {
        var value = Decimal(string: "\(x)") ?? Decimal(x)
        var result = Decimal()
        NSDecimalRound(&result, &value, decimals, .plain)
        let f = NumberFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.numberStyle = .none
        f.usesGroupingSeparator = false
        f.minimumFractionDigits = decimals
        f.maximumFractionDigits = decimals
        f.minimumIntegerDigits = 1
        return f.string(from: result as NSDecimalNumber) ?? "\(result)"
    }

    private static func group(_ plain: String, spec: [String: Any]) -> String {
        let groupSep = spec["group"] as! String
        let decimalSep = spec["decimal"] as! String
        let minGrouping = (spec["minGrouping"] as! NSNumber).intValue
        let parts = plain.split(separator: ".", omittingEmptySubsequences: false)
        let int = String(parts[0])
        var grouped = int
        if int.count >= 4 + (minGrouping - 1) {
            var out: [String] = []
            var rest = int
            while rest.count > 3 { out.insert(String(rest.suffix(3)), at: 0); rest.removeLast(3) }
            out.insert(rest, at: 0)
            grouped = out.joined(separator: groupSep)
        }
        return parts.count > 1 ? grouped + decimalSep + parts[1] : grouped
    }
}

/// Math.round de JavaScript: la mitad redondea hacia +∞ (-2.5 → -2).
func jsRound(_ x: Double) -> Double { (x + 0.5).rounded(.down) }
