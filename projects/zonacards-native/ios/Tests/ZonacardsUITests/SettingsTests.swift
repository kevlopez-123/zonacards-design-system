import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Filas de ajustes (interruptor, abrir algo, informativa, deshabilitada, peligro) y hoja con puntos de anclaje: se dibujan en todas las marcas y modos.
final class SettingsTests: XCTestCase {
    @MainActor
    func testSettingsRenderInEveryBrandAndMode() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                var on = true
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack(spacing: 16) {
                        ZCSettingsGroup([
                            ZCSettingsItem("Alertas de stock", description: "Avisa cuando queda poco", icon: .sInfoCircle, isOn: Binding(get: { on }, set: { on = $0 })),
                            ZCSettingsItem("Idioma", icon: .sGlobal, value: "Español", action: {}),
                            ZCSettingsItem("Versión de la app", value: "2.0.0"),
                            ZCSettingsItem("Cuenta", enabled: false, action: {}),
                            ZCSettingsItem("Cerrar sesión", icon: .sShieldCheck, danger: true, action: {}),
                        ], header: "Preferencias", footer: "Los cambios se aplican al instante.")
                        ZCSettingsRow(ZCSettingsItem("Sola", trailing: AnyView(Text("Extra")), action: {}))
                    }
                    .padding()
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 900)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }

    @MainActor
    func testSheetWithAnchorsCompilesAndRenders() {
        let view = ZCThemeProvider(brand: .zonacards, dark: false) {
            Text("Pantalla").zcSheet(isPresented: .constant(false), title: "Filtros", anchors: [0.5, 0.9]) { Text("Contenido") }
        }
        let host = UIHostingController(rootView: view)
        host.loadViewIfNeeded()
        host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 800)
        host.view.layoutIfNeeded()
        XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0)
    }
}
