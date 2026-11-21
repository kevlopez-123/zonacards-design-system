import Foundation

/// Textos de los componentes (`Localizable.xcstrings`, mismas claves que la web: `ui.cargando`, `mol.cupon.quitar`…).
/// Los parámetros `{{x}}` de la web son `%1$@`, `%2$@`… en el orden de aparición: pásalos como argumentos (números también:
/// se convierten a texto, porque `%@` con un entero cierra la app).
public enum ZCString {
    public static func text(_ key: String, _ args: Any...) -> String {
        let format = NSLocalizedString(key, bundle: .module, comment: "")
        guard !args.isEmpty else { return format }
        return String(format: format, arguments: args.map { String(describing: $0) as CVarArg })
    }
}
