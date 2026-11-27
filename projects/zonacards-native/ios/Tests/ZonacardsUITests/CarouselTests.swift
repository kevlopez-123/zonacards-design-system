import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Carrusel: textos y dibujo en todas las marcas y modos, con pocas y muchas diapositivas, y vacío.
final class CarouselTests: XCTestCase {
    func testTextsAreTranslated() {
        for key in ["mol.carrusel.de", "mol.carrusel.ir", "mol.carrusel.anterior", "mol.carrusel.siguiente"] {
            XCTAssertNotEqual(ZCString.text(key, 1), key, "\(key) no tiene texto en Localizable")
        }
    }

    @MainActor
    func testRendersInEveryBrandAndMode() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack(spacing: 16) {
                        ZCCarousel("Ofertas", items: ["A", "B", "C", "D", "E"]) { name, _ in Text(name).padding() }
                        ZCCarousel("Una sola", items: ["A"]) { name, _ in Text(name).padding() }
                        ZCCarousel("Vacío", items: [String]()) { name, _ in Text(name) }
                    }
                    .padding()
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 800)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
