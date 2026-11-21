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
        // SwiftUI solo evalúa el cuerpo de una vista que está en una ventana.
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = host
        window.makeKeyAndVisible()
        host.view.layoutIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.2))
        XCTAssertEqual(seen?.brand, .giftealo)
        XCTAssertEqual(seen?.isDark, true)
    }

    func testTypeScaleIsOrdered() {
        let sizes = [ZCType.caption, ZCType.bodySm, ZCType.body, ZCType.titleSm, ZCType.title, ZCType.displaySm, ZCType.display, ZCType.displayLg].map(\.size)
        XCTAssertEqual(sizes, sizes.sorted())
    }
}
