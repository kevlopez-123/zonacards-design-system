import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Grupo de casillas, conjunto de campos con leyenda y autocomplete: se dibujan en todas las marcas y modos, y sus textos existen.
final class GroupsTests: XCTestCase {
    func testAutocompleteTextsAreTranslated() {
        for key in ["ui.buscando", "ui.escribeMinimo", "ui.sinResultadosAyuda", "ui.crearTexto", "ui.buscarOpcion"] {
            let text = ZCString.text(key, "x")
            XCTAssertFalse(text.isEmpty, key)
            XCTAssertNotEqual(text, key, "\(key) no tiene texto en Localizable")
        }
    }

    @MainActor
    private func render<V: View>(_ view: V, brand: ZCBrand, dark: Bool) {
        let host = UIHostingController(rootView: ZCThemeProvider(brand: brand, dark: dark) { view.padding() })
        host.loadViewIfNeeded()
        host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 900)
        host.view.layoutIfNeeded()
        XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
    }

    @MainActor
    func testGroupsRenderInEveryBrandAndMode() {
        let options = [ZCCheckboxOption("a", label: "Correo"), ZCCheckboxOption("b", label: "WhatsApp", description: "Solo en Perú"), ZCCheckboxOption("c", label: "SMS", enabled: false)]
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                render(ZCCheckboxGroup("Canales", options: options, selection: .constant(["a"]), hint: "Elige al menos uno.", required: true, selectAllLabel: "Todos"), brand: brand, dark: dark)
                render(ZCCheckboxGroup("Canales", options: options, selection: .constant([]), error: "Elige un canal.", horizontal: true), brand: brand, dark: dark)
                render(ZCFieldset("Datos de contacto", description: "Para avisarte.", bordered: true) { Text("Contenido") }, brand: brand, dark: dark)
                render(ZCFieldset("Sin borde") { Text("Contenido") }, brand: brand, dark: dark)
                let found = [ZCOption("1", label: "Ana Pérez"), ZCOption("2", label: "Ana Soto")]
                render(ZCAutocomplete("Cliente", options: found, selection: .constant(found[0]), onQueryChange: { _ in }, hint: "Escribe al menos 2 letras.", onCreate: { _ in }), brand: brand, dark: dark)
                render(ZCAutocomplete("Cliente", options: [ZCOption<String>](), selection: .constant(nil), onQueryChange: { _ in }, loading: true), brand: brand, dark: dark)
            }
        }
    }
}
