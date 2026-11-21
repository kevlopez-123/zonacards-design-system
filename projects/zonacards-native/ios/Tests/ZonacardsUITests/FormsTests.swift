import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Reglas puras de los campos (fecha ISO, identificador tributario, teléfono) y que cada campo se dibuje en todas las marcas y modos.
final class FormsTests: XCTestCase {
    func testIsoDateRoundTrip() {
        for iso in ["2026-11-21", "2024-02-29", "2026-01-01", "2026-12-31"] {
            XCTAssertEqual(zcIso(from: zcDate(fromIso: iso)), iso)
        }
    }

    func testTaxIdValidation() {
        XCTAssertFalse(zcIsValidTaxId(country: "pe", "123"))
        XCTAssertFalse(zcIsValidTaxId(country: "pe", ""))
    }

    func testPhoneGroupingKeepsDigits() {
        let digits = ZCPhone.digits("987 654 321", country: "pe")
        XCTAssertEqual(digits, "987654321")
        XCTAssertEqual(ZCPhone.format(digits), "987 654 321")
    }

    @MainActor
    func testFieldsRenderInEveryBrandAndMode() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack {
                        ZCTextField("Nombre", text: .constant("Ana"), hint: "Ayuda", required: true)
                        ZCTextField("Clave", text: .constant("x"), error: "Error", password: true)
                        ZCTextArea("Notas", text: .constant(""), maxLength: 100)
                        ZCSearchField(query: .constant("lim"))
                        ZCSelect("Ciudad", options: [ZCOption(1, label: "Lima")], selection: .constant(1))
                        ZCMultiSelect("Tags", options: [ZCOption(1, label: "A")], selection: .constant([1]))
                        ZCDateField("Fecha", iso: .constant("2026-11-21"))
                        ZCMoneyField("Monto", amount: .constant(10), country: "pe")
                        ZCPhoneField("Teléfono", digits: .constant("987654321"), country: .constant("pe"))
                        ZCTaxIdField(value: .constant("20100070970"), country: "pe")
                        ZCOtpField("Código", value: .constant("12"))
                        ZCNumberField(value: .constant(2), min: 0, max: 5, label: "Cupos")
                    }
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 1600)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
