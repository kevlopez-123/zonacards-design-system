import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Reglas puras de los átomos y que cada uno se dibuje en todas las marcas y modos sin fallar.
final class AtomsTests: XCTestCase {
    func testInitials() {
        XCTAssertEqual(zcInitials("Lucía Mendoza"), "LM")
        XCTAssertEqual(zcInitials("  ana  "), "A")
        XCTAssertEqual(zcInitials("Ana María de la Cruz"), "AM")
        XCTAssertEqual(zcInitials(""), "")
    }

    func testTonesCoverEveryCase() {
        let theme = ZCTheme.resolve(.zonacards, dark: false)
        for tone in ZCTone.allCases { _ = theme.tone(tone) }
        XCTAssertEqual(ZCTone.allCases.count, 6)
    }

    func testStringsResolve() {
        // El idioma del simulador puede ser es o en: se comprueba que la clave se resuelva y reciba el parámetro.
        XCTAssertNotEqual(ZCString.text("ui.cargando"), "ui.cargando")
        let remove = ZCString.text("ui.quitar", "Lima")
        XCTAssertNotEqual(remove, "ui.quitar")
        XCTAssertTrue(remove.contains("Lima"))
    }

    @MainActor
    func testAtomsRenderInEveryBrandAndMode() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack {
                        ZCButton("Crear lote") {}
                        ZCButton("Guardando", variant: .outline, loading: true) {}
                        ZCIconButton(.lX, label: "Cerrar") {}
                        ZCBadge("Activo", tone: .success)
                        ZCAvatar("Lucía Mendoza", presence: true)
                        ZCChip("Lima", onRemove: {})
                        ZCSwitch(isOn: .constant(true), label: "Avisos")
                        ZCCheckbox(state: .mixed, label: "Todo") {}
                        ZCRadioGroup("Plan", options: [ZCRadioOption(1, label: "Uno"), ZCRadioOption(2, label: "Dos")], selection: .constant(1))
                        ZCProgress(value: nil)
                        ZCSkeleton(variant: .card)
                    }
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 900)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
