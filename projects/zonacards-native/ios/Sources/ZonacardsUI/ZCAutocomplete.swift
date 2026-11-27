import SwiftUI
import ZonacardsTokens

/// Lista de una búsqueda hecha por quien llama: las opciones ya vienen filtradas (por ejemplo, desde el servidor).
private struct ZCRemoteList<Value: Hashable>: View {
    @Environment(\.zcTheme) private var theme
    @State private var query = ""
    let options: [ZCOption<Value>]
    let selected: Value?
    let loading: Bool
    let minChars: Int
    let onQueryChange: (String) -> Void
    let onSelect: (ZCOption<Value>) -> Void
    let onCreate: ((String) -> Void)?
    let close: () -> Void

    private var text: String { query.trimmingCharacters(in: .whitespaces) }
    private var short: Bool { text.count < minChars }
    private var canCreate: Bool {
        onCreate != nil && !short && !loading && !options.contains { $0.label.localizedCaseInsensitiveCompare(text) == .orderedSame }
    }

    var body: some View {
        let c = theme.colors
        VStack(spacing: 0) {
            ZCSearchField(query: $query, label: ZCString.text("ui.buscarOpcion")).padding(.horizontal, ZCSpace.v4).padding(.top, ZCSpace.v3)
            ScrollView {
                LazyVStack(spacing: 0) {
                    if loading {
                        HStack(spacing: ZCSpace.v2) {
                            ZCSpinner(size: 16, decorative: true)
                            Text(ZCString.text("ui.buscando")).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.textMuted)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(ZCSpace.v6)
                    } else {
                        ForEach(options) { option in row(option) }
                        if options.isEmpty {
                            Text(short ? ZCString.text("ui.escribeMinimo", minChars) : ZCString.text("ui.sinResultadosAyuda", text))
                                .font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.textMuted).padding(ZCSpace.v6)
                        }
                        if canCreate { createRow }
                    }
                }
                .padding(.vertical, ZCSpace.v2)
            }
        }
        .background(c.surface)
        // Espera a que termine de escribir (250 ms): pedir una búsqueda por tecla satura al servidor. Escribir de nuevo cancela la espera.
        .task(id: query) {
            try? await Task.sleep(nanoseconds: 250_000_000)
            if !Task.isCancelled { onQueryChange(text) }
        }
    }

    private func row(_ option: ZCOption<Value>) -> some View {
        let c = theme.colors
        let on = option.value == selected
        return Button {
            onSelect(option)
            close()
        } label: {
            HStack(spacing: ZCSpace.v3) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(option.label).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.text)
                    if let d = option.description { Text(d).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted) }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                if on { ZCIcon(.sCheckCircle, size: 20).foregroundStyle(c.primary) }
            }
            .padding(.horizontal, ZCSpace.v4)
            .frame(minHeight: ZCSize.targetSm)
            .background(on ? c.surface2 : .clear)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!option.enabled)
        .opacity(option.enabled ? 1 : 0.45)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(option.label)
        .accessibilityValue(option.description ?? "")
        .accessibilityAddTraits(on ? [.isButton, .isSelected] : [.isButton])
    }

    private var createRow: some View {
        let c = theme.colors
        return Button {
            onCreate?(text)
            close()
        } label: {
            HStack(spacing: ZCSpace.v3) {
                ZCIcon(.sAddCircle, size: 20).foregroundStyle(c.text)
                Text(ZCString.text("ui.crearTexto", text)).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.text)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.horizontal, ZCSpace.v4)
            .frame(minHeight: ZCSize.targetSm)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(ZCString.text("ui.crearTexto", text))
        .accessibilityAddTraits(.isButton)
    }
}

/// Select con búsqueda hecha por quien llama (equivale a `zc-autocomplete` y al ComboBox con datos remotos): al escribir, espera 250 ms y llama a
/// `onQueryChange(texto)`; la app responde con `options` ya filtradas (del servidor) y `loading` mientras tarda. Con menos de `minChars` letras no
/// se pide nada y se explica ("Escribe al menos 2 letras"); sin resultados, se dice con ayuda; con `onCreate` se ofrece "Crear “texto”".
/// `selection` es la opción elegida: el campo muestra su etiqueta aunque ya no esté en `options` (otra búsqueda la sacó de la lista).
/// Como `ZCSelect`, la lista va en una hoja y, dentro de otra hoja, como subpantalla con Volver.
public struct ZCAutocomplete<Value: Hashable>: View {
    @State private var open = false
    private let label: String
    private let options: [ZCOption<Value>]
    private let selection: Binding<ZCOption<Value>?>
    private let onQueryChange: (String) -> Void
    private let placeholder: String?
    private let hint: String?
    private let error: String?
    private let required: Bool
    private let loading: Bool
    private let minChars: Int
    private let onCreate: ((String) -> Void)?

    public init(_ label: String, options: [ZCOption<Value>], selection: Binding<ZCOption<Value>?>, onQueryChange: @escaping (String) -> Void,
                placeholder: String? = nil, hint: String? = nil, error: String? = nil, required: Bool = false, loading: Bool = false,
                minChars: Int = 2, onCreate: ((String) -> Void)? = nil) {
        self.label = label
        self.options = options
        self.selection = selection
        self.onQueryChange = onQueryChange
        self.placeholder = placeholder
        self.hint = hint
        self.error = error
        self.required = required
        self.loading = loading
        self.minChars = minChars
        self.onCreate = onCreate
    }

    public var body: some View {
        ZCField(label, required: required, hint: hint, error: error) {
            ZCSelectTrigger(name: zcFieldName(label, required: required), valueText: selection.wrappedValue?.label,
                            placeholder: placeholder ?? ZCString.text("ui.selecciona"), icon: .sMagnifier, invalid: error != nil) { open = true }
        }
        .zcChoice(isPresented: $open, title: label) { close in
            ZCRemoteList(options: options, selected: selection.wrappedValue?.value, loading: loading, minChars: minChars,
                         onQueryChange: onQueryChange, onSelect: { selection.wrappedValue = $0 }, onCreate: onCreate, close: close)
        }
    }
}
