import SwiftUI
import ZonacardsTokens

/// Tamaño de las estrellas de `ZCRating`: 16, 20 o 32 puntos.
public enum ZCRatingSize: Sendable {
    case sm, md, lg

    var points: CGFloat {
        switch self {
        case .sm: return 16
        case .md: return 20
        case .lg: return 32
        }
    }
}

/// Estrellas para dar o mostrar una calificación (equivale a Rating de HeroUI y a `zc-rating`).
/// - Solo lectura (`init(_:readOnly:)`): VoiceOver la lee como una imagen con su texto («Calificación del producto: 4,5 de 5, 128 opiniones»);
///   acepta fracciones (4,3 llena el 30 % de la quinta estrella). Con `count` muestra el número de opiniones y con `showValue`, la nota.
/// - Interactiva (`init(_:value:)`): un solo elemento ajustable. Toque o arrastre eligen la estrella (con `allowHalf`, la mitad izquierda
///   vale 0,5); VoiceOver la ajusta deslizando arriba o abajo; con teclado (iPad), flechas ±1 (±0,5 con medias), Re Pág y Av Pág ±1,
///   Inicio la quita y Fin pone el máximo.
/// `label` es obligatorio: es el nombre del control. 0 es «sin calificar». El color es el de advertencia del sistema; la nota va en el
/// texto accesible y, con `showValue`, a la vista (nunca solo color). Deshabilitada con `.disabled(true)`.
public struct ZCRating: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    private let label: String
    private let readOnlyValue: Double
    private let binding: Binding<Double>?
    private let stars: Int
    private let allowHalf: Bool
    private let size: ZCRatingSize
    private let count: Int?
    private let showValue: Bool

    /// Interactiva: `value` va de 0 a `max`.
    public init(_ label: String, value: Binding<Double>, max: Int = 5, allowHalf: Bool = false, size: ZCRatingSize = .md, count: Int? = nil, showValue: Bool = false) {
        self.label = label
        self.readOnlyValue = 0
        self.binding = value
        self.stars = Swift.max(1, max)
        self.allowHalf = allowHalf
        self.size = size
        self.count = count
        self.showValue = showValue
    }

    /// Solo lectura: acepta fracciones.
    public init(_ label: String, readOnly value: Double, max: Int = 5, size: ZCRatingSize = .md, count: Int? = nil, showValue: Bool = false) {
        self.label = label
        self.readOnlyValue = value
        self.binding = nil
        self.stars = Swift.max(1, max)
        self.allowHalf = false
        self.size = size
        self.count = count
        self.showValue = showValue
    }

    // MARK: Lógica (interna para probarla sin dibujar)

    /// Valor bajo un punto del control: la estrella sobre la que está y, con medias, si es su mitad izquierda.
    static func value(at x: CGFloat, slot: CGFloat, stars: Int, allowHalf: Bool) -> Double {
        let px = Swift.min(Swift.max(x, 0), slot * CGFloat(stars))
        let idx = Swift.min(stars - 1, Int((px / slot).rounded(.down)))
        let inside = (px - CGFloat(idx) * slot) / slot
        return Double(idx) + (allowHalf && inside <= 0.5 ? 0.5 : 1)
    }

    static func clamp(_ v: Double, stars: Int) -> Double { Swift.min(Swift.max(v, 0), Double(stars)) }

    private var current: Double { Self.clamp(binding?.wrappedValue ?? readOnlyValue, stars: stars) }
    private var step: Double { allowHalf ? 0.5 : 1 }
    private var interactive: Bool { binding != nil && isEnabled }
    private var valueText: String { current.formatted(.number.precision(.fractionLength(0...1))) }
    private var spoken: String {
        let base = current > 0 ? ZCString.text("ui.calificacion", label, valueText, stars) : ZCString.text("ui.sinCalificar", label)
        guard let count else { return base }
        return base + ", " + ZCString.text("ui.nOpiniones", count)
    }

    private func set(_ next: Double) { binding?.wrappedValue = Self.clamp(next, stars: stars) }

    private func star(_ index: Int) -> some View {
        let c = theme.colors
        let p = size.points
        let fill = Swift.min(Swift.max(current - Double(index), 0), 1)
        return ZStack(alignment: .leading) {
            ZCIcon(.sStar, size: p).foregroundStyle(c.textSubtle)
            ZCIcon(.sStarBold, size: p).foregroundStyle(c.warningFg)
                .mask(alignment: .leading) { Rectangle().frame(width: p * CGFloat(fill), height: p) }
        }
        .frame(width: p, height: p)
    }

    @ViewBuilder private var starsRow: some View {
        let row = HStack(spacing: 0) { ForEach(0..<stars, id: \.self) { star($0) } }
            .contentShape(Rectangle())
            .opacity(isEnabled ? 1 : 0.45)
        if binding != nil {
            row
                .gesture(DragGesture(minimumDistance: 0).onChanged { g in
                    if interactive { set(Self.value(at: g.location.x, slot: size.points, stars: stars, allowHalf: allowHalf)) }
                })
                .focusable(interactive)
                .onKeyPress(keys: [.rightArrow, .upArrow, .leftArrow, .downArrow, .home, .end, .pageUp, .pageDown]) { press in
                    guard interactive else { return .ignored }
                    switch press.key {
                    case .rightArrow, .upArrow: set(current + step)
                    case .leftArrow, .downArrow: set(current - step)
                    case .pageUp: set(current + 1)
                    case .pageDown: set(current - 1)
                    case .home: set(0)
                    case .end: set(Double(stars))
                    default: return .ignored
                    }
                    return .handled
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(label)
                .accessibilityValue(spoken)
                .accessibilityAdjustableAction { direction in
                    guard interactive else { return }
                    switch direction {
                    case .increment: set(current + step)
                    case .decrement: set(current - step)
                    @unknown default: break
                    }
                }
        } else {
            row
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(spoken)
                .accessibilityAddTraits(.isImage)
        }
    }

    public var body: some View {
        HStack(spacing: 8) {
            starsRow
            if showValue { ZCText(valueText, style: ZCType.bodySm).fontWeight(.medium).accessibilityHidden(true) }
            if let count { ZCText("(\(count))", style: ZCType.caption, tone: .muted).accessibilityHidden(true) }
        }
    }
}
