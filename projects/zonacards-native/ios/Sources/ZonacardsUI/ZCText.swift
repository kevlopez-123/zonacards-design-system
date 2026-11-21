import SwiftUI
import ZonacardsTokens

/// Texto con la escala tipográfica del sistema (escala con Dynamic Type) y un tono semántico. No uses `Text` con colores ni fuentes fijas.
public struct ZCText: View {
    /// Color semántico del texto.
    public enum Tone: Sendable { case normal, muted, danger, onPrimary }

    @Environment(\.zcTheme) private var theme
    private let text: String
    private let style: ZCTypeStyle
    private let tone: Tone

    public init(_ text: String, style: ZCTypeStyle = ZCType.body, tone: Tone = .normal) {
        self.text = text
        self.style = style
        self.tone = tone
    }

    private var color: Color {
        switch tone {
        case .normal: return theme.colors.text
        case .muted: return theme.colors.textMuted
        case .danger: return theme.colors.dangerFg
        case .onPrimary: return theme.colors.onPrimary
        }
    }

    public var body: some View {
        Text(text)
            .font(.zc(style, theme: theme))
            .lineSpacing(max(0, style.lineHeight - style.size))
            .foregroundStyle(color)
            .fixedSize(horizontal: false, vertical: true)
    }
}
