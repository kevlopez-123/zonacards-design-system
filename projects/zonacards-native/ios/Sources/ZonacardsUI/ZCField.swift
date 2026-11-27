import SwiftUI
import ZonacardsTokens

/// Aviso temporal de un campo (como `field.flash()` de la web): reemplaza la ayuda 1,6 s, en tono de error. Se usa al rechazar caracteres.
@Observable
public final class ZCFlash {
    public internal(set) var message: String?
    var seq = 0
    public init() {}
    public func show(_ text: String) {
        message = text
        seq += 1
    }
}

/// Caja de un control de formulario con la forma y el estilo de la marca: `theme.shape.control`, `fieldBg`, `fieldBd`.
/// Foco con borde `focus` y halo; error en `danger`, éxito en `success`; deshabilitado con borde punteado y fondo `surface2`.
struct ZCControlBox: ViewModifier {
    @Environment(\.zcTheme) private var theme
    let focused: Bool
    let invalid: Bool
    let disabled: Bool
    let valid: Bool

    func body(content: Content) -> some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: theme.shape.control, style: .continuous)
        let border: Color = invalid ? c.dangerFg : (valid ? c.successFg : (focused ? c.focus : c.fieldBd))
        content
            .background(disabled ? c.surface2 : c.fieldBg, in: shape)
            .overlay(shape.stroke(border, style: StrokeStyle(lineWidth: 1, dash: disabled ? [4, 3] : [])))
            .overlay {
                if focused && !disabled {
                    shape.stroke((invalid ? c.dangerFg : c.focus).opacity(0.22), lineWidth: 6).padding(-3)
                }
            }
    }
}

extension View {
    func zcControlBox(focused: Bool = false, invalid: Bool = false, disabled: Bool = false, valid: Bool = false) -> some View {
        modifier(ZCControlBox(focused: focused, invalid: invalid, disabled: disabled, valid: valid))
    }
}

/// Nombre que lee VoiceOver: etiqueta + "obligatorio" (el asterisco es solo visual).
func zcFieldName(_ label: String, required: Bool) -> String {
    required ? "\(label) (\(ZCString.text("comun.obligatorio")))" : label
}

/// Marco de un campo: etiqueta (con * u "(opcional)" y ayuda "?"), el control y una línea de mensaje que reserva su alto:
/// error con ícono, éxito con ícono, aviso temporal (`flash`) o ayuda, y el contador a la derecha.
public struct ZCField<Control: View>: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @State private var showInfo = false
    private let label: String
    private let required: Bool
    private let optional: Bool
    private let hint: String?
    private let error: String?
    private let counter: String?
    private let success: String?
    private let info: String?
    private let flash: ZCFlash?
    private let reserve: Bool
    private let control: Control

    public init(
        _ label: String,
        required: Bool = false,
        optional: Bool = false,
        hint: String? = nil,
        error: String? = nil,
        counter: String? = nil,
        success: String? = nil,
        info: String? = nil,
        flash: ZCFlash? = nil,
        reserve: Bool = true,
        @ViewBuilder control: () -> Control
    ) {
        self.label = label
        self.required = required
        self.optional = optional
        self.hint = hint
        self.error = error
        self.counter = counter
        self.success = success
        self.info = info
        self.flash = flash
        self.reserve = reserve
        self.control = control()
    }

    public var body: some View {
        let c = theme.colors
        let shownError = flash?.message ?? error
        let caption = ZCTypeStyle(size: ZCType.caption.size, lineHeight: 20, relativeTo: .caption)
        VStack(alignment: .leading, spacing: ZCSpace.v2) {
            HStack(spacing: ZCSpace.v1) {
                HStack(spacing: 0) {
                    Text(label).font(.zc(ZCType.bodySm, theme: theme).weight(.medium)).foregroundStyle(c.text).lineLimit(1)
                    if required { Text(" *").font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.dangerFg) }
                    if optional { Text(" \(ZCString.text("comun.opcional"))").font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.textMuted) }
                }
                .accessibilityHidden(true)
                if let info {
                    Button { showInfo = true } label: {
                        ZCIcon(.sQuestionCircle, size: 16).foregroundStyle(c.textSubtle).frame(width: ZCSize.targetSm, height: ZCSize.targetSm).contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(ZCString.text("comun.masInfo")): \(info)")
                    .popover(isPresented: $showInfo) {
                        Text(info).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.text).padding(ZCSpace.v4).frame(maxWidth: 280, alignment: .leading)
                            .presentationCompactAdaptation(.popover)
                    }
                }
            }
            .frame(minHeight: 20)
            control.opacity(isEnabled ? 1 : 0.6)
            if shownError != nil || success != nil || hint != nil || counter != nil || reserve {
                HStack(alignment: .top, spacing: 6) {
                    if let shownError {
                        ZCIcon(.sDangerCircle, size: 16).foregroundStyle(c.dangerFg).padding(.top, 2)
                        Text(shownError).font(.zc(caption, theme: theme)).foregroundStyle(c.dangerFg).frame(maxWidth: .infinity, alignment: .leading)
                    } else if let success {
                        ZCIcon(.sCheckCircle, size: 16).foregroundStyle(c.successFg).padding(.top, 2)
                        Text(success).font(.zc(caption, theme: theme)).foregroundStyle(c.successFg).frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        Text(hint ?? "").font(.zc(caption, theme: theme)).foregroundStyle(c.textMuted).frame(maxWidth: .infinity, alignment: .leading)
                    }
                    if let counter { Text(counter).font(.zc(caption, theme: theme)).foregroundStyle(c.textMuted) }
                }
                .frame(minHeight: 20)
                .accessibilityHidden(true)
            }
        }
        .task(id: flash?.seq ?? 0) {
            guard let flash, flash.message != nil else { return }
            try? await Task.sleep(nanoseconds: 1_600_000_000)
            flash.message = nil
        }
    }
}

/// Campo de texto: caja de alto `theme.shape.fieldH`, texto de cuerpo y un solo ícono a la derecha (contraseña: mostrar u ocultar).
/// `allowed` (expresión regular de UN carácter, como `\d`) rechaza lo demás y avisa con `rejectMessage`; `maxLength` corta; `onBlur` normaliza.
/// `multiline` lo vuelve área de texto (mínimo 96 pt).
public struct ZCTextField: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @FocusState private var focused: Bool
    @State private var ownFlash = ZCFlash()
    @State private var reveal = false

    private let label: String
    private let text: Binding<String>
    private let placeholder: String?
    private let hint: String?
    private let error: String?
    private let success: String?
    private let info: String?
    private let required: Bool
    private let optional: Bool
    private let password: Bool
    private let keyboard: UIKeyboardType
    private let capitalization: TextInputAutocapitalization
    private let submitLabel: SubmitLabel
    private let allowed: String?
    private let rejectMessage: String?
    private let maxLength: Int?
    private let showCounter: Bool
    private let multiline: Bool
    private let prefix: String?
    private let suffix: String?
    private let trailingIcon: ZCIconName?
    private let trailingLabel: String?
    private let onTrailingTap: (() -> Void)?
    private let hideLabel: Bool
    private let flash: ZCFlash?
    private let leading: AnyView?
    private let below: AnyView?
    private let reserve: Bool
    private let onSubmit: (() -> Void)?
    private let onBlur: (() -> Void)?
    private let onFocusChange: ((Bool) -> Void)?
    private let focusRequest: Int

    public init(
        _ label: String,
        text: Binding<String>,
        placeholder: String? = nil,
        hint: String? = nil,
        error: String? = nil,
        success: String? = nil,
        info: String? = nil,
        required: Bool = false,
        optional: Bool = false,
        password: Bool = false,
        keyboard: UIKeyboardType = .default,
        capitalization: TextInputAutocapitalization = .sentences,
        submitLabel: SubmitLabel = .next,
        allowed: String? = nil,
        rejectMessage: String? = nil,
        maxLength: Int? = nil,
        showCounter: Bool = false,
        multiline: Bool = false,
        prefix: String? = nil,
        suffix: String? = nil,
        trailingIcon: ZCIconName? = nil,
        trailingLabel: String? = nil,
        onTrailingTap: (() -> Void)? = nil,
        hideLabel: Bool = false,
        flash: ZCFlash? = nil,
        leading: AnyView? = nil,
        below: AnyView? = nil,
        reserve: Bool = true,
        onSubmit: (() -> Void)? = nil,
        onBlur: (() -> Void)? = nil,
        onFocusChange: ((Bool) -> Void)? = nil,
        focusRequest: Int = 0
    ) {
        self.label = label
        self.text = text
        self.placeholder = placeholder
        self.hint = hint
        self.error = error
        self.success = success
        self.info = info
        self.required = required
        self.optional = optional
        self.password = password
        self.keyboard = keyboard
        self.capitalization = capitalization
        self.submitLabel = submitLabel
        self.allowed = allowed
        self.rejectMessage = rejectMessage
        self.maxLength = maxLength
        self.showCounter = showCounter
        self.multiline = multiline
        self.prefix = prefix
        self.suffix = suffix
        self.trailingIcon = trailingIcon
        self.trailingLabel = trailingLabel
        self.onTrailingTap = onTrailingTap
        self.hideLabel = hideLabel
        self.flash = flash
        self.leading = leading
        self.below = below
        self.reserve = reserve
        self.onSubmit = onSubmit
        self.onBlur = onBlur
        self.onFocusChange = onFocusChange
        self.focusRequest = focusRequest
    }

    private var activeFlash: ZCFlash { flash ?? ownFlash }

    private func accepts(_ ch: Character) -> Bool {
        guard let allowed else { return true }
        return String(ch).range(of: "^(?:\(allowed))$", options: .regularExpression) != nil
    }

    /// Filtra lo no permitido (avisando), corta al largo máximo y entrega el valor.
    private var filtered: Binding<String> {
        Binding(
            get: { text.wrappedValue },
            set: { raw in
                var v = allowed == nil ? raw : String(raw.filter(accepts))
                if v.count < raw.count { activeFlash.show(rejectMessage ?? ZCString.text("ui.soloNumeros")) }
                if let maxLength { v = String(v.prefix(maxLength)) }
                if v != text.wrappedValue { text.wrappedValue = v }
            }
        )
    }

    @ViewBuilder private var input: some View {
        let prompt = Text(placeholder ?? "").foregroundStyle(theme.colors.textSubtle)
        if password && !reveal {
            SecureField("", text: filtered, prompt: prompt)
        } else if multiline {
            TextField("", text: filtered, prompt: prompt, axis: .vertical).lineLimit(3...8)
        } else {
            TextField("", text: filtered, prompt: prompt)
        }
    }

    private var box: some View {
        let c = theme.colors
        let invalid = (activeFlash.message ?? error) != nil
        return HStack(alignment: multiline ? .top : .center, spacing: ZCSpace.v2) {
            if let leading { leading }
            if let prefix { Text(prefix).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.textMuted).accessibilityHidden(true) }
            input
                .font(.zc(ZCType.body, theme: theme))
                .foregroundStyle(c.text)
                .tint(c.text)
                .keyboardType(password ? .asciiCapable : keyboard)
                .textInputAutocapitalization(password ? .never : capitalization)
                .autocorrectionDisabled(password || allowed != nil)
                .submitLabel(submitLabel)
                .focused($focused)
                .onSubmit { onSubmit?() }
                .padding(.vertical, multiline ? ZCSpace.v3 : 0)
                .frame(minHeight: multiline ? 96 : theme.shape.fieldH, alignment: multiline ? .topLeading : .leading)
                .accessibilityLabel(zcFieldName(label, required: required))
                .accessibilityHint(activeFlash.message ?? error ?? hint ?? "")
            if let suffix {
                Text(suffix).font(.zc(ZCType.caption, theme: theme).weight(.medium)).foregroundStyle(c.textMuted).accessibilityHidden(true)
            }
            if password {
                ZCIconButton(reveal ? .sEyeClosed : .sEye, label: ZCString.text(reveal ? "ui.ocultarClave" : "ui.mostrarClave"), small: true) { reveal.toggle() }
            } else if let trailingIcon {
                if let onTrailingTap, let trailingLabel {
                    ZCIconButton(trailingIcon, label: trailingLabel, small: true, action: onTrailingTap)
                } else {
                    ZCIcon(trailingIcon, size: 20).foregroundStyle(c.textMuted).accessibilityHidden(true)
                }
            }
        }
        .padding(.leading, leading == nil ? ZCSpace.v4 : 0)
        .padding(.trailing, (password || trailingIcon != nil) ? ZCSpace.v1 : (suffix != nil ? ZCSpace.v4 : ZCSpace.v4))
        .zcControlBox(focused: focused, invalid: invalid, disabled: !isEnabled, valid: success != nil)
        .contentShape(Rectangle())
        .onTapGesture { focused = true }
        // Un número que sube lleva el foco al campo desde afuera (por ejemplo, al primer campo con error del servidor: `ZCServerErrors`).
        .onChange(of: focusRequest) { _, _ in focused = true }
        .onChange(of: focused) { old, new in
            if old && !new { onBlur?() }
            onFocusChange?(new)
        }
    }

    public var body: some View {
        let counter = showCounter && maxLength != nil ? "\(text.wrappedValue.count)/\(maxLength!)" : nil
        if hideLabel {
            box
        } else {
            ZCField(label, required: required, optional: optional, hint: hint, error: error, counter: counter, success: success, info: info, flash: activeFlash, reserve: reserve) {
                VStack(alignment: .leading, spacing: ZCSpace.v2) {
                    box
                    if let below { below }
                }
            }
        }
    }
}

/// Área de texto: mínimo 96 pt, crece con el contenido; contador opcional con `maxLength`.
public struct ZCTextArea: View {
    private let label: String
    private let text: Binding<String>
    private let placeholder: String?
    private let hint: String?
    private let error: String?
    private let required: Bool
    private let optional: Bool
    private let maxLength: Int?

    public init(_ label: String, text: Binding<String>, placeholder: String? = nil, hint: String? = nil, error: String? = nil, required: Bool = false, optional: Bool = false, maxLength: Int? = nil) {
        self.label = label
        self.text = text
        self.placeholder = placeholder
        self.hint = hint
        self.error = error
        self.required = required
        self.optional = optional
        self.maxLength = maxLength
    }

    public var body: some View {
        ZCTextField(label, text: text, placeholder: placeholder, hint: hint, error: error, required: required, optional: optional, submitLabel: .return, maxLength: maxLength, showCounter: maxLength != nil, multiline: true)
    }
}

/// Buscador: lupa a la izquierda, sin etiqueta visible (la etiqueta es el nombre para VoiceOver), "Limpiar" a la derecha cuando hay texto.
/// La acción del teclado es "Buscar".
public struct ZCSearchField: View {
    @Environment(\.zcTheme) private var theme
    private let query: Binding<String>
    private let label: String?
    private let placeholder: String?
    private let onSearch: ((String) -> Void)?

    public init(query: Binding<String>, label: String? = nil, placeholder: String? = nil, onSearch: ((String) -> Void)? = nil) {
        self.query = query
        self.label = label
        self.placeholder = placeholder
        self.onSearch = onSearch
    }

    public var body: some View {
        let name = label ?? ZCString.text("ui.buscar")
        ZCTextField(
            name, text: query, placeholder: placeholder ?? name,
            submitLabel: .search,
            trailingIcon: query.wrappedValue.isEmpty ? nil : .lX,
            trailingLabel: ZCString.text("ui.limpiar"),
            onTrailingTap: { query.wrappedValue = "" },
            hideLabel: true,
            leading: AnyView(ZCIcon(.sMagnifer, size: 16).foregroundStyle(theme.colors.textMuted).padding(.leading, ZCSpace.v4)),
            onSubmit: { onSearch?(query.wrappedValue) }
        )
    }
}
