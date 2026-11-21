import XCTest

/// Auditoría de accesibilidad de Apple (`performAccessibilityAudit`) sobre cada pantalla del catálogo: contraste, tamaño de toque,
/// etiquetas, Dynamic Type y elementos cortados. Equivale a `ZcA11yAudit` de Android. Una sección nueva se agrega a `sections`.
/// Reúne los hallazgos de todas las secciones (con su elemento) en vez de detenerse en el primero.
final class AccessibilityAuditTests: XCTestCase {
    private let sections = ["fundamentos", "atomos", "formularios", "estructura", "dominio", "compra", "cuenta", "acceso"]

    override func setUp() { continueAfterFailure = true }

    private func audit(_ app: XCUIApplication, section: String) throws {
        var found: [String] = []
        try app.performAccessibilityAudit { issue in
            let element = issue.element.map { "\($0.elementType.rawValue) «\($0.label.prefix(60))» id=\($0.identifier)" } ?? "sin elemento"
            found.append("[\(section)] \(issue.auditType.rawValue) · \(issue.compactDescription) · \(element)")
            return true   // atendido: no falla por sí solo; se informa abajo uno por uno
        }
        for issue in found { XCTFail(issue) }
    }

    func testHomeAndSections() throws {
        let app = XCUIApplication()
        app.launch()
        try audit(app, section: "inicio")
        for id in sections {
            let row = app.buttons["section-\(id)"].firstMatch
            guard row.waitForExistence(timeout: 5) else { XCTFail("No existe la fila de \(id)"); continue }
            row.tap()
            try audit(app, section: id)
            app.navigationBars.buttons.firstMatch.tap()
        }
    }
}
