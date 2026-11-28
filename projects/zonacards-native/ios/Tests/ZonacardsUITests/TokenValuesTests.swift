import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Los valores de los tokens semánticos generados (iguales a los de tokens.css): si cambian en un lado y no en el otro, esta prueba avisa.
final class TokenValuesTests: XCTestCase {
    func testBreakpointsAreTheWebOnesPlusTheNativeThresholds() {
        XCTAssertEqual([ZCBreakpoint.sm, ZCBreakpoint.md, ZCBreakpoint.lg, ZCBreakpoint.xl], [640, 768, 1024, 1280])
        XCTAssertEqual([ZCBreakpoint.phone, ZCBreakpoint.wide], [600, 900])
    }

    func testIconSizesAre16To32() {
        XCTAssertEqual([ZCSize.iconSm, ZCSize.iconMd, ZCSize.iconLg, ZCSize.iconXl], [16, 20, 24, 32])
    }

    func testStateAndSpacingTokensMatchTheDocs() {
        XCTAssertEqual(ZCOpacity.disabled, 0.45)
        XCTAssertEqual(ZCScale.pressed, 0.97)
        XCTAssertEqual([ZCSpacing.inline, ZCSpacing.group, ZCSpacing.field, ZCSpacing.fieldX, ZCSpacing.section], [8, 12, 16, 20, 40])
    }
}
