import SwiftUI
import ZonacardsTokens
import ZonacardsUI

/// Adaptable: navegación que cambia entre barra inferior (iPhone) y barra lateral (iPad), y lista con detalle. Cada demo fuerza el ancho que muestra.
struct AdaptiveSection: View {
    @State private var nav = "lotes"
    @State private var picked = "lote-2829"

    private let navItems = [
        ZCNavItem(id: "inicio", label: "Inicio", icon: .sHomeSmile, iconActive: .sHomeSmileBold),
        ZCNavItem(id: "lotes", label: "Lotes", icon: .sBox, iconActive: .sBoxBold, badge: "3"),
        ZCNavItem(id: "cuenta", label: "Cuenta", icon: .sUserRounded)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: ZCSpace.v8) {
            group("Navegación en ancho compacto (iPhone)") {
                ZCText("Barra inferior con 3 a 5 destinos. En iPad (ancho regular) se vuelve barra lateral con el contenido al lado.", style: ZCType.caption, tone: .muted)
                ZCAdaptiveScaffold(items: navItems, selection: $nav) { id in
                    VStack { ZCText("Destino: \(id)", style: ZCType.body) }.frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .environment(\.horizontalSizeClass, .compact)
                .frame(height: 220)
                .clipShape(RoundedRectangle(cornerRadius: ZCRadius.md))
            }
            group("Lista y detalle en ancho regular (iPad)") {
                ZCText("Las dos columnas a la vez; en iPhone se muestra una sola, con Volver.", style: ZCType.caption, tone: .muted)
                ZCListDetail(showsDetail: true, listWidth: 130) {
                    VStack(alignment: .leading, spacing: ZCSpace.v2) {
                        ForEach(["lote-2829", "lote-2830"], id: \.self) { id in
                            ZCButton(id == "lote-2829" ? "#02829" : "#02830", variant: picked == id ? .secondary : .ghost, size: .sm) { picked = id }
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(ZCSpace.v3)
                } detail: {
                    VStack(alignment: .leading, spacing: ZCSpace.v2) {
                        ZCText("Detalle del lote", style: ZCType.titleSm)
                        ZCText(picked, style: ZCType.caption, tone: .muted)
                        Spacer(minLength: 0)
                    }
                    .padding(ZCSpace.v3)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .environment(\.horizontalSizeClass, .regular)
                .frame(height: 160)
                .clipShape(RoundedRectangle(cornerRadius: ZCRadius.md))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func group<C: View>(_ title: String, @ViewBuilder _ content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: ZCSpace.v4) {
            ZCText(title, style: ZCType.titleSm)
            content()
        }
    }
}
