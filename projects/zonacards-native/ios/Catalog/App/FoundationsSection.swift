import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Fundamentos: escala tipográfica, forma por marca y paleta base. Sirve de primera captura de referencia (claro y oscuro, cada marca).
struct FoundationsSection: View {
    @Environment(\.zcTheme) private var theme

    private var swatches: [(String, Color)] {
        let c = theme.colors
        return [("primary", c.primary), ("bg", c.bg), ("surface", c.surface), ("surface2", c.surface2), ("border", c.border), ("fieldBg", c.fieldBg), ("dangerBg", c.dangerBg), ("successBg", c.successBg)]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ZCSpace.v6) {
            group("Tipografía") {
                ZCText("Display", style: ZCType.displaySm)
                ZCText("Título de sección", style: ZCType.title)
                ZCText("Texto de cuerpo para párrafos y descripciones.", style: ZCType.body)
                ZCText("Texto secundario", style: ZCType.caption, tone: .muted)
                ZCText("Mensaje de error", style: ZCType.caption, tone: .danger)
            }
            group("Forma (\(theme.brand.rawValue))") {
                HStack(spacing: ZCSpace.v3) {
                    shape("control", theme.shape.control)
                    shape("card", theme.shape.card)
                    shape("sheet", theme.shape.sheet)
                }
            }
            group("Color") {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: ZCSpace.v2)], spacing: ZCSpace.v2) {
                    ForEach(swatches, id: \.0) { name, color in
                        VStack(alignment: .leading, spacing: ZCSpace.v1) {
                            RoundedRectangle(cornerRadius: theme.shape.control).fill(color)
                                .frame(height: 40)
                                .overlay(RoundedRectangle(cornerRadius: theme.shape.control).stroke(theme.colors.border))
                                .accessibilityHidden(true)
                            ZCText(name, style: ZCType.caption, tone: .muted)
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func group<C: View>(_ title: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: ZCSpace.v3) {
            ZCText(title, style: ZCType.titleSm)
            content()
        }
    }

    private func shape(_ name: String, _ radius: CGFloat) -> some View {
        ZCText("\(name) \(Int(radius))", style: ZCType.caption)
            .padding(ZCSpace.v3)
            .frame(maxWidth: .infinity, minHeight: 64)
            .background(theme.colors.surface, in: RoundedRectangle(cornerRadius: radius))
            .overlay(RoundedRectangle(cornerRadius: radius).stroke(theme.colors.border))
    }
}
