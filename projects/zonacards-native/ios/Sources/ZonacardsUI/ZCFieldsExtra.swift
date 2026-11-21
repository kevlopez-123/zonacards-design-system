import SwiftUI
import UIKit
import ZonacardsTokens

// MARK: - Deslizadores

private func zcPlain(_ v: Double) -> String { v.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(v)) : String(v) }

/// Núcleo de los deslizadores: una o dos perillas sobre la misma pista, con paso, separación mínima y respuesta háptica por paso.
private struct ZCSliderCore: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @State private var active: Int?
    @Binding var values: [Double]
    let lo: Double
    let hi: Double
    let step: Double
    let minGap: Double
    let labels: [String?]
    let format: (Double) -> String

    private func snap(_ raw: Double, index: Int) -> Double {
        var v = (((raw - lo) / step).rounded() * step) + lo
        v = min(max(v, lo), hi)
        if values.count == 2 {
            if index == 0 { v = min(v, values[1] - minGap) } else { v = max(v, values[0] + minGap) }
        }
        return min(max(v, lo), hi)
    }

    private func set(_ index: Int, to raw: Double) {
        let v = snap(raw, index: index)
        guard v != values[index] else { return }
        values[index] = v
        UISelectionFeedbackGenerator().selectionChanged()
    }

    var body: some View {
        let c = theme.colors
        GeometryReader { geo in
            let w = max(geo.size.width - 24, 1)
            let span = max(hi - lo, 0.0001)
            let xs = values.map { CGFloat(($0 - lo) / span) * w + 12 }
            ZStack(alignment: .leading) {
                Capsule().fill(c.surface3).frame(height: 6)
                Capsule().fill(c.primary)
                    .frame(width: max(0, (xs.last ?? 12) - (values.count == 2 ? xs[0] : 12)), height: 6)
                    .offset(x: values.count == 2 ? xs[0] : 12)
                ForEach(values.indices, id: \.self) { i in
                    Circle().fill(c.surface).overlay(Circle().stroke(c.primary, lineWidth: 2)).frame(width: 24, height: 24)
                        .shadow(color: .black.opacity(0.15), radius: 1, y: 1)
                        .frame(width: 44, height: 44)
                        .offset(x: xs[i] - 22)
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel(labels.indices.contains(i) ? (labels[i] ?? "") : "")
                        .accessibilityValue(format(values[i]))
                        .accessibilityAdjustableAction { dir in
                            switch dir {
                            case .increment: set(i, to: values[i] + step)
                            case .decrement: set(i, to: values[i] - step)
                            @unknown default: break
                            }
                        }
                }
            }
            .frame(height: 44)
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0).onChanged { g in
                    guard isEnabled else { return }
                    let raw = lo + Double((g.location.x - 12) / w) * span
                    if active == nil { active = values.indices.min { abs(values[$0] - raw) < abs(values[$1] - raw) } }
                    if let a = active { set(a, to: raw) }
                }
                .onEnded { _ in active = nil }
            )
        }
        .frame(height: 44)
        .opacity(isEnabled ? 1 : 0.45)
    }
}

/// Deslizador de un valor, para ir dentro de un `ZCField`. Paso a paso con háptica; para VoiceOver es ajustable (deslizar arriba o abajo) y anuncia
/// `format(valor)` ("4,5 %"). Pista de 6 pt, perilla de 24 con área de toque de 44.
public struct ZCSlider: View {
    private let value: Binding<Double>
    private let range: ClosedRange<Double>
    private let step: Double
    private let label: String?
    private let format: (Double) -> String

    public init(value: Binding<Double>, in range: ClosedRange<Double> = 0...100, step: Double = 1, label: String? = nil, format: @escaping (Double) -> String = zcPlain) {
        self.value = value
        self.range = range
        self.step = step
        self.label = label
        self.format = format
    }

    public var body: some View {
        ZCSliderCore(values: Binding(get: { [value.wrappedValue] }, set: { value.wrappedValue = $0[0] }), lo: range.lowerBound, hi: range.upperBound, step: step, minGap: 0, labels: [label], format: format)
    }
}

/// Deslizador de rango: dos perillas que no se cruzan (`minGap`), anunciadas como "mínimo" y "máximo".
public struct ZCRangeSlider: View {
    private let low: Binding<Double>
    private let high: Binding<Double>
    private let range: ClosedRange<Double>
    private let step: Double
    private let minGap: Double
    private let minLabel: String?
    private let maxLabel: String?
    private let format: (Double) -> String

    public init(low: Binding<Double>, high: Binding<Double>, in range: ClosedRange<Double> = 0...100, step: Double = 1, minGap: Double = 0, minLabel: String? = nil, maxLabel: String? = nil, format: @escaping (Double) -> String = zcPlain) {
        self.low = low
        self.high = high
        self.range = range
        self.step = step
        self.minGap = minGap
        self.minLabel = minLabel
        self.maxLabel = maxLabel
        self.format = format
    }

    public var body: some View {
        ZCSliderCore(
            values: Binding(get: { [low.wrappedValue, high.wrappedValue] }, set: { low.wrappedValue = $0[0]; high.wrappedValue = $0[1] }),
            lo: range.lowerBound, hi: range.upperBound, step: step, minGap: minGap,
            labels: [minLabel ?? ZCString.text("mol.slider.minimo"), maxLabel ?? ZCString.text("mol.slider.maximo")], format: format
        )
    }
}

// MARK: - Hora

/// Campo de hora: se escribe hh:mm (24 h, los dos puntos se ponen solos) o se elige con la rueda del sistema. El ícono de reloj, a la derecha, la abre.
/// Valor: "hh:mm", o el texto escrito si aún no está completo; nulo si está vacío.
public struct ZCTimeField: View {
    @State private var open = false
    private let label: String
    private let value: Binding<String?>
    private let hint: String?
    private let error: String?
    private let info: String?
    private let required: Bool
    private let optional: Bool

    public init(_ label: String, value: Binding<String?>, hint: String? = nil, error: String? = nil, info: String? = nil, required: Bool = false, optional: Bool = false) {
        self.label = label
        self.value = value
        self.hint = hint
        self.error = error
        self.info = info
        self.required = required
        self.optional = optional
    }

    private var pick: Binding<Date> {
        Binding(
            get: {
                let parts = (value.wrappedValue.flatMap { ZCDates.isValidHm($0) ? $0 : nil } ?? "09:00").split(separator: ":").compactMap { Int($0) }
                return Calendar.current.date(bySettingHour: parts[0], minute: parts[1], second: 0, of: Date()) ?? Date()
            },
            set: { d in
                let c = Calendar.current.dateComponents([.hour, .minute], from: d)
                value.wrappedValue = String(format: "%02d:%02d", c.hour ?? 0, c.minute ?? 0)
            }
        )
    }

    public var body: some View {
        ZCTextField(
            label,
            text: Binding(get: { value.wrappedValue ?? "" }, set: { raw in let m = ZCDates.maskHm(raw); value.wrappedValue = m.isEmpty ? nil : m }),
            placeholder: ZCString.text("ui.formatoHora"), hint: hint, error: error, info: info, required: required, optional: optional,
            keyboard: .numberPad, allowed: "[0-9:]", maxLength: 5,
            trailingIcon: .sClockCircle, trailingLabel: ZCString.text("ui.elegirHora"), onTrailingTap: { open = true }
        )
        .zcChoice(isPresented: $open, title: label) { close in
            VStack(spacing: ZCSpace.v2) {
                DatePicker(label, selection: pick, displayedComponents: .hourAndMinute).datePickerStyle(.wheel).labelsHidden()
                HStack { Spacer(); ZCButton(ZCString.text("ui.listo"), size: .sm, action: close) }
            }
            .padding(ZCSpace.v4)
        }
    }
}

// MARK: - Credencial enmascarada

/// Credencial enmascarada: los últimos 4 caracteres a la vista, mostrar (solo con `canReveal`; avisa por `onRevealed` para la auditoría) y copiar con
/// confirmación. Copiar siempre copia el valor real, marcado como local y con vencimiento para que no viaje a otros dispositivos. El estado "visible" no
/// se conserva al volver.
public struct ZCSecretField: View {
    @Environment(\.zcTheme) private var theme
    @State private var shown = false
    @State private var copied = false
    private let value: String
    private let label: String
    private let hint: String?
    private let canReveal: Bool
    private let keepPrefix: String
    private let toasts: ZCToastState?
    private let onRevealed: () -> Void

    public init(value: String, label: String, hint: String? = nil, canReveal: Bool = true, keepPrefix: String = "", toasts: ZCToastState? = nil, onRevealed: @escaping () -> Void = {}) {
        self.value = value
        self.label = label
        self.hint = hint
        self.canReveal = canReveal
        self.keepPrefix = keepPrefix
        self.toasts = toasts
        self.onRevealed = onRevealed
    }

    public var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: ZCRadius.sm, style: .continuous)
        let text = shown ? value : keepPrefix + String(repeating: "•", count: 12) + value.suffix(4)
        ZCField(label, hint: hint) {
            HStack(spacing: 0) {
                ScrollView(.horizontal, showsIndicators: false) {
                    Text(text).font(.system(size: 14, design: .monospaced)).foregroundStyle(c.text).lineLimit(1).padding(.horizontal, ZCSpace.v4).frame(minHeight: ZCSize.target)
                }
                .accessibilityLabel(label)
                .accessibilityValue(shown ? value : "••••" + value.suffix(4))
                if canReveal {
                    ZCIconButton(shown ? .sEyeClosed : .sEye, label: ZCString.text(shown ? "mol.secreto.ocultar" : "mol.secreto.mostrar", label), small: true) {
                        shown.toggle()
                        if shown { onRevealed(); toasts?.info(ZCString.text("mol.secreto.visible", label), text: ZCString.text("mol.secreto.auditado")) }
                    }
                }
                ZCIconButton(copied ? .lCheck : .sCopy, label: ZCString.text(copied ? "mol.secreto.copiada" : "mol.secreto.copiar", label), small: true) {
                    UIPasteboard.general.setItems([[UIPasteboard.typeAutomatic: value]], options: [.localOnly: true, .expirationDate: Date().addingTimeInterval(120)])
                    copied = true
                    let done = ZCString.text("mol.secreto.copiadaToast", label)
                    toasts?.success(done)
                    AccessibilityNotification.Announcement(done).post()
                    Task { try? await Task.sleep(nanoseconds: 1_600_000_000); copied = false }
                }
            }
            .background(c.surface2, in: shape)
            .overlay(shape.stroke(c.borderStrong))
        }
    }
}

// MARK: - Etiquetas

public enum ZCTagKind: Sendable { case email, text }

/// Varias etiquetas (por lo general correos) en un campo. Coma, punto y coma, espacio o "Listo" del teclado agregan; pegar una lista la separa; las repetidas
/// se avisan y no se agregan; con `max`, al llegar al tope el campo lo dice. Cada etiqueta se valida por separado (no válida con texto para VoiceOver).
public struct ZCTagsField: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @FocusState private var focused: Bool
    @State private var text = ""
    @State private var flash = ZCFlash()
    private let label: String
    private let value: Binding<[String]>
    private let kind: ZCTagKind
    private let max: Int?
    private let placeholder: String?
    private let hint: String?
    private let error: String?
    private let required: Bool
    private let optional: Bool

    public init(_ label: String, value: Binding<[String]>, kind: ZCTagKind = .email, max: Int? = nil, placeholder: String? = nil, hint: String? = nil, error: String? = nil, required: Bool = false, optional: Bool = false) {
        self.label = label
        self.value = value
        self.kind = kind
        self.max = max
        self.placeholder = placeholder
        self.hint = hint
        self.error = error
        self.required = required
        self.optional = optional
    }

    private func isValid(_ t: String) -> Bool {
        kind != .email || t.range(of: #"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"#, options: .regularExpression) != nil
    }

    private func add(_ items: [String]) {
        var current = value.wrappedValue
        var repeated = false
        for raw in items {
            let t = raw.trimmingCharacters(in: .whitespaces)
            if t.isEmpty { continue }
            if current.contains(where: { $0.caseInsensitiveCompare(t) == .orderedSame }) { repeated = true; continue }
            if let max, current.count >= max { flash.show(ZCString.text("ui.maximoEtiquetas", max)); break }
            current.append(t)
        }
        if repeated { flash.show(ZCString.text("ui.repetido")) }
        if current.count != value.wrappedValue.count { value.wrappedValue = current }
    }

    private func commit() {
        let v = text.trimmingCharacters(in: CharacterSet(charactersIn: ",; ").union(.whitespaces))
        text = ""
        if !v.isEmpty { add([v]) }
    }

    public var body: some View {
        let c = theme.colors
        let full = max.map { value.wrappedValue.count >= $0 } ?? false
        ZCField(label, required: required, optional: optional, hint: hint, error: error, flash: flash) {
            ZCFlowLayout(spacing: 6, lineSpacing: 2) {
                ForEach(value.wrappedValue, id: \.self) { t in
                    ZCChip(t, onRemove: isEnabled ? { value.wrappedValue.removeAll { $0 == t } } : nil, invalid: !isValid(t))
                }
                TextField("", text: Binding(get: { text }, set: { raw in
                    let pasted = raw.count - text.count > 1
                    if pasted || raw.contains(where: { $0 == "," || $0 == ";" || $0.isWhitespace }) {
                        let parts = raw.components(separatedBy: CharacterSet(charactersIn: ",;").union(.whitespaces)).filter { !$0.isEmpty }
                        let endsWithSeparator = raw.last.map { $0 == "," || $0 == ";" || $0.isWhitespace } ?? false
                        if pasted || endsWithSeparator { add(parts); text = "" } else { add(Array(parts.dropLast())); text = parts.last ?? "" }
                    } else { text = raw }
                }), prompt: Text(full ? ZCString.text("ui.maximoAlcanzado") : (placeholder ?? "")).foregroundStyle(c.textSubtle))
                    .font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.text).tint(c.text)
                    .keyboardType(kind == .email ? .emailAddress : .default).textInputAutocapitalization(.never).autocorrectionDisabled()
                    .submitLabel(.done).focused($focused).onSubmit(commit)
                    .disabled(full)
                    .frame(minWidth: 160, minHeight: ZCSize.targetSm)
                    .accessibilityLabel(zcFieldName(label, required: required))
                    .onChange(of: focused) { old, new in if old && !new { commit() } }
            }
            .padding(.leading, ZCSpace.v3).padding(.trailing, ZCSpace.v2).padding(.vertical, 4)
            .frame(maxWidth: .infinity, minHeight: theme.shape.fieldH, alignment: .leading)
            .zcControlBox(focused: focused, invalid: (flash.message ?? error) != nil, disabled: !isEnabled)
            .contentShape(Rectangle())
            .onTapGesture { focused = true }
        }
    }
}
