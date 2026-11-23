import SwiftUI
import UniformTypeIdentifiers
import ZonacardsTokens

/// Texto traducido de un error de importación (de una fila o del archivo).
public func zcBulkErrorText(_ e: ZCBulkError) -> String {
    func p(_ k: String) -> String {
        switch e.params[k] {
        case .text(let s)?: return s
        case .integer(let n)?: return String(n)
        case nil: return ""
        }
    }
    let key = "mol.importar.err.\(e.code.rawValue)"
    switch e.code {
    case .required, .code, .integer, .date, .email: return ZCString.text(key, p("title"))
    case .maxLength: return ZCString.text(key, p("title"), p("max"), p("len"))
    case .min: return ZCString.text(key, p("title"), p("min"))
    case .max: return ZCString.text(key, p("title"), p("max"))
    case .option: return ZCString.text(key, p("title"), p("list"))
    case .duplicate: return ZCString.text(key, p("row"))
    case .missingColumns: return ZCString.text(key, p("list"))
    case .tooManyRows: return ZCString.text(key, p("n"), p("max"))
    case .emptyFile, .invalidFile: return ZCString.text(key)
    }
}

/// Rótulos de la plantilla en el idioma de la app.
public func zcBulkTemplateLabels() -> ZCBulkTemplateLabels {
    ZCBulkTemplateLabels(
        data: ZCString.text("mol.importar.plantilla.datos"), instructions: ZCString.text("mol.importar.plantilla.instrucciones"),
        column: ZCString.text("mol.importar.plantilla.columna"), required: ZCString.text("mol.importar.plantilla.obligatoria"),
        whatToWrite: ZCString.text("mol.importar.plantilla.queEscribir"), example: ZCString.text("mol.importar.plantilla.ejemplo"),
        yes: ZCString.text("mol.importar.plantilla.si"), no: ZCString.text("mol.importar.plantilla.no")
    )
}

/// Un archivo binario para el selector de "guardar como" (`fileExporter`).
struct ZCBinaryDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.data] }
    static var writableContentTypes: [UTType] { [.data] }
    var data: Data

    init(data: Data) { self.data = data }
    init(configuration: ReadConfiguration) throws { data = configuration.file.regularFileContents ?? Data() }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: data) }
}

private let zcMaxImportBytes = 10 * 1024 * 1024
private let zcXlsxType = UTType(filenameExtension: "xlsx") ?? .data

/// Importación masiva desde un Excel o un CSV, en dos pasos: (1) descargar la plantilla con los encabezados de `columns`, (2) subir el archivo.
/// Cada fila se valida en el teléfono (`ZCBulk.processMatrix`; el servidor vuelve a validar): se muestran las filas válidas, los errores por fila con su
/// causa, y "Importar N filas" entrega solo las válidas a `onImport`. Las filas con errores se omiten, con aviso.
///
/// El archivo lo elige el usuario con el selector de documentos del sistema (`fileImporter`, sin permisos) y la plantilla se guarda con el de
/// "guardar como" (`fileExporter`). `templateTitle` da el nombre del archivo de la plantilla ("plantilla-clientes-2026-11-23.xlsx").
/// `keyOf` arma la llave que identifica cada fila (las repetidas se rechazan desde la segunda). Archivos de más de 10 MB no se leen.
public struct ZCBulkImport: View {
    private let columns: [ZCBulkColumn]
    private let templateTitle: String
    private let keyOf: (([String: ZCBulkValue]) -> String)?
    private let maxRows: Int?
    private let onImport: ([ZCBulkRow]) -> Void
    @State private var result: ZCBulkResult?
    @State private var picking = false
    @State private var saving = false
    @State private var template = ZCBinaryDocument(data: Data())

    public init(columns: [ZCBulkColumn], templateTitle: String = "plantilla", maxRows: Int? = nil, keyOf: (([String: ZCBulkValue]) -> String)? = nil,
                onImport: @escaping ([ZCBulkRow]) -> Void) {
        self.columns = columns
        self.templateTitle = templateTitle
        self.maxRows = maxRows
        self.keyOf = keyOf
        self.onImport = onImport
    }

    private var fileName: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return ZCExport.fileName(title: templateTitle, ext: "xlsx", isoDate: f.string(from: Date()))
    }

    public var body: some View {
        ZCBulkImportBody(
            result: result,
            onTemplate: {
                template = ZCBinaryDocument(data: ZCExport.toXLSX(sheets: ZCBulk.template(columns: columns, labels: zcBulkTemplateLabels())))
                saving = true
            },
            onPick: { picking = true },
            onImport: onImport
        )
        .fileExporter(isPresented: $saving, document: template, contentType: zcXlsxType, defaultFilename: String(fileName.dropLast(5))) { _ in }
        .fileImporter(isPresented: $picking, allowedContentTypes: [zcXlsxType, .commaSeparatedText, .plainText, .data]) { picked in
            guard case .success(let url) = picked else { return }
            result = load(url)
        }
    }

    private func load(_ url: URL) -> ZCBulkResult {
        let invalid = ZCBulkResult(rows: [], fileError: ZCBulkError(.invalidFile))
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        if let size = try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize, size > zcMaxImportBytes { return invalid }
        guard let data = try? Data(contentsOf: url), data.count <= zcMaxImportBytes else { return invalid }
        return ZCBulk.processFile(fileName: url.lastPathComponent, data: data, columns: columns, keyOf: keyOf, maxRows: maxRows)
    }
}

/// Cuántos errores se listan: el resto se resume ("… +N") para que la pantalla no se haga eterna con un archivo malo.
private let zcMaxListedErrors = 50

/// El cuerpo sin estado de la importación (lo usan la versión con selectores del sistema y las pruebas).
struct ZCBulkImportBody: View {
    @Environment(\.zcTheme) private var theme
    let result: ZCBulkResult?
    let onTemplate: () -> Void
    let onPick: () -> Void
    let onImport: ([ZCBulkRow]) -> Void

    var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous)
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: ZCSpace.v2) {
                ZCText(ZCString.text("mol.importar.paso1"), style: ZCType.titleSm).accessibilityAddTraits(.isHeader)
                ZCText(ZCString.text("mol.importar.paso1Texto"), style: ZCType.body, tone: .muted)
                ZCButton(ZCString.text("mol.importar.descargarPlantilla"), variant: .outline, block: true, action: onTemplate)
            }
            VStack(alignment: .leading, spacing: ZCSpace.v2) {
                ZCText(ZCString.text("mol.importar.paso2"), style: ZCType.titleSm).accessibilityAddTraits(.isHeader)
                ZCButton(ZCString.text("mol.importar.subir"), block: true, action: onPick)
            }
            if let result { resultView(result) }
        }
        .padding(ZCSpace.v5)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(c.surface, in: shape)
        .overlay(shape.stroke(c.border))
    }

    @ViewBuilder private func resultView(_ result: ZCBulkResult) -> some View {
        if let fileError = result.fileError {
            ZCAlert(zcBulkErrorText(fileError), tone: .danger)
        } else {
            let valid = result.rows.filter { $0.error == nil }
            let bad = result.rows.filter { $0.error != nil }
            let summary = bad.isEmpty ? ZCString.text("mol.importar.resumenOk", valid.count) : ZCString.text("mol.importar.resumen", valid.count, bad.count)
            ZCText(summary, style: ZCType.body).fontWeight(.semibold).accessibilityAddTraits(.isHeader)
            if !bad.isEmpty {
                ZCAlert(ZCString.text("mol.importar.omitidas", bad.count), tone: .warning)
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(bad.prefix(zcMaxListedErrors), id: \.row) { row in
                        ZCText(ZCString.text("mol.importar.fila", row.row, row.error.map(zcBulkErrorText) ?? ""), style: ZCType.caption, tone: .danger)
                    }
                    if bad.count > zcMaxListedErrors { ZCText("… +\(bad.count - zcMaxListedErrors)", style: ZCType.caption, tone: .muted) }
                }
            }
            if valid.isEmpty {
                ZCAlert(ZCString.text("mol.importar.sinValidas"), tone: .warning)
            } else {
                ZCButton(ZCString.text("mol.importar.importar", valid.count), block: true) { onImport(valid) }
            }
        }
    }
}
