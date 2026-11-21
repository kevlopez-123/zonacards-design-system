import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Comprueba que cada estilo tipográfico del sistema crece con Dynamic Type (la auditoría de Apple marca textos pequeños como "parcialmente no soportados").
/// Imprime la tabla de alturas (líneas "DT …") para ver cuánto crece cada estilo.
final class DynamicTypeTests: XCTestCase {
    private let theme = ZCTheme.resolve(.zonacards, dark: false)

    @MainActor
    private func height<V: View>(_ build: () -> V, size: DynamicTypeSize) -> CGFloat {
        let host = UIHostingController(rootView: ZCThemeProvider(brand: .zonacards, dark: false) { build().environment(\.dynamicTypeSize, size) })
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 1000, height: 1000))
        window.rootViewController = host
        window.makeKeyAndVisible()
        return host.sizeThatFits(in: CGSize(width: 1000, height: 3000)).height
    }

    private var styles: [(String, ZCTypeStyle)] {
        [("xxs", ZCType.xxs), ("tiny", ZCType.tiny), ("caption", ZCType.caption), ("bodySm", ZCType.bodySm), ("body", ZCType.body), ("titleSm", ZCType.titleSm),
         ("title", ZCType.title), ("heading", ZCType.heading), ("displaySm", ZCType.displaySm), ("display", ZCType.display), ("displayLg", ZCType.displayLg)]
    }

    @MainActor
    func testEveryTypeStyleGrows() {
        for (name, style) in styles {
            let theme = self.theme
            let small = height({ Text("Hamburguesa").font(.zc(style, theme: theme)).fixedSize() }, size: .large)
            let big = height({ Text("Hamburguesa").font(.zc(style, theme: theme)).fixedSize() }, size: .accessibility3)
            print("DT estilo \(name): large=\(small) accessibility3=\(big) factor=\(big / max(small, 1))")
            XCTAssertGreaterThan(big, small * 1.15, "El estilo \(name) no crece con Dynamic Type")
        }
    }

    @MainActor
    func testZCTextGrows() {
        let small = height({ ZCText("Hamburguesa", style: ZCType.caption, tone: .muted) }, size: .large)
        let big = height({ ZCText("Hamburguesa", style: ZCType.caption, tone: .muted) }, size: .accessibility3)
        print("DT ZCText caption: large=\(small) accessibility3=\(big)")
        XCTAssertGreaterThan(big, small * 1.15)
    }

    @MainActor
    func testSwatchLabelLayoutGrows() {
        // Igual que las muestras de color de Fundamentos: un recuadro de 40 pt y el nombre debajo, en una cuadrícula adaptable.
        func swatch() -> some View {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: 8)], spacing: 8) {
                ForEach(["primary", "bg", "surface"], id: \.self) { name in
                    VStack(alignment: .leading, spacing: ZCSpace.v1) {
                        RoundedRectangle(cornerRadius: 8).frame(height: 40)
                        ZCText(name, style: ZCType.caption, tone: .muted)
                    }
                }
            }
        }
        let small = height({ swatch() }, size: .large)
        let big = height({ swatch() }, size: .accessibility3)
        print("DT cuadrícula de muestras: large=\(small) accessibility3=\(big)")
        XCTAssertGreaterThan(big, small, "La cuadrícula no crece")
    }

    @MainActor
    func testUppercasedTrackedLabelGrows() {
        let label = ZCTypeStyle(size: 10, lineHeight: 14, relativeTo: .caption2)
        let theme = self.theme
        let small = height({ Text("MEMBER").font(.zc(label, theme: theme).weight(.semibold)).tracking(0.6).fixedSize() }, size: .large)
        let big = height({ Text("MEMBER").font(.zc(label, theme: theme).weight(.semibold)).tracking(0.6).fixedSize() }, size: .accessibility3)
        print("DT etiqueta del pase: large=\(small) accessibility3=\(big)")
        XCTAssertGreaterThan(big, small * 1.15)
    }
}
