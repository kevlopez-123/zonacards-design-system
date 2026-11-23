import XCTest
@testable import ZonacardsTokens

/// Importar y exportar: corre los casos de domain-vectors.json que salen del motor de la web (`processMatrix`, `parseCsv`, `toCsv`,
/// `toXlsxSheets`, `readXlsx`, `bulkTemplate`, `exportFileName`). El XLSX que escribimos debe salir byte por byte igual que el de la web.
final class BulkVectorsTests: XCTestCase {
    private static let v: [String: Any] = {
        let url = Bundle.module.url(forResource: "domain-vectors", withExtension: "json")!
        return try! JSONSerialization.jsonObject(with: Data(contentsOf: url)) as! [String: Any]
    }()
    private func cases(_ g: String) -> [[String: Any]] { Self.v[g] as! [[String: Any]] }

    /// Forma canónica para comparar (llaves ordenadas; 5.0 y 5 son lo mismo).
    private func canon(_ x: Any?) -> String {
        switch x {
        case nil, is NSNull: return "null"
        case let s as String: return "\"\(s)\""
        case let n as NSNumber:
            let d = n.doubleValue
            return d == d.rounded() && abs(d) < 1e15 ? String(Int(d)) : "\(d)"
        case let m as [String: Any]: return "{" + m.keys.sorted().map { "\"\($0)\":\(canon(m[$0]))" }.joined(separator: ",") + "}"
        case let a as [Any]: return "[" + a.map { canon($0) }.joined(separator: ",") + "]"
        default: return "?\(String(describing: x))"
        }
    }

    private func check(_ group: String, _ run: ([String: Any]) -> (Any?, Any?)) {
        var fails: [String] = []
        let all = cases(group)
        for c in all {
            let (expected, actual) = run(c)
            if canon(expected) != canon(actual) {
                fails.append("\(c["name"] ?? c["s"] ?? c["text"] ?? "?")\n    esperado: \(canon(expected))\n    obtenido: \(canon(actual))")
            }
        }
        XCTAssert(fails.isEmpty, "\(group): \(fails.count) de \(all.count) no coinciden\n" + fails.prefix(10).joined(separator: "\n"))
    }

    private func cell(_ x: Any?) -> ZCCell {
        if let s = x as? String { return .text(s) }
        if let n = x as? NSNumber { return .number(n.doubleValue) }
        return .empty
    }

    private func columns(_ x: Any?) -> [ZCBulkColumn] {
        (x as! [[String: Any]]).map { c in
            let type: ZCBulkType
            switch c["type"] as! String {
            case "text": type = .text
            case "code": type = .code
            case "integer": type = .integer
            case "date": type = .date
            case "option": type = .option
            default: type = .email
            }
            return ZCBulkColumn(key: c["key"] as! String, title: c["title"] as! String, type: type, required: (c["required"] as? Bool) ?? false,
                                maxLength: (c["maxLength"] as? NSNumber)?.intValue, min: (c["min"] as? NSNumber)?.intValue, max: (c["max"] as? NSNumber)?.intValue,
                                options: (c["options"] as? [String]) ?? [], help: (c["help"] as? String) ?? "", example: cell(c["example"]),
                                aliases: (c["aliases"] as? [String]) ?? [])
        }
    }

    private func value(_ v: ZCBulkValue) -> Any {
        switch v {
        case .text(let s): return s
        case .integer(let n): return NSNumber(value: n)
        }
    }

    private func errorMap(_ e: ZCBulkError) -> [String: Any] {
        var m: [String: Any] = ["code": e.code.rawValue]
        if let f = e.field { m["field"] = f }
        if !e.params.isEmpty { m["params"] = e.params.mapValues(value) }
        return m
    }

    func testProcessMatrix() {
        check("bulk") { c in
            let keyFields = c["keyFields"] as? [String]
            let keyOf: (([String: ZCBulkValue]) -> String)? = keyFields.map { fields in
                { values in
                    fields.map { f -> String in
                        switch values[f] {
                        case .text(let s)?: return s
                        case .integer(let n)?: return String(n)
                        case nil: return ""
                        }
                    }.joined(separator: "|")
                }
            }
            let matrix = (c["matrix"] as! [[String]])
            let result = ZCBulk.processMatrix(columns: columns(c["columns"]), matrix: matrix, keyOf: keyOf, maxRows: (c["maxRows"] as? NSNumber)?.intValue)
            var actual: [String: Any] = [:]
            actual["rows"] = result.rows.map { r -> [String: Any] in
                var m: [String: Any] = ["row": NSNumber(value: r.row), "values": r.values.mapValues(value)]
                if let e = r.error { m["error"] = errorMap(e) }
                return m
            }
            if let e = result.fileError { actual["fileError"] = errorMap(e) }
            return (c["out"], actual)
        }
    }

    func testParseDate() { check("bulkDate") { c in (c["out"], ZCBulk.parseDate(c["s"] as! String)) } }

    func testParseCSV() { check("csvParse") { c in (c["out"], ZCBulk.parseCSV(c["text"] as! String)) } }

    func testToCSV() {
        check("csvOut") { c in
            let rows = (c["rows"] as! [[Any]]).map { $0.map(cell) }
            let csv = ZCExport.toCSV(rows)
            // JSONSerialization quita el BOM del principio de los textos del JSON: el esperado llega sin él, así que se compara sin BOM y el BOM se exige aparte.
            XCTAssertTrue(csv.hasPrefix("\u{FEFF}"), "el CSV debe empezar con BOM")
            return (c["out"], String(csv.unicodeScalars.dropFirst()))
        }
    }

    func testParseCSVIgnoresTheBOM() {
        XCTAssertEqual(ZCBulk.parseCSV("\u{FEFF}a,b\r\n1,2\r\n"), [["a", "b"], ["1", "2"]])
    }

    func testFileName() { check("fileName") { c in (c["out"], ZCExport.fileName(title: c["title"] as! String, ext: c["ext"] as! String, isoDate: c["iso"] as! String)) } }

    func testTemplate() {
        check("template") { c in
            let l = c["labels"] as! [String: String]
            let labels = ZCBulkTemplateLabels(data: l["data"]!, instructions: l["instructions"]!, column: l["column"]!, required: l["required"]!,
                                              whatToWrite: l["whatToWrite"]!, example: l["example"]!, yes: l["yes"]!, no: l["no"]!)
            let sheets = ZCBulk.template(columns: columns(c["columns"]), labels: labels)
            let actual: [[String: Any]] = sheets.map { s in
                ["name": s.name, "rows": s.rows.map { r in r.map { cell -> Any in
                    switch cell {
                    case .text(let t): return t
                    case .number(let n): return NSNumber(value: n)
                    case .empty: return NSNull()
                    }
                } }]
            }
            return (c["out"], actual)
        }
    }

    private func sheets(_ x: Any?) -> [ZCXlsxSheet] {
        (x as! [[String: Any]]).map { s in ZCXlsxSheet(name: s["name"] as! String, rows: (s["rows"] as! [[Any]]).map { $0.map(cell) }) }
    }

    func testXlsxIsByteForByteTheSameAsTheWeb() {
        let all = cases("xlsxOut")
        XCTAssertFalse(all.isEmpty)
        for c in all {
            let expected = Data(base64Encoded: c["base64"] as! String)!
            let actual = ZCExport.toXLSX(sheets: sheets(c["sheets"]))
            XCTAssertEqual(actual.base64EncodedString(), expected.base64EncodedString(), "bytes del libro")
            XCTAssertEqual(UInt32(truncating: c["crc"] as! NSNumber), ZCExport.crc32([UInt8](actual)))
        }
    }

    func testReadXlsx() throws {
        let all = cases("xlsxRead")
        XCTAssertGreaterThanOrEqual(all.count, 8)
        for c in all {
            let bytes = Data(base64Encoded: c["base64"] as! String)!
            if (c["out"] as? String) == "error" {
                XCTAssertThrowsError(try ZCXlsx.read(bytes), "\(c["name"] ?? "")")
            } else {
                let actual = try ZCXlsx.read(bytes).map { ["name": $0.name, "rows": $0.rows] as [String: Any] }
                XCTAssertEqual(canon(actual), canon(c["out"]), "\(c["name"] ?? "")")
            }
        }
    }

    func testWhatWeWriteWeCanRead() throws {
        let rows: [[ZCCell]] = [["Código", "Monto"], ["A-1", 10.5], ["ñandú & <b>", 0]]
        let read = try ZCXlsx.read(ZCExport.toXLSX(rows: rows))
        XCTAssertEqual(read.first?.rows, [["Código", "Monto"], ["A-1", "10.5"], ["ñandú & <b>", "0"]])
    }
}
