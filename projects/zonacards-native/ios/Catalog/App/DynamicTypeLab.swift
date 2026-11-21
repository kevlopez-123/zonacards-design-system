import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Banco de pruebas de Dynamic Type: variantes mínimas de un mismo texto pequeño, para saber cuáles marca la auditoría de Apple como "parcialmente no soportadas".
/// Solo se abre con el argumento de lanzamiento `-dtlab` (lo usa `AccessibilityAuditTests.testDynamicTypeLab`); no aparece en el catálogo.
struct DynamicTypeLab: View {
    @Environment(\.zcTheme) private var theme

    private func swatch(_ name: String) -> some View {
        VStack(alignment: .leading, spacing: ZCSpace.v1) {
            RoundedRectangle(cornerRadius: 8).fill(theme.colors.surface3).frame(height: 40)
            ZCText(name, style: ZCType.caption, tone: .muted)
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: ZCSpace.v4) {
                Text("A sistema caption").font(.caption)
                Text("B custom relativeTo caption").font(.custom("Figtree", size: 13, relativeTo: .caption))
                ZCText("C ZCText caption", style: ZCType.caption, tone: .muted)
                swatch("D muestra en VStack")
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: 8)], spacing: 8) { swatch("E muestra en LazyVGrid") }
                HStack { swatch("F muestra en HStack") }
                Button {} label: { VStack(spacing: 2) { RoundedRectangle(cornerRadius: 4).frame(width: 20, height: 20); ZCText("G etiqueta en botón", style: ZCType.tiny, tone: .muted) } }
                    .accessibilityElement(children: .ignore).accessibilityLabel("G etiqueta en botón")
                Text("H MAYÚSCULAS CON TRACKING").font(.zc(ZCTypeStyle(size: 10, lineHeight: 14, relativeTo: .caption2), theme: theme).weight(.semibold)).tracking(0.6)
                Text("I una línea").font(.zc(ZCType.caption, theme: theme)).lineLimit(1)
                Text("J sin ZCText").font(.zc(ZCType.caption, theme: theme))
                ZCText("K body", style: ZCType.body)
            }
            .padding(ZCSpace.v4)
        }
    }
}
