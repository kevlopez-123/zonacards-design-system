import SwiftUI

/// Ícono del sistema Zonacards. Toma el color del texto (`foregroundStyle`) y es decorativo salvo que lleve `label`.
public struct ZCIcon: View {
    private let name: ZCIconName
    private let size: CGFloat
    private let label: String?

    public init(_ name: ZCIconName, size: CGFloat = 20, label: String? = nil) {
        self.name = name; self.size = size; self.label = label
    }

    public var body: some View {
        let image = Image(name.rawValue, bundle: .module).renderingMode(.template).resizable().frame(width: size, height: size)
        if let label { image.accessibilityLabel(Text(label)) } else { image.accessibilityHidden(true) }
    }
}

public extension View {
    /// Aplica el tema Zonacards (marca y modo) a toda la jerarquía.
    func zcTheme(_ brand: ZCBrand = .zonacards, dark: Bool) -> some View {
        environment(\.zcTheme, .resolve(brand, dark: dark))
    }
}
