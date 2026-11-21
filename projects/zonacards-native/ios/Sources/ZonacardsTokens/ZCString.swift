import Foundation

/// Textos de los componentes (`Localizable.xcstrings`, mismas claves que la web: `ui.cargando`, `mol.cupon.quitar`…).
/// Los parámetros `{{x}}` de la web son `%1$@`, `%2$@`… en el orden de aparición: pásalos como argumentos.
public enum ZCString {
    public static func text(_ key: String, _ args: CVarArg...) -> String {
        let format = NSLocalizedString(key, bundle: .module, comment: "")
        return args.isEmpty ? format : String(format: format, arguments: args)
    }
}
