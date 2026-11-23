import Foundation

/// Una celda de una tabla para exportar: texto, número o vacía. Se escribe como literal: `["Nombre", 10.5, nil]`.
public enum ZCCell: Sendable, Equatable, ExpressibleByStringLiteral, ExpressibleByIntegerLiteral, ExpressibleByFloatLiteral, ExpressibleByNilLiteral {
    case text(String)
    case number(Double)
    case empty

    public init(stringLiteral value: String) { self = .text(value) }
    public init(integerLiteral value: Int) { self = .number(Double(value)) }
    public init(floatLiteral value: Double) { self = .number(value) }
    public init(nilLiteral: ()) { self = .empty }
}

/// Una hoja de un libro de Excel: nombre (máx. 31 caracteres) y filas.
public struct ZCXlsxSheet: Sendable, Equatable {
    public let name: String
    public let rows: [[ZCCell]]
    public init(name: String, rows: [[ZCCell]]) { self.name = name; self.rows = rows }
}

/// Exportación de datos tabulares sin librerías (equivale a `toCsv`, `toXlsxSheets` y `exportFileName` de @zonacards/tokens/domain):
/// CSV (UTF-8 con BOM, para que Excel respete tildes) y XLSX mínimo (Office Open XML con cadenas en línea, en un ZIP sin compresión).
/// Las cifras van sin formato (número puro) y las fechas en ISO 8601. El XLSX sale byte por byte igual que el de la web (lo comprueban los vectores).
/// La app guarda o comparte los bytes con su propio selector de archivos (`fileExporter`, `ShareLink`).
public enum ZCExport {
    public static let mimeCSV = "text/csv;charset=utf-8"
    public static let mimeXLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    /// El texto de un número como lo escribe JavaScript: `2.5`, `10`, `1e+21`.
    static func numberText(_ x: Double) -> String {
        if x.isNaN { return "NaN" }
        if x.isInfinite { return x > 0 ? "Infinity" : "-Infinity" }
        if x == 0 { return "0" }
        if x == x.rounded(), abs(x) < 1e21 { return String(format: "%.0f", x) }
        let d = "\(x)"   // los dígitos más cortos que ida y vuelta, como JavaScript
        guard let e = d.firstIndex(where: { $0 == "e" || $0 == "E" }) else { return d }
        let mantissa = String(d[..<e])
        let exp = Int(d[d.index(after: e)...]) ?? 0
        if abs(x) >= 1e21 || abs(x) < 1e-6 { return "\(mantissa)e\(exp >= 0 ? "+" : "-")\(abs(exp))" }
        return Decimal(string: d)?.description ?? d
    }

    private static func text(_ c: ZCCell) -> String {
        switch c {
        case .empty: return ""
        case .text(let s): return s
        case .number(let n): return numberText(n)
        }
    }

    public static func toCSV(_ rows: [[ZCCell]]) -> String {
        func esc(_ c: ZCCell) -> String {
            let s = text(c)
            let special = s.unicodeScalars.contains { $0 == "\"" || $0 == "," || $0 == "\n" || $0 == "\r" }
            return special ? "\"" + s.replacingOccurrences(of: "\"", with: "\"\"") + "\"" : s
        }
        return "\u{FEFF}" + rows.map { $0.map(esc).joined(separator: ",") }.joined(separator: "\r\n")
    }

    private static func xml(_ s: String) -> String {
        s.replacingOccurrences(of: "&", with: "&amp;").replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;").replacingOccurrences(of: "\"", with: "&quot;")
    }

    private static func colName(_ i: Int) -> String {
        var s = ""
        var n = i + 1
        while n > 0 {
            s = String(UnicodeScalar(UInt8(65 + (n - 1) % 26))) + s
            n = (n - 1) / 26
        }
        return s
    }

    private static func sheetXML(_ rows: [[ZCCell]]) -> String {
        var body = ""
        for (ri, r) in rows.enumerated() {
            body += "<row r=\"\(ri + 1)\">"
            for (ci, c) in r.enumerated() {
                let ref = colName(ci) + String(ri + 1)
                switch c {
                case .number(let n) where n.isFinite:
                    body += "<c r=\"\(ref)\"><v>\(numberText(n))</v></c>"
                case .empty:
                    break
                case .text(let s) where s.isEmpty:
                    break
                default:
                    body += "<c r=\"\(ref)\" t=\"inlineStr\"><is><t xml:space=\"preserve\">\(xml(text(c)))</t></is></c>"
                }
            }
            body += "</row>"
        }
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>\(body)</sheetData></worksheet>"
    }

    private static let crcTable: [UInt32] = (0..<256).map { n -> UInt32 in
        var c = UInt32(n)
        for _ in 0..<8 { c = c & 1 != 0 ? 0xedb88320 ^ (c >> 1) : c >> 1 }
        return c
    }

    /// CRC-32 de un ZIP.
    public static func crc32(_ data: [UInt8]) -> UInt32 {
        var c: UInt32 = 0xffffffff
        for b in data { c = crcTable[Int((c ^ UInt32(b)) & 0xff)] ^ (c >> 8) }
        return c ^ 0xffffffff
    }

    private static func u16(_ out: inout [UInt8], _ v: Int) { out.append(UInt8(v & 0xff)); out.append(UInt8((v >> 8) & 0xff)) }
    private static func u32(_ out: inout [UInt8], _ v: UInt32) { u16(&out, Int(v & 0xffff)); u16(&out, Int(v >> 16)) }

    /// ZIP sin compresión (método 0): suficiente para un XLSX de pocas filas y sin dependencias.
    public static func zipStore(_ files: [(name: String, data: String)]) -> [UInt8] {
        var parts: [UInt8] = []
        var central: [UInt8] = []
        for f in files {
            let name = Array(f.name.utf8)
            let data = Array(f.data.utf8)
            let crc = crc32(data)
            let offset = UInt32(parts.count)
            u32(&parts, 0x04034b50); u16(&parts, 20); u16(&parts, 0); u16(&parts, 0); u16(&parts, 0); u16(&parts, 0)
            u32(&parts, crc); u32(&parts, UInt32(data.count)); u32(&parts, UInt32(data.count)); u16(&parts, name.count); u16(&parts, 0)
            parts += name; parts += data
            u32(&central, 0x02014b50); u16(&central, 20); u16(&central, 20); u16(&central, 0); u16(&central, 0); u16(&central, 0); u16(&central, 0)
            u32(&central, crc); u32(&central, UInt32(data.count)); u32(&central, UInt32(data.count)); u16(&central, name.count); u16(&central, 0); u16(&central, 0)
            u16(&central, 0); u16(&central, 0); u32(&central, 0); u32(&central, offset)
            central += name
        }
        var out = parts + central
        u32(&out, 0x06054b50); u16(&out, 0); u16(&out, 0); u16(&out, files.count); u16(&out, files.count)
        u32(&out, UInt32(central.count)); u32(&out, UInt32(parts.count)); u16(&out, 0)
        return out
    }

    /// Libro de Excel con una o más hojas (Office Open XML con cadenas en línea, ZIP sin compresión).
    public static func toXLSX(sheets: [ZCXlsxSheet]) -> Data {
        let head = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
        let rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
        let overrides: String = sheets.indices.map { (i: Int) -> String in
            "<Override PartName=\"/xl/worksheets/sheet\(i + 1).xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>"
        }.joined()
        let sheetTags: String = sheets.enumerated().map { (i: Int, sh: ZCXlsxSheet) -> String in
            let name = xml(String(sh.name.prefix(31)))
            return "<sheet name=\"\(name)\" sheetId=\"\(i + 1)\" r:id=\"rId\(i + 1)\"/>"
        }.joined()
        let relTags: String = sheets.indices.map { (i: Int) -> String in
            "<Relationship Id=\"rId\(i + 1)\" Type=\"\(rel)/worksheet\" Target=\"worksheets/sheet\(i + 1).xml\"/>"
        }.joined()
        var types = head + "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">"
        types += "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>"
        types += "<Default Extension=\"xml\" ContentType=\"application/xml\"/>"
        types += "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>"
        types += overrides + "</Types>"
        var book = head + "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"\(rel)\"><sheets>"
        book += sheetTags + "</sheets></workbook>"
        var bookRels = head + "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
        bookRels += relTags + "</Relationships>"
        var files: [(name: String, data: String)] = [
            ("[Content_Types].xml", types),
            ("_rels/.rels", head + "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"\(rel)/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>"),
            ("xl/workbook.xml", book),
            ("xl/_rels/workbook.xml.rels", bookRels),
        ]
        for (i, sh) in sheets.enumerated() { files.append(("xl/worksheets/sheet\(i + 1).xml", sheetXML(sh.rows))) }
        return Data(zipStore(files))
    }

    /// Libro de una sola hoja.
    public static func toXLSX(rows: [[ZCCell]], sheetName: String = "Datos") -> Data {
        toXLSX(sheets: [ZCXlsxSheet(name: sheetName, rows: rows)])
    }

    /// Nombre de archivo seguro: minúsculas, sin tildes, con fecha ISO. "ventas-por-dia-2026-10-10.xlsx".
    public static func fileName(title: String, ext: String, isoDate: String) -> String {
        var slug = title.decomposedStringWithCanonicalMapping
            .replacingOccurrences(of: "[\u{0300}-\u{036f}]", with: "", options: .regularExpression)
            .lowercased()
            .replacingOccurrences(of: "[^a-z0-9]+", with: "-", options: .regularExpression)
            .replacingOccurrences(of: "^-|-$", with: "", options: .regularExpression)
        slug = String(slug.prefix(60))
        return "\(slug.isEmpty ? "datos" : slug)-\(isoDate).\(ext)"
    }
}
