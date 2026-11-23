import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Cambio de marca en vivo (con memoria entre sesiones) y plantillas que se adaptan al ancho (iPhone / iPad).
final class AdaptiveTests: XCTestCase {
    private func freshDefaults() -> UserDefaults {
        let name = "zc-tests-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: name)!
        defaults.removePersistentDomain(forName: name)
        return defaults
    }

    func testBrandStoreRemembersChoicesBetweenSessions() {
        let defaults = freshDefaults()
        let first = ZCBrandStore(defaultBrand: .zonacards, defaults: defaults)
        XCTAssertEqual(first.brand, .zonacards)
        XCTAssertNil(first.dark)
        first.select(.giftealo)
        first.setDark(true)
        let second = ZCBrandStore(defaultBrand: .zonacards, defaults: defaults)
        XCTAssertEqual(second.brand, .giftealo)
        XCTAssertEqual(second.dark, true)
        second.setDark(nil)
        XCTAssertNil(ZCBrandStore(defaults: defaults).dark, "volver a 'sistema' borra el modo guardado")
    }

    func testBrandStoreIgnoresASavedBrandThatNoLongerExists() {
        let defaults = freshDefaults()
        defaults.set("marca-que-ya-no-existe", forKey: "zc.brand")
        XCTAssertEqual(ZCBrandStore(defaultBrand: .motiva, defaults: defaults).brand, .motiva)
    }

    func testStoreThemeFollowsSystemModeUnlessChosen() {
        let store = ZCBrandStore(defaultBrand: .enjoy, defaults: freshDefaults())
        XCTAssertTrue(store.theme(systemDark: true).isDark)
        XCTAssertFalse(store.theme(systemDark: false).isDark)
        store.setDark(false)
        XCTAssertFalse(store.theme(systemDark: true).isDark)
        XCTAssertEqual(store.theme(systemDark: true).brand, .enjoy)
    }

    private struct Probe: View {
        @Environment(\.zcTheme) var theme
        let onTheme: (ZCTheme) -> Void
        var body: some View { onTheme(theme); return Color.clear }
    }

    @MainActor
    private func show<V: View>(_ view: V, width: CGFloat = 390, height: CGFloat = 844) -> UIWindow {
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: width, height: height))
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        RunLoop.current.run(until: Date().addingTimeInterval(0.3))
        return window
    }

    @MainActor
    func testChangingTheBrandRedrawsEverythingInside() {
        let store = ZCBrandStore(defaultBrand: .zonacards, defaults: freshDefaults())
        var seen: ZCTheme?
        let window = show(ZCLiveThemeProvider(store: store) { Probe { seen = $0 } })
        XCTAssertEqual(seen?.brand, .zonacards)
        store.select(.giftealo)
        RunLoop.current.run(until: Date().addingTimeInterval(0.3))
        XCTAssertEqual(seen?.brand, .giftealo, "el contenido debe ver la marca nueva sin reiniciar")
        store.setDark(true)
        RunLoop.current.run(until: Date().addingTimeInterval(0.3))
        XCTAssertEqual(seen?.isDark, true)
        window.isHidden = true
    }

    private let nav = [
        ZCNavItem(id: "inicio", label: "Inicio", icon: .sHomeSmile, iconActive: .sHomeSmileBold),
        ZCNavItem(id: "lotes", label: "Lotes", icon: .sBox, iconActive: .sBoxBold, badge: "3"),
        ZCNavItem(id: "cuenta", label: "Cuenta", icon: .sUserRounded),
    ]

    @MainActor
    func testScaffoldShowsTheChosenDestinationInBothWidths() {
        for sizeClass in [UserInterfaceSizeClass.compact, .regular] {
            var shown: [String] = []
            let selection = Binding<String>.constant("lotes")
            let view = ZCThemeProvider(brand: .zonacards, dark: false) {
                ZCAdaptiveScaffold(items: nav, selection: selection) { id in
                    Color.clear.onAppear { shown.append(id) }
                }
                .environment(\.horizontalSizeClass, sizeClass)
            }
            let window = show(view, width: sizeClass == .regular ? 1024 : 390, height: sizeClass == .regular ? 768 : 844)
            XCTAssertTrue(shown.contains("lotes"), "\(sizeClass): no se dibujó el destino elegido")
            window.isHidden = true
        }
    }

    @MainActor
    func testListDetailShowsBothColumnsOnlyInRegularWidth() {
        func appeared(showsDetail: Bool, sizeClass: UserInterfaceSizeClass) -> Set<String> {
            var seen = Set<String>()
            let view = ZCThemeProvider(brand: .zonacards, dark: false) {
                ZCListDetail(showsDetail: showsDetail) {
                    Color.clear.onAppear { seen.insert("lista") }
                } detail: {
                    Color.clear.onAppear { seen.insert("detalle") }
                }
                .environment(\.horizontalSizeClass, sizeClass)
            }
            let window = show(view)
            window.isHidden = true
            return seen
        }
        XCTAssertEqual(appeared(showsDetail: false, sizeClass: .compact), ["lista"])
        XCTAssertEqual(appeared(showsDetail: true, sizeClass: .compact), ["detalle"])
        XCTAssertEqual(appeared(showsDetail: false, sizeClass: .regular), ["lista", "detalle"])
    }
}
