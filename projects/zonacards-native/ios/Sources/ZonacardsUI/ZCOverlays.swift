import SwiftUI
import ZonacardsTokens

// MARK: - Subpantallas dentro de una hoja

/// Pila de subpantallas de una hoja. Regla del sistema: nunca una hoja sobre otra; lo que se abriría encima (selects, calendario,
/// menús) entra como subpantalla con "Volver" dentro de la misma hoja.
@Observable
final class ZCSubscreenHost {
    struct Item: Identifiable {
        let id = UUID()
        let title: String
        let content: AnyView
        let onPop: () -> Void
    }

    var stack: [Item] = []

    func push<V: View>(title: String, onPop: @escaping () -> Void = {}, @ViewBuilder content: () -> V) {
        stack.append(Item(title: title, content: AnyView(content()), onPop: onPop))
    }

    @discardableResult
    func pop() -> Bool {
        guard let last = stack.popLast() else { return false }
        last.onPop()
        return true
    }

    func popAll() {
        while pop() {}
    }
}

private struct ZCSubscreenHostKey: EnvironmentKey { static let defaultValue: ZCSubscreenHost? = nil }

extension EnvironmentValues {
    var zcSubscreenHost: ZCSubscreenHost? {
        get { self[ZCSubscreenHostKey.self] }
        set { self[ZCSubscreenHostKey.self] = newValue }
    }
}

private struct ZCHeightKey: PreferenceKey {
    static let defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
}

// MARK: - Hoja

/// Cuerpo de una hoja inferior: encabezado con título y X, cuerpo con subpantallas y pie fijo con borde. Se cierra arrastrando, tocando el fondo,
/// con la X o con el gesto de volver; `busy` bloquea el cierre. Forma `theme.shape.sheet`.
struct ZCSheetBody<Content: View, Footer: View>: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.dismiss) private var dismiss
    @State private var host = ZCSubscreenHost()
    @State private var bodyHeight: CGFloat = 0
    let title: String?
    let subtitle: String?
    let closable: Bool
    let busy: Bool
    let dismissible: Bool
    let fit: Bool
    let scrolls: Bool
    let hasFooter: Bool
    let footer: Footer
    let content: Content

    init(
        title: String?, subtitle: String? = nil, closable: Bool = true, busy: Bool = false, dismissible: Bool = true,
        fit: Bool = true, scrolls: Bool = true, hasFooter: Bool = false,
        @ViewBuilder footer: () -> Footer, @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.subtitle = subtitle
        self.closable = closable
        self.busy = busy
        self.dismissible = dismissible
        self.fit = fit
        self.scrolls = scrolls
        self.hasFooter = hasFooter
        self.footer = footer()
        self.content = content()
    }

    private var detents: Set<PresentationDetent> {
        guard fit, scrolls, host.stack.isEmpty, bodyHeight > 0 else { return [.medium, .large] }
        // Alto del contenido más el encabezado, el pie y el margen inferior; máximo 700 pt (después se desplaza).
        let chrome: CGFloat = 20 + 64 + 1 + (hasFooter ? 89 : 0) + 34
        return [.height(min(max(bodyHeight + chrome, 160), 700)), .large]
    }

    private func titleBlock(_ t: String, _ sub: String?) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(t).font(.zc(ZCType.titleSm, theme: theme).weight(.semibold)).foregroundStyle(theme.colors.text).accessibilityAddTraits(.isHeader)
            if let sub { Text(sub).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(theme.colors.textMuted) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    var body: some View {
        let c = theme.colors
        VStack(spacing: 0) {
            if let sub = host.stack.last {
                HStack(spacing: ZCSpace.v1) {
                    ZCIconButton(.sAltArrowLeft, label: ZCString.text("ui.volver"), small: true) { host.pop() }
                    titleBlock(sub.title, nil)
                }
                .padding(.horizontal, ZCSpace.v2)
                .padding(.vertical, ZCSpace.v2)
                ZCDivider()
                sub.content
            } else {
                HStack(alignment: .top, spacing: ZCSpace.v2) {
                    if let title { titleBlock(title, subtitle) }
                    else { Spacer() }
                    if closable { ZCIconButton(.lX, label: ZCString.text("ui.cerrar"), small: true) { dismiss() }.disabled(busy) }
                }
                .padding(.leading, ZCSpace.v4)
                .padding(.trailing, ZCSpace.v2)
                .padding(.vertical, ZCSpace.v2)
                ZCDivider()
                if scrolls {
                    ScrollView {
                        content
                            .padding(ZCSpace.v4)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(GeometryReader { Color.clear.preference(key: ZCHeightKey.self, value: $0.size.height) })
                    }
                    .scrollBounceBehavior(.basedOnSize)
                } else {
                    content
                }
                if hasFooter {
                    ZCDivider()
                    HStack(spacing: ZCSpace.v2) { footer }.padding(ZCSpace.v4)
                }
            }
        }
        .frame(maxHeight: .infinity, alignment: .top)
        .background(c.surface)
        .environment(\.zcSubscreenHost, host)
        .onPreferenceChange(ZCHeightKey.self) { bodyHeight = $0 }
        .presentationDetents(detents)
        .presentationDragIndicator(.visible)
        .presentationBackground(c.surface)
        .presentationCornerRadius(theme.shape.sheet)
        .interactiveDismissDisabled(busy || !dismissible)
        .preferredColorScheme(theme.isDark ? .dark : .light)
        .onDisappear { host.popAll() }
    }
}

/// Botón del pie de un overlay: ocupa su parte del ancho (todos iguales, como la web).
public func ZCFooterButton(_ title: String, variant: ZCButtonVariant = .primary, loading: Bool = false, action: @escaping () -> Void) -> some View {
    ZCButton(title, variant: variant, loading: loading, block: true, action: action)
}

public extension View {
    /// Hoja inferior con título y subtítulo, X, cuerpo que se desplaza y pie fijo (`footer`: botones con `ZCFooterButton`).
    /// Se ajusta al alto del contenido (máximo 700 pt). En iPad el sistema la muestra centrada.
    func zcSheet<Sheet: View, Footer: View>(
        isPresented: Binding<Bool>, title: String? = nil, subtitle: String? = nil, closable: Bool = true, busy: Bool = false,
        @ViewBuilder footer: @escaping () -> Footer, @ViewBuilder content: @escaping () -> Sheet
    ) -> some View {
        sheet(isPresented: isPresented) {
            ZCSheetBody(title: title, subtitle: subtitle, closable: closable, busy: busy, hasFooter: true, footer: footer, content: content)
        }
    }

    /// Hoja inferior sin pie.
    func zcSheet<Sheet: View>(
        isPresented: Binding<Bool>, title: String? = nil, subtitle: String? = nil, closable: Bool = true, busy: Bool = false,
        @ViewBuilder content: @escaping () -> Sheet
    ) -> some View {
        sheet(isPresented: isPresented) {
            ZCSheetBody(title: title, subtitle: subtitle, closable: closable, busy: busy, footer: { EmptyView() }, content: content)
        }
    }

    /// Modal: en iPhone es una hoja inferior; en iPad, la hoja centrada del sistema. Título y subtítulo sin ícono al costado;
    /// lo destructivo se marca con el botón `.danger` del pie.
    func zcModal<Sheet: View, Footer: View>(
        isPresented: Binding<Bool>, title: String, subtitle: String? = nil, closable: Bool = true, busy: Bool = false,
        @ViewBuilder footer: @escaping () -> Footer, @ViewBuilder content: @escaping () -> Sheet
    ) -> some View {
        zcSheet(isPresented: isPresented, title: title, subtitle: subtitle, closable: closable, busy: busy, footer: footer, content: content)
    }

    /// Lo que se abre desde un campo o botón (lista de opciones, calendario, menú): subpantalla con "Volver" si ya está dentro de una hoja;
    /// si no, una hoja propia con encabezado. `content` recibe `close`.
    func zcChoice<Sheet: View>(isPresented: Binding<Bool>, title: String, @ViewBuilder content: @escaping (_ close: @escaping () -> Void) -> Sheet) -> some View {
        modifier(ZCChoicePresenter(isPresented: isPresented, title: title, sheet: content))
    }
}

struct ZCChoicePresenter<Sheet: View>: ViewModifier {
    @Environment(\.zcSubscreenHost) private var host
    @Binding var isPresented: Bool
    let title: String
    let sheet: (_ close: @escaping () -> Void) -> Sheet

    func body(content: Content) -> some View {
        if let host {
            content.onChange(of: isPresented) { _, on in
                guard on else { return }
                host.push(title: title, onPop: { isPresented = false }) { sheet { host.pop() } }
            }
        } else {
            content.sheet(isPresented: $isPresented) {
                ZCSheetBody(title: title, fit: false, scrolls: false, footer: { EmptyView() }) { sheet { isPresented = false } }
            }
        }
    }
}

// MARK: - Confirmación

private struct ZCAlertSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.zcTheme) private var theme
    @State private var reason = ""
    @State private var word = ""
    let title: String
    let text: String
    let confirmLabel: String
    let cancelLabel: String
    let danger: Bool
    let loading: Bool
    let reasonLabel: String?
    let confirmWord: String?
    let onConfirm: (String?) -> Void

    private var ready: Bool {
        (reasonLabel == nil || reason.trimmingCharacters(in: .whitespacesAndNewlines).count >= 5)
            && (confirmWord == nil || word.trimmingCharacters(in: .whitespacesAndNewlines) == confirmWord)
    }

    var body: some View {
        ZCSheetBody(title: title, closable: false, busy: loading, dismissible: false, hasFooter: true) {
            ZCFooterButton(cancelLabel, variant: .outline) { dismiss() }.disabled(loading)
            ZCFooterButton(confirmLabel, variant: danger ? .danger : .primary, loading: loading) {
                onConfirm(reasonLabel != nil ? reason.trimmingCharacters(in: .whitespacesAndNewlines) : nil)
            }
            .disabled(!ready)
        } content: {
            VStack(alignment: .leading, spacing: ZCSpace.v4) {
                ZCText(text, tone: .muted)
                if let reasonLabel {
                    ZCTextArea(reasonLabel, text: $reason, hint: ZCString.text("org.motivoMin", "5"), required: true)
                }
                if let confirmWord {
                    ZCTextField(ZCString.text("org.escribeParaConfirmar", confirmWord), text: $word, capitalization: .never, submitLabel: .done)
                }
            }
        }
    }
}

public extension View {
    /// Confirmación (alert dialog): título, texto y dos botones iguales; `danger` pinta la confirmación en rojo. `reasonLabel` pide un
    /// motivo (mínimo 5 caracteres) y `confirmWord` pide escribir una palabra; la confirmación queda deshabilitada hasta completarlos.
    /// No se cierra arrastrando ni tocando el fondo.
    func zcAlertDialog(
        isPresented: Binding<Bool>, title: String, text: String, confirmLabel: String, cancelLabel: String,
        danger: Bool = false, loading: Bool = false, reasonLabel: String? = nil, confirmWord: String? = nil,
        onConfirm: @escaping (_ reason: String?) -> Void
    ) -> some View {
        sheet(isPresented: isPresented) {
            ZCAlertSheet(title: title, text: text, confirmLabel: confirmLabel, cancelLabel: cancelLabel, danger: danger, loading: loading, reasonLabel: reasonLabel, confirmWord: confirmWord, onConfirm: onConfirm)
        }
    }
}

// MARK: - Avisos (toasts)

public enum ZCToastKind: Sendable { case success, error, info }

public struct ZCToast: Identifiable {
    public let id: Int
    public let kind: ZCToastKind
    public let title: String
    public let text: String?
    public let actionLabel: String?
    public let onAction: (() -> Void)?
    /// Segundos; nulo = no se cierra solo (errores con acción).
    public let duration: Double?
}

/// Avisos de resultado de una acción. Un solo `ZCToaster` en la raíz de la app. 6 s por defecto; los errores con acción ("Reintentar")
/// no se cierran solos; con más de 3, los demás esperan en cola.
@Observable
public final class ZCToastState {
    public private(set) var items: [ZCToast] = []
    private var queue: [ZCToast] = []
    private var next = 0
    public init() {}

    @discardableResult
    public func show(_ kind: ZCToastKind, _ title: String, text: String? = nil, actionLabel: String? = nil, onAction: (() -> Void)? = nil, duration: Double? = nil) -> Int {
        next += 1
        let d = duration ?? ((kind == .error && actionLabel != nil) ? nil : 6)
        let toast = ZCToast(id: next, kind: kind, title: title, text: text, actionLabel: actionLabel, onAction: onAction, duration: d)
        if items.count < 3 { items.append(toast) } else { queue.append(toast) }
        return next
    }

    @discardableResult public func success(_ title: String, text: String? = nil, actionLabel: String? = nil, onAction: (() -> Void)? = nil) -> Int { show(.success, title, text: text, actionLabel: actionLabel, onAction: onAction) }
    @discardableResult public func error(_ title: String, text: String? = nil, actionLabel: String? = nil, onAction: (() -> Void)? = nil) -> Int { show(.error, title, text: text, actionLabel: actionLabel, onAction: onAction) }
    @discardableResult public func info(_ title: String, text: String? = nil) -> Int { show(.info, title, text: text) }

    public func dismiss(_ id: Int) {
        items.removeAll { $0.id == id }
        queue.removeAll { $0.id == id }
        while items.count < 3, !queue.isEmpty { items.append(queue.removeFirst()) }
    }
}

private struct ZCToastRow: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var held = false
    @State private var shown = false
    let toast: ZCToast
    let state: ZCToastState

    var body: some View {
        let c = theme.colors
        let (icon, tone): (ZCIconName, Color) = {
            switch toast.kind {
            case .success: return (.sCheckCircle, c.successFg)
            case .error: return (.sDangerCircle, c.dangerFg)
            case .info: return (.sInfoCircle, c.infoFg)
            }
        }()
        let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
        HStack(alignment: .top, spacing: ZCSpace.v3) {
            ZCIcon(icon, size: 20).foregroundStyle(tone).padding(.top, 2)
            VStack(alignment: .leading, spacing: 2) {
                Text(toast.title).font(.zc(ZCType.body, theme: theme).weight(.semibold)).foregroundStyle(c.text)
                if let text = toast.text { Text(text).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.textMuted) }
                if let label = toast.actionLabel {
                    ZCButton(label, variant: .link, size: .sm) { toast.onAction?(); state.dismiss(toast.id) }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            ZCIconButton(.lX, label: ZCString.text("ui.cerrarNotificacion"), small: true) { state.dismiss(toast.id) }
                .padding(.trailing, -ZCSpace.v2).padding(.top, -ZCSpace.v2)
        }
        .padding(ZCSpace.v4)
        .background(c.surface, in: shape)
        .overlay(shape.stroke(c.border))
        .opacity(shown ? 1 : 0)
        .offset(y: shown ? 0 : -8)
        .animation(reduceMotion ? .easeOut(duration: ZCMotion.fast) : .easeOut(duration: ZCMotion.base), value: shown)
        .onLongPressGesture(minimumDuration: .infinity, perform: {}, onPressingChanged: { held = $0 })
        .accessibilityElement(children: .contain)
        .onAppear {
            shown = true
            // Los errores se anuncian con prioridad; el resto, al aparecer.
            var message = AttributedString(toast.title + (toast.text.map { ". " + $0 } ?? ""))
            message.accessibilitySpeechAnnouncementPriority = toast.kind == .error ? .high : .default
            AccessibilityNotification.Announcement(message).post()
        }
        .task(id: toast.id) {
            guard let duration = toast.duration else { return }
            var left = duration
            while left > 0 {
                try? await Task.sleep(nanoseconds: 100_000_000)
                if Task.isCancelled { return }
                if !held { left -= 0.1 }
            }
            state.dismiss(toast.id)
        }
    }
}

/// Pila de avisos arriba (bajo la barra superior). VoiceOver los anuncia al aparecer; el tiempo se detiene mientras se toca el aviso.
public struct ZCToaster: View {
    private let state: ZCToastState

    public init(state: ZCToastState) { self.state = state }

    public var body: some View {
        VStack(spacing: ZCSpace.v2) {
            ForEach(state.items) { toast in
                ZCToastRow(toast: toast, state: state)
            }
        }
        .frame(maxWidth: 400)
        .padding(.horizontal, ZCSpace.v4)
        .padding(.vertical, ZCSpace.v2)
        .frame(maxWidth: .infinity, alignment: .top)
    }
}
