import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// `ZCToastState.promise` y `update`: un solo aviso que pasa de "cargando" a éxito o error en su lugar.
final class ToastPromiseTests: XCTestCase {
    private struct Boom: Error {}

    func testLoadingDoesNotCloseByItselfSuccessDoesAndAnErrorWithActionDoesNot() {
        let s = ZCToastState()
        let a = s.loading("Guardando…")
        let b = s.success("Listo")
        let c = s.error("Falló", actionLabel: "Reintentar", onAction: {})
        XCTAssertNil(s.items.first { $0.id == a }?.duration)
        XCTAssertEqual(s.items.first { $0.id == b }?.duration, 6)
        XCTAssertNil(s.items.first { $0.id == c }?.duration)
    }

    func testUpdateChangesTheToastInPlaceAndRecomputesTheDuration() {
        let s = ZCToastState()
        let id = s.loading("Guardando…")
        XCTAssertTrue(s.update(id, .success, "Guardado", text: "Ya está activo."))
        let t = s.items[0]
        XCTAssertEqual(t.id, id)
        XCTAssertEqual(t.kind, .success)
        XCTAssertEqual(t.title, "Guardado")
        XCTAssertEqual(t.text, "Ya está activo.")
        XCTAssertEqual(t.duration, 6)
        XCTAssertFalse(s.update(999, .info, "x"))
    }

    @MainActor
    func testPromiseGoesFromLoadingToSuccessInTheSameToastAndReturnsTheValue() async throws {
        let s = ZCToastState()
        let value = try await s.promise(loading: ZCToastBody("Guardando…"), success: { (n: Int) in ZCToastBody("Se guardaron \(n) filas") }, error: { _ in ZCToastBody("No se pudo guardar") }) {
            XCTAssertEqual(s.items.map(\.kind), [.loading], "mientras corre se ve el aviso de cargando")
            return 7
        }
        XCTAssertEqual(value, 7)
        XCTAssertEqual(s.items.count, 1)
        XCTAssertEqual(s.items[0].id, 1)
        XCTAssertEqual(s.items[0].kind, .success)
        XCTAssertEqual(s.items[0].title, "Se guardaron 7 filas")
    }

    @MainActor
    func testPromiseGoesToErrorInPlaceAndRethrows() async {
        let s = ZCToastState()
        do {
            _ = try await s.promise(loading: "Guardando…", success: "Guardado", error: "No se pudo guardar") { () async throws -> Int in throw Boom() }
            XCTFail("debía relanzar el error")
        } catch {
            XCTAssertTrue(error is Boom)
        }
        XCTAssertEqual(s.items.count, 1)
        XCTAssertEqual(s.items[0].kind, .error)
        XCTAssertEqual(s.items[0].title, "No se pudo guardar")
    }

    @MainActor
    func testIfTheToastWasClosedTheResultIsStillShownInANewOne() async throws {
        let s = ZCToastState()
        _ = try await s.promise(loading: "Guardando…", success: "Guardado", error: "No se pudo guardar") { () async throws -> Int in
            s.dismiss(1)
            XCTAssertTrue(s.items.isEmpty)
            return 1
        }
        XCTAssertEqual(s.items.map(\.kind), [.success])
        XCTAssertEqual(s.items.map(\.title), ["Guardado"])
    }

    @MainActor
    func testCancellingClosesTheLoadingToast() async {
        let s = ZCToastState()
        do {
            _ = try await s.promise(loading: "Guardando…", success: "Guardado", error: "No se pudo guardar") { () async throws -> Int in throw CancellationError() }
            XCTFail("debía relanzar la cancelación")
        } catch {
            XCTAssertTrue(error is CancellationError)
        }
        XCTAssertTrue(s.items.isEmpty)
    }

    @MainActor
    func testTheToasterRendersLoadingSuccessAndError() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let s = ZCToastState()
                s.loading("Guardando el lote…")
                s.success("Lote guardado", text: "120 códigos listos.")
                s.error("No se pudo guardar", text: "Revisa tu conexión.")
                let view = ZCThemeProvider(brand: brand, dark: dark) { ZCToaster(state: s) }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 600)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
