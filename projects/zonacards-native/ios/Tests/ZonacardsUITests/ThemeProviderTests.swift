import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Comprueba que el tema llega al contenido y que cada marca y modo se resuelve.
final class ThemeProviderTests: XCTestCase {
    func testEveryBrandResolvesInBothModes() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let theme = ZCTheme.resolve(brand, dark: dark)
                XCTAssertEqual(theme.brand, brand)
                XCTAssertEqual(theme.isDark, dark)
                XCTAssertGreaterThan(theme.shape.fieldH, 0, "\(brand) no define el alto de campo")
            }
        }
    }

    @MainActor
    func testProviderInjectsTheme() {
        var seen: ZCTheme?
        struct Probe: View {
            @Environment(\.zcTheme) var theme
            let onTheme: (ZCTheme) -> Void
            var body: some View { onTheme(theme); return Color.clear }
        }
        let host = UIHostingController(rootView: ZCThemeProvider(brand: .giftealo, dark: true) { Probe { seen = $0 } })
        host.loadViewIfNeeded()
        host.view.layoutIfNeeded()
        XCTAssertEqual(seen?.brand, .giftealo)
        XCTAssertEqual(seen?.isDark, true)
    }

    func testTypeScaleIsOrdered() {
        let sizes = [ZCType.caption, ZCType.bodySm, ZCType.body, ZCType.titleSm, ZCType.title, ZCType.displaySm, ZCType.display, ZCType.displayLg].map(\.size)
        XCTAssertEqual(sizes, sizes.sorted())
    }
}
