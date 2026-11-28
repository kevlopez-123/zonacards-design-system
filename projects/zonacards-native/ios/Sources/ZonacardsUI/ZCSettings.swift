import SwiftUI
import ZonacardsTokens

/// Una fila de ajustes (equivale a ItemCard, CellSwitch y CellSelect de HeroUI): ícono, título, descripción y, al final, lo que dice qué hace tocarla:
/// - `isOn`: un interruptor; toda la fila alterna y VoiceOver la anuncia como interruptor con su estado.
/// - `action`: abre algo (otra pantalla, un selector); lleva una flecha y, si hay, el `value` actual ("Español").
/// - Solo `value` (o `trailing`): informativa, sin acción.
/// `danger` pinta el texto de peligro (cerrar sesión, eliminar). `trailing` reemplaza lo que va al final.
public struct ZCSettingsItem {
    public let title: String
    public let description: String?
    public let icon: ZCIconName?
    public let value: String?
    public let isOn: Binding<Bool>?
    public let enabled: Bool
    public let danger: Bool
    public let trailing: AnyView?
    public let action: (() -> Void)?

    public init(_ title: String, description: String? = nil, icon: ZCIconName? = nil, value: String? = nil, isOn: Binding<Bool>? = nil, enabled: Bool = true,
                danger: Bool = false, trailing: AnyView? = nil, action: (() -> Void)? = nil) {
        self.title = title
        self.description = description
        self.icon = icon
        self.value = value
        self.isOn = isOn
        self.enabled = enabled
        self.danger = danger
        self.trailing = trailing
        self.action = action
    }
}

/// El dibujo del interruptor (pista y pulgar), sin comportamiento: la fila alterna al tocarla.
private struct ZCSwitchTrack: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let on: Bool

    var body: some View {
        let c = theme.colors
        ZStack(alignment: on ? .trailing : .leading) {
            Capsule().fill(on ? c.successFg : c.borderStrong)
            Circle().fill(c.thumb).frame(width: 24, height: 24).shadow(color: .black.opacity(0.2), radius: 1, y: 1).padding(2)
        }
        .frame(width: 48, height: 28)
        .animation(reduceMotion ? nil : .easeOut(duration: ZCMotion.base), value: on)
        .accessibilityHidden(true)
    }
}

/// Una fila de ajustes sola (dentro de un `ZCSettingsGroup` se dibujan con sus separadores). Alto mínimo de 56 pt.
public struct ZCSettingsRow: View {
    @Environment(\.zcTheme) private var theme
    private let item: ZCSettingsItem

    public init(_ item: ZCSettingsItem) { self.item = item }

    private var rowContent: some View {
        let c = theme.colors
        return HStack(spacing: ZCSpace.v3) {
            if let icon = item.icon {
                ZCIcon(icon, size: 20).foregroundStyle(item.danger ? c.dangerFg : c.text)
                    .frame(width: 40, height: 40)
                    .background(c.surface2, in: RoundedRectangle(cornerRadius: ZCRadius.ms, style: .continuous))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(item.title).font(.zc(ZCType.body, theme: theme)).foregroundStyle(item.danger ? c.dangerFg : c.text)
                if let d = item.description { Text(d).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted) }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            if let trailing = item.trailing {
                trailing
            } else if let isOn = item.isOn {
                ZCSwitchTrack(on: isOn.wrappedValue)
            } else {
                if let v = item.value { Text(v).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.textMuted) }
                if item.action != nil { ZCIcon(.sAltArrowRight, size: 16).foregroundStyle(c.textMuted) }
            }
        }
        .padding(.horizontal, ZCSpace.v4)
        .padding(.vertical, ZCSpace.v2)
        .frame(minHeight: 56)
        .contentShape(Rectangle())
    }

    private var traits: AccessibilityTraits {
        var t: AccessibilityTraits = []
        if item.isOn != nil { t.insert(.isToggle) } else if item.action != nil { t.insert(.isButton) }
        if item.isOn?.wrappedValue == true { t.insert(.isSelected) }
        return t
    }

    public var body: some View {
        Group {
            if let isOn = item.isOn {
                Button { isOn.wrappedValue.toggle() } label: { rowContent }.buttonStyle(.plain)
            } else if let action = item.action {
                Button(action: action) { rowContent }.buttonStyle(.plain)
            } else {
                rowContent
            }
        }
        .disabled(!item.enabled)
        .opacity(item.enabled ? 1 : 0.45)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(item.title)
        // El valor actual se lee tras el título ("Idioma, Español"); la descripción, como ayuda.
        .accessibilityValue(item.value ?? "")
        .accessibilityHint(item.description ?? "")
        .accessibilityAddTraits(traits)
    }
}

/// Un grupo de filas de ajustes en una tarjeta, con separadores entre ellas, un encabezado opcional arriba y un texto de ayuda opcional abajo
/// (equivale a un grupo de ItemCard de HeroUI). El encabezado se anuncia como título de sección.
public struct ZCSettingsGroup: View {
    @Environment(\.zcTheme) private var theme
    private let items: [ZCSettingsItem]
    private let header: String?
    private let footer: String?

    public init(_ items: [ZCSettingsItem], header: String? = nil, footer: String? = nil) {
        self.items = items
        self.header = header
        self.footer = footer
    }

    public var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous)
        VStack(alignment: .leading, spacing: 8) {
            if let header {
                Text(header).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.textMuted).padding(.horizontal, 4).accessibilityAddTraits(.isHeader)
            }
            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                    if i > 0 { ZCDivider().padding(.leading, item.icon != nil ? 68 : 16) }
                    ZCSettingsRow(item)
                }
            }
            .background(c.surface, in: shape)
            .clipShape(shape)
            .overlay(shape.stroke(c.border))
            if let footer {
                Text(footer).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted).padding(.horizontal, 4)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
