import Foundation

/// Acceso a los archivos de datos del paquete (`ubigeo-pe.json`, `latam.json`, `logos.json`…) desde otros módulos, que no ven `Bundle.module`.
public enum ZCData {
    /// Contenido de un recurso JSON del paquete, o nulo si no existe.
    public static func json(_ name: String) -> Data? {
        guard let url = Bundle.module.url(forResource: name, withExtension: "json") else { return nil }
        return try? Data(contentsOf: url)
    }
}
