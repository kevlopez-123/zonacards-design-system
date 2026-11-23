import Observation
import SwiftUI
import ZonacardsTokens

/// Marca y modo elegidos, que se recuerdan entre sesiones. Cambiarlos redibuja toda la app al momento (sin reiniciar): `ZCLiveThemeProvider`
/// los lee, y todo lo que está dentro toma colores, forma y tipografía de la marca nueva. Útil para apps con varias marcas (Zonacards, Giftealo, Enjoy, Motiva…)
/// y para probar una marca nueva sin recompilar.
@Observable
public final class ZCBrandStore {
    @ObservationIgnored private let defaults: UserDefaults
    @ObservationIgnored private let prefix: String

    /// Marca activa (se cambia con `select(_:)`).
    public private(set) var brand: ZCBrand

    /// `nil` sigue el modo del sistema; `true` oscuro; `false` claro (se cambia con `setDark(_:)`).
    public private(set) var dark: Bool?

    /// `defaultBrand` se usa solo si no hay una marca guardada o la guardada ya no existe (por ejemplo, si se quitó una marca del paquete).
    public init(defaultBrand: ZCBrand = .zonacards, defaults: UserDefaults = .standard, keyPrefix: String = "zc.") {
        self.defaults = defaults
        self.prefix = keyPrefix
        self.brand = defaults.string(forKey: keyPrefix + "brand").flatMap(ZCBrand.init(rawValue:)) ?? defaultBrand
        self.dark = defaults.object(forKey: keyPrefix + "dark") as? Bool
    }

    public func select(_ brand: ZCBrand) {
        self.brand = brand
        defaults.set(brand.rawValue, forKey: prefix + "brand")
    }

    public func setDark(_ dark: Bool?) {
        self.dark = dark
        if let dark { defaults.set(dark, forKey: prefix + "dark") } else { defaults.removeObject(forKey: prefix + "dark") }
    }

    /// Para un selector: `Picker(selection: store.brandBinding)`.
    public var brandBinding: Binding<ZCBrand> {
        Binding(get: { self.brand }, set: { self.select($0) })
    }

    /// Para un selector de modo (sistema, claro, oscuro).
    public var darkBinding: Binding<Bool?> {
        Binding(get: { self.dark }, set: { self.setDark($0) })
    }

    /// El tema que resulta de la marca y el modo elegidos, dado el modo del sistema.
    public func theme(systemDark: Bool) -> ZCTheme {
        ZCTheme.resolve(brand, dark: dark ?? systemDark)
    }
}

/// Como `ZCThemeProvider`, pero la marca y el modo salen de un `ZCBrandStore`: al cambiarlos, todo se redibuja con la marca nueva.
public struct ZCLiveThemeProvider<Content: View>: View {
    private let store: ZCBrandStore
    private let content: Content

    public init(store: ZCBrandStore, @ViewBuilder content: () -> Content) {
        self.store = store
        self.content = content()
    }

    public var body: some View {
        ZCThemeProvider(brand: store.brand, dark: store.dark) { content }
    }
}
