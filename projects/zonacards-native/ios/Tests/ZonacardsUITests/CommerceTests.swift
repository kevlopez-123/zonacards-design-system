import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Reglas puras de compra y cuenta, y que cada pieza se dibuje en todas las marcas y modos.
final class CommerceTests: XCTestCase {
    func testCouponDiscountNeverExceedsSubtotal() {
        let pct = ZCCoupon(code: "A", kind: .pct, value: 0.10, description: "")
        let fix = ZCCoupon(code: "B", kind: .fix, value: 500, description: "")
        XCTAssertEqual(pct.discount(of: 200), 20, accuracy: 0.001)
        XCTAssertEqual(fix.discount(of: 200), 200, accuracy: 0.001)
        XCTAssertEqual(zcCouponsTotal([pct, fix], subtotal: 200), 200, accuracy: 0.001)
        XCTAssertEqual(zcCouponsTotal([], subtotal: 200), 0)
    }

    func testPrettyPhone() {
        XCTAssertEqual(zcPrettyPhone("+51900000099"), "+51 900 000 099")
        XCTAssertEqual(zcPrettyPhone("+5117008000"), "+51 1 700 8000")
        XCTAssertEqual(zcPrettyPhone("abc"), "abc")
    }

    func testFlowLayoutWrapsRows() {
        let host = UIHostingController(rootView: ZCFlowLayout(spacing: 8, lineSpacing: 8) {
            ForEach(0..<6, id: \.self) { _ in Color.red.frame(width: 100, height: 20) }
        }.frame(width: 250))
        let size = host.sizeThatFits(in: CGSize(width: 250, height: 1000))
        XCTAssertEqual(size.height, 20 * 3 + 8 * 2, accuracy: 1)   // 2 por fila (100 + 8 + 100 = 208 < 250), 3 filas
    }

    @MainActor
    func testCommerceRendersInEveryBrandAndMode() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack {
                        ZCStepper(steps: ["A", "B"], current: 1, label: "Pasos")
                        ZCCheckoutSteps(steps: [ZCCheckoutStep(id: "a", title: "A", summary: "x"), ZCCheckoutStep(id: "b", title: "B")], current: .constant(1)) { _ in Text("cuerpo") }
                        ZCFormSummary(errors: [ZCFormError(id: "a", message: "Error")]) { _ in }
                        ZCCart(lines: .constant([ZCCartLine(id: "1", name: "Giftcard", brand: "Marca", price: 10, qty: 2)]), country: "pe", discount: 2, fees: [ZCCartFee(label: "Comisión", amount: 1, info: "Ayuda")])
                        ZCCart(lines: .constant([]), country: "pe")
                        ZCAmountPicker("Monto", amounts: [10, 20], value: .constant(10), soldOut: [50])
                        ZCCouponField("Cupón", value: .constant([ZCCoupon(code: "X", kind: .gc, value: 5, description: "Saldo")]), subtotal: 20) { _ in .notFound }
                        ZCPasswordField("Clave", text: .constant("Abc123!x"))
                        ZCPasswordRules(value: "Abc123!x")
                        ZCLegalConsent(checked: .constant(true), onOpenTerms: {}, onOpenPrivacy: {})
                        ZCCountrySwitcher(value: .constant("pe"), allowed: ["pe", "co"])
                        ZCStepDots(total: 3, current: 1)
                    }
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 3000)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
