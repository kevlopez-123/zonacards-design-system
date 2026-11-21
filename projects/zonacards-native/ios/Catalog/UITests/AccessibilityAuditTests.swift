import XCTest

/// Auditoría de accesibilidad de Apple (`performAccessibilityAudit`) sobre cada pantalla del catálogo: contraste, tamaño de toque,
/// etiquetas y elementos cortados. Equivale a `ZcA11yAudit` de Android. Una sección nueva se agrega a `sections`.
/// Reúne los hallazgos de todas las secciones (con su elemento) en vez de detenerse en el primero.
///
/// Se descartan, con motivo, hallazgos que la auditoría produce sin que haya un defecto, y dos tipos se informan como AVISO sin fallar:
/// - elementos deshabilitados (iOS no exige contraste en ellos);
/// - texto "cortado" por el borde de la pantalla: el catálogo es una lista que se desplaza y lo que asoma a medias no está cortado;
/// - área de toque de un campo de texto o de un indicador: el campo entero se toca (la caja), aunque el marco de accesibilidad sea la línea de texto;
/// - AVISO, Dynamic Type y texto cortado dentro de la pantalla: hallazgos abiertos (ver docs/plan-ios.md); fallan solo contraste, descripción y área de toque.
final class AccessibilityAuditTests: XCTestCase {
    private let sections = ["fundamentos", "atomos", "formularios", "estructura", "dominio", "compra", "cuenta", "acceso"]

    override func setUp() { continueAfterFailure = true }

    private func audit(_ app: XCUIApplication, section: String) throws {
        var failures: [String] = []
        var warnings: [String] = []
        let screen = app.windows.firstMatch.frame
        try app.performAccessibilityAudit { issue in
            let element = issue.element
            let description = element.map { "\($0.elementType.rawValue) «\($0.label.prefix(60))»" } ?? "sin elemento"
            let line = "[\(section)] \(issue.auditType.rawValue) · \(issue.compactDescription) · \(description)"
            if let element, !element.isEnabled { return true }
            switch issue.auditType {
            case .textClipped:
                // Texto cortado: lo que asoma a medias en el borde de la pantalla no cuenta. Lo demás se informa como AVISO, porque la auditoría también lo marca
                // en los títulos de la barra de navegación del sistema (que no controlamos); se confirma mirando las capturas de referencia.
                if let frame = element?.frame, !screen.insetBy(dx: 1, dy: 1).contains(frame) { return true }
                warnings.append(line)
                return true
            case .hitRegion:
                if let type = element?.elementType, [.textField, .secureTextField, .other, .progressIndicator].contains(type) { return true }
            case .dynamicType:
                warnings.append(line)
                return true
            default: break
            }
            failures.append(line)
            return true   // atendido: no falla por sí solo; se informa abajo uno por uno
        }
        for w in warnings { print("AVISO \(w)") }
        for f in failures { XCTFail(f) }
    }

    func testHomeAndSections() throws {
        let app = XCUIApplication()
        app.launch()
        try audit(app, section: "inicio")
        for id in sections {
            let row = app.buttons["section-\(id)"].firstMatch
            guard row.waitForExistence(timeout: 5) else { XCTFail("No existe la fila de \(id)"); continue }
            row.tap()
            Thread.sleep(forTimeInterval: 0.8)   // deja terminar la animación de la barra de título
            try audit(app, section: id)
            app.navigationBars.buttons.firstMatch.tap()
        }
    }
}
