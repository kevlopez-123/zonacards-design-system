import SwiftUI
import ZonacardsTokens

public enum ZCNotificationKind: Sendable { case apr, alr, other }

public struct ZCNotification: Identifiable, Equatable {
    public let id: String
    public let icon: ZCIconName
    public let title: String
    /// Origen y hora relativa ("Aprobaciones · hace 5 min").
    public let meta: String
    public let kind: ZCNotificationKind
    public var unread: Bool
    /// Grupo de fecha ("Hoy", "Anteriores").
    public let group: String

    public init(id: String, icon: ZCIconName, title: String, meta: String, kind: ZCNotificationKind, unread: Bool, group: String) {
        self.id = id
        self.icon = icon
        self.title = title
        self.meta = meta
        self.kind = kind
        self.unread = unread
        self.group = group
    }
}

private struct ZCNotificationsPanel: View {
    @Environment(\.zcTheme) private var theme
    @State private var filter = "all"
    let items: Binding<[ZCNotification]>
    let onOpen: (ZCNotification) -> Void
    let onSeeAll: () -> Void
    let close: () -> Void

    private func markAll() {
        items.wrappedValue = items.wrappedValue.map { var n = $0; n.unread = false; return n }
    }

    private func visible() -> [ZCNotification] {
        items.wrappedValue.filter { filter == "all" || (filter == "apr" && $0.kind == .apr) || (filter == "alr" && $0.kind == .alr) }
    }

    var body: some View {
        let c = theme.colors
        let unread = items.wrappedValue.filter(\.unread).count
        let shown = visible()
        let groups = shown.reduce(into: [String]()) { if !$0.contains($1.group) { $0.append($1.group) } }
        VStack(alignment: .leading, spacing: ZCSpace.v2) {
            HStack {
                Spacer()
                Button(action: markAll) {
                    Text(ZCString.text("top.notif.marcarTodo")).font(.zc(ZCType.caption, theme: theme)).underline(unread > 0)
                        .foregroundStyle(unread > 0 ? c.text : c.textSubtle).frame(minHeight: ZCSize.targetSm).contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(unread == 0)
            }
            ZCTabs(tabs: [ZCTab(value: "all", label: ZCString.text("top.notif.filtro.all")), ZCTab(value: "apr", label: ZCString.text("top.notif.filtro.apr")), ZCTab(value: "alr", label: ZCString.text("top.notif.filtro.alr"))],
                   selected: $filter, variant: .segmented, label: ZCString.text("top.notif.tipo"))
            if shown.isEmpty {
                ZCState(ZCString.text("top.notif.vacio"), icon: .sInbox, text: ZCString.text("top.notif.vacioTexto"))
            } else {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(groups, id: \.self) { group in
                        Text(group).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(c.textMuted)
                            .padding(.vertical, 6).accessibilityAddTraits(.isHeader)
                        ForEach(shown.filter { $0.group == group }) { n in
                            Button {
                                if let i = items.wrappedValue.firstIndex(where: { $0.id == n.id }) { items.wrappedValue[i].unread = false }
                                close(); onOpen(n)
                            } label: {
                                HStack(alignment: .top, spacing: ZCSpace.v3) {
                                    ZCIcon(n.icon, size: 16).foregroundStyle(c.text).frame(width: 36, height: 36).background(c.surface2, in: RoundedRectangle(cornerRadius: ZCRadius.ms, style: .continuous))
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(n.title).font(.zc(ZCType.bodySm, theme: theme).weight(n.unread ? .semibold : .regular)).foregroundStyle(c.text)
                                        Text(n.meta).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    if n.unread { Circle().fill(c.dangerFg).frame(width: 8, height: 8).padding(.top, 6).accessibilityHidden(true) }
                                }
                                .padding(.vertical, ZCSpace.v3)
                                .frame(minHeight: ZCSize.targetSm)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .accessibilityElement(children: .ignore)
                            .accessibilityLabel(n.title)
                            .accessibilityValue([n.meta, n.unread ? ZCString.text("top.notif.sinLeer") : nil].compactMap { $0 }.joined(separator: ", "))
                            .accessibilityAddTraits(.isButton)
                            ZCDivider()
                        }
                    }
                }
            }
            ZCButton(ZCString.text("top.notif.verTodas"), variant: .ghost, size: .sm, block: true) { close(); onSeeAll() }
        }
    }
}

/// Campana de la barra superior con su panel: contador de no leídas, "Marcar todo como leído", pestañas Todas, Aprobaciones y Alertas, grupos por fecha
/// y "Ver todas". El panel es una hoja inferior. Abrir una notificación la marca como leída y avisa por `onOpen` para navegar.
public struct ZCNotifications: View {
    @Environment(\.zcTheme) private var theme
    @State private var open = false
    private let items: Binding<[ZCNotification]>
    private let onOpen: (ZCNotification) -> Void
    private let onSeeAll: () -> Void

    public init(items: Binding<[ZCNotification]>, onOpen: @escaping (ZCNotification) -> Void, onSeeAll: @escaping () -> Void) {
        self.items = items
        self.onOpen = onOpen
        self.onSeeAll = onSeeAll
    }

    public var body: some View {
        let c = theme.colors
        let unread = items.wrappedValue.filter(\.unread).count
        ZCIconButton(.sBell, label: ZCString.text("top.notif.boton", unread)) { open = true }
            .overlay(alignment: .topTrailing) {
                if unread > 0 {
                    Text("\(unread)").font(.zc(ZCType.tiny, theme: theme).weight(.semibold).zcTabular())
                        .foregroundStyle(.white).padding(.horizontal, 4).frame(minWidth: 18, minHeight: 18)
                        .background(c.dangerFg, in: Capsule()).padding(.top, 6).padding(.trailing, 4).accessibilityHidden(true)
                }
            }
            .zcSheet(isPresented: $open, title: ZCString.text("top.notif.titulo"), content: {
                ZCNotificationsPanel(items: items, onOpen: onOpen, onSeeAll: onSeeAll) { open = false }
            })
    }
}
