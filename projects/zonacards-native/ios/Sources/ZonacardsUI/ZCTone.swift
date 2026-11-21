import SwiftUI
import ZonacardsTokens

/// Tono semántico de estados y badges: siempre con ícono y texto, nunca solo color.
public enum ZCTone: String, CaseIterable, Sendable {
    case success, warning, danger, info, accent, neutral
}

struct ZCToneColors {
    let bg: Color
    let fg: Color
    let border: Color
}

extension ZCTheme {
    func tone(_ tone: ZCTone) -> ZCToneColors {
        let c = colors
        switch tone {
        case .success: return ZCToneColors(bg: c.successBg, fg: c.successFg, border: c.successBd)
        case .warning: return ZCToneColors(bg: c.warningBg, fg: c.warningFg, border: c.warningBd)
        case .danger: return ZCToneColors(bg: c.dangerBg, fg: c.dangerFg, border: c.dangerBd)
        case .info: return ZCToneColors(bg: c.infoBg, fg: c.infoFg, border: c.infoBd)
        case .accent: return ZCToneColors(bg: c.accentBg, fg: c.accentFg, border: c.accentBd)
        case .neutral: return ZCToneColors(bg: c.neutralBg, fg: c.neutralFg, border: c.neutralBd)
        }
    }
}

private struct ZCOnPrimaryKey: EnvironmentKey { static let defaultValue = false }

public extension EnvironmentValues {
    /// `true` cuando el contenido se dibuja sobre el color primario (cabeceras, banners): los botones invierten sus colores.
    var zcOnPrimary: Bool {
        get { self[ZCOnPrimaryKey.self] }
        set { self[ZCOnPrimaryKey.self] = newValue }
    }
}
