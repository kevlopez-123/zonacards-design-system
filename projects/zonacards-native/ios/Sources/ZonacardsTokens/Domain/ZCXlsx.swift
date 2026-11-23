import Compression
import Foundation

/// El archivo no es un ZIP o un XLSX legible.
public struct ZCInvalidWorkbook: Error, Equatable {
    public let reason: String
}

/// Una hoja leída: nombre y filas con todas las columnas como texto (vacío si la celda no tiene valor).
public struct ZCSheetRead: Sendable, Equatable {
    public let name: String
    public let rows: [[String]]
}

/// Lector de libros de Excel (.xlsx) sin librerías (equivale a `readXlsx` de @zonacards/tokens/domain): abre el ZIP, descomprime con el framework
/// Compression y devuelve cada hoja como una matriz de textos. No evalúa fórmulas: lee el último valor guardado. La app le pasa los bytes del
/// archivo que eligió el usuario (`fileImporter`). Lanza `ZCInvalidWorkbook` si no es un Excel válido.
public enum ZCXlsx {
    private struct ZipEntry { let method: Int; let compressed: Int; let uncompressed: Int; let offset: Int }

    private static func u16(_ b: [UInt8], _ o: Int) -> Int { Int(b[o]) | (Int(b[o + 1]) << 8) }
    private static func u32(_ b: [UInt8], _ o: Int) -> Int { u16(b, o) | (u16(b, o + 2) << 16) }
    private static let invalidZip = ZCInvalidWorkbook(reason: "zip")

    private static func zipEntries(_ buf: [UInt8]) throws -> [String: ZipEntry] {
        var end = -1
        var i = buf.count - 22
        let lowest = max(0, buf.count - 65557)
        while i >= lowest {
            if u32(buf, i) == 0x06054b50 { end = i; break }
            i -= 1
        }
        if end < 0 { throw invalidZip }
        let total = u16(buf, end + 10)
        var o = u32(buf, end + 16)
        var map: [String: ZipEntry] = [:]
        for _ in 0..<total {
            if o < 0 || o + 46 > buf.count || u32(buf, o) != 0x02014b50 { throw invalidZip }
            let method = u16(buf, o + 10)
            let compressed = u32(buf, o + 20)
            let uncompressed = u32(buf, o + 24)
            let nameLen = u16(buf, o + 28)
            let extraLen = u16(buf, o + 30)
            let commentLen = u16(buf, o + 32)
            let offset = u32(buf, o + 42)
            if o + 46 + nameLen > buf.count { throw invalidZip }
            let name = String(decoding: buf[(o + 46)..<(o + 46 + nameLen)], as: UTF8.self)
            map[name] = ZipEntry(method: method, compressed: compressed, uncompressed: uncompressed, offset: offset)
            o += 46 + nameLen + extraLen + commentLen
        }
        return map
    }

    private static func entryBytes(_ buf: [UInt8], _ e: ZipEntry) throws -> [UInt8] {
        if e.offset < 0 || e.offset + 30 > buf.count || u32(buf, e.offset) != 0x04034b50 { throw invalidZip }
        let start = e.offset + 30 + u16(buf, e.offset + 26) + u16(buf, e.offset + 28)
        if e.compressed < 0 || start + e.compressed > buf.count { throw invalidZip }
        let data = Array(buf[start..<(start + e.compressed)])
        if e.method == 0 { return data }
        if e.method != 8 { throw invalidZip }
        // Un libro de importación no pasa de 64 MB descomprimido (protege de archivos que se expanden sin medida).
        if e.uncompressed < 0 || e.uncompressed > 64 * 1024 * 1024 { throw invalidZip }
        if e.uncompressed == 0 { return [] }
        if data.isEmpty { throw invalidZip }
        let size = e.uncompressed
        var out = [UInt8](repeating: 0, count: size)
        // COMPRESSION_ZLIB de Apple es deflate crudo (sin cabecera zlib), que es lo que guarda un ZIP.
        let written = out.withUnsafeMutableBufferPointer { dst in
            data.withUnsafeBufferPointer { src in
                compression_decode_buffer(dst.baseAddress!, size, src.baseAddress!, data.count, nil, COMPRESSION_ZLIB)
            }
        }
        if written != size { throw invalidZip }
        return out
    }

    // MARK: XML

    private final class Node {
        let name: String
        var attrs: [String: String]
        var children: [Node] = []
        var text = ""
        init(name: String, attrs: [String: String]) { self.name = name; self.attrs = attrs }

        func descendants(_ tag: String) -> [Node] {
            var out: [Node] = []
            for c in children { if c.name == tag { out.append(c) }; out += c.descendants(tag) }
            return out
        }

        var textContent: String { text + children.map(\.textContent).joined() }
    }

    private final class Builder: NSObject, XMLParserDelegate {
        var root: Node?
        var stack: [Node] = []

        func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?, qualifiedName qName: String?, attributes attributeDict: [String: String] = [:]) {
            let node = Node(name: elementName, attrs: attributeDict)
            if let top = stack.last { top.children.append(node) } else { root = node }
            stack.append(node)
        }

        func parser(_ parser: XMLParser, didEndElement elementName: String, namespaceURI: String?, qualifiedName qName: String?) { _ = stack.popLast() }
        func parser(_ parser: XMLParser, foundCharacters string: String) { stack.last?.text += string }
        func parser(_ parser: XMLParser, foundCDATA CDATABlock: Data) { stack.last?.text += String(decoding: CDATABlock, as: UTF8.self) }
    }

    private static func parse(_ xml: String) throws -> Node {
        let parser = XMLParser(data: Data(xml.utf8))
        let builder = Builder()
        parser.delegate = builder
        parser.shouldResolveExternalEntities = false
        guard parser.parse(), let root = builder.root else { throw ZCInvalidWorkbook(reason: "xml") }
        return root
    }

    // MARK: Lectura

    /// Índice de columna (0 = A) de una referencia de celda («C12»).
    public static func columnIndex(_ ref: String) -> Int {
        var n = 0
        for u in ref.unicodeScalars {
            if u.value < 65 || u.value > 90 { break }
            n = n * 26 + Int(u.value) - 64
        }
        return n - 1
    }

    /// Fecha de un número de serie de Excel (días desde 1899-12-30) en formato AAAA-MM-DD.
    public static func serialToDate(_ n: Double) -> String {
        // 25569 días separan 1899-12-30 de 1970-01-01; luego el algoritmo de fecha civil (calendario gregoriano proléptico).
        let z = Int((n + 0.5).rounded(.down)) - 25569 + 719468
        let era = (z >= 0 ? z : z - 146096) / 146097
        let doe = z - era * 146097
        let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365
        var y = yoe + era * 400
        let doy = doe - (365 * yoe + yoe / 4 - yoe / 100)
        let mp = (5 * doy + 2) / 153
        let d = doy - (153 * mp + 2) / 5 + 1
        let m = mp < 10 ? mp + 3 : mp - 9
        if m <= 2 { y += 1 }
        return String(format: "%04ld-%02ld-%02ld", y, m, d)
    }

    /// Lee todas las hojas del libro.
    public static func read(_ data: Data) throws -> [ZCSheetRead] {
        let buf = [UInt8](data)
        let entries = try zipEntries(buf)
        func text(_ path: String) throws -> String {
            guard let e = entries[path] else { return "" }
            return String(decoding: try entryBytes(buf, e), as: UTF8.self)
        }
        let book = try text("xl/workbook.xml")
        if book.isEmpty { throw ZCInvalidWorkbook(reason: "xlsx") }
        var target: [String: String] = [:]
        let rels = try text("xl/_rels/workbook.xml.rels")
        if !rels.isEmpty {
            for r in try parse(rels).descendants("Relationship") {
                let t = (r.attrs["Target"] ?? "").replacingOccurrences(of: "^/?(xl/)?", with: "xl/", options: .regularExpression)
                target[r.attrs["Id"] ?? ""] = t
            }
        }
        var shared: [String] = []
        let ss = try text("xl/sharedStrings.xml")
        if !ss.isEmpty {
            for si in try parse(ss).descendants("si") { shared.append(si.descendants("t").map(\.textContent).joined()) }
        }

        var sheets: [ZCSheetRead] = []
        for s in try parse(book).descendants("sheet") {
            let rid = s.attrs["r:id"] ?? ""
            let body = target[rid].map { (try? text($0)) ?? "" } ?? ""
            if body.isEmpty { continue }
            var rows: [[String]] = []
            for row in try parse(body).descendants("row") {
                let r = (Int(row.attrs["r"] ?? "") ?? (rows.count + 1)) - 1
                var cells: [String] = []
                for c in row.descendants("c") {
                    let col = columnIndex(c.attrs["r"] ?? "")
                    if col < 0 { continue }
                    let type = c.attrs["t"] ?? ""
                    let v = c.descendants("v").first?.textContent ?? ""
                    var value = v
                    switch type {
                    case "s": value = Int(v.trimmingCharacters(in: .whitespaces)).flatMap { $0 >= 0 && $0 < shared.count ? shared[$0] : nil } ?? ""
                    case "inlineStr": value = c.descendants("t").map(\.textContent).joined()
                    case "b": value = v == "1" ? "VERDADERO" : "FALSO"
                    default: break
                    }
                    while cells.count <= col { cells.append("") }
                    cells[col] = value.trimmingCharacters(in: .whitespacesAndNewlines)
                }
                while let last = cells.last, last.isEmpty { cells.removeLast() }
                if r < 0 { continue }
                while rows.count <= r { rows.append([]) }
                rows[r] = cells
            }
            let name = (s.attrs["name"] ?? "").isEmpty ? "Hoja \(sheets.count + 1)" : s.attrs["name"]!
            sheets.append(ZCSheetRead(name: name, rows: rows))
        }
        if sheets.isEmpty { throw ZCInvalidWorkbook(reason: "xlsx") }
        return sheets
    }
}
