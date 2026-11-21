import SwiftUI
import ZonacardsTokens

/// Monto en la moneda del país: símbolo a la izquierda y código ISO a la derecha; solo dígitos y hasta los decimales del país
/// (CLP y COP sin decimales). Mientras se escribe se ve el número limpio; al salir, con separadores ("1,250.00").
public struct ZCMoneyField: View {
    @State private var raw = ""
    @State private var focused = false
    private let label: String
    private let amount: Binding<Double?>
    private let country: String
    private let hint: String?
    private let error: String?
    private let required: Bool

    public init(_ label: String, amount: Binding<Double?>, country: String, hint: String? = nil, error: String? = nil, required: Bool = false) {
        self.label = label
        self.amount = amount
        self.country = country
        self.hint = hint
        self.error = error
        self.required = required
    }

    private var decimals: Int { ZCMoney.country(country).decimals }

    private func plain(_ a: Double) -> String {
        let s = String(format: "%.\(decimals)f", a)
        guard decimals > 0, s.contains(".") else { return s }
        var t = s
        while t.hasSuffix("0") { t.removeLast() }
        if t.hasSuffix(".") { t.removeLast() }
        return t
    }

    private var shown: Binding<String> {
        Binding(
            get: {
                if !focused, let a = amount.wrappedValue {
                    return ZCMoney.format(a, country: country).replacingOccurrences(of: ZCMoney.currencySymbol(country), with: "").trimmingCharacters(in: .whitespacesAndNewlines)
                }
                return raw
            },
            set: { v in
                // Acepta "," o "." como separador decimal; guarda con punto.
                let norm = v.replacingOccurrences(of: ",", with: ".")
                let pattern = decimals == 0 ? "^\\d{0,13}$" : "^\\d{0,13}(\\.\\d{0,\(decimals)})?$"
                if norm.range(of: pattern, options: .regularExpression) != nil {
                    raw = norm
                    amount.wrappedValue = Double(norm)
                }
            }
        )
    }

    public var body: some View {
        ZCTextField(
            label, text: shown, hint: hint, error: error, required: required,
            keyboard: decimals == 0 ? .numberPad : .decimalPad,
            submitLabel: .done,
            prefix: ZCMoney.currencySymbol(country), suffix: ZCMoney.country(country).currency,
            onFocusChange: { isFocused in
                if isFocused { raw = amount.wrappedValue.map(plain) ?? "" }
                focused = isFocused
            }
        )
        .onAppear { raw = amount.wrappedValue.map(plain) ?? "" }
        .onChange(of: country) { _, _ in raw = amount.wrappedValue.map(plain) ?? "" }
    }
}

/// Teléfono: a la izquierda bandera, prefijo y flecha (abre la lista de países en una hoja, con búsqueda), y los dígitos nacionales en grupos de 3.
public struct ZCPhoneField: View {
    @Environment(\.zcTheme) private var theme
    @State private var open = false
    private let label: String
    private let digits: Binding<String>
    private let country: Binding<String>
    private let hint: String?
    private let error: String?
    private let required: Bool

    public init(_ label: String, digits: Binding<String>, country: Binding<String>, hint: String? = nil, error: String? = nil, required: Bool = false) {
        self.label = label
        self.digits = digits
        self.country = country
        self.hint = hint
        self.error = error
        self.required = required
    }

    private var grouped: Binding<String> {
        Binding(
            get: { ZCPhone.format(digits.wrappedValue) },
            set: { digits.wrappedValue = ZCPhone.digits($0, country: country.wrappedValue) }
        )
    }

    private var countrySet: Binding<Set<String>> {
        Binding(
            get: { [country.wrappedValue] },
            set: { if let c = $0.first, c != country.wrappedValue { country.wrappedValue = c; digits.wrappedValue = ZCPhone.digits(digits.wrappedValue, country: c) } }
        )
    }

    public var body: some View {
        let dial = ZCPhone.dialCountry(country.wrappedValue)
        let c = theme.colors
        let picker = Button { open = true } label: {
            HStack(spacing: 6) {
                ZCFlag(dial.code)
                Text(dial.dial).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.text)
                ZCIcon(.sAltArrowDown, size: 16).foregroundStyle(c.textMuted)
            }
            .padding(.leading, ZCSpace.v4)
            .padding(.trailing, ZCSpace.v1)
            .frame(minHeight: ZCSize.targetSm)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(ZCString.text("ui.codigoPais", dial.name, dial.dial))
        .accessibilityAddTraits(.isButton)
        ZCTextField(
            label, text: grouped, hint: hint, error: error, required: required,
            keyboard: .phonePad, allowed: "\\d|\\s", rejectMessage: ZCString.text("ui.soloNumeros"),
            leading: AnyView(HStack(spacing: 0) { picker; Rectangle().fill(c.border).frame(width: 1, height: 24) })
        )
        .zcChoice(isPresented: $open, title: ZCString.text("ui.paisOPrefijo")) { close in
            ZCOptionSheet(
                options: ZCDomainData.dialCountries.map { ZCOption($0.code, label: $0.name, description: $0.dial) },
                multiple: false, selected: countrySet, close: close
            )
        }
    }
}

/// Identificador tributario del país (RUC, NIT, RUT, RFC): segmento izquierdo con el tipo, rechaza caracteres no permitidos,
/// corta al largo máximo, teclado numérico o de texto según el país y normaliza al salir (mayúsculas, guion del verificador).
/// Al cambiar de país el documento anterior ya no aplica y se vacía.
public struct ZCTaxIdField: View {
    @Environment(\.zcTheme) private var theme
    private let value: Binding<String>
    private let country: String
    private let label: String?
    private let hint: String?
    private let error: String?
    private let required: Bool

    public init(value: Binding<String>, country: String, label: String? = nil, hint: String? = nil, error: String? = nil, required: Bool = false) {
        self.value = value
        self.country = country
        self.label = label
        self.hint = hint
        self.error = error
        self.required = required
    }

    private var rule: ZCTaxIdRule { ZCDomainData.taxIdRules[country] ?? ZCDomainData.taxIdRules["pe"]! }

    private var rejectKey: String {
        switch country {
        case "co": return "ui.soloNumerosGuion"
        case "cl": return "ui.soloNumerosKGuion"
        case "mx": return "ui.soloLetrasNumeros"
        default: return "ui.soloNumeros"
        }
    }

    public var body: some View {
        let info = ZCMoney.country(country)
        let c = theme.colors
        ZCTextField(
            label ?? info.taxId, text: value, hint: hint ?? info.taxIdHint, error: error, required: required,
            keyboard: rule.inputMode == "numeric" ? .numberPad : .asciiCapable,
            capitalization: .characters,
            allowed: rule.allowed, rejectMessage: ZCString.text(rejectKey), maxLength: rule.maxLength,
            leading: AnyView(HStack(spacing: 0) {
                Text(info.taxId).font(.zc(ZCType.bodySm, theme: theme).weight(.medium)).foregroundStyle(c.textMuted).padding(.horizontal, ZCSpace.v3).accessibilityHidden(true)
                Rectangle().fill(c.border).frame(width: 1, height: 24)
            }),
            onBlur: {
                let n = ZCTaxId.normalize(country: country, value.wrappedValue)
                if n != value.wrappedValue { value.wrappedValue = n }
            }
        )
        .onChange(of: country) { _, _ in if !value.wrappedValue.isEmpty { value.wrappedValue = "" } }
    }
}

/// `true` si el valor es un identificador tributario válido para el país (con verificador cuando existe).
public func zcIsValidTaxId(country: String, _ value: String) -> Bool { ZCTaxId.isValid(country: country, value) }

/// Código de un solo uso: casilleros de hasta 52 pt de ancho, con 6 o más dígitos un guion separa las mitades (123 – 456).
/// `valid` pinta el borde de éxito; rechaza lo que no es número con aviso; pegar el código completo funciona. Llama `onComplete` al llegar al largo.
public struct ZCOtpField: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @FocusState private var focused: Bool
    @State private var flash = ZCFlash()
    private let label: String
    private let value: Binding<String>
    private let length: Int
    private let error: String?
    private let hint: String?
    private let valid: Bool
    private let onComplete: ((String) -> Void)?

    public init(_ label: String, value: Binding<String>, length: Int = 6, error: String? = nil, hint: String? = nil, valid: Bool = false, onComplete: ((String) -> Void)? = nil) {
        self.label = label
        self.value = value
        self.length = length
        self.error = error
        self.hint = hint
        self.valid = valid
        self.onComplete = onComplete
    }

    private var digitsOnly: Binding<String> {
        Binding(
            get: { value.wrappedValue },
            set: { raw in
                if raw.contains(where: { !("0"..."9").contains($0) }) { flash.show(ZCString.text("mol.otp.soloNumeros")) }
                let d = String(raw.filter { ("0"..."9").contains($0) }.prefix(length))
                if d != value.wrappedValue {
                    value.wrappedValue = d
                    if d.count == length { onComplete?(d) }
                }
            }
        )
    }

    public var body: some View {
        let c = theme.colors
        let split = length >= 6 ? length / 2 : -1
        let chars = Array(value.wrappedValue)
        let invalid = (flash.message ?? error) != nil
        ZCField(label, hint: hint, error: error, flash: flash) {
            ZStack {
                HStack(spacing: ZCSpace.v2) {
                    ForEach(0..<length, id: \.self) { i in
                        if i == split { Text("–").foregroundStyle(c.textSubtle) }
                        let active = focused && (i == chars.count || (i == length - 1 && chars.count == length))
                        Text(i < chars.count ? String(chars[i]) : "")
                            .font(.zc(ZCTypeStyle(size: 20, lineHeight: 28, relativeTo: .title3), theme: theme).weight(.semibold))
                            .foregroundStyle(c.text)
                            .frame(maxWidth: 52)
                            .frame(height: ZCSize.target)
                            .frame(maxWidth: .infinity)
                            .zcControlBox(focused: active, invalid: invalid, disabled: !isEnabled, valid: valid)
                    }
                }
                .frame(maxWidth: 380)
                .accessibilityHidden(true)
                // El campo real es invisible y cubre los casilleros: recibe el teclado numérico y el código pegado.
                TextField("", text: digitsOnly)
                    .keyboardType(.numberPad)
                    .textContentType(.oneTimeCode)
                    .focused($focused)
                    .foregroundStyle(.clear)
                    .tint(.clear)
                    .opacity(0.02)
                    .accessibilityLabel(label)
                    .accessibilityValue("\(value.wrappedValue.count)/\(length)")
                    .accessibilityHint(flash.message ?? error ?? "")
            }
            .contentShape(Rectangle())
            .onTapGesture { focused = true }
        }
    }
}

/// Número entero con − y +: caja de control con botones de paso y rango `min`…`max`. VoiceOver lo trata como control ajustable (deslizar arriba o abajo).
public struct ZCNumberField: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    private let value: Binding<Int>
    private let min: Int
    private let max: Int
    private let label: String?

    public init(value: Binding<Int>, min: Int = 0, max: Int = Int.max, label: String? = nil) {
        self.value = value
        self.min = min
        self.max = max
        self.label = label
    }

    private func step(_ icon: ZCIconName, name: String, can: Bool, delta: Int) -> some View {
        Button { value.wrappedValue = Swift.min(Swift.max(value.wrappedValue + delta, min), max) } label: {
            ZCIcon(icon, size: 16)
                .foregroundStyle(can ? theme.colors.text : theme.colors.textSubtle)
                .frame(width: ZCSize.target, height: ZCSize.target)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!can || !isEnabled)
        .accessibilityLabel(name)
    }

    public var body: some View {
        let c = theme.colors
        HStack(spacing: 0) {
            step(.lMinus, name: ZCString.text("ui.disminuir"), can: value.wrappedValue > min, delta: -1)
            Rectangle().fill(c.border).frame(width: 1, height: ZCSize.target)
            Text("\(value.wrappedValue)")
                .font(.zc(ZCType.body, theme: theme).monospacedDigit())
                .foregroundStyle(c.text)
                .frame(maxWidth: .infinity)
                .accessibilityHidden(true)
            Rectangle().fill(c.border).frame(width: 1, height: ZCSize.target)
            step(.lPlus, name: ZCString.text("ui.aumentar"), can: value.wrappedValue < max, delta: 1)
        }
        .frame(height: ZCSize.target)
        .zcControlBox(disabled: !isEnabled)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label ?? "")
        .accessibilityValue("\(value.wrappedValue)")
        .accessibilityAdjustableAction { direction in
            switch direction {
            case .increment: value.wrappedValue = Swift.min(value.wrappedValue + 1, max)
            case .decrement: value.wrappedValue = Swift.max(value.wrappedValue - 1, min)
            @unknown default: break
            }
        }
    }
}
