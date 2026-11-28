import SwiftUI
import ZonacardsTokens

/// Badge de estado: tono y texto (y un ícono opcional). Alto de 28 pt.
public struct ZCBadge: View {
    @Environment(\.zcTheme) private var theme
    private let text: String
    private let tone: ZCTone
    private let icon: ZCIconName?

    public init(_ text: String, tone: ZCTone = .neutral, icon: ZCIconName? = nil) {
        self.text = text
        self.tone = tone
        self.icon = icon
    }

    public var body: some View {
        let t = theme.tone(tone)
        HStack(spacing: 6) {
            if let icon { ZCIcon(icon, size: 16) }
            Text(text).font(.zc(ZCType.caption, theme: theme).weight(.medium)).lineLimit(1)
        }
        .foregroundStyle(t.fg)
        .padding(.leading, icon != nil ? 8 : 10)
        .padding(.trailing, 10)
        .frame(height: 28)
        .background(t.bg, in: Capsule())
        .overlay(Capsule().stroke(t.border, lineWidth: 1))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(text)
    }
}

/// Tamaño del avatar: 32, 40 o 56 pt.
public enum ZCAvatarSize: Sendable {
    case sm, md, lg
    var side: CGFloat { switch self { case .sm: return 32; case .md: return 40; case .lg: return 56 } }
    var text: CGFloat { switch self { case .sm: return 12; case .md: return 14; case .lg: return 18 } }
    var dot: CGFloat { switch self { case .sm: return 10; case .md: return 12; case .lg: return 14 } }
}

/// Iniciales: primera letra de las dos primeras palabras ("Lucía Mendoza" → "LM").
public func zcInitials(_ name: String) -> String {
    name.split(whereSeparator: { $0.isWhitespace }).prefix(2).compactMap { $0.first.map { String($0).uppercased() } }.joined()
}

/// Avatar con foto (`image`) o iniciales sobre `surface3`. `square` para empresas. `presence` agrega el punto verde y "En línea" al nombre que lee VoiceOver.
public struct ZCAvatar: View {
    @Environment(\.zcTheme) private var theme
    private let name: String
    private let size: ZCAvatarSize
    private let brand: Bool
    private let image: Image?
    private let square: Bool
    private let presence: Bool
    private let initials: String?

    public init(_ name: String, size: ZCAvatarSize = .md, brand: Bool = false, image: Image? = nil, square: Bool = false, presence: Bool = false, initials: String? = nil) {
        self.name = name
        self.size = size
        self.brand = brand
        self.image = image
        self.square = square
        self.presence = presence
        self.initials = initials
    }

    public var body: some View {
        let c = theme.colors
        let side = size.side
        ZStack(alignment: .bottomTrailing) {
            ZStack {
                (brand ? c.secondary : c.surface3)
                if let image {
                    image.resizable().scaledToFill()
                } else {
                    Text(initials ?? zcInitials(name))
                        .font(.zc(ZCTypeStyle(size: size.text, lineHeight: size.text * 1.4, relativeTo: .caption), theme: theme).weight(.semibold))
                        .foregroundStyle(brand ? c.onSecondary : c.text)
                }
            }
            .frame(width: side, height: side)
            .clipShape(square ? AnyShape(RoundedRectangle(cornerRadius: ZCRadius.ms, style: .continuous)) : AnyShape(Circle()))
            if presence {
                Circle().fill(c.successFg).frame(width: size.dot - 4, height: size.dot - 4)
                    .padding(2).background(c.surface, in: Circle())
            }
        }
        .frame(width: side, height: side)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(presence ? "\(name), \(ZCString.text("ui.enLinea"))" : name)
    }
}

/// Grupo de avatares superpuestos con "+N" si hay más de `max`. VoiceOver lee `label` una sola vez.
public struct ZCAvatarGroup: View {
    @Environment(\.zcTheme) private var theme
    private let names: [String]
    private let label: String
    private let size: ZCAvatarSize
    private let max: Int

    public init(names: [String], label: String, size: ZCAvatarSize = .sm, max: Int = 4) {
        self.names = names
        self.label = label
        self.size = size
        self.max = max
    }

    public var body: some View {
        let c = theme.colors
        let shown = Array(names.prefix(max))
        let extra = names.count - shown.count
        HStack(spacing: -(size.side / 4)) {
            ForEach(Array(shown.enumerated()), id: \.offset) { _, n in
                ZCAvatar(n, size: size).padding(2).background(c.surface, in: Circle())
            }
            if extra > 0 {
                Text("+\(extra)")
                    .font(.zc(ZCType.caption, theme: theme).weight(.semibold))
                    .foregroundStyle(c.text)
                    .frame(width: size.side, height: size.side)
                    .background(c.surface2, in: Circle())
                    .padding(2).background(c.surface, in: Circle())
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
    }
}

/// Chip: etiqueta (solo lectura), seleccionable (filtros, con `selected`) o con "Quitar" (`onRemove`). Alto visual de 32 pt, toque de 44 pt.
/// `invalid` lo marca como no válido con texto para VoiceOver, no solo con color.
public struct ZCChip: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    private let label: String
    private let selected: Binding<Bool>?
    private let onRemove: (() -> Void)?
    private let invalid: Bool
    private let icon: ZCIconName?

    public init(_ label: String, selected: Binding<Bool>? = nil, onRemove: (() -> Void)? = nil, invalid: Bool = false, icon: ZCIconName? = nil) {
        self.label = label
        self.selected = selected
        self.onRemove = onRemove
        self.invalid = invalid
        self.icon = icon
    }

    private func traits(on: Bool) -> AccessibilityTraits {
        if selected == nil { return [] }
        return on ? [.isButton, .isSelected] : [.isButton]
    }

    public var body: some View {
        let c = theme.colors
        let on = selected?.wrappedValue == true
        let (bg, fg, bd): (Color, Color, Color) = invalid ? (c.dangerBg, c.dangerFg, c.dangerBd) : (on ? (c.primary, c.onPrimary, c.primary) : (c.surface2, c.text, c.border))
        HStack(spacing: 0) {
            HStack(spacing: 6) {
                if let icon, !invalid, selected == nil { ZCIcon(icon, size: 16) }
                Text(label).font(.zc(ZCType.caption, theme: theme)).lineLimit(1)
            }
            .padding(.leading, 12)
            .padding(.trailing, onRemove == nil ? 12 : 4)
            if let onRemove {
                Button(action: onRemove) {
                    ZCIcon(.lX, size: 16).frame(width: ZCSize.targetSm, height: ZCSize.targetSm).contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(ZCString.text("ui.quitar", label))
            }
        }
        .foregroundStyle(fg)
        .frame(height: 32)
        .background(bg, in: Capsule())
        .overlay(Capsule().stroke(bd, lineWidth: 1))
        .opacity(isEnabled ? 1 : ZCOpacity.disabled)
        .frame(minHeight: ZCSize.targetSm)
        .contentShape(Rectangle())
        .onTapGesture { if let selected, isEnabled { selected.wrappedValue.toggle() } }
        .accessibilityElement(children: onRemove == nil ? .ignore : .contain)
        .accessibilityLabel(invalid ? "\(ZCString.text("ui.invalido")): \(label)" : label)
        .accessibilityAddTraits(traits(on: on))
    }
}

/// Separador de 1 pt con el color de borde. Decorativo por defecto.
public struct ZCDivider: View {
    @Environment(\.zcTheme) private var theme
    private let vertical: Bool
    private let decorative: Bool

    public init(vertical: Bool = false, decorative: Bool = true) {
        self.vertical = vertical
        self.decorative = decorative
    }

    public var body: some View {
        let line = Rectangle().fill(theme.colors.border)
        Group {
            if vertical { line.frame(width: 1) } else { line.frame(height: 1) }
        }
        .accessibilityHidden(decorative)
    }
}
