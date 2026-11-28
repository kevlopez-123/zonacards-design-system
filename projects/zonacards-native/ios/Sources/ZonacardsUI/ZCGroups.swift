import SwiftUI
import ZonacardsTokens

/// Una opción de `ZCCheckboxGroup`.
public struct ZCCheckboxOption: Identifiable, Sendable {
    public var id: String { value }
    public let value: String
    public let label: String
    public let description: String?
    public let enabled: Bool

    public init(_ value: String, label: String, description: String? = nil, enabled: Bool = true) {
        self.value = value
        self.label = label
        self.description = description
        self.enabled = enabled
    }
}

/// Varias casillas con una sola etiqueta (equivale a `zc-checkbox-group`): el grupo se anuncia con su nombre, y el error o la ayuda quedan debajo.
/// `selection` es el conjunto de valores marcados. Con `selectAllLabel` aparece arriba "Seleccionar todo", que queda a medias cuando hay algunas
/// marcadas y no cambia las opciones deshabilitadas.
public struct ZCCheckboxGroup: View {
    @Environment(\.zcTheme) private var theme
    private let label: String
    private let options: [ZCCheckboxOption]
    private let selection: Binding<Set<String>>
    private let hint: String?
    private let error: String?
    private let required: Bool
    private let horizontal: Bool
    private let selectAllLabel: String?

    public init(_ label: String, options: [ZCCheckboxOption], selection: Binding<Set<String>>, hint: String? = nil, error: String? = nil,
                required: Bool = false, horizontal: Bool = false, selectAllLabel: String? = nil) {
        self.label = label
        self.options = options
        self.selection = selection
        self.hint = hint
        self.error = error
        self.required = required
        self.horizontal = horizontal
        self.selectAllLabel = selectAllLabel
    }

    private var changeable: [String] { options.filter(\.enabled).map(\.value) }
    private var allOn: Bool { !changeable.isEmpty && changeable.allSatisfy { selection.wrappedValue.contains($0) } }
    private var someOn: Bool { !allOn && changeable.contains { selection.wrappedValue.contains($0) } }

    private func toggleAll() {
        if allOn { selection.wrappedValue.subtract(changeable) } else { selection.wrappedValue.formUnion(changeable) }
    }

    private func toggle(_ value: String) {
        if selection.wrappedValue.contains(value) { selection.wrappedValue.remove(value) } else { selection.wrappedValue.insert(value) }
    }

    @ViewBuilder private var rows: some View {
        if let selectAllLabel {
            ZCCheckbox(state: allOn ? .on : (someOn ? .mixed : .off), label: selectAllLabel, action: toggleAll)
                .disabled(changeable.isEmpty)
        }
        ForEach(options) { o in
            ZCCheckbox(state: selection.wrappedValue.contains(o.value) ? .on : .off, label: o.label, description: o.description, invalid: error != nil) { toggle(o.value) }
                .disabled(!o.enabled)
        }
    }

    public var body: some View {
        let c = theme.colors
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 0) {
                Text(label).font(.zc(ZCType.bodySm, theme: theme).weight(ZCWeight.medium)).foregroundStyle(c.text)
                if required { Text(" *").font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.dangerFg).accessibilityHidden(true) }
            }
            .accessibilityAddTraits(.isHeader)
            if horizontal {
                HStack(spacing: 16) { rows }
            } else {
                VStack(alignment: .leading, spacing: 4) { rows }
            }
            if let error {
                HStack(spacing: 6) {
                    ZCIcon(.sDangerCircle, size: ZCSize.iconSm).foregroundStyle(c.dangerFg)
                    Text(error).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.dangerFg)
                }
            } else if let hint {
                Text(hint).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }
}

/// Agrupa campos relacionados con una leyenda que VoiceOver anuncia como título del grupo (equivale a `zc-fieldset`). `bordered` lo dibuja como
/// una tarjeta suave. 16 pt entre la leyenda y cada campo.
public struct ZCFieldset<Content: View>: View {
    @Environment(\.zcTheme) private var theme
    private let legend: String
    private let description: String?
    private let bordered: Bool
    private let content: Content

    public init(_ legend: String, description: String? = nil, bordered: Bool = false, @ViewBuilder content: () -> Content) {
        self.legend = legend
        self.description = description
        self.bordered = bordered
        self.content = content()
    }

    public var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous)
        let inner = VStack(alignment: .leading, spacing: 16) {
            Text(legend).font(.zc(ZCType.bodySm, theme: theme).weight(ZCWeight.medium)).foregroundStyle(c.text).accessibilityAddTraits(.isHeader)
            if let description { Text(description).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted) }
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(legend)
        if bordered {
            inner.padding(ZCSpace.v4).background(c.surface, in: shape).overlay(shape.stroke(c.border))
        } else {
            inner
        }
    }
}
