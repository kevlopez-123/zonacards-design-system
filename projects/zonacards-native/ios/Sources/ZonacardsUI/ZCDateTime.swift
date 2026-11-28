import SwiftUI
import ZonacardsTokens

/// Fecha y hora en un solo campo (equivale a `zc-datetime-field` y al `granularity` del DatePicker de HeroUI): el selector de fecha y el campo de hora lado a
/// lado, con un solo valor "aaaa-mm-ddThh:mm" (hora local de la operación). Mientras falte una de las dos partes el valor es `nil` y la otra se conserva en
/// pantalla. `min` y `max` valen para la fecha. El selector de fecha del sistema no admite fechas no disponibles sueltas: para eso usa `ZCCalendar` con `unavailable`.
public struct ZCDateTimeField: View {
    @Environment(\.zcTheme) private var theme
    @State private var date: String
    @State private var time: String?
    @State private var emitted: String?
    private let label: String
    private let value: Binding<String?>
    private let minDate: String?
    private let maxDate: String?
    private let hint: String?
    private let error: String?
    private let required: Bool

    public init(_ label: String, value: Binding<String?>, min: String? = nil, max: String? = nil, hint: String? = nil, error: String? = nil, required: Bool = false) {
        self.label = label
        self.value = value
        self.minDate = min
        self.maxDate = max
        self.hint = hint
        self.error = error
        self.required = required
        _date = State(initialValue: Self.datePart(value.wrappedValue) ?? "")
        _time = State(initialValue: Self.timePart(value.wrappedValue))
        _emitted = State(initialValue: value.wrappedValue)
    }

    private static func datePart(_ v: String?) -> String? {
        guard let d = v?.split(separator: "T", maxSplits: 1, omittingEmptySubsequences: false).first.map(String.init), d.count == 10 else { return nil }
        return d
    }

    private static func timePart(_ v: String?) -> String? {
        guard let v, let i = v.firstIndex(of: "T") else { return nil }
        let t = String(v[v.index(after: i)...])
        return t.isEmpty ? nil : t
    }

    private func emit() {
        let joined: String? = ZCDates.isIsoDate(date) && time.map(ZCDates.isValidHm) == true ? "\(date)T\(time!)" : nil
        emitted = joined
        value.wrappedValue = joined
    }

    public var body: some View {
        let c = theme.colors
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 0) {
                Text(label).font(.zc(ZCType.bodySm, theme: theme).weight(.medium)).foregroundStyle(c.text)
                if required { Text(" *").font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.dangerFg).accessibilityHidden(true) }
            }
            .accessibilityAddTraits(.isHeader)
            HStack(alignment: .top, spacing: 12) {
                ZCDateField(ZCString.text("ui.fecha"), iso: Binding(get: { date }, set: { date = $0; emit() }), min: minDate, max: maxDate)
                ZCTimeField(ZCString.text("ui.hora"), value: Binding(get: { time }, set: { time = $0; emit() }))
                    .frame(maxWidth: 140)
            }
            if let error {
                HStack(spacing: 6) {
                    ZCIcon(.sDangerCircle, size: 16).foregroundStyle(c.dangerFg)
                    Text(error).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.dangerFg)
                }
            } else if let hint {
                Text(hint).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
        // Un valor distinto que llega de afuera reemplaza las dos partes; lo que este campo mismo emitió no (así no pierde la parte ya elegida).
        .onChange(of: value.wrappedValue) { _, new in
            guard new != emitted else { return }
            emitted = new
            date = Self.datePart(new) ?? ""
            time = Self.timePart(new)
        }
    }
}
