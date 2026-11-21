import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Datos de ubigeo y Code 39 contra los archivos reales, y que cada pieza de cuenta y wallet se dibuje en todas las marcas y modos.
final class AccountTests: XCTestCase {
    func testCode39TableIsConsistent() {
        for (ch, pattern) in ZCCode39.patterns {
            XCTAssertEqual(pattern.count, 9, "\(ch): 9 elementos")
            XCTAssertEqual(pattern.filter { $0 == "w" }.count, 3, "\(ch): 3 anchos")
        }
        XCTAssertEqual(ZCCode39.patterns.count, 44)
    }

    func testCode39Modules() throws {
        let m = try XCTUnwrap(ZCCode39.modules("A1"))
        // 3 caracteres (*, A, 1) de 9 elementos + 2 separadores angostos.
        XCTAssertEqual(m.count, 3 * 9 + 2)
        XCTAssertTrue(m.first!.bar)
        XCTAssertTrue(m.last!.bar)
        XCTAssertNil(ZCCode39.modules("a_b"))   // "_" no existe en Code 39
    }

    func testUbigeoLoadsRealFile() throws {
        let u = try XCTUnwrap(ZCUbigeo.shared)
        XCTAssertEqual(u.departments.count, 25)
        XCTAssertEqual(u.provinceCount, 196)
        XCTAssertEqual(u.districtCount, 1891)
        XCTAssertEqual(u.label("150122"), "Miraflores, Lima, Lima")
        XCTAssertEqual(u.district("150122")?.lat ?? 0, -12.121667, accuracy: 0.0001)
        XCTAssertFalse(u.provinces(department: "15").isEmpty)
        XCTAssertTrue(u.districts(province: "9999").isEmpty)
    }

    @MainActor
    func testAccountRendersInEveryBrandAndMode() {
        let pass = ZCLoyaltyPass(program: "Puntos", member: "Ana", points: 1200, tier: "Oro", bg: .blue, fg: .white, label: .gray, code: "ZP-1")
        let card = ZCGiftcardData(issuer: "Cine", title: "Giftcard", balance: 50, number: "1234567890123456", pin: "1111", expires: "2027-01-31", bg: .red, fg: .white, label: .pink)
        let items = [ZCNotification(id: "1", icon: .sBox, title: "Aviso", meta: "hoy", kind: .apr, unread: true, group: "Hoy")]
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack {
                        ZCCodeImage("ZP-1", format: .qr)
                        ZCCodeImage("1234567", format: .code128)
                        ZCCodeImage("ABC", format: .code39)
                        ZCWalletPass(pass: pass, os: .apple)
                        ZCWalletPass(pass: pass, os: .google, back: true)
                        ZCGiftcardPass(card: card, country: "pe", os: .apple)
                        ZCGiftcardPass(card: card, country: "pe", os: .google)
                        ZCNotifications(items: .constant(items), onOpen: { _ in }, onSeeAll: {})
                        ZCPermissionPrompt(icon: .sBell, title: "Título", text: "Texto") { ZCButton("Permitir") {} }
                        ZCPushPreview(app: "App", time: "ahora", title: "Título", text: "Texto")
                        ZCUbigeoSelect(value: .constant("150122"))
                        ZCSlider(value: .constant(40))
                        ZCRangeSlider(low: .constant(10), high: .constant(60), minGap: 5)
                        ZCTimeField("Hora", value: .constant("09:30"))
                        ZCTagsField("Correos", value: .constant(["a@b.co", "mal"]), max: 3)
                        ZCSecretField(value: "sk_live_abcdefgh", label: "Clave", keepPrefix: "sk_live_")
                        ZCDeleteAccount(request: nil, maskedEmail: "a***@b.co", onSendCode: {}, onSubmit: { _, _ in }, onBack: {})
                    }
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 5000)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
