import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Errores del servidor por campo: caen en su campo, el foco va al primero y el error se borra al editar.
final class ServerErrorsTests: XCTestCase {
    func testAppliesMessagesAndReportsTheUnknownKeys() {
        let s = ZCServerErrors(fields: ["email", "nombre"])
        let left = s.apply(["email": "Repetido.", "cuenta": "Suspendida", "nombre": "", "otro": nil])
        XCTAssertEqual(left, ["cuenta"])
        XCTAssertEqual(s.error("email"), "Repetido.")
        XCTAssertNil(s.error("nombre"), "un mensaje vacío no es un error")
        XCTAssertTrue(s.hasErrors)
        s.clear("email")
        XCTAssertFalse(s.hasErrors)
        XCTAssertNil(s.firstInvalid)
    }

    func testTheFirstInvalidFollowsTheDeclaredOrderNotTheOrderOfTheResponse() {
        let s = ZCServerErrors(fields: ["email", "nombre", "telefono"])
        s.apply(["telefono": "Corto.", "nombre": "Sin números."])
        XCTAssertEqual(s.firstInvalid, "nombre")
    }

    func testFocusGoesOnlyToTheFirstInvalidField() {
        let s = ZCServerErrors(fields: ["email", "nombre"])
        XCTAssertEqual(s.focusRequest("email"), 0)
        s.apply(["email": "Repetido.", "nombre": "Sin números."])
        XCTAssertEqual(s.focusRequest("email"), 1)
        XCTAssertEqual(s.focusRequest("nombre"), 0)
        s.apply(["email": "Repetido otra vez."])
        XCTAssertEqual(s.focusRequest("email"), 2, "cada envío con error vuelve a llevar el foco")
    }

    func testFocusCanBeSkipped() {
        let s = ZCServerErrors(fields: ["email"])
        s.apply(["email": "Repetido."], focus: false)
        XCTAssertEqual(s.focusRequest("email"), 0)
    }

    func testEditingAFieldClearsItsErrorAndLeavesTheOthers() {
        let s = ZCServerErrors(fields: ["email", "nombre"])
        var email = "ana@empresa.com"
        let binding = s.binding("email", Binding(get: { email }, set: { email = $0 }))
        s.apply(["email": "Repetido.", "nombre": "Sin números."])
        binding.wrappedValue = "otra@empresa.com"
        XCTAssertEqual(email, "otra@empresa.com")
        XCTAssertNil(s.error("email"))
        XCTAssertEqual(s.error("nombre"), "Sin números.")
    }

    func testClearAllEmptiesEverything() {
        let s = ZCServerErrors(fields: ["email", "nombre"])
        s.apply(["email": "a", "nombre": "b"])
        s.clearAll()
        XCTAssertFalse(s.hasErrors)
    }

    @MainActor
    func testFieldsWithAServerErrorRenderInEveryBrandAndMode() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let s = ZCServerErrors(fields: ["email"])
                s.apply(["email": "Ya existe una cuenta con este correo."])
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    ZCTextField("Correo", text: .constant("ana@empresa.com"), error: s.error("email"), focusRequest: s.focusRequest("email")).padding()
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 300)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
