import SwiftUI
import ZonacardsTokens

// MARK: - Pasos de un formulario

/// Pasos de un formulario largo. Desde 768 pt de ancho: pasos en horizontal (hechos con check, el actual destacado; se desplazan si no caben).
/// En iPhone: compacto, "Paso 2 de 4: Contacto" con barra de progreso. No es interactivo: solo informa.
public struct ZCStepper: View {
    @Environment(\.zcTheme) private var theme
    private let steps: [String]
    private let current: Int
    private let label: String

    public init(steps: [String], current: Int, label: String) {
        self.steps = steps
        self.current = current
        self.label = label
    }

    public var body: some View {
        let c = theme.colors
        if !steps.isEmpty {
            ViewThatFits(in: .horizontal) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: ZCSpace.v2) {
                        ForEach(Array(steps.enumerated()), id: \.offset) { i, s in
                            let done = i < current, on = i == current
                            let (fill, line, ink): (Color, Color, Color) = done ? (c.successFg, c.successFg, c.surface) : (on ? (c.primary, c.primary, c.onPrimary) : (.clear, c.borderStrong, c.textMuted))
                            HStack(spacing: ZCSpace.v2) {
                                ZStack {
                                    Circle().fill(fill)
                                    Circle().stroke(line, lineWidth: 1.5)
                                    if done { ZCIcon(.lCheck, size: ZCSize.iconSm).foregroundStyle(ink) }
                                    else { Text("\(i + 1)").font(.zc(ZCType.caption, theme: theme).weight(ZCWeight.semibold).zcTabular()).foregroundStyle(ink) }
                                }
                                .frame(width: 28, height: 28)
                                Text(s).font(.zc(ZCType.bodySm, theme: theme).weight(on ? .medium : .regular)).foregroundStyle(on ? c.text : c.textMuted).lineLimit(1)
                            }
                            .padding(.leading, ZCSpace.v2).padding(.trailing, ZCSpace.v3)
                            .frame(height: 44)
                            .background { if on { Capsule().fill(c.surface2) } }
                            .accessibilityElement(children: .ignore)
                            .accessibilityLabel(done ? ZCString.text("org.pasoCompletado", s) : s)
                            .accessibilityAddTraits(on ? .isSelected : [])
                        }
                    }
                }
                .frame(minWidth: 768)
                compact
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(label)
        }
    }

    private var compact: some View {
        let c = theme.colors
        let progress = CGFloat(current + 1) / CGFloat(max(steps.count, 1))
        return HStack(spacing: ZCSpace.v3) {
            Text(ZCString.text("org.pasoDe", current + 1, steps.count, steps.indices.contains(current) ? steps[current] : ""))
                .font(.zc(ZCType.bodySm, theme: theme).zcTabular()).foregroundStyle(c.text)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(c.surface3)
                    Capsule().fill(c.primary).frame(width: geo.size.width * progress)
                }
            }
            .frame(height: 6)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(ZCString.text("org.progreso"))
            .accessibilityValue("\(current + 1)/\(steps.count)")
        }
    }
}

// MARK: - Resumen de errores

public struct ZCFormError: Identifiable {
    public let id: String
    public let message: String

    public init(id: String, message: String) {
        self.id = id
        self.message = message
    }
}

/// Resumen de errores al tope del formulario. Al fallar el envío el resumen se anuncia de inmediato y cada error es un toque que lleva al campo
/// (`onGo`). Sin errores no ocupa espacio.
public struct ZCFormSummary: View {
    @Environment(\.zcTheme) private var theme
    private let errors: [ZCFormError]
    private let onGo: (String) -> Void

    public init(errors: [ZCFormError], onGo: @escaping (String) -> Void) {
        self.errors = errors
        self.onGo = onGo
    }

    private var title: String {
        errors.count == 1 ? ZCString.text("org.revisaCampo") : ZCString.text("org.revisaCampos", errors.count)
    }

    public var body: some View {
        if !errors.isEmpty {
            let c = theme.colors
            let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
            HStack(alignment: .top, spacing: ZCSpace.v3) {
                ZCIcon(.sDangerCircle, size: ZCSize.iconMd).foregroundStyle(c.dangerFg).padding(.top, 2)
                VStack(alignment: .leading, spacing: ZCSpace.v1) {
                    Text(title).font(.zc(ZCType.body, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(c.dangerFg).accessibilityAddTraits(.isHeader)
                    ForEach(errors) { e in
                        Button { onGo(e.id) } label: {
                            Text(e.message).font(.zc(ZCType.bodySm, theme: theme)).underline().foregroundStyle(c.dangerFg)
                                .frame(maxWidth: .infinity, minHeight: ZCSize.targetSm, alignment: .leading).contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(ZCSpace.v4)
            .background(c.dangerBg, in: shape)
            .overlay(shape.stroke(c.dangerBd))
            .onAppear {
                var message = AttributedString(title)
                message.accessibilitySpeechAnnouncementPriority = .high
                AccessibilityNotification.Announcement(message).post()
            }
        }
    }
}

// MARK: - Contraseña

/// Contraseña nueva con medidor de seguridad: mostrar y ocultar con un solo ícono, cuatro barras (peligro, aviso, info, éxito) y el nivel anunciado.
/// El medidor no reemplaza el mensaje del campo: los errores siguen en el campo. Los requisitos van aparte, con `ZCPasswordRules`.
public struct ZCPasswordField: View {
    @Environment(\.zcTheme) private var theme
    private let label: String
    private let text: Binding<String>
    private let hint: String?
    private let error: String?
    private let required: Bool
    private let submitLabel: SubmitLabel
    private let onSubmit: (() -> Void)?

    public init(_ label: String, text: Binding<String>, hint: String? = nil, error: String? = nil, required: Bool = false, submitLabel: SubmitLabel = .next, onSubmit: (() -> Void)? = nil) {
        self.label = label
        self.text = text
        self.hint = hint
        self.error = error
        self.required = required
        self.submitLabel = submitLabel
        self.onSubmit = onSubmit
    }

    public var body: some View {
        let c = theme.colors
        let score = ZCPassword.score(text.wrappedValue)
        let bar: Color = score == 1 ? c.dangerFg : (score == 2 ? c.warningFg : (score == 3 ? c.infoFg : c.successFg))
        let level = ZCString.text("mol.clave.nivel.\(min(max(score, 0), 4))")
        ZCTextField(
            label, text: text, hint: hint, error: error, required: required, password: true, submitLabel: submitLabel,
            below: AnyView(
                VStack(alignment: .leading, spacing: ZCSpace.v2) {
                    HStack(spacing: ZCSpace.v1) {
                        ForEach(0..<4, id: \.self) { i in Capsule().fill(score >= i + 1 ? bar : c.surface3).frame(height: 6) }
                    }
                    .accessibilityHidden(true)
                    Text(ZCString.text("mol.clave.seguridad", level)).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
                        .accessibilityLabel(ZCString.text("mol.clave.seguridad", level))
                }
            ),
            onSubmit: onSubmit
        )
    }
}

/// Requisitos de la contraseña: ícono y texto, y "cumplido" o "pendiente" para VoiceOver.
public struct ZCPasswordRules: View {
    @Environment(\.zcTheme) private var theme
    private let value: String

    public init(value: String) { self.value = value }

    public var body: some View {
        let c = theme.colors
        let checks = ZCPassword.checks(value)
        let rules: [(String, Bool)] = [("mol.clave.regla.len", checks.len), ("mol.clave.regla.case", checks.case), ("mol.clave.regla.num", checks.num), ("mol.clave.regla.sym", checks.sym)]
        VStack(alignment: .leading, spacing: ZCSpace.v1) {
            ForEach(Array(rules.enumerated()), id: \.offset) { _, rule in
                let text = ZCString.text(rule.0)
                let tone = rule.1 ? c.successFg : c.textMuted
                HStack(spacing: 6) {
                    ZCIcon(rule.1 ? .sCheckCircle : .sCloseCircle, size: ZCSize.iconSm).foregroundStyle(tone)
                    Text(text).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(tone)
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("\(text), \(ZCString.text(rule.1 ? "mol.clave.cumplido" : "mol.clave.pendiente"))")
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(ZCString.text("mol.clave.requisitos"))
    }
}
