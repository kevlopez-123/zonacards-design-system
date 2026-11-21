import XCTest

/// Auditoría de accesibilidad de Apple (`performAccessibilityAudit`) sobre cada pantalla del catálogo: contraste, tamaño de toque,
/// etiquetas, Dynamic Type y elementos cortados. Equivale a `ZcA11yAudit` de Android. Una sección nueva se agrega a `sections`.
final class AccessibilityAuditTests: XCTestCase {
    private let sections = ["fundamentos"]

    override func setUp() { continueAfterFailure = false }

    func testHomeAndSections() throws {
        let app = XCUIApplication()
        app.launch()
        try app.performAccessibilityAudit()
        for id in sections {
            let row = app.buttons["section-\(id)"].firstMatch
            XCTAssertTrue(row.waitForExistence(timeout: 5), "No existe la fila de \(id)")
            row.tap()
            try app.performAccessibilityAudit()
            app.navigationBars.buttons.firstMatch.tap()
        }
    }
}
