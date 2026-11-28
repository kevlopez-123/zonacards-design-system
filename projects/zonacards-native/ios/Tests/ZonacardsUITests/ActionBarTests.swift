import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Barra de acciones sobre una selección múltiple: se dibuja en todas las marcas y modos, y vacía no ocupa espacio.
final class ActionBarTests: XCTestCase {
    private let actions = [
        ZCAction(id: "enviar", label: "Enviar", icon: .sPlain),
        ZCAction(id: "exportar", label: "Exportar", icon: .sDownloadMinimalistic, disabledReason: "Un borrador no se puede exportar"),
        ZCAction(id: "nota", label: "Añadir nota"),
        ZCAction(id: "anular", label: "Anular", icon: .sCloseCircle, danger: true)
    ]

    @MainActor
    private func height(count: Int, brand: ZCBrand, dark: Bool) -> CGFloat {
        let view = ZCThemeProvider(brand: brand, dark: dark) {
            ZCActionBar(count: count, actions: actions, onAction: { _ in }, onClear: {})
        }
        let host = UIHostingController(rootView: view)
        host.loadViewIfNeeded()
        host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 300)
        host.view.layoutIfNeeded()
        return host.view.intrinsicContentSize.height
    }

    @MainActor
    func testItRendersInEveryBrandAndModeWhenThereIsASelection() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                XCTAssertGreaterThanOrEqual(height(count: 2, brand: brand, dark: dark), 56, "\(brand) \(dark)")
            }
        }
    }

    @MainActor
    func testWithoutSelectionItTakesNoSpace() {
        XCTAssertLessThan(height(count: 0, brand: .zonacards, dark: false), 1)
    }

    func testTheActionKeepsItsIdLabelAndReason() {
        XCTAssertEqual(actions[1].id, "exportar")
        XCTAssertEqual(actions[1].disabledReason, "Un borrador no se puede exportar")
        XCTAssertNil(actions[0].disabledReason)
        XCTAssertTrue(actions[3].danger)
    }
}
