import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// `ZCRating`: qué valor da cada punto del control, que los puntos fuera se acotan y que se dibuja en todas las marcas y modos.
final class RatingTests: XCTestCase {
    func testATapPicksTheStarUnderTheFinger() {
        // Cinco estrellas de 20 pt: la tercera va de 40 a 60.
        XCTAssertEqual(ZCRating.value(at: 50, slot: 20, stars: 5, allowHalf: false), 3)
        XCTAssertEqual(ZCRating.value(at: 1, slot: 20, stars: 5, allowHalf: false), 1)
        XCTAssertEqual(ZCRating.value(at: 99, slot: 20, stars: 5, allowHalf: false), 5)
    }

    func testWithHalvesTheLeftHalfOfAStarIsHalf() {
        XCTAssertEqual(ZCRating.value(at: 5, slot: 20, stars: 5, allowHalf: true), 0.5)
        XCTAssertEqual(ZCRating.value(at: 15, slot: 20, stars: 5, allowHalf: true), 1)
        XCTAssertEqual(ZCRating.value(at: 45, slot: 20, stars: 5, allowHalf: true), 2.5)
    }

    func testPointsOutsideTheControlAreClamped() {
        XCTAssertEqual(ZCRating.value(at: -30, slot: 20, stars: 5, allowHalf: false), 1)
        XCTAssertEqual(ZCRating.value(at: 400, slot: 20, stars: 5, allowHalf: false), 5)
        XCTAssertEqual(ZCRating.clamp(7, stars: 5), 5)
        XCTAssertEqual(ZCRating.clamp(-1, stars: 5), 0)
    }

    @MainActor
    func testItRendersInEveryBrandAndMode() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                var stars = 3.0
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack(alignment: .leading, spacing: 12) {
                        ZCRating("Servicio", value: Binding(get: { stars }, set: { stars = $0 }))
                        ZCRating("Entrega", value: .constant(3.5), allowHalf: true, size: .lg, showValue: true)
                        ZCRating("Producto", readOnly: 4.3, count: 128, showValue: true)
                        ZCRating("Sin calificar", readOnly: 0)
                        ZCRating("Bloqueada", value: .constant(2)).disabled(true)
                    }
                    .padding()
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 400)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
