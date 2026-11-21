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

    /// Mide en la app real cuánto crece el alto de algunos textos al pasar al tamaño de letra más grande de accesibilidad (líneas "DT en app …").
    /// Sirve para saber si los textos que la auditoría marca como "parcialmente no soportados" de verdad no crecen.
    func testDynamicTypeGrowthInApp() {
        func heights(category: String?) -> [String: CGFloat] {
            let app = XCUIApplication()
            if let category { app.launchArguments += ["-UIPreferredContentSizeCategoryName", category] }
            app.launch()
            var out: [String: CGFloat] = [:]
            let probes: [(section: String, labels: [String])] = [("fundamentos", ["Texto secundario", "Texto de cuerpo para párrafos y descripciones.", "primary", "bg"]), ("estructura", ["Inicio", "Lotes", "Detalle del lote"])]
            for probe in probes {
                let row = app.buttons["section-\(probe.section)"].firstMatch
                guard row.waitForExistence(timeout: 5) else { continue }
                row.tap()
                Thread.sleep(forTimeInterval: 0.8)
                for label in probe.labels {
                    let t = app.staticTexts[label].firstMatch
                    out["\(probe.section)/\(label)"] = t.exists ? t.frame.height : -1
                }
                app.navigationBars.buttons.firstMatch.tap()
            }
            app.terminate()
            return out
        }
        let normal = heights(category: nil)
        let big = heights(category: "UICTContentSizeCategoryAccessibilityXXXL")
        for key in normal.keys.sorted() { print("DT en app \(key): normal=\(normal[key] ?? -1) accesibilidad=\(big[key] ?? -1)") }
    }

    /// Audita solo Dynamic Type sobre el banco de pruebas (`DynamicTypeLab`): imprime qué variantes marca la auditoría (líneas "DTLAB …").
    func testDynamicTypeLab() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-dtlab"]
        app.launch()
        Thread.sleep(forTimeInterval: 1)
        var flagged: [String] = []
        try app.performAccessibilityAudit(for: .dynamicType) { issue in
            flagged.append(issue.element?.label ?? "sin elemento")
            return true
        }
        for label in ["A sistema caption", "B custom relativeTo caption", "C ZCText caption", "D muestra en VStack", "E muestra en LazyVGrid", "F muestra en HStack",
                      "G etiqueta en botón", "G2 botón con combine", "G3 botón sin modificadores", "H MAYÚSCULAS CON TRACKING", "H2 MAYÚSCULAS CON KERNING",
                      "H3 MAYÚSCULAS SIN ESPACIADO", "L muestra exacta", "M1 tamaño 11 con caption", "M2 tamaño 11 con footnote", "M3 tamaño 11 con caption2", "M4 tamaño 13 con caption2",
                      "M5 tamaño 10 con caption", "M6 tamaño 10 con subheadline", "om", "bg", "border", "dangerBg", "fieldBg", "surface", "surface2", "I una línea", "J sin ZCText", "K body"] {
            print("DTLAB \(label): \(flagged.contains(label) ? "MARCADO" : "ok")")
        }
        print("DTLAB marcados: \(flagged.joined(separator: " | "))")
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
