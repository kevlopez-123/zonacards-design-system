// Archivo generado por scripts/build-native.mjs. No editar a mano.
import SwiftUI

/// Bandera 4:3 de un país (código ISO en minúsculas). Decorativa: acompáñala siempre del nombre o el código.
public struct ZCFlag: View {
    public static let available = ["pe", "ec", "bo", "co", "cl", "mx", "us", "ar", "br", "es"]
    private let code: String
    private let height: CGFloat
    public init(_ code: String, height: CGFloat = 15) { self.code = code.lowercased(); self.height = height }
    public var body: some View {
        Image("zc_flag_\(code)", bundle: .module).resizable().aspectRatio(4.0 / 3.0, contentMode: .fit)
            .frame(height: height).clipShape(RoundedRectangle(cornerRadius: 2)).accessibilityHidden(true)
    }
}
