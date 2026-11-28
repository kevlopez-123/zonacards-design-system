import SwiftUI
import ZonacardsTokens

/// Fila de un control: la caja o el interruptor y, al lado, la etiqueta y la ayuda. Toda la fila se toca (mínimo 44 pt).
struct ZCControlRow<Control: View>: View {
    @Environment(\.zcTheme) private var theme
    let label: String?
    let description: String?
    let control: Control

    init(label: String?, description: String?, @ViewBuilder control: () -> Control) {
        self.label = label
        self.description = description
        self.control = control()
    }

    var body: some View {
        HStack(alignment: .top, spacing: ZCSpace.v3) {
            control
            if label != nil || description != nil {
                VStack(alignment: .leading, spacing: 2) {
                    if let label { Text(label).font(.zc(ZCType.body, theme: theme)).foregroundStyle(theme.colors.text) }
                    if let description { Text(description).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(theme.colors.textMuted) }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .frame(minHeight: ZCSize.targetSm, alignment: .center)
        .contentShape(Rectangle())
    }
}

/// Tamaño de los controles pequeños (interruptor, casilla): `md` o `sm` para filas compactas.
public enum ZCControlSize: Sendable { case md, sm }

// MARK: - Interruptor

struct ZCSwitchStyle: ToggleStyle {
    let size: ZCControlSize
    let label: String?
    let description: String?

    func makeBody(configuration: Configuration) -> some View {
        ZCSwitchBody(configuration: configuration, size: size, label: label, description: description)
    }
}

private struct ZCSwitchBody: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let configuration: ToggleStyleConfiguration
    let size: ZCControlSize
    let label: String?
    let description: String?

    var body: some View {
        let c = theme.colors
        let w: CGFloat = size == .md ? 48 : 36
        let h: CGFloat = size == .md ? 28 : 22
        let thumb = h - 4
        let on = configuration.isOn
        Button { configuration.isOn.toggle() } label: {
            ZCControlRow(label: label, description: description) {
                ZStack(alignment: on ? .trailing : .leading) {
                    Capsule().fill(on ? c.successFg : c.borderStrong)
                    Circle().fill(c.thumb).frame(width: thumb, height: thumb).shadow(color: .black.opacity(0.2), radius: 1, y: 1).padding(2)
                }
                .frame(width: w, height: h)
                .animation(reduceMotion ? nil : .easeOut(duration: ZCMotion.base), value: on)
            }
        }
        .buttonStyle(.plain)
        .opacity(isEnabled ? 1 : ZCOpacity.disabled)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label ?? "")
        .accessibilityValue(description ?? "")
        .accessibilityAddTraits(.isToggle)
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

/// Interruptor: aplica al instante (sin "Guardar"). Activado en `success`, pulgar blanco. Para opciones que esperan confirmación, usa `ZCCheckbox`.
public struct ZCSwitch: View {
    private let isOn: Binding<Bool>
    private let label: String?
    private let description: String?
    private let size: ZCControlSize

    public init(isOn: Binding<Bool>, label: String? = nil, description: String? = nil, size: ZCControlSize = .md) {
        self.isOn = isOn
        self.label = label
        self.description = description
        self.size = size
    }

    public var body: some View {
        Toggle("", isOn: isOn).labelsHidden()
            .toggleStyle(ZCSwitchStyle(size: size, label: label, description: description))
    }
}

// MARK: - Casilla

/// Estado de una casilla. `mixed` (guion) es para el padre de una lista con casillas.
public enum ZCCheckState: Sendable { case off, on, mixed }

private struct ZCCheckBox: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    let state: ZCCheckState
    let invalid: Bool

    var body: some View {
        let c = theme.colors
        let on = state != .off
        let shape = RoundedRectangle(cornerRadius: ZCRadius.xs, style: .continuous)
        ZStack {
            if on {
                shape.fill(c.primary)
                Path { p in
                    if state == .on {
                        p.move(to: CGPoint(x: 5.5, y: 11.5)); p.addLine(to: CGPoint(x: 9.5, y: 15.5)); p.addLine(to: CGPoint(x: 16.5, y: 6.5))
                    } else {
                        p.move(to: CGPoint(x: 6, y: 11)); p.addLine(to: CGPoint(x: 16, y: 11))
                    }
                }
                .stroke(c.onPrimary, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
            } else {
                shape.fill(isEnabled ? c.surface : c.surface2)
                shape.stroke(invalid ? c.dangerFg : c.borderStrong, style: StrokeStyle(lineWidth: 1, dash: isEnabled ? [] : [3, 2]))
            }
        }
        .frame(width: 22, height: 22)
        .accessibilityHidden(true)
    }
}

/// Casilla con estado mixto. Sin etiqueta visible, `accessibilityLabel` la nombra (fila compacta de una lista).
public struct ZCCheckbox: View {
    @Environment(\.isEnabled) private var isEnabled
    private let state: ZCCheckState
    private let action: () -> Void
    private let label: String?
    private let description: String?
    private let invalid: Bool
    private let accessibilityName: String?

    public init(state: ZCCheckState, label: String? = nil, description: String? = nil, invalid: Bool = false, accessibilityLabel: String? = nil, action: @escaping () -> Void) {
        self.state = state
        self.label = label
        self.description = description
        self.invalid = invalid
        self.accessibilityName = accessibilityLabel
        self.action = action
    }

    /// Casilla simple (sí o no).
    public init(isOn: Binding<Bool>, label: String? = nil, description: String? = nil, invalid: Bool = false, accessibilityLabel: String? = nil) {
        self.init(state: isOn.wrappedValue ? .on : .off, label: label, description: description, invalid: invalid, accessibilityLabel: accessibilityLabel) { isOn.wrappedValue.toggle() }
    }

    public var body: some View {
        Button(action: action) {
            ZCControlRow(label: label, description: description) { ZCCheckBox(state: state, invalid: invalid).padding(.top, label == nil ? 0 : 1) }
                .frame(minWidth: ZCSize.targetSm)
        }
        .buttonStyle(.plain)
        .opacity(isEnabled ? 1 : ZCOpacity.disabled)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label ?? accessibilityName ?? "")
        .accessibilityValue(spokenValue)
        .accessibilityAddTraits(state == .on ? [.isButton, .isSelected] : [.isButton])
    }

    /// Lo que lee VoiceOver tras el nombre: "Mixto" si la casilla está a medias, y la descripción si hay.
    private var spokenValue: String {
        [state == .mixed ? ZCString.text("ui.mixto") : nil, description].compactMap { $0 }.joined(separator: ", ")
    }
}

// MARK: - Radios

/// Una opción de un `ZCRadioGroup`.
public struct ZCRadioOption<Value: Hashable>: Identifiable {
    public var id: Value { value }
    public let value: Value
    public let label: String
    public let description: String?
    public let enabled: Bool

    public init(_ value: Value, label: String, description: String? = nil, enabled: Bool = true) {
        self.value = value
        self.label = label
        self.description = description
        self.enabled = enabled
    }
}

private struct ZCRadioDot: View {
    @Environment(\.zcTheme) private var theme
    let on: Bool
    let invalid: Bool
    let enabled: Bool

    var body: some View {
        let c = theme.colors
        Circle()
            .fill(enabled ? c.surface : c.surface2)
            .overlay(Circle().stroke(invalid ? c.dangerFg : (on ? c.primary : c.borderStrong), lineWidth: on ? 1.5 : 1))
            .overlay { if on { Circle().fill(c.primary).frame(width: 10, height: 10) } }
            .frame(width: 22, height: 22)
            .accessibilityHidden(true)
    }
}

/// Grupo de opciones excluyentes (2 a 6): etiqueta del grupo visible, filas separadas 16 pt, error del grupo con texto.
public struct ZCRadioGroup<Value: Hashable>: View {
    @Environment(\.zcTheme) private var theme
    private let label: String
    private let options: [ZCRadioOption<Value>]
    private let selection: Binding<Value?>
    private let error: String?

    public init(_ label: String, options: [ZCRadioOption<Value>], selection: Binding<Value?>, error: String? = nil) {
        self.label = label
        self.options = options
        self.selection = selection
        self.error = error
    }

    public var body: some View {
        let c = theme.colors
        VStack(alignment: .leading, spacing: ZCSpace.v4) {
            Text(label).font(.zc(ZCType.bodySm, theme: theme).weight(ZCWeight.medium)).foregroundStyle(c.text)
            ForEach(options) { option in
                let on = selection.wrappedValue == option.value
                Button { selection.wrappedValue = option.value } label: {
                    ZCControlRow(label: option.label, description: option.description) {
                        ZCRadioDot(on: on, invalid: error != nil, enabled: option.enabled)
                    }
                }
                .buttonStyle(.plain)
                .disabled(!option.enabled)
                .opacity(option.enabled ? 1 : ZCOpacity.disabled)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(option.label)
                .accessibilityValue(option.description ?? "")
                .accessibilityAddTraits(on ? [.isButton, .isSelected] : [.isButton])
            }
            if let error {
                HStack(spacing: 6) {
                    ZCIcon(.sDangerCircle, size: ZCSize.iconSm)
                    Text(error).font(.zc(ZCType.caption, theme: theme))
                }
                .foregroundStyle(c.dangerFg)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }
}

// MARK: - Progreso y esqueleto

public enum ZCProgressVariant: Sendable { case bar, circular, meter }

/// Progreso: barra (`bar`), circular o medidor de consumo de un cupo (`meter`, cambia de color con `warnAt` y `dangerAt`, en %).
/// Con `value` nulo es indeterminado (un segmento cruza la pista; nunca parpadea). Sin `valueText` muestra el porcentaje.
public struct ZCProgress: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var travel = false
    private let value: Double?
    private let label: String?
    private let valueText: String?
    private let variant: ZCProgressVariant
    private let tone: ZCTone?
    private let warnAt: Int
    private let dangerAt: Int

    public init(value: Double?, label: String? = nil, valueText: String? = nil, variant: ZCProgressVariant = .bar, tone: ZCTone? = nil, warnAt: Int = 75, dangerAt: Int = 90) {
        self.value = value
        self.label = label
        self.valueText = valueText
        self.variant = variant
        self.tone = tone
        self.warnAt = warnAt
        self.dangerAt = dangerAt
    }

    private var percent: Int? { value.map { Int((min(max($0, 0), 1) * 100).rounded()) } }

    private var barColor: Color {
        let resolved: ZCTone? = tone ?? {
            guard variant == .meter, let p = percent else { return nil }
            return p >= dangerAt ? .danger : (p >= warnAt ? .warning : .success)
        }()
        return resolved.map { theme.tone($0).fg } ?? theme.colors.text
    }

    public var body: some View {
        let c = theme.colors
        let bar = barColor
        let fraction = min(max(value ?? 0, 0), 1)
        Group {
            if variant == .circular {
                ZStack {
                    Circle().stroke(c.surface2, lineWidth: 6)
                    if value == nil {
                        Circle().trim(from: 0, to: 0.25).stroke(bar, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                            .rotationEffect(.degrees(travel ? 360 : 0))
                            .animation(reduceMotion ? nil : .linear(duration: 1).repeatForever(autoreverses: false), value: travel)
                    } else {
                        Circle().trim(from: 0, to: fraction).stroke(bar, style: StrokeStyle(lineWidth: 6, lineCap: .round)).rotationEffect(.degrees(-90))
                    }
                    if let p = percent { Text("\(p)%").font(.zc(ZCType.caption, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(c.text) }
                }
                .frame(width: 56, height: 56)
            } else {
                VStack(alignment: .leading, spacing: 6) {
                    if label != nil || valueText != nil || percent != nil {
                        HStack {
                            if let label { Text(label).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.text) }
                            Spacer(minLength: ZCSpace.v2)
                            if let text = valueText ?? percent.map({ "\($0) %" }) { Text(text).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted) }
                        }
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(c.surface2)
                            if value == nil {
                                Capsule().fill(bar).frame(width: geo.size.width * 0.35)
                                    .offset(x: reduceMotion ? 0 : (travel ? geo.size.width * 0.65 : 0))
                                    .animation(reduceMotion ? nil : .easeInOut(duration: 1.2).repeatForever(autoreverses: false), value: travel)
                            } else {
                                Capsule().fill(bar).frame(width: geo.size.width * fraction)
                            }
                        }
                        .clipShape(Capsule())
                    }
                    .frame(height: 8)
                }
            }
        }
        .onAppear { travel = true }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label ?? ZCString.text("ui.cargando"))
        .accessibilityValue(value == nil ? "" : (valueText ?? percent.map { "\($0) %" } ?? ""))
    }
}

public enum ZCSkeletonVariant: Sendable { case line, block, card }

/// Esqueleto de carga: brillo que recorre (1,4 s) sobre `surface2`; anuncia "Cargando" una vez. Quieto con "Reducir movimiento".
public struct ZCSkeleton: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shift: CGFloat = -1
    private let variant: ZCSkeletonVariant
    private let lines: Int

    public init(variant: ZCSkeletonVariant = .line, lines: Int = 3) {
        self.variant = variant
        self.lines = lines
    }

    private func bone(width: CGFloat? = nil, fraction: CGFloat = 1, height: CGFloat, radius: CGFloat) -> some View {
        let c = theme.colors
        return GeometryReader { geo in
            let w = geo.size.width
            RoundedRectangle(cornerRadius: radius, style: .continuous).fill(c.surface2)
                .overlay(
                    LinearGradient(colors: [.clear, c.surface3, .clear], startPoint: .leading, endPoint: .trailing)
                        .frame(width: w).offset(x: w * shift)
                        .opacity(reduceMotion ? 0 : 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
                .frame(width: width ?? w * fraction, height: height)
        }
        .frame(height: height)
    }

    public var body: some View {
        let c = theme.colors
        Group {
            switch variant {
            case .block:
                bone(height: 96, radius: ZCRadius.md)
            case .line:
                VStack(alignment: .leading, spacing: ZCSpace.v2) {
                    let fractions: [CGFloat] = [0.9, 0.75, 0.83, 0.66]
                    ForEach(0..<max(lines, 1), id: \.self) { i in
                        bone(fraction: i == 0 ? 0.6 : fractions[(i - 1) % fractions.count], height: i == 0 ? 16 : 12, radius: ZCRadius.sm)
                    }
                }
            case .card:
                VStack(alignment: .leading, spacing: ZCSpace.v3) {
                    bone(fraction: 0.6, height: 16, radius: ZCRadius.sm)
                    bone(fraction: 0.92, height: 12, radius: ZCRadius.sm)
                    bone(fraction: 0.75, height: 12, radius: ZCRadius.sm)
                    HStack(spacing: ZCSpace.v3) {
                        bone(width: 80, height: 28, radius: ZCRadius.full)
                        bone(width: 96, height: 28, radius: ZCRadius.full)
                    }
                }
                .padding(ZCSpace.v5)
                .background(c.surface, in: RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous).stroke(c.border))
            }
        }
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: false)) { shift = 1 }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(ZCString.text("ui.cargando"))
    }
}
