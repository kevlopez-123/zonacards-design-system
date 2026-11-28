import SwiftUI
import ZonacardsTokens

/// Periodos predefinidos de `zc-date-range` (las mismas claves que la web).
public enum ZCRangePreset: String, CaseIterable, Sendable {
    case today = "hoy", yesterday = "ayer", last7 = "ult7", last30 = "ult30", week = "semana", month = "mes"
    case prevMonth = "mesAnterior", quarter = "trimestre", year = "anio", custom = "personalizado"

    var label: String { ZCString.text("ui.preset.\(rawValue)") }
}

/// Valor del selector: fechas ISO, el periodo elegido (nil si vino de afuera) y si se compara con el anterior.
public struct ZCDateRangeValue: Equatable, Sendable {
    public let from: String
    public let to: String
    public let preset: ZCRangePreset?
    public let compare: Bool

    public init(from: String, to: String, preset: ZCRangePreset? = nil, compare: Bool = false) {
        self.from = from
        self.to = to
        self.preset = preset
        self.compare = compare
    }
}

/// Fechas de un periodo predefinido respecto de hoy; nil para "Personalizado".
public func zcPresetRange(_ p: ZCRangePreset, today: String) -> (from: String, to: String)? {
    let y = String(today.prefix(4))
    let m = Int(today.dropFirst(5).prefix(2)) ?? 1
    switch p {
    case .today: return (today, today)
    case .yesterday: let d = ZCDates.addDays(today, -1); return (d, d)
    case .last7: return (ZCDates.addDays(today, -6), today)
    case .last30: return (ZCDates.addDays(today, -29), today)
    case .week: return (ZCDates.startOfWeek(today), today)
    case .month: return (ZCDates.startOfMonth(today), today)
    case .prevMonth: let d = ZCDates.addMonths(today, -1); return (d, ZCDates.endOfMonth(d))
    case .quarter: return ("\(y)-" + String(format: "%02d", (m - 1) / 3 * 3 + 1) + "-01", today)
    case .year: return ("\(y)-01-01", today)
    case .custom: return nil
    }
}

/// Periodo anterior de la misma duración, para comparar.
public func zcPreviousRange(from: String, to: String) -> (from: String, to: String) {
    let n = ZCDates.daysInRange(from, to)
    return (ZCDates.addDays(from, -n), ZCDates.addDays(from, -1))
}

private let zcUtcCalendar: Calendar = {
    var c = Calendar(identifier: .gregorian)
    c.timeZone = TimeZone(identifier: "UTC")!
    return c
}()

private func zcDate(_ iso: String) -> Date {
    let p = iso.split(separator: "-").compactMap { Int($0) }
    return zcUtcCalendar.date(from: DateComponents(year: p[0], month: p[1], day: p[2])) ?? Date()
}

private func zcLongDate(_ iso: String, lang: String) -> String { ZCDates.format(zcDate(iso), .full, lang: lang, timeZone: "UTC") }

/// Un mes de lunes a domingo (`zc-calendar`). Cada día es un botón de 44 pt con la fecha completa como nombre; hoy lleva un punto, la elegida o los
/// extremos del rango van rellenos y lo que queda entre ellos, con `surface2`. Deshabilita lo que sale de [min, max]. Las siete columnas miden 308 pt.
public struct ZCCalendar: View {
    @Environment(\.zcTheme) private var theme
    private let month: Binding<String>
    private let today: String
    private let selected: String?
    private let rangeStart: String?
    private let rangeEnd: String?
    private let minDate: String?
    private let maxDate: String?
    private let unavailable: ((String) -> Bool)?
    private let hideOutside: Bool
    private let lang: String
    private let onPick: (String) -> Void

    public init(month: Binding<String>, today: String, selected: String? = nil, rangeStart: String? = nil, rangeEnd: String? = nil,
                min: String? = nil, max: String? = nil, unavailable: ((String) -> Bool)? = nil, hideOutside: Bool = true, lang: String = "es", onPick: @escaping (String) -> Void) {
        self.month = month
        self.today = today
        self.selected = selected
        self.rangeStart = rangeStart
        self.rangeEnd = rangeEnd
        self.minDate = min
        self.maxDate = max
        self.unavailable = unavailable
        self.hideOutside = hideOutside
        self.lang = lang
        self.onPick = onPick
    }

    private func off(_ d: String) -> Bool { (minDate.map { d < $0 } ?? false) || (maxDate.map { d > $0 } ?? false) || (unavailable?(d) ?? false) }

    public var body: some View {
        let c = theme.colors
        let grid = ZCDates.monthGrid(month.wrappedValue)
        let weeks = stride(from: 0, to: grid.count, by: 7).map { Array(grid[$0..<($0 + 7)]) }.filter { week in week.contains { ZCDates.sameMonth($0, month.wrappedValue) } }
        VStack(spacing: 0) {
            HStack {
                ZCIconButton(.sAltArrowLeft, label: ZCString.text("ui.mesAnterior")) { month.wrappedValue = ZCDates.addMonths(month.wrappedValue, -1) }
                Spacer()
                Text(ZCDates.format(zcDate(ZCDates.startOfMonth(month.wrappedValue)), .month, lang: lang, timeZone: "UTC"))
                    .font(.zc(ZCType.body, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(c.text).accessibilityAddTraits(.isHeader)
                Spacer()
                ZCIconButton(.sAltArrowRight, label: ZCString.text("ui.mesSiguiente")) { month.wrappedValue = ZCDates.addMonths(month.wrappedValue, 1) }
            }
            HStack(spacing: 0) {
                ForEach(Array(grid.prefix(7).enumerated()), id: \.offset) { _, d in
                    let long = ZCDates.format(zcDate(d), .full, lang: lang, timeZone: "UTC").split(separator: ",")[0].split(separator: " ")[0]
                    Text(String(long.prefix(1)).uppercased()).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
                        .frame(width: 44, height: 32)
                        .accessibilityLabel(String(long))
                }
            }
            ForEach(Array(weeks.enumerated()), id: \.offset) { _, week in
                HStack(spacing: 0) {
                    ForEach(week, id: \.self) { d in day(d) }
                }
            }
        }
        .frame(width: 308)
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder private func day(_ d: String) -> some View {
        let c = theme.colors
        let out = !ZCDates.sameMonth(d, month.wrappedValue)
        if out && hideOutside {
            Color.clear.frame(width: 44, height: 44)
        } else {
            let edge = d == selected || d == rangeStart || d == rangeEnd
            let inside = rangeStart != nil && rangeEnd != nil && d > rangeStart! && d < rangeEnd!
            let disabled = off(d)
            Button { onPick(d) } label: {
                ZStack(alignment: .bottom) {
                    Text(String(Int(d.suffix(2)) ?? 0)).font(.zc(ZCType.bodySm, theme: theme).weight(edge ? .semibold : .regular)).monospacedDigit()
                        .foregroundStyle(edge ? c.onPrimary : (disabled || out ? c.textSubtle : c.text))
                        .frame(width: 44, height: 44)
                    if d == today && !edge {
                        Circle().fill(disabled ? c.textSubtle : c.text).frame(width: 4, height: 4).padding(.bottom, 5)
                    }
                }
                .frame(width: 44, height: 44)
                .background(edge ? c.primary : (inside ? c.surface2 : .clear), in: RoundedRectangle(cornerRadius: inside ? 0 : ZCRadius.sm, style: .continuous))
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .disabled(disabled)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(zcLongDate(d, lang: lang))
            .accessibilityAddTraits(edge ? [.isButton, .isSelected] : [.isButton])
        }
    }
}

/// Periodo de reportes y filtros (`zc-date-range`). Disparador con un ícono de calendario; abre un panel con los periodos predefinidos como chips,
/// Desde y Hasta escribibles (dd/mm/aaaa), un mes con el rango resaltado, "Comparar con el periodo anterior" y Aplicar/Cancelar (el borrador solo se
/// aplica con Aplicar). Por defecto no deja elegir fechas futuras (`allowFuture`).
public struct ZCDateRange: View {
    @State private var open = false
    private let label: String
    private let value: Binding<ZCDateRangeValue?>
    private let today: String
    private let allowFuture: Bool
    private let maxDays: Int?
    private let unavailable: ((String) -> Bool)?
    private let lang: String
    private let hint: String?
    private let error: String?
    private let required: Bool

    public init(_ label: String, value: Binding<ZCDateRangeValue?>, today: String = ZCDates.todayIso(), allowFuture: Bool = false, maxDays: Int? = nil, unavailable: ((String) -> Bool)? = nil, lang: String = "es",
                hint: String? = nil, error: String? = nil, required: Bool = false) {
        self.label = label
        self.value = value
        self.today = today
        self.allowFuture = allowFuture
        self.maxDays = maxDays
        self.unavailable = unavailable
        self.lang = lang
        self.hint = hint
        self.error = error
        self.required = required
    }

    private func presetText(_ v: ZCDateRangeValue) -> String? {
        if let p = v.preset, p != .custom { return p.label }
        return nil
    }

    public var body: some View {
        let short: String? = value.wrappedValue.map { v in
            let base = presetText(v) ?? "\(ZCDates.formatDmy(v.from).prefix(5)) – \(ZCDates.formatDmy(v.to))"
            return v.compare ? "\(base) · \(ZCString.text("ui.vsAnterior"))" : base
        }
        let full: String? = value.wrappedValue.map { v in
            let pre = presetText(v).map { $0 + ": " } ?? ""
            return "\(pre)\(ZCDates.formatDmy(v.from)) – \(ZCDates.formatDmy(v.to))" + (v.compare ? ", " + ZCString.text("ui.comparadoAnterior") : "")
        }
        ZCField(label, required: required, hint: hint, error: error) {
            ZCSelectTrigger(name: zcFieldName(label, required: required) + (full.map { ", \($0)" } ?? ""), valueText: short, placeholder: ZCString.text("ui.elegirPeriodo"),
                            icon: .sCalendar, invalid: error != nil) { open = true }
        }
        .zcChoice(isPresented: $open, title: label) { close in
            ZCRangePanel(value: value.wrappedValue, today: today, maxDate: allowFuture ? nil : today, maxDays: maxDays, unavailable: unavailable, lang: lang, cancel: close) {
                value.wrappedValue = $0
                close()
            }
        }
    }
}

private struct ZCRangePanel: View {
    @Environment(\.zcTheme) private var theme
    let today: String
    let maxDate: String?
    let maxDays: Int?
    let unavailable: ((String) -> Bool)?
    let lang: String
    let cancel: () -> Void
    let apply: (ZCDateRangeValue) -> Void
    @State private var from: String?
    @State private var to: String?
    @State private var preset: ZCRangePreset
    @State private var compare: Bool
    @State private var month: String
    @State private var fromText: String
    @State private var toText: String
    @State private var fromError: String?
    @State private var toError: String?

    init(value: ZCDateRangeValue?, today: String, maxDate: String?, maxDays: Int?, unavailable: ((String) -> Bool)?, lang: String, cancel: @escaping () -> Void, apply: @escaping (ZCDateRangeValue) -> Void) {
        self.today = today
        self.maxDate = maxDate
        self.maxDays = maxDays
        self.unavailable = unavailable
        self.lang = lang
        self.cancel = cancel
        self.apply = apply
        let defaultRange = zcPresetRange(.last30, today: today)!
        let start: (String, String) = value.map { ($0.from, $0.to) } ?? (defaultRange.from, defaultRange.to)
        _from = State(initialValue: start.0)
        _to = State(initialValue: start.1)
        _preset = State(initialValue: value?.preset ?? (value != nil ? .custom : .last30))
        _compare = State(initialValue: value?.compare ?? false)
        _month = State(initialValue: ZCDates.startOfMonth(start.1))
        _fromText = State(initialValue: ZCDates.formatDmy(start.0))
        _toText = State(initialValue: ZCDates.formatDmy(start.1))
    }

    private func sync() {
        fromText = from.map { ZCDates.formatDmy($0) } ?? ""
        toText = to.map { ZCDates.formatDmy($0) } ?? ""
        fromError = nil
        toError = nil
    }

    private func choose(_ p: ZCRangePreset) {
        preset = p
        if let r = zcPresetRange(p, today: today) {
            from = r.from
            to = r.to
            month = ZCDates.startOfMonth(r.to)
            sync()
        }
    }

    private func pick(_ d: String) {
        if let f = from, to == nil {
            if d < f { from = d; to = f } else { to = d }
        } else {
            from = d
            to = nil
        }
        preset = .custom
        sync()
    }

    private func typed(_ raw: String, isTo: Bool) {
        let masked = ZCDates.maskDmy(raw)
        if isTo { toText = masked } else { fromText = masked }
        func setError(_ m: String?) { if isTo { toError = m } else { fromError = m } }
        if masked.count < 10 { setError(nil); return }
        guard let d = ZCDates.parseDmy(masked) else { setError(ZCString.text("validacion.dateFormat")); return }
        if let maxDate, d > maxDate { setError(ZCString.text("ui.noFutura")); return }
        if unavailable?(d) == true { setError(ZCString.text("ui.fechaNoDisponible")); return }
        if isTo, let f = from, d < f { setError(ZCString.text("validacion.rangeOrder")); return }
        let spanFrom = isTo ? from : d
        let spanTo = isTo ? d : to
        if let maxDays, let a = spanFrom, let b = spanTo, a <= b, ZCDates.daysInRange(a, b) > maxDays {
            setError(ZCString.text("ui.rangoMaxDias", maxDays))
            return
        }
        setError(nil)
        if isTo { to = d } else {
            from = d
            if let t = to, d > t { to = nil; toText = "" }
        }
        preset = .custom
        month = ZCDates.startOfMonth(to ?? d)
    }

    /// Lo que el calendario deshabilita: las no disponibles y, mientras se espera el fin, lo que pasaría del tope o cruzaría una no disponible.
    private func blocked(_ d: String) -> Bool {
        if unavailable?(d) == true { return true }
        guard let f = from, to == nil else { return false }
        let (a, b) = d < f ? (d, f) : (f, d)
        let n = ZCDates.daysInRange(a, b)
        if let maxDays, n > maxDays { return true }
        if let unavailable {
            var x = a
            for _ in 0..<min(n, 400) { if unavailable(x) { return true }; x = ZCDates.addDays(x, 1) }
        }
        return false
    }

    /// Un periodo predefinido más largo que el tope no se puede elegir.
    private func presetOff(_ p: ZCRangePreset) -> Bool {
        guard let maxDays, let r = zcPresetRange(p, today: today) else { return false }
        return ZCDates.daysInRange(r.from, r.to) > maxDays
    }

    /// Las fechas del periodo anterior, que se muestran bajo "Comparar con el periodo anterior".
    private var previousText: String? {
        guard let f = from, let t = to else { return nil }
        let p = zcPreviousRange(from: f, to: t)
        return "\(ZCDates.formatDmy(p.from)) – \(ZCDates.formatDmy(p.to))"
    }

    var body: some View {
        let c = theme.colors
        let days = (from != nil && to != nil) ? ZCDates.daysInRange(from!, to!) : 0
        let canApply = from != nil && to != nil && fromError == nil && toError == nil
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ZCFlowLayout(spacing: 8, lineSpacing: 8) {
                    ForEach(ZCRangePreset.allCases, id: \.self) { p in
                        ZCChip(p.label, selected: Binding(get: { preset == p }, set: { _ in choose(p) })).disabled(presetOff(p))
                    }
                }
                .accessibilityElement(children: .contain)
                .accessibilityLabel(ZCString.text("ui.periodos"))
                HStack(alignment: .top, spacing: 12) {
                    ZCTextField(ZCString.text("ui.desde"), text: Binding(get: { fromText }, set: { typed($0, isTo: false) }), placeholder: ZCString.text("ui.formatoFecha"), error: fromError)
                    ZCTextField(ZCString.text("ui.hasta"), text: Binding(get: { toText }, set: { typed($0, isTo: true) }), placeholder: ZCString.text("ui.formatoFecha"), error: toError)
                }
                ZCCalendar(month: $month, today: today, rangeStart: from, rangeEnd: to, max: maxDate, unavailable: blocked, lang: lang, onPick: pick)
                ZCCheckbox(isOn: $compare, label: ZCString.text("ui.compararAnterior"),
                           description: previousText)
                HStack(spacing: 8) {
                    Text(to != nil ? ZCString.text("ui.nDias", days) : ZCString.text("ui.eligeFin")).font(.zc(ZCType.bodySm, theme: theme)).monospacedDigit()
                        .foregroundStyle(c.textMuted).frame(maxWidth: .infinity, alignment: .leading)
                    ZCButton(ZCString.text("ui.cancelar"), variant: .ghost, size: .sm, action: cancel)
                    ZCButton(ZCString.text("ui.aplicar"), size: .sm) {
                        if let f = from, let t = to { apply(ZCDateRangeValue(from: f, to: t, preset: preset, compare: compare)) }
                    }
                    .disabled(!canApply)
                }
            }
            .padding(ZCSpace.v4)
        }
        .background(c.surface)
    }
}
