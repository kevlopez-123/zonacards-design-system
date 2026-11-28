import SwiftUI
import UIKit
import ZonacardsTokens

/// Tamaño de letra para números tabulares: los montos y fechas no bailan al cambiar.
extension Font {
    func zcTabular() -> Font { monospacedDigit() }
}

// MARK: - Alert

public enum ZCAlertTone: Sendable { case info, success, warning, danger }

/// Aviso dentro de la página: no se cierra solo. Siempre ícono y título, nunca solo color. `danger` se anuncia de inmediato; el resto, con calma.
/// Error de servidor de un formulario: `danger` al tope, con la referencia en el texto. Las acciones van en `actions` (usa `ZCAlertAction`).
public struct ZCAlert<Actions: View>: View {
    @Environment(\.zcTheme) private var theme
    private let title: String
    private let tone: ZCAlertTone
    private let text: String?
    private let actions: Actions

    public init(_ title: String, tone: ZCAlertTone = .info, text: String? = nil, @ViewBuilder actions: () -> Actions) {
        self.title = title
        self.tone = tone
        self.text = text
        self.actions = actions()
    }

    public var body: some View {
        let c = theme.colors
        let (icon, fg, bg, bd): (ZCIconName, Color, Color, Color) = {
            switch tone {
            case .info: return (.sInfoCircle, c.infoFg, c.infoBg, c.infoBd)
            case .success: return (.sCheckCircle, c.successFg, c.successBg, c.successBd)
            case .warning: return (.sDangerTriangle, c.warningFg, c.warningBg, c.warningBd)
            case .danger: return (.sCloseCircle, c.dangerFg, c.dangerBg, c.dangerBd)
            }
        }()
        let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
        HStack(alignment: .top, spacing: ZCSpace.v3) {
            ZCIcon(icon, size: 20).foregroundStyle(fg).padding(.top, 2)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.zc(ZCType.body, theme: theme).weight(.semibold)).foregroundStyle(fg)
                if let text { Text(text).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(fg) }
                if Actions.self != EmptyView.self {
                    HStack(spacing: ZCSpace.v2) { actions }.padding(.top, ZCSpace.v3)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(ZCSpace.v4)
        .background(bg, in: shape)
        .overlay(shape.stroke(bd))
        .accessibilityElement(children: .contain)
        .onAppear {
            guard tone == .danger else { return }
            var message = AttributedString(title + (text.map { ". " + $0 } ?? ""))
            message.accessibilitySpeechAnnouncementPriority = .high
            AccessibilityNotification.Announcement(message).post()
        }
    }
}

public extension ZCAlert where Actions == EmptyView {
    init(_ title: String, tone: ZCAlertTone = .info, text: String? = nil) {
        self.init(title, tone: tone, text: text) { EmptyView() }
    }
}

/// Botón de acción de un `ZCAlert`: outline, pequeño.
public func ZCAlertAction(_ title: String, action: @escaping () -> Void) -> some View {
    ZCButton(title, variant: .outline, size: .sm, action: action)
}

// MARK: - Tabs

/// Una pestaña. `count` es un contador en píldora de color primario.
public struct ZCTab: Identifiable {
    public let value: String
    public let label: String
    public let icon: ZCIconName?
    public let count: Int?
    public let enabled: Bool
    public var id: String { value }

    public init(value: String, label: String, icon: ZCIconName? = nil, count: Int? = nil, enabled: Bool = true) {
        self.value = value
        self.label = label
        self.icon = icon
        self.count = count
        self.enabled = enabled
    }
}

public enum ZCTabsVariant: Sendable { case line, segmented }

/// Pestañas. `line`: subrayado, con ícono y contador (secciones de una ficha, estados de una lista). `segmented`: pastilla con fondo (alternar vistas o
/// periodos, 2 a 4 opciones). Si no caben, se desplazan en horizontal (nunca saltan de línea) y la elegida se trae a la vista; el indicador se desliza.
/// El contenido de cada panel lo arma quien llama.
public struct ZCTabs: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Namespace private var indicator
    private let tabs: [ZCTab]
    private let selected: Binding<String>
    private let variant: ZCTabsVariant
    private let label: String?

    public init(tabs: [ZCTab], selected: Binding<String>, variant: ZCTabsVariant = .line, label: String? = nil) {
        self.tabs = tabs
        self.selected = selected
        self.variant = variant
        self.label = label
    }

    public var body: some View {
        let c = theme.colors
        let line = variant == .line
        let triggerH: CGFloat = line ? ZCSize.target : ZCSize.target - 8
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: line ? 20 : 4) {
                    ForEach(tabs) { tab in
                        let on = tab.value == selected.wrappedValue
                        let color = on ? c.text : c.textMuted
                        Button {
                            guard !on else { return }
                            withAnimation(reduceMotion ? nil : .easeOut(duration: ZCMotion.base)) { selected.wrappedValue = tab.value }
                        } label: {
                            HStack(spacing: ZCSpace.v2) {
                                if let icon = tab.icon { ZCIcon(icon, size: 16) }
                                Text(tab.label).font(.zc(ZCType.body, theme: theme).weight(on ? .medium : .regular)).lineLimit(1)
                                if let count = tab.count {
                                    Text("\(count)").font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme).weight(.semibold))
                                        .foregroundStyle(c.onPrimary).padding(.horizontal, 6).frame(minWidth: 20, minHeight: 20)
                                        .background(c.primary, in: Capsule())
                                }
                            }
                            .foregroundStyle(color)
                            .padding(.horizontal, line ? 2 : 16)
                            .frame(minHeight: triggerH)
                            .background {
                                if on {
                                    if line {
                                        VStack { Spacer(); Capsule().fill(c.text).frame(height: 2) }.matchedGeometryEffect(id: "indicator", in: indicator)
                                    } else {
                                        Capsule().fill(c.surface).shadow(color: .black.opacity(0.12), radius: 1, y: 1).matchedGeometryEffect(id: "indicator", in: indicator)
                                    }
                                }
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .disabled(!tab.enabled)
                        .opacity(tab.enabled ? 1 : ZCOpacity.disabled)
                        .id(tab.value)
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel(tab.count.map { "\(tab.label), \($0)" } ?? tab.label)
                        .accessibilityAddTraits(on ? [.isButton, .isSelected] : [.isButton])
                    }
                }
                .padding(line ? 0 : 4)
                .background { if !line { Capsule().fill(c.surface2) } }
            }
            .onChange(of: selected.wrappedValue) { _, v in withAnimation { proxy.scrollTo(v, anchor: .center) } }
        }
        .overlay(alignment: .bottom) { if line { ZCDivider() } }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label ?? "")
    }
}

// MARK: - Acordeón

/// Un elemento de un `ZCAccordion`. `aside` (estado u otro dato a la derecha del título) se oculta en pantallas de menos de 400 pt.
public struct ZCAccordionItem: Identifiable {
    public let id: String
    public let title: String
    public let subtitle: String?
    public let icon: ZCIconName?
    public let enabled: Bool
    public let aside: AnyView?
    public let content: AnyView

    public init<Content: View>(id: String, title: String, subtitle: String? = nil, icon: ZCIconName? = nil, enabled: Bool = true, aside: AnyView? = nil, @ViewBuilder content: () -> Content) {
        self.id = id
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.enabled = enabled
        self.aside = aside
        self.content = AnyView(content())
    }
}

public enum ZCAccordionVariant: Sendable { case card, flush }

/// Acordeón. `multiple = false`: uno abierto a la vez (preguntas frecuentes); `true`: varios (formularios largos por secciones) y, con `label`,
/// el botón "Expandir todo / Contraer todo". `flush`: sin bordes laterales, dentro de paneles y hojas.
public struct ZCAccordion: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var open: [String]
    private let items: [ZCAccordionItem]
    private let multiple: Bool
    private let variant: ZCAccordionVariant
    private let label: String?

    public init(items: [ZCAccordionItem], multiple: Bool = false, variant: ZCAccordionVariant = .card, label: String? = nil, initiallyOpen: [String] = []) {
        self.items = items
        self.multiple = multiple
        self.variant = variant
        self.label = label
        _open = State(initialValue: initiallyOpen)
    }

    private func toggle(_ id: String) {
        withAnimation(reduceMotion ? nil : .easeOut(duration: ZCMotion.base)) {
            if multiple { if open.contains(id) { open.removeAll { $0 == id } } else { open.append(id) } }
            else { open = open.contains(id) ? [] : [id] }
        }
    }

    public var body: some View {
        let c = theme.colors
        let enabledIds = items.filter(\.enabled).map(\.id)
        let allOpen = !enabledIds.isEmpty && enabledIds.allSatisfy(open.contains)
        let flush = variant == .flush
        let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
        VStack(alignment: .leading, spacing: ZCSpace.v2) {
            if let label {
                HStack {
                    Text(label).font(.zc(ZCType.bodySm, theme: theme).weight(.medium)).foregroundStyle(c.text)
                    Spacer()
                    if multiple {
                        Button { withAnimation { open = allOpen ? [] : enabledIds } } label: {
                            Text(ZCString.text(allOpen ? "ui.contraerTodo" : "ui.expandirTodo")).font(.zc(ZCType.caption, theme: theme)).underline().foregroundStyle(c.text)
                                .frame(minHeight: ZCSize.targetSm).contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                    if i > 0 { ZCDivider() }
                    row(item, flush: flush)
                }
            }
            .background { if !flush { shape.fill(c.surface) } }
            .overlay {
                if flush { VStack { ZCDivider(); Spacer(); ZCDivider() } }
                else { shape.stroke(c.border) }
            }
            .clipShape(flush ? AnyShape(Rectangle()) : AnyShape(shape))
        }
    }

    private func row(_ item: ZCAccordionItem, flush: Bool) -> some View {
        let c = theme.colors
        let isOpen = open.contains(item.id)
        let padX: CGFloat = flush ? 0 : 16
        return VStack(spacing: 0) {
            Button { toggle(item.id) } label: {
                HStack(spacing: ZCSpace.v3) {
                    if let icon = item.icon {
                        ZCIcon(icon, size: 16).foregroundStyle(c.text).frame(width: 36, height: 36).background(c.surface2, in: RoundedRectangle(cornerRadius: ZCRadius.ms, style: .continuous))
                    }
                    VStack(alignment: .leading, spacing: 0) {
                        Text(item.title).font(.zc(ZCType.body, theme: theme).weight(.medium)).foregroundStyle(c.text)
                        if let sub = item.subtitle, !sub.isEmpty { Text(sub).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted) }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    if let aside = item.aside, UIScreen.main.bounds.width >= 400 { aside }
                    ZCIcon(.sAltArrowDown, size: 16).foregroundStyle(c.textMuted).rotationEffect(.degrees(isOpen ? 180 : 0))
                }
                .padding(.horizontal, padX)
                .padding(.vertical, ZCSpace.v3)
                .frame(minHeight: ZCSize.target)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .disabled(!item.enabled)
            .opacity(item.enabled ? 1 : 0.55)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(item.title)
            .accessibilityValue(item.subtitle ?? "")
            .accessibilityHint(isOpen ? "Contraer" : "Expandir")
            .accessibilityAddTraits([.isButton, .isHeader])
            if isOpen {
                item.content
                    .foregroundStyle(c.textMuted)
                    .padding(.horizontal, padX)
                    .padding(.bottom, ZCSpace.v4)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .transition(.opacity)
            }
        }
    }
}

// MARK: - Lista de descripción

/// Un par dato–valor. `flag`: código de país, con la bandera antes del valor.
public struct ZCDescription: Identifiable {
    public let term: String
    public let value: String
    public let flag: String?
    public var id: String { term }

    public init(term: String, value: String, flag: String? = nil) {
        self.term = term
        self.value = value
        self.flag = flag
    }
}

public enum ZCDescriptionLayout: Sendable { case grid, rows }

/// Pares dato–valor de una ficha. `grid`: dos columnas desde 448 pt de ancho (una, si no caben); `rows`: una por fila con el valor a la derecha
/// (resúmenes, hojas). Los montos ya vienen formateados por quien llama.
public struct ZCDescriptionList: View {
    @Environment(\.zcTheme) private var theme
    private let items: [ZCDescription]
    private let layout: ZCDescriptionLayout

    public init(items: [ZCDescription], layout: ZCDescriptionLayout = .grid) {
        self.items = items
        self.layout = layout
    }

    private func value(_ item: ZCDescription, trailing: Bool) -> some View {
        HStack(spacing: ZCSpace.v2) {
            if let flag = item.flag { ZCFlag(flag) }
            Text(item.value).font(.zc(ZCType.body, theme: theme).weight(.medium).zcTabular()).foregroundStyle(theme.colors.text).multilineTextAlignment(trailing ? .trailing : .leading)
        }
    }

    private func cell(_ item: ZCDescription) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(item.term).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(theme.colors.textMuted)
            value(item, trailing: false)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(item.term): \(item.value)")
    }

    public var body: some View {
        let c = theme.colors
        if layout == .rows {
            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                    HStack(alignment: .top) {
                        Text(item.term).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted).padding(.trailing, ZCSpace.v4)
                        Spacer(minLength: 0)
                        value(item, trailing: true)
                    }
                    .padding(.vertical, ZCSpace.v2)
                    .overlay(alignment: .bottom) { if i < items.count - 1 { ZCDivider() } }
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("\(item.term): \(item.value)")
                }
            }
        } else {
            // Dos columnas si caben (448 pt o más); si no, una.
            ViewThatFits(in: .horizontal) {
                VStack(alignment: .leading, spacing: ZCSpace.v3) {
                    ForEach(Array(stride(from: 0, to: items.count, by: 2)), id: \.self) { i in
                        HStack(alignment: .top, spacing: 20) {
                            cell(items[i])
                            if i + 1 < items.count { cell(items[i + 1]) } else { Color.clear.frame(maxWidth: .infinity, maxHeight: 0) }
                        }
                    }
                }
                .frame(minWidth: 448)
                VStack(alignment: .leading, spacing: ZCSpace.v3) {
                    ForEach(items) { cell($0) }
                }
            }
        }
    }
}

// MARK: - Historial

/// Un hecho del historial: ícono, título y una línea en gris (fecha, autor, detalle).
public struct ZCTimelineItem: Identifiable {
    public let id = UUID()
    public let icon: ZCIconName
    public let title: String
    public let meta: String?

    public init(icon: ZCIconName, title: String, meta: String? = nil) {
        self.icon = icon
        self.title = title
        self.meta = meta
    }
}

/// Historial vertical: círculo con ícono, conector y título con su detalle.
public struct ZCTimeline: View {
    @Environment(\.zcTheme) private var theme
    private let items: [ZCTimelineItem]
    private let label: String?

    public init(items: [ZCTimelineItem], label: String? = nil) {
        self.items = items
        self.label = label
    }

    public var body: some View {
        let c = theme.colors
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(items.enumerated()), id: \.offset) { i, item in
                let last = i == items.count - 1
                HStack(alignment: .top, spacing: ZCSpace.v3) {
                    ZCIcon(item.icon, size: 16).foregroundStyle(c.text).frame(width: 36, height: 36).background(c.surface2, in: Circle())
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.title).font(.zc(ZCType.body, theme: theme).weight(.medium)).foregroundStyle(c.text)
                        if let meta = item.meta, !meta.isEmpty { Text(meta).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted) }
                    }
                    .padding(.top, 6)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(.bottom, ZCSpace.v4)
                .background(alignment: .topLeading) {
                    if !last { Rectangle().fill(c.border).frame(width: 2).padding(.top, 40).padding(.bottom, 4).padding(.leading, 17) }
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(item.meta.map { $0.isEmpty ? item.title : "\(item.title). \($0)" } ?? item.title)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label ?? "")
    }
}

// MARK: - Copiar

/// Copia un texto al portapapeles. Solo ícono por defecto (con su nombre para VoiceOver); `showText` muestra el texto. Al copiar: check y "Copiado"
/// durante 2 s, anunciado. Una clave secreta va enmascarada, no aquí.
public struct ZCCopyButton: View {
    private enum Phase { case idle, done, failed }
    @State private var phase: Phase = .idle
    private let value: String
    private let label: String?
    private let showText: Bool
    private let variant: ZCButtonVariant
    private let onCopied: ((String) -> Void)?

    public init(value: String, label: String? = nil, showText: Bool = false, variant: ZCButtonVariant = .ghost, onCopied: ((String) -> Void)? = nil) {
        self.value = value
        self.label = label
        self.showText = showText
        self.variant = variant
        self.onCopied = onCopied
    }

    private func text(_ p: Phase) -> String {
        switch p {
        case .idle: return ZCString.text("ui.copiar")
        case .done: return ZCString.text("ui.copiado")
        case .failed: return ZCString.text("ui.noSeCopio")
        }
    }

    private func copy() {
        UIPasteboard.general.string = value
        let ok = UIPasteboard.general.string == value
        phase = ok ? .done : .failed
        if ok { onCopied?(value) }
        AccessibilityNotification.Announcement(text(phase)).post()
        Task {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            phase = .idle
        }
    }

    public var body: some View {
        let icon: ZCIconName = phase == .done ? .lCheck : (phase == .failed ? .sDangerCircle : .sCopy)
        if showText {
            ZCButton(text(phase), variant: variant, size: .sm, leadingIcon: icon, action: copy)
        } else {
            ZCIconButton(icon, label: phase == .idle ? (label ?? text(.idle)) : text(phase), variant: variant, small: true, action: copy)
        }
    }
}

// MARK: - Página de error

/// Página de error (404, 403, 500, 503, sin conexión, sesión expirada): qué pasó, qué se conservó y qué hacer; nunca solo un código.
/// La referencia, solo cuando soporte la necesita (500, 404).
public struct ZCErrorPage<Actions: View>: View {
    @Environment(\.zcTheme) private var theme
    private let title: String
    private let text: String
    private let icon: ZCIconName
    private let code: String?
    private let reference: String?
    private let actions: Actions

    public init(title: String, text: String, icon: ZCIconName, code: String? = nil, reference: String? = nil, @ViewBuilder actions: () -> Actions) {
        self.title = title
        self.text = text
        self.icon = icon
        self.code = code
        self.reference = reference
        self.actions = actions()
    }

    public var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
        VStack(spacing: ZCSpace.v2) {
            ZCIcon(icon, size: 24).foregroundStyle(c.text).frame(width: 56, height: 56).background(c.surface2, in: RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous))
            Text(title).font(.zc(ZCType.body, theme: theme).weight(.semibold)).foregroundStyle(c.text).multilineTextAlignment(.center).accessibilityAddTraits(.isHeader)
            Text(text).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted).multilineTextAlignment(.center).frame(maxWidth: 280)
            HStack(spacing: ZCSpace.v2) { actions }
            if let reference { Text("\(ZCString.text("comun.referencia")) \(reference)").font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme).zcTabular()).foregroundStyle(c.textMuted) }
        }
        .padding(.horizontal, ZCSpace.v4)
        .padding(.vertical, ZCSpace.v6)
        .frame(maxWidth: .infinity)
        .background(c.bg, in: shape)
        .overlay(shape.stroke(c.border))
        .overlay(alignment: .topLeading) {
            if let code { Text(code).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme).zcTabular()).foregroundStyle(c.textSubtle).padding(.top, 10).padding(.leading, 12).accessibilityHidden(true) }
        }
    }
}

public extension ZCErrorPage where Actions == EmptyView {
    init(title: String, text: String, icon: ZCIconName, code: String? = nil, reference: String? = nil) {
        self.init(title: title, text: text, icon: icon, code: code, reference: reference) { EmptyView() }
    }
}

// MARK: - Bullet (stock)

/// Medidor de stock: franjas bajo el mínimo (peligro), rango sano (éxito) y sobre el máximo (aviso); la barra es el valor y la marca, el punto de pedido.
/// Los textos (cabecera y leyenda) los pone quien lo usa; el medidor se anuncia con `label`. `scale` es el fin de la escala (por defecto 1,25 × máximo).
public struct ZCBullet<Head: View, Legend: View>: View {
    @Environment(\.zcTheme) private var theme
    private let value: Double
    private let min: Double
    private let max: Double
    private let label: String
    private let reorder: Double?
    private let scale: Double?
    private let head: Head
    private let legend: Legend

    public init(value: Double, min: Double, max: Double, label: String, reorder: Double? = nil, scale: Double? = nil, @ViewBuilder head: () -> Head, @ViewBuilder legend: () -> Legend) {
        self.value = value
        self.min = min
        self.max = max
        self.label = label
        self.reorder = reorder
        self.scale = scale
        self.head = head()
        self.legend = legend()
    }

    public var body: some View {
        let c = theme.colors
        let end = scale ?? (max * 1.25)
        let p: (Double) -> CGFloat = { CGFloat(Swift.min(Swift.max($0 / end, 0), 1)) }
        VStack(alignment: .leading, spacing: 6) {
            head
            GeometryReader { geo in
                let w = geo.size.width
                let shape = RoundedRectangle(cornerRadius: ZCRadius.xs, style: .continuous)
                ZStack(alignment: .leading) {
                    HStack(spacing: 0) {
                        Rectangle().fill(c.dangerBg).frame(width: w * p(min))
                        Rectangle().fill(c.successBg).frame(width: w * (p(max) - p(min)))
                        Rectangle().fill(c.warningBg).frame(width: w * (1 - p(max)))
                    }
                    .clipShape(shape)
                    RoundedRectangle(cornerRadius: 2).fill(c.text).frame(width: Swift.max(0, (w - 2) * p(value)), height: 6).offset(x: 1)
                    if let reorder {
                        Rectangle().fill(c.text).frame(width: 2, height: 22).offset(x: 1 + (w - 2) * p(reorder))
                    }
                }
                .overlay(shape.stroke(c.border))
            }
            .frame(height: 14)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(label)
            .accessibilityAddTraits(.isImage)
            legend
        }
    }
}

public extension ZCBullet where Head == EmptyView, Legend == EmptyView {
    init(value: Double, min: Double, max: Double, label: String, reorder: Double? = nil, scale: Double? = nil) {
        self.init(value: value, min: min, max: max, label: label, reorder: reorder, scale: scale, head: { EmptyView() }, legend: { EmptyView() })
    }
}
