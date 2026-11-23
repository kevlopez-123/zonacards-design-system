import Foundation

/// Motor de las importaciones masivas (equivale a `processMatrix` de @zonacards/tokens/domain): convierte las filas de una hoja en valores
/// validados, fila por fila, sin que una fila mala frene a las demás. Es puro (sin UI ni red) y lo comprueban los mismos casos que la web
/// (domain-vectors.json). Los errores salen como códigos con parámetros; se traducen al dibujar con la clave `mol.importar.err.<rawValue>`.
///
/// Reglas: la primera fila es el encabezado (se reconoce sin tildes, sin «*» y sin importar mayúsculas); las filas totalmente vacías se
/// ignoran; las columnas obligatorias deben venir con dato; una llave (`keyOf`) repetida se rechaza a partir de la segunda.
public enum ZCBulkType: Sendable { case text, code, integer, date, option, email }

/// Columna de una importación. `example` es texto o número (va en la plantilla).
public struct ZCBulkColumn: Sendable {
    public let key: String
    public let title: String
    public let type: ZCBulkType
    public let required: Bool
    public let maxLength: Int?
    public let min: Int?
    public let max: Int?
    /// Valores permitidos (tipo `.option`).
    public let options: [String]
    /// Qué escribir (va en la hoja de instrucciones de la plantilla).
    public let help: String
    public let example: ZCCell
    /// Otros nombres con los que se reconoce el encabezado.
    public let aliases: [String]

    public init(key: String, title: String, type: ZCBulkType, required: Bool = false, maxLength: Int? = nil, min: Int? = nil, max: Int? = nil,
                options: [String] = [], help: String = "", example: ZCCell = "", aliases: [String] = []) {
        self.key = key; self.title = title; self.type = type; self.required = required; self.maxLength = maxLength; self.min = min; self.max = max
        self.options = options; self.help = help; self.example = example; self.aliases = aliases
    }
}

/// Códigos de error de una fila o del archivo; el `rawValue` es el de i18n (`mol.importar.err.<rawValue>`).
public enum ZCBulkErrorCode: String, Sendable {
    case required, maxLength, code, integer, min, max, date, option, email, duplicate, emptyFile, missingColumns, tooManyRows, invalidFile
}

/// Un valor convertido (texto o entero) o un parámetro de error.
public enum ZCBulkValue: Sendable, Equatable {
    case text(String)
    case integer(Int)
}

/// Un error con sus parámetros (`title`, `max`, `len`, `min`, `list`, `row`, `n`) para completar el texto traducido.
public struct ZCBulkError: Sendable, Equatable {
    public let code: ZCBulkErrorCode
    public let field: String?
    public let params: [String: ZCBulkValue]
    public init(_ code: ZCBulkErrorCode, field: String? = nil, params: [String: ZCBulkValue] = [:]) {
        self.code = code; self.field = field; self.params = params
    }
}

/// `row` es el número de fila en el archivo (2 = primera fila de datos); `values` trae solo las columnas con dato.
public struct ZCBulkRow: Sendable, Equatable {
    public let row: Int
    public let values: [String: ZCBulkValue]
    public let error: ZCBulkError?
}

/// `fileError` indica que el archivo no se puede procesar (faltan columnas, está vacío…).
public struct ZCBulkResult: Sendable, Equatable {
    public let rows: [ZCBulkRow]
    public let fileError: ZCBulkError?
}

/// Rótulos de la plantilla (ya traducidos por quien la pide).
public struct ZCBulkTemplateLabels: Sendable {
    public let data, instructions, column, required, whatToWrite, example, yes, no: String
    public init(data: String, instructions: String, column: String, required: String, whatToWrite: String, example: String, yes: String, no: String) {
        self.data = data; self.instructions = instructions; self.column = column; self.required = required
        self.whatToWrite = whatToWrite; self.example = example; self.yes = yes; self.no = no
    }
}

public enum ZCBulk {
    private static func matches(_ pattern: String, _ s: String) -> Bool { s.range(of: pattern, options: .regularExpression) != nil }

    private static func trimmed(_ s: String) -> String { s.trimmingCharacters(in: .whitespacesAndNewlines) }

    public static func stripAccents(_ s: String) -> String {
        trimmed(s.decomposedStringWithCanonicalMapping.replacingOccurrences(of: "[\u{0300}-\u{036f}]", with: "", options: .regularExpression)).lowercased()
    }

    /// Encabezado normalizado: sin tildes, sin «*», en minúsculas.
    public static func normalizeHeader(_ s: String) -> String { stripAccents(s.replacingOccurrences(of: "*", with: "")) }

    private static func daysIn(_ y: Int, _ m: Int) -> Int {
        switch m {
        case 2: return (y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)) ? 29 : 28
        case 4, 6, 9, 11: return 30
        default: return 31
        }
    }

    /// Fecha AAAA-MM-DD, dd/mm/aaaa o número de serie de Excel → «AAAA-MM-DD» (o `nil`).
    public static func parseDate(_ s: String) -> String? {
        let iso: String
        if matches("^[0-9]{4}-[0-9]{2}-[0-9]{2}$", s) {
            iso = s
        } else if matches("^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$", s) {
            let p = s.components(separatedBy: "/")
            func pad(_ x: String) -> String { x.count < 2 ? "0" + x : x }
            iso = "\(p[2])-\(pad(p[1]))-\(pad(p[0]))"
        } else if matches("^[0-9]{5}(\\.[0-9]+)?$", s), let n = Double(s), n > 20000, n < 90000 {
            iso = ZCXlsx.serialToDate(n)
        } else {
            return nil
        }
        let parts = iso.components(separatedBy: "-")
        guard parts.count == 3, let y = Int(parts[0]), let m = Int(parts[1]), let d = Int(parts[2]), (1...12).contains(m), d >= 1, d <= daysIn(y, m) else { return nil }
        return iso
    }

    private enum Conversion {
        case ok(ZCBulkValue)
        case bad(ZCBulkError)
    }

    private static func bad(_ c: ZCBulkColumn, _ code: ZCBulkErrorCode, _ extra: [String: ZCBulkValue] = [:]) -> Conversion {
        var params: [String: ZCBulkValue] = ["title": .text(c.title)]
        for (k, v) in extra { params[k] = v }
        return .bad(ZCBulkError(code, field: c.key, params: params))
    }

    private static func convert(_ c: ZCBulkColumn, _ raw: String) -> Conversion {
        let s = trimmed(raw)
        func tooLong(_ t: String) -> Conversion? {
            guard let maxLength = c.maxLength, t.utf16.count > maxLength else { return nil }
            return bad(c, .maxLength, ["max": .integer(maxLength), "len": .integer(t.utf16.count)])
        }
        switch c.type {
        case .text:
            return tooLong(s) ?? .ok(.text(s))
        case .code:
            if !matches("^[A-Za-z0-9][A-Za-z0-9._-]*$", s) { return bad(c, .code) }
            return tooLong(s) ?? .ok(.text(s))
        case .integer:
            if !matches("^-?[0-9]+(\\.0+)?$", s) { return bad(c, .integer) }
            let whole = s.replacingOccurrences(of: "\\.0+$", with: "", options: .regularExpression)
            guard let n = Int(whole) else { return bad(c, .integer) }
            if let min = c.min, n < min { return bad(c, .min, ["min": .integer(min)]) }
            if let max = c.max, n > max { return bad(c, .max, ["max": .integer(max)]) }
            return .ok(.integer(n))
        case .date:
            if let f = parseDate(s) { return .ok(.text(f)) }
            return bad(c, .date)
        case .option:
            if let found = c.options.first(where: { stripAccents($0) == stripAccents(s) }) { return .ok(.text(found)) }
            return bad(c, .option, ["list": .text(c.options.joined(separator: ", "))])
        case .email:
            if !matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", s) { return bad(c, .email) }
            return tooLong(s) ?? .ok(.text(s.lowercased()))
        }
    }

    private static func hasData(_ cells: [String]) -> Bool { cells.contains { !trimmed($0).isEmpty } }

    /// Procesa la matriz de una hoja. `keyOf` arma la llave que identifica cada fila (las repetidas se rechazan desde la segunda);
    /// `maxRows` limita las filas con datos.
    public static func processMatrix(columns: [ZCBulkColumn], matrix: [[String]], keyOf: (([String: ZCBulkValue]) -> String)? = nil, maxRows: Int? = nil) -> ZCBulkResult {
        guard let header = matrix.first, hasData(header) else { return ZCBulkResult(rows: [], fileError: ZCBulkError(.emptyFile)) }
        let data = Array(matrix.dropFirst())
        let normal = header.map(normalizeHeader)
        let index: [Int] = columns.map { c in
            normal.firstIndex { h in h == normalizeHeader(c.title) || h == normalizeHeader(c.key) || c.aliases.contains { normalizeHeader($0) == h } } ?? -1
        }
        let missing = columns.enumerated().filter { index[$0.offset] == -1 && $0.element.required }.map { $0.element.title }
        if !missing.isEmpty { return ZCBulkResult(rows: [], fileError: ZCBulkError(.missingColumns, params: ["list": .text(missing.joined(separator: ", "))])) }
        let filled = data.filter(hasData).count
        if let maxRows, filled > maxRows { return ZCBulkResult(rows: [], fileError: ZCBulkError(.tooManyRows, params: ["max": .integer(maxRows), "n": .integer(filled)])) }

        var seen: [String: Int] = [:]
        var rows: [ZCBulkRow] = []
        for (k, cells) in data.enumerated() {
            if !hasData(cells) { continue }
            let row = k + 2
            var values: [String: ZCBulkValue] = [:]
            var error: ZCBulkError?
            for (i, c) in columns.enumerated() {
                if error != nil { break }
                let pos = index[i]
                let rawValue = pos >= 0 && pos < cells.count ? trimmed(cells[pos]) : ""
                if rawValue.isEmpty {
                    if c.required { error = ZCBulkError(.required, field: c.key, params: ["title": .text(c.title)]) }
                    continue
                }
                switch convert(c, rawValue) {
                case .ok(let v): values[c.key] = v
                case .bad(let e): error = e
                }
            }
            if error == nil, let keyOf {
                let key = keyOf(values).lowercased()
                if let previous = seen[key] { error = ZCBulkError(.duplicate, params: ["row": .integer(previous)]) } else { seen[key] = row }
            }
            rows.append(ZCBulkRow(row: row, values: values, error: error))
        }
        return ZCBulkResult(rows: rows, fileError: nil)
    }

    /// Texto de un CSV (comillas dobles, coma o punto y coma como separador, BOM) → matriz de textos.
    public static func parseCSV(_ text: String) -> [[String]] {
        var scalars = Array(text.unicodeScalars)
        if scalars.first == "\u{FEFF}" { scalars.removeFirst() }
        let src = String(String.UnicodeScalarView(scalars))
        let firstLine = src.components(separatedBy: "\n")[0]
        let semicolons = firstLine.filter { $0 == ";" }.count
        let commas = firstLine.filter { $0 == "," }.count
        let sep: Unicode.Scalar = semicolons > commas ? ";" : ","

        var rows: [[String]] = []
        var row: [String] = []
        var cur = String.UnicodeScalarView()
        var quoted = false
        var i = 0
        func cell() -> String { trimmed(String(cur)) }
        while i < scalars.count {
            let ch = scalars[i]
            if quoted {
                if ch == "\"" {
                    if i + 1 < scalars.count, scalars[i + 1] == "\"" { cur.append("\""); i += 1 } else { quoted = false }
                } else { cur.append(ch) }
            } else if ch == "\"" {
                quoted = true
            } else if ch == sep {
                row.append(cell()); cur = String.UnicodeScalarView()
            } else if ch == "\n" || ch == "\r" {
                if ch == "\r", i + 1 < scalars.count, scalars[i + 1] == "\n" { i += 1 }
                row.append(cell()); rows.append(row); row = []; cur = String.UnicodeScalarView()
            } else {
                cur.append(ch)
            }
            i += 1
        }
        if !cur.isEmpty || !row.isEmpty { row.append(cell()); rows.append(row) }
        return rows
    }

    /// Plantilla descargable: hoja «Datos» (encabezados, con «*» en los obligatorios, y una fila de ejemplo) y hoja de instrucciones con qué
    /// escribir en cada columna. Se escribe con `ZCExport.toXLSX(sheets:)`.
    public static func template(columns: [ZCBulkColumn], labels l: ZCBulkTemplateLabels) -> [ZCXlsxSheet] {
        let header: [ZCCell] = columns.map { .text($0.title + ($0.required ? " *" : "")) }
        let example: [ZCCell] = columns.map { $0.example }
        var instructions: [[ZCCell]] = [[.text(l.column), .text(l.required), .text(l.whatToWrite), .text(l.example)]]
        for c in columns { instructions.append([.text(c.title), .text(c.required ? l.yes : l.no), .text(c.help), c.example]) }
        return [ZCXlsxSheet(name: l.data, rows: [header, example]), ZCXlsxSheet(name: l.instructions, rows: instructions)]
    }
}
