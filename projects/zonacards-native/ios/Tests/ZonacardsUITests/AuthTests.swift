import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Trazados SVG y logos contra el archivo real, bloqueo del acceso y piezas de acceso en todas las marcas y modos.
final class AuthTests: XCTestCase {
    func testSvgLinesAndClose() {
        let b = ZCSvgPath.parse("M0 0 L10 0 L10 10 Z").cgPath.boundingBoxOfPath
        XCTAssertEqual(b.width, 10, accuracy: 0.01)
        XCTAssertEqual(b.height, 10, accuracy: 0.01)
    }

    func testSvgRelativeAndImplicitCommands() {
        // "m" seguido de pares extra = líneas relativas; "h" y "v" relativos.
        let b = ZCSvgPath.parse("m1 1 4 0 0 4h-4z").cgPath.boundingBoxOfPath
        XCTAssertEqual(b.minX, 1, accuracy: 0.01)
        XCTAssertEqual(b.maxX, 5, accuracy: 0.01)
        XCTAssertEqual(b.maxY, 5, accuracy: 0.01)
    }

    func testSvgArcWithPackedFlags() {
        // Semicírculo de radio 5 de (0,0) a (10,0) con las banderas pegadas al destino ("011 0"): pasa por y = -5 (sentido horario en pantalla).
        let b = ZCSvgPath.parse("M0 0a5 5 0 0110 0").cgPath.boundingBoxOfPath
        XCTAssertEqual(b.width, 10, accuracy: 0.3)
        XCTAssertEqual(b.minY, -5, accuracy: 0.3)
        XCTAssertEqual(b.maxY, 0, accuracy: 0.3)
    }

    func testLogosFileLoads() throws {
        let reg = ZCLogoRegistry.shared
        XCTAssertEqual(reg.logos.count, 32)
        XCTAssertEqual(Set(reg.sso.keys), ["google-icon", "apple", "microsoft-icon"])
        for (name, entry) in reg.logos {
            XCTAssertFalse(entry.path.isEmpty, "logo vacío: \(name)")
            let b = entry.path.cgPath.boundingBoxOfPath
            XCTAssertLessThanOrEqual(b.maxX, 24.5, "\(name) se sale del cuadro de 24")
            XCTAssertGreaterThanOrEqual(b.minX, -0.5, "\(name) se sale del cuadro de 24")
        }
        XCTAssertEqual(reg.sso["microsoft-icon"]?.parts.count, 4)
    }

    func testChunkedKeepsOrder() {
        XCTAssertEqual("ABCDEFGHIJ".chunked(4), ["ABCD", "EFGH", "IJ"])
        XCTAssertEqual("".chunked(4), [])
    }

    func testAuthStateLocksAfterFiveFailures() {
        let s = ZCAuthState()
        for _ in 0..<4 { s.registerFailure(maxFails: 5, lockFor: 900) }
        XCTAssertLessThan(s.lockUntil, Date())
        s.registerFailure(maxFails: 5, lockFor: 900)
        XCTAssertGreaterThan(s.lockUntil, Date().addingTimeInterval(800))
        s.reset()
        XCTAssertEqual(s.fails, 0)
        XCTAssertEqual(s.view, .login)
    }

    func testPinPadStateRejectIncrements() {
        let s = ZCPinPadState()
        s.reject(); s.reject()
        XCTAssertEqual(s.shake, 2)
    }

    @MainActor
    func testAuthRendersInEveryBrandAndMode() {
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                let view = ZCThemeProvider(brand: brand, dark: dark) {
                    VStack {
                        ZCAuth(variant: .shop, login: { _, _ in .bad }, verifyOtp: { _ in true }, onSignedIn: {})
                        ZCAuth(variant: .admin, state: { let s = ZCAuthState(); s.view = .otp; return s }(), login: { _, _ in .otp }, verifyOtp: { _ in true }, verifyRecoveryCode: { _ in true }, onSignedIn: {})
                        ZCMfaSetup(qrPayload: "otpauth://totp/x?secret=ABC", secret: "ABCDEFGH", recoveryCodes: ["A-1"], verify: { _ in true }, onFinished: {})
                        ZCPinPad(value: .constant("12"), error: "Mal", onBiometric: {})
                        ZCLogo("visa", label: true)
                        ZCSsoButton(.google) {}
                        ZCSsoButton(.apple, text: .signup, loading: true) {}
                        ZCSsoButton(.microsoft, theme: .dark, text: .signin) {}
                    }
                }
                let host = UIHostingController(rootView: view)
                host.loadViewIfNeeded()
                host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 4000)
                host.view.layoutIfNeeded()
                XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
            }
        }
    }
}
