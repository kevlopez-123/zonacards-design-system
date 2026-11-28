import SwiftUI
import ZonacardsTokens

/// Navegación principal que se adapta al ancho: en iPhone (ancho compacto) una barra inferior con 3 a 5 destinos (`ZCBottomNav`);
/// en iPad (ancho regular) una barra lateral con `NavigationSplitView` y el contenido al lado. Mismos destinos y misma selección en los dos.
/// El contenido recibe el id del destino elegido.
public struct ZCAdaptiveScaffold<Content: View>: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.horizontalSizeClass) private var sizeClass
    private let items: [ZCNavItem]
    @Binding private var selection: String
    private let content: (String) -> Content

    public init(items: [ZCNavItem], selection: Binding<String>, @ViewBuilder content: @escaping (String) -> Content) {
        self.items = items
        self._selection = selection
        self.content = content
    }

    public var body: some View {
        if sizeClass == .regular {
            NavigationSplitView {
                ZCSidebarList(items: items, selection: $selection)
            } detail: {
                content(selection)
            }
            .navigationSplitViewStyle(.balanced)
        } else {
            VStack(spacing: 0) {
                content(selection).frame(maxWidth: .infinity, maxHeight: .infinity)
                ZCBottomNav(items: items, current: selection) { selection = $0 }
            }
        }
    }
}

/// Barra lateral: ícono y texto por destino, el activo con fondo `surface2` y el ícono en Bold y color de marca; insignia a la derecha.
struct ZCSidebarList: View {
    @Environment(\.zcTheme) private var theme
    let items: [ZCNavItem]
    @Binding var selection: String

    var body: some View {
        let c = theme.colors
        List {
            ForEach(items) { item in
                let on = item.id == selection
                Button { selection = item.id } label: {
                    HStack(spacing: ZCSpace.v3) {
                        ZCIcon(on ? item.iconActive : item.icon, size: 20)
                            .foregroundStyle(on ? c.primary : c.textMuted)
                        ZCText(item.label, style: ZCType.body).fontWeight(on ? .semibold : .regular)
                        Spacer(minLength: 0)
                        if let badge = item.badge {
                            Text(badge)
                                .font(.zc(ZCType.xxs, theme: theme).weight(ZCWeight.semibold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 6)
                                .frame(minWidth: 18, minHeight: 18)
                                .background(c.dangerFg, in: Capsule())
                        }
                    }
                    .frame(minHeight: ZCSize.targetSm)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .listRowBackground(on ? c.surface2 : c.surface)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(item.label)
                .accessibilityValue(item.badge ?? "")
                .accessibilityAddTraits(on ? [.isButton, .isSelected] : [.isButton])
            }
        }
        .scrollContentBackground(.hidden)
        .background(c.surface)
    }
}

/// Lista y detalle: en ancho regular (iPad) las dos columnas a la vez, la lista de ancho fijo; en ancho compacto (iPhone) una sola,
/// la lista o el detalle según `showsDetail` (quien llama maneja el "Volver", por ejemplo con `ZCTopBar(onBack:)`).
public struct ZCListDetail<ListContent: View, Detail: View>: View {
    @Environment(\.zcTheme) private var theme
    @Environment(\.horizontalSizeClass) private var sizeClass
    private let showsDetail: Bool
    private let listWidth: CGFloat
    private let list: ListContent
    private let detail: Detail

    public init(showsDetail: Bool, listWidth: CGFloat = 360, @ViewBuilder list: () -> ListContent, @ViewBuilder detail: () -> Detail) {
        self.showsDetail = showsDetail
        self.listWidth = listWidth
        self.list = list()
        self.detail = detail()
    }

    public var body: some View {
        if sizeClass == .regular {
            HStack(spacing: 0) {
                list.frame(width: listWidth)
                Rectangle().fill(theme.colors.border).frame(width: 1)
                detail.frame(maxWidth: .infinity)
            }
        } else if showsDetail {
            detail
        } else {
            list
        }
    }
}
