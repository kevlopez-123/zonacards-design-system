import SwiftUI
import ZonacardsTokens

/// Una opción de un select. `description` es una segunda línea opcional.
public struct ZCOption<Value: Hashable>: Identifiable {
    public var id: Value { value }
    public let value: Value
    public let label: String
    public let description: String?
    public let enabled: Bool

    public init(_ value: Value, label: String, description: String? = nil, enabled: Bool = true) {
        self.value = value
        self.label = label
        self.description = description
        self.enabled = enabled
    }
}

private func zcFold(_ s: String) -> String { s.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: nil) }

/// Hoja de opciones con la lista propia del sistema (nunca `Menu` ni `Picker` con su estilo). Búsqueda desde 9 opciones.
/// Con `multiple`, filas con casilla y pie "Limpiar" y "Listo" a la derecha, sin conteo.
struct ZCOptionSheet<Value: Hashable>: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""
    let title: String
    let options: [ZCOption<Value>]
    let multiple: Bool
    @Binding var selected: Set<Value>

    private var visible: [ZCOption<Value>] {
        let q = zcFold(query.trimmingCharacters(in: .whitespaces))
        return q.isEmpty ? options : options.filter { zcFold($0.label).contains(q) || zcFold($0.description ?? "").contains(q) }
    }

    var body: some View {
        let c = theme.colors
        VStack(spacing: 0) {
            HStack {
                Text(title).font(.zc(ZCType.titleSm, theme: theme)).foregroundStyle(c.text).frame(maxWidth: .infinity, alignment: .leading)
                ZCIconButton(.lX, label: ZCString.text("ui.cerrar"), small: true) { dismiss() }
            }
            .padding(.horizontal, ZCSpace.v4)
            .padding(.top, ZCSpace.v3)
            if options.count >= 9 {
                ZCSearchField(query: $query, label: ZCString.text("ui.buscarOpcion")).padding(.horizontal, ZCSpace.v4).padding(.top, ZCSpace.v2)
            }
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(visible) { option in
                        row(option)
                    }
                    if visible.isEmpty {
                        Text(ZCString.text("ui.sinResultados", query)).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.textMuted).padding(ZCSpace.v6)
                    }
                }
                .padding(.vertical, ZCSpace.v2)
            }
            if multiple {
                ZCDivider()
                HStack(spacing: ZCSpace.v3) {
                    Spacer()
                    ZCButton(ZCString.text("ui.limpiar"), variant: .outline, size: .sm) { selected = [] }
                    ZCButton(ZCString.text("ui.listo"), size: .sm) { dismiss() }
                }
                .padding(ZCSpace.v4)
            }
        }
        .background(c.surface)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .presentationBackground(c.surface)
        .presentationCornerRadius(theme.shape.sheet)
        .preferredColorScheme(theme.isDark ? .dark : .light)
    }

    private func row(_ option: ZCOption<Value>) -> some View {
        let c = theme.colors
        let on = selected.contains(option.value)
        return Button {
            if multiple {
                if on { selected.remove(option.value) } else { selected.insert(option.value) }
            } else {
                selected = [option.value]
                dismiss()
            }
        } label: {
            HStack(spacing: ZCSpace.v3) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(option.label).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.text)
                    if let d = option.description { Text(d).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted) }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                if on { ZCIcon(.sCheckCircle, size: 20).foregroundStyle(c.primary) }
            }
            .padding(.horizontal, ZCSpace.v4)
            .frame(minHeight: ZCSize.targetSm)
            .background(on ? c.surface2 : .clear)   // opción activa: solo surface2, sin bordes ni barras
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!option.enabled)
        .opacity(option.enabled ? 1 : 0.45)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(option.label)
        .accessibilityValue(option.description ?? "")
        .accessibilityAddTraits(on ? [.isButton, .isSelected] : [.isButton])
    }
}

/// Disparador de un select: caja del campo con el valor (o el texto de ayuda) y la flecha a la derecha, que abre la hoja.
struct ZCSelectTrigger: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    let name: String
    let valueText: String?
    let placeholder: String
    let icon: ZCIconName
    let invalid: Bool
    let action: () -> Void

    var body: some View {
        let c = theme.colors
        Button(action: action) {
            HStack(spacing: ZCSpace.v2) {
                Text(valueText ?? placeholder)
                    .font(.zc(ZCType.body, theme: theme))
                    .foregroundStyle(valueText == nil ? c.textSubtle : c.text)
                    .lineLimit(1)
                    .frame(maxWidth: .infinity, alignment: .leading)
                ZCIcon(icon, size: 20).foregroundStyle(c.textMuted)
            }
            .padding(.horizontal, ZCSpace.v4)
            .frame(minHeight: theme.shape.fieldH)
            .zcControlBox(invalid: invalid, disabled: !isEnabled)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(name)
        .accessibilityValue(valueText ?? "")
        .accessibilityAddTraits(.isButton)
    }
}

/// Select de una opción: el valor se elige en una hoja propia (no hay `Picker` del sistema).
public struct ZCSelect<Value: Hashable>: View {
    @State private var open = false
    private let label: String
    private let options: [ZCOption<Value>]
    private let selection: Binding<Value?>
    private let placeholder: String?
    private let hint: String?
    private let error: String?
    private let required: Bool
    private let optional: Bool
    private let info: String?

    public init(_ label: String, options: [ZCOption<Value>], selection: Binding<Value?>, placeholder: String? = nil, hint: String? = nil, error: String? = nil, required: Bool = false, optional: Bool = false, info: String? = nil) {
        self.label = label
        self.options = options
        self.selection = selection
        self.placeholder = placeholder
        self.hint = hint
        self.error = error
        self.required = required
        self.optional = optional
        self.info = info
    }

    private var set: Binding<Set<Value>> {
        Binding(get: { selection.wrappedValue.map { [$0] } ?? [] }, set: { selection.wrappedValue = $0.first })
    }

    public var body: some View {
        let current = options.first { $0.value == selection.wrappedValue }?.label
        ZCField(label, required: required, optional: optional, hint: hint, error: error, info: info) {
            ZCSelectTrigger(name: zcFieldName(label, required: required), valueText: current, placeholder: placeholder ?? ZCString.text("ui.selecciona"), icon: .sAltArrowDown, invalid: error != nil) { open = true }
        }
        .sheet(isPresented: $open) {
            ZCOptionSheet(title: label, options: options, multiple: false, selected: set)
        }
    }
}

/// Select de varias opciones: filas con casilla y pie "Limpiar" y "Listo". El campo muestra la opción o "n seleccionados".
public struct ZCMultiSelect<Value: Hashable>: View {
    @State private var open = false
    private let label: String
    private let options: [ZCOption<Value>]
    private let selection: Binding<Set<Value>>
    private let placeholder: String?
    private let hint: String?
    private let error: String?
    private let required: Bool
    private let optional: Bool

    public init(_ label: String, options: [ZCOption<Value>], selection: Binding<Set<Value>>, placeholder: String? = nil, hint: String? = nil, error: String? = nil, required: Bool = false, optional: Bool = false) {
        self.label = label
        self.options = options
        self.selection = selection
        self.placeholder = placeholder
        self.hint = hint
        self.error = error
        self.required = required
        self.optional = optional
    }

    public var body: some View {
        let chosen = options.filter { selection.wrappedValue.contains($0.value) }
        let text: String? = chosen.isEmpty ? nil : (chosen.count == 1 ? chosen[0].label : ZCString.text("ui.nSeleccionados", chosen.count))
        ZCField(label, required: required, optional: optional, hint: hint, error: error) {
            ZCSelectTrigger(name: zcFieldName(label, required: required), valueText: text, placeholder: placeholder ?? ZCString.text("ui.selecciona"), icon: .sAltArrowDown, invalid: error != nil) { open = true }
        }
        .sheet(isPresented: $open) {
            ZCOptionSheet(title: label, options: options, multiple: true, selected: selection)
        }
    }
}

// MARK: - Fecha

private let zcCalendar = Calendar(identifier: .gregorian)

func zcDate(fromIso iso: String) -> Date {
    let p = iso.split(separator: "-").compactMap { Int($0) }
    guard p.count == 3 else { return Date() }
    return zcCalendar.date(from: DateComponents(year: p[0], month: p[1], day: p[2], hour: 12)) ?? Date()
}

func zcIso(from date: Date) -> String {
    let c = zcCalendar.dateComponents([.year, .month, .day], from: date)
    return String(format: "%04d-%02d-%02d", c.year ?? 1970, c.month ?? 1, c.day ?? 1)
}

/// Fecha de calendario como texto ISO `aaaa-mm-dd` (nunca con hora). Se muestra como dd/mm/aaaa y se elige en una hoja con el calendario del sistema.
public struct ZCDateField: View {
    @Environment(\.zcTheme) private var theme
    @State private var open = false
    private let label: String
    private let iso: Binding<String>
    private let min: String?
    private let max: String?
    private let hint: String?
    private let error: String?
    private let required: Bool
    private let optional: Bool

    public init(_ label: String, iso: Binding<String>, min: String? = nil, max: String? = nil, hint: String? = nil, error: String? = nil, required: Bool = false, optional: Bool = false) {
        self.label = label
        self.iso = iso
        self.min = min
        self.max = max
        self.hint = hint
        self.error = error
        self.required = required
        self.optional = optional
    }

    private var range: ClosedRange<Date> {
        let lower = min.map(zcDate(fromIso:)) ?? Date.distantPast
        let upper = max.map(zcDate(fromIso:)) ?? Date.distantFuture
        return lower...Swift.max(lower, upper)
    }

    private var pick: Binding<Date> {
        Binding(
            get: { ZCDates.isIsoDate(iso.wrappedValue) ? zcDate(fromIso: iso.wrappedValue) : zcDate(fromIso: ZCDates.todayIso()) },
            set: { iso.wrappedValue = zcIso(from: $0) }
        )
    }

    public var body: some View {
        let value = ZCDates.isIsoDate(iso.wrappedValue) ? ZCDates.formatDmy(iso.wrappedValue) : nil
        ZCField(label, required: required, optional: optional, hint: hint, error: error) {
            ZCSelectTrigger(name: zcFieldName(label, required: required), valueText: value, placeholder: "dd/mm/aaaa", icon: .sCalendar, invalid: error != nil) { open = true }
        }
        .sheet(isPresented: $open) {
            VStack(spacing: ZCSpace.v2) {
                HStack {
                    Text(label).font(.zc(ZCType.titleSm, theme: theme)).foregroundStyle(theme.colors.text).frame(maxWidth: .infinity, alignment: .leading)
                    ZCIconButton(.lX, label: ZCString.text("ui.cerrar"), small: true) { open = false }
                }
                DatePicker(label, selection: pick, in: range, displayedComponents: .date)
                    .datePickerStyle(.graphical)
                    .labelsHidden()
                    .tint(theme.colors.primary)
                HStack {
                    Spacer()
                    ZCButton(ZCString.text("ui.listo"), size: .sm) { open = false }
                }
            }
            .padding(ZCSpace.v4)
            .background(theme.colors.surface)
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
            .presentationBackground(theme.colors.surface)
            .presentationCornerRadius(theme.shape.sheet)
            .preferredColorScheme(theme.isDark ? .dark : .light)
        }
    }
}
