import SwiftUI
import ZonacardsTokens

/// Indicador de carga: aro de 2 pt con tres cuartos visibles. Anuncia "Cargando" salvo `decorative`; con "Reducir movimiento" queda fijo.
public struct ZCSpinner: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var turning = false
    private let size: CGFloat
    private let color: Color?
    private let decorative: Bool

    public init(size: CGFloat = 18, color: Color? = nil, decorative: Bool = false) {
        self.size = size
        self.color = color
        self.decorative = decorative
    }

    public var body: some View {
        let ring = Circle()
            .trim(from: 0, to: 0.75)
            .stroke(color ?? Color.primary, style: StrokeStyle(lineWidth: 2, lineCap: .butt))
            .frame(width: size, height: size)
            .rotationEffect(.degrees(turning ? 360 : 0))
            .animation(reduceMotion ? nil : .linear(duration: 0.9).repeatForever(autoreverses: false), value: turning)
            .onAppear { turning = true }
        if decorative {
            ring.accessibilityHidden(true)
        } else {
            ring.accessibilityElement().accessibilityLabel(ZCString.text("ui.cargando"))
        }
    }
}
