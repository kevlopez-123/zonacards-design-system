// Archivo generado por scripts/build-native.mjs. No editar a mano.
import CoreText
import Foundation

/// Registra las tipografías de las cuatro marcas. Llama `ZCFonts.register()` una vez al iniciar la app.
public enum ZCFonts {
    public static let files = ["Figtree[wght].ttf", "Lato-Light.ttf", "Lato-Regular.ttf", "Lato-Bold.ttf", "Lato-Black.ttf", "Outfit[wght].ttf", "Geist[wght].ttf"]
    private static var done = false

    public static func register() {
        guard !done else { return }
        done = true
        for file in files {
            let name = (file as NSString).deletingPathExtension
            if let url = Bundle.module.url(forResource: name, withExtension: "ttf", subdirectory: "Fonts") ?? Bundle.module.url(forResource: name, withExtension: "ttf") {
                CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
            }
        }
    }
}
