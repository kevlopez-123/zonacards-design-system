import SwiftUI
import ZonacardsTokens

/// Resuelve el tema (marca × claro/oscuro), registra las tipografías y lo pone en el entorno (`\.zcTheme`) para todo lo que contiene.
/// Sin `dark` sigue el modo del sistema. Úsalo una vez en la raíz de la app y en cada captura del catálogo.
public struct ZCThemeProvider<Content: View>: View {
    @Environment(\.colorScheme) private var systemScheme
    private let brand: ZCBrand
    private let dark: Bool?
    private let content: Content

    public init(brand: ZCBrand = .zonacards, dark: Bool? = nil, @ViewBuilder content: () -> Content) {
        ZCFonts.register()
        self.brand = brand
        self.dark = dark
        self.content = content()
    }

    public var body: some View {
        let isDark = dark ?? (systemScheme == .dark)
        let theme = ZCTheme.resolve(brand, dark: isDark)
        content
            .environment(\.zcTheme, theme)
            .environment(\.colorScheme, isDark ? .dark : .light)
            .background(theme.colors.bg)
    }
}
