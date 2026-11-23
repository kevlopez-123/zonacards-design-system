import SwiftUI
import XCTest
import ZonacardsTokens
@testable import ZonacardsUI

/// Importación masiva: los textos de cada error existen y se dibuja en todos los estados, marcas y modos.
final class BulkImportTests: XCTestCase {
    private let columns = [
        ZCBulkColumn(key: "code", title: "Código", type: .code, required: true, maxLength: 12),
        ZCBulkColumn(key: "qty", title: "Cantidad", type: .integer, min: 1, max: 100),
    ]

    private func process(_ rows: [[String]]) -> ZCBulkResult {
        ZCBulk.processMatrix(columns: columns, matrix: [["Código *", "Cantidad"]] + rows)
    }

    func testEveryErrorCodeHasATranslatedText() {
        let params: [String: ZCBulkValue] = ["title": .text("Campo"), "max": .integer(9), "len": .integer(12), "min": .integer(1), "list": .text("A, B"), "row": .integer(3), "n": .integer(7)]
        let codes: [ZCBulkErrorCode] = [.required, .maxLength, .code, .integer, .min, .max, .date, .option, .email, .duplicate, .emptyFile, .missingColumns, .tooManyRows, .invalidFile]
        for code in codes {
            let text = zcBulkErrorText(ZCBulkError(code, field: "x", params: params))
            XCTAssertFalse(text.isEmpty, "\(code)")
            XCTAssertNotEqual(text, "mol.importar.err.\(code.rawValue)", "\(code) no tiene texto en Localizable")
        }
    }

    func testTheErrorTextCarriesItsParameters() {
        let text = zcBulkErrorText(ZCBulkError(.maxLength, field: "name", params: ["title": .text("Nombre"), "max": .integer(20), "len": .integer(25)]))
        XCTAssertTrue(text.contains("Nombre") && text.contains("20") && text.contains("25"), text)
    }

    func testTemplateLabelsAreTranslated() {
        let l = zcBulkTemplateLabels()
        for t in [l.data, l.instructions, l.column, l.required, l.whatToWrite, l.example, l.yes, l.no] {
            XCTAssertFalse(t.isEmpty)
            XCTAssertFalse(t.hasPrefix("mol.importar"), t)
        }
    }

    @MainActor
    func testEveryStateRendersInEveryBrandAndMode() {
        let states: [ZCBulkResult?] = [
            nil,
            process([["A-1", "5"], ["", "3"], ["B-2", "999"], ["C-3", "7"]]),   // válidas y con errores
            process([["A-1", "5"], ["A-2", "6"]]),                              // todo válido
            process([["", "1"], ["X", "0"]]),                                   // sin filas válidas
            ZCBulkResult(rows: [], fileError: ZCBulkError(.missingColumns, params: ["list": .text("Código")])),
            ZCBulkResult(rows: [], fileError: ZCBulkError(.invalidFile)),
        ]
        for brand in ZCBrand.allCases {
            for dark in [false, true] {
                for result in states {
                    let view = ZCThemeProvider(brand: brand, dark: dark) {
                        ZCBulkImportBody(result: result, onTemplate: {}, onPick: {}, onImport: { _ in }).padding()
                    }
                    let host = UIHostingController(rootView: view)
                    host.loadViewIfNeeded()
                    host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 1400)
                    host.view.layoutIfNeeded()
                    XCTAssertGreaterThan(host.view.intrinsicContentSize.height, 0, "\(brand) \(dark)")
                }
            }
        }
    }
}
