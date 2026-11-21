import SwiftUI
import ZonacardsTokens

/// Un nivel del ubigeo (INEI): departamento (2 dígitos), provincia (4) o distrito (6).
public struct ZCUbigeoPlace: Sendable, Equatable {
    public let code: String
    public let name: String
    public let parent: String?
    public let lat: Double?
    public let lng: Double?
}

/// Ubigeo del Perú (INEI): departamento › provincia › distrito, desde el mismo archivo que la web (`ubigeo-pe.json`; datos MIT © 2025 MichaelSuarez0).
/// Consulta con índices por código.
public struct ZCUbigeo: Sendable {
    public let departments: [ZCUbigeoPlace]
    private let provinces: [ZCUbigeoPlace]
    private let districts: [ZCUbigeoPlace]
    private let provByDep: [String: [ZCUbigeoPlace]]
    private let distByProv: [String: [ZCUbigeoPlace]]
    private let distByCode: [String: ZCUbigeoPlace]
    private let provByCode: [String: ZCUbigeoPlace]
    private let depByCode: [String: ZCUbigeoPlace]

    public var provinceCount: Int { provinces.count }
    public var districtCount: Int { districts.count }

    init(departments: [ZCUbigeoPlace], provinces: [ZCUbigeoPlace], districts: [ZCUbigeoPlace]) {
        self.departments = departments
        self.provinces = provinces
        self.districts = districts
        provByDep = Dictionary(grouping: provinces) { $0.parent ?? "" }
        distByProv = Dictionary(grouping: districts) { $0.parent ?? "" }
        distByCode = Dictionary(uniqueKeysWithValues: districts.map { ($0.code, $0) })
        provByCode = Dictionary(uniqueKeysWithValues: provinces.map { ($0.code, $0) })
        depByCode = Dictionary(uniqueKeysWithValues: departments.map { ($0.code, $0) })
    }

    public func provinces(department: String?) -> [ZCUbigeoPlace] { department.flatMap { provByDep[$0] } ?? [] }
    public func districts(province: String?) -> [ZCUbigeoPlace] { province.flatMap { distByProv[$0] } ?? [] }
    public func district(_ code: String?) -> ZCUbigeoPlace? { code.flatMap { distByCode[$0] } }

    /// "Miraflores, Lima, Lima" (distrito, provincia, departamento).
    public func label(_ code: String?) -> String {
        guard let code else { return "" }
        let d = distByCode[code]
        let p = provByCode[d?.parent ?? String(code.prefix(4))]
        let dep = depByCode[p?.parent ?? String(code.prefix(2))]
        return [d?.name, p?.name, dep?.name].compactMap { $0 }.joined(separator: ", ")
    }

    public static func parse(_ data: Data) throws -> ZCUbigeo {
        guard let root = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { throw CocoaError(.fileReadCorruptFile) }
        func list(_ key: String, parent: String?) -> [ZCUbigeoPlace] {
            (root[key] as? [[String: Any]] ?? []).compactMap { r in
                guard let code = r["codigo"] as? String, let name = r["nombre"] as? String else { return nil }
                return ZCUbigeoPlace(code: code, name: name, parent: parent.flatMap { r[$0] as? String }, lat: r["lat"] as? Double, lng: r["lng"] as? Double)
            }
        }
        return ZCUbigeo(departments: list("departamentos", parent: nil), provinces: list("provincias", parent: "departamento"), districts: list("distritos", parent: "provincia"))
    }

    /// Lee el archivo una sola vez.
    public static let shared: ZCUbigeo? = ZCData.json("ubigeo-pe").flatMap { try? parse($0) }
}

/// Departamento › provincia › distrito del Perú. El valor es el código del distrito (6 dígitos) o nulo. Cambiar un nivel limpia los de abajo. Cada nivel
/// es un select con búsqueda (más de 8 opciones). `onLocated` entrega el distrito con sus coordenadas (centro de mapa).
public struct ZCUbigeoSelect: View {
    @State private var dep: String?
    @State private var prov: String?
    private let value: Binding<String?>
    private let required: Bool
    private let error: String?
    private let data: ZCUbigeo?
    private let onLocated: (ZCUbigeoPlace) -> Void

    public init(value: Binding<String?>, required: Bool = false, error: String? = nil, data: ZCUbigeo? = ZCUbigeo.shared, onLocated: @escaping (ZCUbigeoPlace) -> Void = { _ in }) {
        self.value = value
        self.required = required
        self.error = error
        self.data = data
        self.onLocated = onLocated
        _dep = State(initialValue: value.wrappedValue.map { String($0.prefix(2)) })
        _prov = State(initialValue: value.wrappedValue.map { String($0.prefix(4)) })
    }

    public var body: some View {
        let tree = data
        VStack(alignment: .leading, spacing: ZCSpace.v4) {
            ZCSelect(
                ZCString.text("ui.ubigeo.departamento"),
                options: (tree?.departments ?? []).map { ZCOption($0.code, label: $0.name) },
                selection: Binding(get: { dep }, set: { dep = $0; prov = nil; value.wrappedValue = nil }),
                placeholder: ZCString.text(tree != nil ? "ui.ubigeo.eligeDepartamento" : "ui.cargando"), required: required
            )
            .disabled(tree == nil)
            ZCSelect(
                ZCString.text("ui.ubigeo.provincia"),
                options: (tree?.provinces(department: dep) ?? []).map { ZCOption($0.code, label: $0.name) },
                selection: Binding(get: { prov }, set: { prov = $0; value.wrappedValue = nil }),
                placeholder: ZCString.text("ui.ubigeo.eligeProvincia"), required: required
            )
            .disabled(dep == nil)
            ZCSelect(
                ZCString.text("ui.ubigeo.distrito"),
                options: (tree?.districts(province: prov) ?? []).map { ZCOption($0.code, label: $0.name) },
                selection: Binding(get: { value.wrappedValue }, set: { code in
                    value.wrappedValue = code
                    if let place = tree?.district(code) { onLocated(place) }
                }),
                placeholder: ZCString.text("ui.ubigeo.eligeDistrito"), error: error, required: required
            )
            .disabled(prov == nil)
        }
        .onChange(of: value.wrappedValue) { _, v in
            if let v { dep = String(v.prefix(2)); prov = String(v.prefix(4)) }
        }
    }
}
