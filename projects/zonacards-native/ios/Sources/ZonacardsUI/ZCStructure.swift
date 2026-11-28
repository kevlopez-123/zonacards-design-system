import SwiftUI
import UIKit
import ZonacardsTokens

// MARK: - Barras

/// Barra superior: Volver cuadrado de 40 pt (radio 8, toque 44), título y subtítulo de 12 pt, y una acción a la derecha. Lleva un borde inferior.
public struct ZCTopBar<Action: View>: View {
    @Environment(\.zcTheme) private var theme
    private let title: String
    private let subtitle: String?
    private let onBack: (() -> Void)?
    private let action: Action

    public init(_ title: String, subtitle: String? = nil, onBack: (() -> Void)? = nil, @ViewBuilder action: () -> Action) {
        self.title = title
        self.subtitle = subtitle
        self.onBack = onBack
        self.action = action()
    }

    public var body: some View {
        let c = theme.colors
        VStack(spacing: 0) {
            HStack(spacing: ZCSpace.v1) {
                if let onBack {
                    Button(action: onBack) {
                        ZCIcon(.sAltArrowLeft, size: 20).foregroundStyle(c.text)
                            .frame(width: 40, height: 40)
                            .frame(width: ZCSize.targetSm, height: ZCSize.targetSm)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(ZCString.text("mol.movil.volver"))
                }
                VStack(alignment: .leading, spacing: 0) {
                    Text(title).font(.zc(ZCType.titleSm, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(c.text).lineLimit(1)
                    if let subtitle { Text(subtitle).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(c.textMuted).lineLimit(1) }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityElement(children: .combine)
                .accessibilityAddTraits(.isHeader)
                action
            }
            .padding(.horizontal, ZCSpace.v2)
            .frame(minHeight: 56)
            ZCDivider()
        }
        .background(c.surface)
    }
}

public extension ZCTopBar where Action == EmptyView {
    init(_ title: String, subtitle: String? = nil, onBack: (() -> Void)? = nil) {
        self.init(title, subtitle: subtitle, onBack: onBack) { EmptyView() }
    }
}

/// Destino de la navegación inferior. `iconActive` suele ser la variante `-bold` del ícono.
public struct ZCNavItem: Identifiable {
    public let id: String
    public let label: String
    public let icon: ZCIconName
    public let iconActive: ZCIconName
    public let badge: String?

    public init(id: String, label: String, icon: ZCIconName, iconActive: ZCIconName? = nil, badge: String? = nil) {
        self.id = id
        self.label = label
        self.icon = icon
        self.iconActive = iconActive ?? icon
        self.badge = badge
    }
}

/// Navegación inferior: 3 a 5 destinos con ícono de 20 pt y texto pequeño; el activo en Bold y color de marca, marcado como seleccionado.
/// Margen inferior de 14 pt o el del sistema.
public struct ZCBottomNav: View {
    @Environment(\.zcTheme) private var theme
    private let items: [ZCNavItem]
    private let current: String?
    private let onSelect: (String) -> Void

    public init(items: [ZCNavItem], current: String?, onSelect: @escaping (String) -> Void) {
        precondition((3...5).contains(items.count), "ZCBottomNav lleva de 3 a 5 destinos")
        self.items = items
        self.current = current
        self.onSelect = onSelect
    }

    public var body: some View {
        let c = theme.colors
        VStack(spacing: 0) {
            ZCDivider()
            HStack(spacing: 0) {
                ForEach(items) { item in
                    let on = item.id == current
                    Button { onSelect(item.id) } label: {
                        VStack(spacing: 2) {
                            ZCIcon(on ? item.iconActive : item.icon, size: 20)
                                .foregroundStyle(on ? c.primary : c.textMuted)
                                .overlay(alignment: .topTrailing) {
                                    if let badge = item.badge {
                                        Text(badge)
                                            .font(.zc(ZCType.xxs, theme: theme).weight(ZCWeight.semibold))
                                            .foregroundStyle(.white)
                                            .padding(.horizontal, 4)
                                            .frame(minWidth: 16, minHeight: 16)
                                            .background(c.dangerFg, in: Capsule())
                                            .offset(x: 8, y: -4)
                                    }
                                }
                            Text(item.label).font(.zc(ZCType.tiny, theme: theme).weight(on ? .semibold : .regular)).foregroundStyle(on ? c.primary : c.textMuted).lineLimit(1)
                        }
                        .frame(maxWidth: .infinity, minHeight: 56)
                        .padding(.top, ZCSpace.v2)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(item.label)
                    .accessibilityValue(item.badge ?? "")
                    .accessibilityAddTraits(on ? [.isButton, .isSelected] : [.isButton])
                }
            }
            .padding(.bottom, ZCSpace.v3)
        }
        .background(c.surface.ignoresSafeArea(edges: .bottom))
    }
}

// MARK: - Avisos del sistema

public enum ZCBannerTone: Sendable { case offline, update }

/// Banda bajo la barra superior: sin conexión o actualización disponible. VoiceOver la anuncia al aparecer.
public struct ZCSystemBanner<Action: View>: View {
    @Environment(\.zcTheme) private var theme
    private let text: String
    private let tone: ZCBannerTone
    private let action: Action

    public init(_ text: String, tone: ZCBannerTone = .offline, @ViewBuilder action: () -> Action) {
        self.text = text
        self.tone = tone
        self.action = action()
    }

    public var body: some View {
        let c = theme.colors
        let (bg, fg): (Color, Color) = tone == .offline ? (c.text, c.surface) : (c.infoBg, c.infoFg)
        HStack(spacing: ZCSpace.v2) {
            ZCIcon(tone == .offline ? .lWifiOff : .lRotateCw, size: 16).foregroundStyle(fg)
            Text(text).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(fg).frame(maxWidth: .infinity, alignment: .leading)
            action
        }
        .padding(.horizontal, ZCSpace.v4)
        .padding(.vertical, ZCSpace.v2)
        .background(bg)
        .accessibilityElement(children: .combine)
        .onAppear { AccessibilityNotification.Announcement(text).post() }
    }
}

public extension ZCSystemBanner where Action == EmptyView {
    init(_ text: String, tone: ZCBannerTone = .offline) {
        self.init(text, tone: tone) { EmptyView() }
    }
}

/// Aviso de sin conexión con cambios pendientes: bloque con radio 8 y texto de 14 pt.
public struct ZCOfflineBanner: View {
    @Environment(\.zcTheme) private var theme
    private let pending: Int

    public init(pending: Int) { self.pending = pending }

    public var body: some View {
        let c = theme.colors
        let text = ZCString.text("mol.offline.texto", pending)
        HStack(spacing: ZCSpace.v2) {
            ZCIcon(.lWifiOff, size: 16).foregroundStyle(c.surface)
            Text(text).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.surface).frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, ZCSpace.v3)
        .padding(.vertical, 10)
        .background(c.text, in: RoundedRectangle(cornerRadius: ZCRadius.sm, style: .continuous))
        .accessibilityElement(children: .combine)
        .onAppear { AccessibilityNotification.Announcement(text).post() }
    }
}

// MARK: - Estado de bloque

public enum ZCStateKind: Sendable { case empty, error }

/// Detalles técnicos de un error para soporte (código, servicio, fecha).
public struct ZCTechDetails: Sendable {
    public let code: String
    public let service: String
    public let date: String

    public init(code: String, service: String, date: String) {
        self.code = code
        self.service = service
        self.date = date
    }
}

/// Estado de bloque (vacío o error): borde punteado, ícono en recuadro de 44 pt, qué pasó (título), por qué o qué se conservó (texto),
/// la acción para salir y luego la referencia. En errores, "Ver detalles técnicos" con "Copiar detalles".
public struct ZCState<Action: View>: View {
    @Environment(\.zcTheme) private var theme
    @State private var open = false
    private let title: String
    private let kind: ZCStateKind
    private let icon: ZCIconName
    private let text: String?
    private let reference: String?
    private let details: ZCTechDetails?
    private let onCopied: (() -> Void)?
    private let action: Action

    public init(
        _ title: String, kind: ZCStateKind = .empty, icon: ZCIconName? = nil, text: String? = nil, reference: String? = nil,
        details: ZCTechDetails? = nil, onCopied: (() -> Void)? = nil, @ViewBuilder action: () -> Action
    ) {
        self.title = title
        self.kind = kind
        self.icon = icon ?? (kind == .error ? .sDangerTriangle : .sBox)
        self.text = text
        self.reference = reference
        self.details = details
        self.onCopied = onCopied
        self.action = action()
    }

    private func rows(_ d: ZCTechDetails) -> [(String, String)] {
        [
            (ZCString.text("comun.referencia"), reference ?? "—"),
            (ZCString.text("org.codigo"), d.code),
            (ZCString.text("org.servicio"), d.service),
            (ZCString.text("org.fecha"), d.date)
        ]
    }

    public var body: some View {
        let c = theme.colors
        let isError = kind == .error
        VStack(spacing: ZCSpace.v3) {
            ZCIcon(icon, size: 24)
                .foregroundStyle(isError ? c.dangerFg : c.text)
                .frame(width: 44, height: 44)
                .background(isError ? c.dangerBg : c.surface2, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            VStack(spacing: ZCSpace.v1) {
                Text(title).font(.zc(ZCType.titleSm, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(c.text).multilineTextAlignment(.center).accessibilityAddTraits(.isHeader)
                if let text { Text(text).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.textMuted).multilineTextAlignment(.center) }
            }
            .accessibilityElement(children: .combine)
            action
            if let reference {
                Text("\(ZCString.text("comun.referencia")) \(reference)").font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(c.textMuted)
            }
            if let details {
                Button { open.toggle() } label: {
                    HStack(spacing: ZCSpace.v1) {
                        Text(ZCString.text("org.verDetallesTecnicos")).font(.zc(ZCType.bodySm, theme: theme)).underline().foregroundStyle(c.textMuted)
                        ZCIcon(.sAltArrowDown, size: 16).foregroundStyle(c.textMuted).rotationEffect(.degrees(open ? 180 : 0))
                    }
                    .frame(minHeight: ZCSize.targetSm)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                if open {
                    let list = rows(details)
                    VStack(alignment: .leading, spacing: ZCSpace.v3) {
                        VStack(alignment: .leading, spacing: ZCSpace.v1) {
                            ForEach(Array(list.enumerated()), id: \.offset) { _, row in
                                HStack(alignment: .top, spacing: ZCSpace.v4) {
                                    Text(row.0).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted).frame(width: 88, alignment: .leading)
                                    Text(row.1).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.text).frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }
                        }
                        ZCButton(ZCString.text("org.copiarDetalles"), variant: .outline, size: .sm, leadingIcon: .lClipboardCopy) {
                            UIPasteboard.general.string = list.map { "\($0.0): \($0.1)" }.joined(separator: "\n")
                            onCopied?()
                        }
                    }
                    .padding(ZCSpace.v3)
                    .frame(maxWidth: 420, alignment: .leading)
                    .background(c.surface2, in: RoundedRectangle(cornerRadius: ZCRadius.sm, style: .continuous))
                }
            }
        }
        .padding(.horizontal, ZCSpace.v4)
        .padding(.vertical, ZCSpace.v5)
        .frame(maxWidth: .infinity)
        .overlay(RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous).stroke(c.borderStrong, style: StrokeStyle(lineWidth: 1, dash: [6, 4])))
    }
}

public extension ZCState where Action == EmptyView {
    init(_ title: String, kind: ZCStateKind = .empty, icon: ZCIconName? = nil, text: String? = nil, reference: String? = nil, details: ZCTechDetails? = nil, onCopied: (() -> Void)? = nil) {
        self.init(title, kind: kind, icon: icon, text: text, reference: reference, details: details, onCopied: onCopied) { EmptyView() }
    }
}

// MARK: - Menú y acciones

/// Acción de menú o de deslizamiento. `disabledReason` explica por qué no se puede (se lee y se muestra).
public struct ZCAction: Identifiable {
    public let id: String
    public let label: String
    public let icon: ZCIconName?
    public let danger: Bool
    public let description: String?
    public let disabledReason: String?
    public let checked: Bool?
    public let separatorBefore: Bool

    public init(id: String, label: String, icon: ZCIconName? = nil, danger: Bool = false, description: String? = nil, disabledReason: String? = nil, checked: Bool? = nil, separatorBefore: Bool = false) {
        self.id = id
        self.label = label
        self.icon = icon
        self.danger = danger
        self.description = description
        self.disabledReason = disabledReason
        self.checked = checked
        self.separatorBefore = separatorBefore
    }
}

private struct ZCActionList: View {
    @Environment(\.zcTheme) private var theme
    let actions: [ZCAction]
    let onAction: (String) -> Void
    let close: () -> Void

    var body: some View {
        let c = theme.colors
        ScrollView {
            VStack(spacing: 0) {
                ForEach(actions) { a in
                    if a.separatorBefore { ZCDivider().padding(.vertical, ZCSpace.v1) }
                    let enabled = a.disabledReason == nil
                    Button { close(); onAction(a.id) } label: {
                        HStack(spacing: ZCSpace.v3) {
                            if let icon = a.icon { ZCIcon(icon, size: 16).foregroundStyle(a.danger ? c.dangerFg : c.textMuted) }
                            VStack(alignment: .leading, spacing: 0) {
                                Text(a.label).font(.zc(ZCType.body, theme: theme)).foregroundStyle(a.danger ? c.dangerFg : c.text)
                                if let sub = a.disabledReason ?? a.description {
                                    Text(sub).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            if a.checked == true { ZCIcon(.lCheck, size: 16).foregroundStyle(c.text) }
                        }
                        .padding(.horizontal, ZCSpace.v3)
                        .padding(.vertical, 6)
                        .frame(minHeight: 48)
                        .contentShape(RoundedRectangle(cornerRadius: ZCRadius.sm))
                    }
                    .buttonStyle(.plain)
                    .disabled(!enabled)
                    .opacity(enabled ? 1 : ZCOpacity.disabled)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(a.label)
                    .accessibilityValue(a.disabledReason ?? a.description ?? "")
                    .accessibilityAddTraits(a.checked == true ? [.isButton, .isSelected] : [.isButton])
                }
            }
            .padding(ZCSpace.v2)
        }
    }
}

/// Menú de acciones (kebab Bold): filas de 48 pt con ícono de 16 en muted (rojo si es destructiva), descripción, marca de elegido, separadores
/// y deshabilitadas con su motivo. Se abre en una hoja inferior (o subpantalla si ya está en una). `dense`: kebab de 36 pt visibles (toque 44).
public struct ZCMenu: View {
    @State private var open = false
    private let actions: [ZCAction]
    private let onAction: (String) -> Void
    private let label: String
    private let dense: Bool

    public init(actions: [ZCAction], label: String, dense: Bool = false, onAction: @escaping (String) -> Void) {
        self.actions = actions
        self.label = label
        self.dense = dense
        self.onAction = onAction
    }

    public var body: some View {
        Button { open = true } label: {
            ZCIcon(.sMenuDotsVerticalBold, size: 20)
                .frame(width: dense ? 36 : 48, height: dense ? 36 : 48)
                .frame(width: 48, height: 48)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .zcChoice(isPresented: $open, title: label) { close in
            ZCActionList(actions: actions, onAction: onAction, close: close)
        }
    }
}

/// Fila deslizable: al deslizar a la izquierda más de 70 pt se abren las acciones (152 pt, texto de 12). Las mismas acciones están en el menú ⋮
/// (denso) y como acciones de VoiceOver, así nadie depende del gesto.
public struct ZCSwipeItem<Content: View>: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var offset: CGFloat = 0
    @State private var settledOpen = false
    private let actions: [ZCAction]
    private let menuLabel: String
    private let onAction: (String) -> Void
    private let content: Content
    private let reveal: CGFloat = 152
    private let openAt: CGFloat = 70

    public init(actions: [ZCAction], menuLabel: String, onAction: @escaping (String) -> Void, @ViewBuilder content: () -> Content) {
        precondition((1...2).contains(actions.count), "ZCSwipeItem muestra 1 o 2 acciones")
        self.actions = actions
        self.menuLabel = menuLabel
        self.onAction = onAction
        self.content = content()
    }

    private func settle(open: Bool) {
        settledOpen = open
        withAnimation(reduceMotion ? nil : .easeOut(duration: ZCMotion.base)) { offset = open ? -reveal : 0 }
    }

    public var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
        HStack(spacing: 0) {
            content.frame(maxWidth: .infinity, alignment: .leading)
            ZCMenu(actions: actions, label: menuLabel, dense: true, onAction: onAction)
        }
        .padding(.leading, ZCSpace.v3)
        .padding(.vertical, 10)
        .padding(.trailing, ZCSpace.v1)
        .background(c.surface, in: shape)
        .overlay(shape.stroke(c.border))
        .offset(x: offset)
        .simultaneousGesture(
            DragGesture(minimumDistance: 20)
                .onChanged { g in
                    guard abs(g.translation.width) > abs(g.translation.height) else { return }
                    let base: CGFloat = settledOpen ? -reveal : 0
                    offset = min(0, max(-reveal, base + g.translation.width))
                }
                .onEnded { g in
                    guard abs(g.translation.width) > abs(g.translation.height) else { return }
                    settle(open: offset < -openAt || g.predictedEndTranslation.width < -300)
                }
        )
        .background(alignment: .trailing) {
            HStack(spacing: 0) {
                ForEach(actions) { a in
                    Button { settle(open: false); onAction(a.id) } label: {
                        VStack(spacing: 2) {
                            if let icon = a.icon { ZCIcon(icon, size: 20) }
                            Text(a.label).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).multilineTextAlignment(.center)
                        }
                        .foregroundStyle(c.surface)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(a.danger ? c.dangerFg : c.infoFg)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .frame(width: reveal)
            .accessibilityHidden(true)
        }
        .background(c.surface2, in: shape)
        .clipShape(shape)
        .accessibilityElement(children: .contain)
        .accessibilityActions {
            ForEach(actions) { a in Button(a.label) { onAction(a.id) } }
        }
    }
}

// MARK: - Deslizar para actualizar

/// Deslizar para actualizar: usa el gesto del sistema (`refreshable`), que VoiceOver ya ofrece como acción. Termina cuando `onRefresh` retorna.
public struct ZCPullRefresh<Content: View>: View {
    private let onRefresh: () async -> Void
    private let content: Content

    public init(onRefresh: @escaping () async -> Void, @ViewBuilder content: () -> Content) {
        self.onRefresh = onRefresh
        self.content = content()
    }

    public var body: some View {
        ScrollView { content }.refreshable { await onRefresh() }
    }
}
