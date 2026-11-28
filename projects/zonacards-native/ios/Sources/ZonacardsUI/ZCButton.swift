import SwiftUI
import ZonacardsTokens

/// Variantes del botón. Una sola acción principal (`primary`) por vista.
public enum ZCButtonVariant: Sendable { case primary, secondary, outline, ghost, danger, dangerSoft, link }

/// Tamaño visual: `md` 56 pt, `sm` 44 pt. El área de toque nunca baja de 44 pt.
public enum ZCButtonSize: Sendable { case md, sm }

private struct ZCButtonColors {
    let bg: Color
    let fg: Color
    let border: Color?
}

/// Botón con etiqueta de verbo y objeto ("Crear lote"). `loading` lo deja ocupado y lo anuncia; se aprieta con resorte al presionar
/// (un fundido corto con "Reducir movimiento"). Forma de `theme.shape.button`.
public struct ZCButton: View {
    private let title: String
    private let variant: ZCButtonVariant
    private let size: ZCButtonSize
    private let leadingIcon: ZCIconName?
    private let trailingIcon: ZCIconName?
    private let loading: Bool
    private let block: Bool
    private let action: () -> Void

    public init(
        _ title: String,
        variant: ZCButtonVariant = .primary,
        size: ZCButtonSize = .md,
        leadingIcon: ZCIconName? = nil,
        trailingIcon: ZCIconName? = nil,
        loading: Bool = false,
        block: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.variant = variant
        self.size = size
        self.leadingIcon = leadingIcon
        self.trailingIcon = trailingIcon
        self.loading = loading
        self.block = block
        self.action = action
    }

    public var body: some View {
        // El estilo dibuja todo el contenido; ocupado no se deshabilita (no se atenúa), solo ignora el toque.
        Button(action: { if !loading { action() } }) { EmptyView() }
            .buttonStyle(ZCButtonStyle(title: title, variant: variant, size: size, leadingIcon: leadingIcon, trailingIcon: trailingIcon, loading: loading, block: block))
    }
}

struct ZCButtonStyle: ButtonStyle {
    let title: String
    let variant: ZCButtonVariant
    let size: ZCButtonSize
    let leadingIcon: ZCIconName?
    let trailingIcon: ZCIconName?
    let loading: Bool
    let block: Bool

    func makeBody(configuration: Configuration) -> some View {
        ZCButtonBody(configuration: configuration, style: self)
    }
}

private struct ZCButtonBody: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.zcOnPrimary) private var onPrimary
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let configuration: ButtonStyleConfiguration
    let style: ZCButtonStyle

    private var colors: ZCButtonColors {
        let c = theme.colors
        let onDanger: Color = theme.isDark ? .black : .white
        if onPrimary {
            switch style.variant {
            case .primary: return ZCButtonColors(bg: c.onPrimary, fg: c.primary, border: nil)
            case .outline: return ZCButtonColors(bg: .clear, fg: c.onPrimary, border: c.onPrimary.opacity(0.5))
            case .secondary, .ghost, .link: return ZCButtonColors(bg: .clear, fg: c.onPrimary, border: nil)
            case .danger: return ZCButtonColors(bg: c.dangerFg, fg: onDanger, border: nil)
            case .dangerSoft: return ZCButtonColors(bg: c.dangerBg, fg: c.dangerFg, border: c.dangerBd)
            }
        }
        switch style.variant {
        case .primary: return ZCButtonColors(bg: c.primary, fg: c.onPrimary, border: nil)
        case .secondary: return ZCButtonColors(bg: c.secondary, fg: c.onSecondary, border: nil)
        case .outline: return ZCButtonColors(bg: c.surface, fg: c.text, border: c.borderStrong)
        case .ghost: return ZCButtonColors(bg: .clear, fg: c.text, border: nil)
        case .danger: return ZCButtonColors(bg: c.dangerFg, fg: onDanger, border: nil)
        case .dangerSoft: return ZCButtonColors(bg: c.dangerBg, fg: c.dangerFg, border: c.dangerBd)
        case .link: return ZCButtonColors(bg: .clear, fg: c.text, border: nil)
        }
    }

    var body: some View {
        let colors = self.colors
        let isLink = style.variant == .link
        let pressed = configuration.isPressed && isEnabled && !style.loading && !isLink
        let height = style.size == .md ? ZCSize.target : ZCSize.targetSm
        // Con radio de pastilla (9999) el borde de un rectángulo redondeado "continuo" se dibuja con tramos rectos: se limita a la mitad del alto.
        let shape = RoundedRectangle(cornerRadius: isLink ? 0 : min(theme.shape.button, height / 2), style: .continuous)
        HStack(spacing: ZCSpace.v2) {
            if style.loading {
                ZCSpinner(size: 18, color: colors.fg, decorative: true)
            } else if let icon = style.leadingIcon {
                ZCIcon(icon, size: 20)
            }
            Text(style.title)
                .font(.zc(style.size == .md ? ZCType.body : ZCType.bodySm, theme: theme).weight(ZCWeight.medium))
                .underline(isLink)
                .lineLimit(1)
            if let icon = style.trailingIcon, !style.loading {
                ZCIcon(icon, size: 20)
            }
        }
        .foregroundStyle(colors.fg)
        .padding(.horizontal, isLink ? 0 : (style.size == .md ? 20 : 16))
        .frame(minHeight: isLink ? ZCSize.targetSm : height, maxHeight: isLink ? nil : height)
        .frame(maxWidth: style.block ? .infinity : nil)
        .background(colors.bg, in: shape)
        .overlay { if let border = colors.border { shape.stroke(border, lineWidth: 1) } }
        .opacity(isEnabled ? 1 : ZCOpacity.disabled)
        .scaleEffect(pressed ? ZCScale.pressed : 1)
        .animation(reduceMotion ? .easeOut(duration: ZCMotion.fast) : .spring(response: 0.3, dampingFraction: 0.55), value: pressed)
        .frame(minWidth: ZCSize.targetSm, minHeight: ZCSize.targetSm)
        .contentShape(Rectangle())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(style.title)
        .accessibilityValue(style.loading ? ZCString.text("ui.cargando") : "")
        .accessibilityAddTraits(.isButton)
    }
}

/// Botón de solo ícono: `label` es obligatorio (lo lee VoiceOver). 44 pt visual con `small`, 48 pt por defecto.
public struct ZCIconButton: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.zcOnPrimary) private var onPrimary
    @Environment(\.isEnabled) private var isEnabled
    private let icon: ZCIconName
    private let label: String
    private let variant: ZCButtonVariant
    private let small: Bool
    private let action: () -> Void

    public init(_ icon: ZCIconName, label: String, variant: ZCButtonVariant = .ghost, small: Bool = false, action: @escaping () -> Void) {
        self.icon = icon
        self.label = label
        self.variant = variant
        self.small = small
        self.action = action
    }

    public var body: some View {
        let c = theme.colors
        let fg: Color = onPrimary ? c.onPrimary : (variant == .primary ? c.onPrimary : (variant == .danger || variant == .dangerSoft ? c.dangerFg : c.text))
        let bg: Color = onPrimary ? .clear : (variant == .primary ? c.primary : (variant == .dangerSoft ? c.dangerBg : (variant == .secondary ? c.secondary : .clear)))
        let side = small ? ZCSize.targetSm : ZCSize.iconBtn
        Button(action: action) {
            ZCIcon(icon, size: 20)
                .foregroundStyle(fg)
                .frame(width: side, height: side)
                .background(bg, in: RoundedRectangle(cornerRadius: theme.shape.button, style: .continuous))
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .opacity(isEnabled ? 1 : ZCOpacity.disabled)
        .accessibilityLabel(label)
    }
}
