import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Pila de subpantallas, cola de avisos y que cada pieza de estructura se dibuje en todas las marcas y modos.
final class StructureTests: XCTestCase {
    func testSubscreenHostPushAndPop() {
        let host = ZCSubscreenHost()
        var popped: [String] = []
        host.push(title: "A", onPop: { popped.append("A") }) { EmptyView() }
        host.push(title: "B", onPop: { popped.append("B") }) { EmptyView() }
        XCTAssertEqual(host.stack.map(\.title), ["A", "B"])
        XCTAssertTrue(host.pop())
        XCTAssertEqual(popped, ["B"])
        host.popAll()
        XCTAssertEqual(popped, ["B", "A"])
        XCTAssertFalse(host.pop())
    }

    func testToastQueueKeepsThreeVisible() {
        let state = ZCToastState()
        let ids = (1...5).map { state.info("Aviso \($0)") }
        XCTAssertEqual(state.items.count, 3)
        state.dismiss(ids[0])
        XCTAssertEqual(state.items.map(\.id), [ids[1], ids[2], ids[3]])
        state.dismiss(ids[1]); state.dismiss(ids[2]); state.dismiss(ids[3])
        XCTAssertEqual(state.items.map(\.id), [ids[4]])
    }

    func testErrorWithActionDoesNotAutoClose() {
        let state = ZCToastState()
        state.error("Falló", actionLabel: "Reintentar") {}
        state.success("Listo")
        XCTAssertNil(state.items[0].duration)
        XCTAssertEqual(state.items[1].duration, 6)
    }

    @MainActor
    func testStructureRendersInEveryBrandAndMode() {
        let actions = [ZCAction(id: "a", label: "Editar", icon: .sPen), ZCAction(id: "b", label: "Eliminar", danger: true, separatorBefore: true)]
        let nav = [ZCNavItem(id: "1", label: "Inicio", icon: .sBox), ZCNavItem(id: "2", label: "Lotes", icon: .sBox, badge: "2"), ZCNavItem(id: "3", label: "Cuenta", icon: .sBox)]
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack {
                        ZCTopBar("Título", subtitle: "Sub", onBack: {}) { ZCMenu(actions: actions, label: "Acciones") { _ in } }
                        ZCBottomNav(items: nav, current: "1") { _ in }
                        ZCSystemBanner("Sin conexión")
                        ZCOfflineBanner(pending: 2)
                        ZCState("Vacío", text: "Texto") { ZCButton("Crear") {} }
                        ZCState("Error", kind: .error, reference: "ZC-1", details: ZCTechDetails(code: "503", service: "lotes", date: "hoy"))
                        ZCSwipeItem(actions: actions, menuLabel: "Acciones", onAction: { _ in }) { Text("Fila") }
                    }
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 1400)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
