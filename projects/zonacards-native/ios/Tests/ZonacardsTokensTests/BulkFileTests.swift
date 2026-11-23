import XCTest
@testable import ZonacardsTokens

/// `processFile`: elige CSV o Excel según el contenido y devuelve "archivo inválido" en lo demás.
final class BulkFileTests: XCTestCase {
    private let columns = [
        ZCBulkColumn(key: "code", title: "Código", type: .code, required: true, maxLength: 12),
        ZCBulkColumn(key: "qty", title: "Cantidad", type: .integer, min: 1),
    ]

    func testReadsACsvByExtension() {
        let r = ZCBulk.processFile(fileName: "datos.csv", data: Data("Código;Cantidad\nA-1;5\nB-2;0\n".utf8), columns: columns)
        XCTAssertNil(r.fileError)
        XCTAssertEqual(r.rows.map { $0.error?.code }, [nil, .min])
        XCTAssertEqual(r.rows[0].values, ["code": .text("A-1"), "qty": .integer(5)])
    }

    func testReadsTheFirstSheetOfAnExcelFile() {
        let rows: [[ZCCell]] = [["Código *", "Cantidad"], ["X1", 3], ["X2", 4]]
        let r = ZCBulk.processFile(fileName: "clientes.xlsx", data: ZCExport.toXLSX(rows: rows), columns: columns)
        XCTAssertNil(r.fileError)
        XCTAssertEqual(r.rows.count, 2)
        XCTAssertTrue(r.rows.allSatisfy { $0.error == nil })
    }

    func testReadsAnExcelEvenWithoutAnExtension() {
        let rows: [[ZCCell]] = [["Código", "Cantidad"], ["X1", 3]]
        XCTAssertEqual(ZCBulk.processFile(fileName: "document:1234", data: ZCExport.toXLSX(rows: rows), columns: columns).rows.count, 1)
    }

    func testAnythingElseIsAnInvalidFile() {
        let pdf = Data([0x25, 0x50, 0x44, 0x46, 0x00, 0x01, 0x02])
        XCTAssertEqual(ZCBulk.processFile(fileName: "x.pdf", data: pdf, columns: columns).fileError?.code, .invalidFile)
        let brokenZip = Data([0x50, 0x4B, 3, 4, 0, 0])
        XCTAssertEqual(ZCBulk.processFile(fileName: "x.xlsx", data: brokenZip, columns: columns).fileError?.code, .invalidFile)
    }

    func testAnEmptyFileIsReportedAsEmpty() {
        XCTAssertEqual(ZCBulk.processFile(fileName: "vacio.csv", data: Data(), columns: columns).fileError?.code, .emptyFile)
    }
}
