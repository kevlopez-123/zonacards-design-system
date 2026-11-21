import SwiftUI
import ZonacardsTokens

// MARK: - Tarjeta

/// Tarjeta de listado: radio de `theme.shape.card`, borde, padding 16, separación 16. Encabezado con ícono en recuadro de 36 pt (o `lead`),
/// título de 16 semibold y subtítulo en muted, y `aside` a la derecha (menú ⋮ o badge, con su propio toque); `media` a sangre arriba en 16:9,
/// cuerpo libre y `footer` con borde superior. Con `onTap`, toda la tarjeta abre el detalle.
public struct ZCCard<Media: View, Lead: View, Aside: View, Footer: View, Inner: View>: View {
    @Environment(\.zcTheme) private var theme
    @State private var pressed = false
    private let title: String
    private let subtitle: String?
    private let icon: ZCIconName?
    private let onTap: (() -> Void)?
    private let media: Media
    private let lead: Lead
    private let aside: Aside
    private let footer: Footer
    private let content: Inner

    public init(
        _ title: String, subtitle: String? = nil, icon: ZCIconName? = nil, onTap: (() -> Void)? = nil,
        @ViewBuilder media: () -> Media, @ViewBuilder lead: () -> Lead, @ViewBuilder aside: () -> Aside,
        @ViewBuilder footer: () -> Footer, @ViewBuilder content: () -> Inner
    ) {
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.onTap = onTap
        self.media = media()
        self.lead = lead()
        self.aside = aside()
        self.footer = footer()
        self.content = content()
    }

    private var inner: some View {
        let c = theme.colors
        return VStack(spacing: 0) {
            if Media.self != EmptyView.self {
                media.frame(maxWidth: .infinity).aspectRatio(16.0 / 9.0, contentMode: .fit).clipped()
            }
            VStack(alignment: .leading, spacing: ZCSpace.v4) {
                HStack(alignment: .top, spacing: ZCSpace.v3) {
                    if let icon {
                        ZCIcon(icon, size: 20).foregroundStyle(c.text).frame(width: 36, height: 36).background(c.surface2, in: RoundedRectangle(cornerRadius: ZCRadius.ms, style: .continuous))
                    }
                    lead
                    VStack(alignment: .leading, spacing: 0) {
                        Text(title).font(.zc(ZCTypeStyle(size: 16, lineHeight: 22, relativeTo: .body), theme: theme).weight(.semibold)).foregroundStyle(c.text)
                        if let subtitle { Text(subtitle).font(.zc(ZCType.caption, theme: theme).zcTabular()).foregroundStyle(c.textMuted) }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    aside
                }
                if Inner.self != EmptyView.self { content }
                if Footer.self != EmptyView.self {
                    VStack(alignment: .leading, spacing: 0) {
                        ZCDivider()
                        HStack(spacing: ZCSpace.v2) { footer }.foregroundStyle(c.textMuted).frame(minHeight: 44).padding(.top, ZCSpace.v3)
                    }
                }
            }
            .padding(ZCSpace.v4)
        }
    }

    public var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous)
        let card = inner
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(c.surface, in: shape)
            .clipShape(shape)
            .overlay(shape.stroke(pressed ? c.borderStrong : c.border))
            .shadow(color: .black.opacity(pressed ? 0.12 : 0), radius: 3, y: 1)
        if let onTap {
            Button(action: onTap) { card }
                .buttonStyle(ZCPressTracker(pressed: $pressed))
                .accessibilityLabel(title)
                .accessibilityValue(subtitle ?? "")
        } else {
            card.accessibilityElement(children: .contain)
        }
    }
}

/// Estilo sin efecto propio que avisa si el botón está presionado (la tarjeta pinta su borde y su sombra).
struct ZCPressTracker: ButtonStyle {
    @Binding var pressed: Bool
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.onChange(of: configuration.isPressed) { _, v in pressed = v }
    }
}

public extension ZCCard where Media == EmptyView, Lead == EmptyView, Aside == EmptyView, Footer == EmptyView, Inner == EmptyView {
    init(_ title: String, subtitle: String? = nil, icon: ZCIconName? = nil, onTap: (() -> Void)? = nil) {
        self.init(title, subtitle: subtitle, icon: icon, onTap: onTap, media: { EmptyView() }, lead: { EmptyView() }, aside: { EmptyView() }, footer: { EmptyView() }, content: { EmptyView() })
    }
}

public extension ZCCard where Media == EmptyView, Lead == EmptyView, Footer == EmptyView {
    init(_ title: String, subtitle: String? = nil, icon: ZCIconName? = nil, onTap: (() -> Void)? = nil, @ViewBuilder aside: () -> Aside, @ViewBuilder content: () -> Inner) {
        self.init(title, subtitle: subtitle, icon: icon, onTap: onTap, media: { EmptyView() }, lead: { EmptyView() }, aside: aside, footer: { EmptyView() }, content: content)
    }
}

// MARK: - KPI

/// Variación de un KPI: "+8,2 %" o "−3 %" (signo menos tipográfico y 1 decimal máximo; el separador decimal es el de es-PE, igual que en Android).
public func zcFormatDelta(_ delta: Double) -> String {
    let f = NumberFormatter()
    f.locale = Locale(identifier: "es_PE")
    f.numberStyle = .decimal
    f.maximumFractionDigits = 1
    f.minimumFractionDigits = 0
    return (delta >= 0 ? "+" : "−") + (f.string(from: NSNumber(value: abs(delta))) ?? "0") + " %"
}

/// Línea de tendencia mínima para un KPI. Decorativa.
public struct ZCSparkline: View {
    private let values: [Double]
    private let color: Color

    public init(values: [Double], color: Color) {
        self.values = values
        self.color = color
    }

    public var body: some View {
        if values.count >= 2, let lo = values.min(), let hi = values.max() {
            let span = (hi - lo) > 0 ? hi - lo : 1
            Path { p in
                let w: CGFloat = 72, h: CGFloat = 28
                let step = w / CGFloat(values.count - 1)
                for (i, v) in values.enumerated() {
                    let pt = CGPoint(x: CGFloat(i) * step, y: h - CGFloat((v - lo) / span) * (h - 4) - 2)
                    if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
                }
            }
            .stroke(color, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
            .frame(width: 72, height: 28)
            .accessibilityHidden(true)
        }
    }
}

/// KPI: radio de `theme.shape.card`, borde, padding 16. Etiqueta de 14 muted e ícono en recuadro de 32 pt (se oculta si la tarjeta mide 150 o menos);
/// valor de 24 semibold tabular. Con `trend`: píldora de variación (verde o roja según `invert`) y sparkline; solo con `delta`: la variación en línea.
/// `filter` lo vuelve un filtro que se marca (borde `primary` de 2).
public struct ZCKpi: View {
    @Environment(\.zcTheme) private var theme
    @State private var width: CGFloat = 200
    private let label: String
    private let value: String
    private let icon: ZCIconName?
    private let delta: Double?
    private let deltaLabel: String?
    private let trend: [Double]?
    private let invert: Bool
    private let filter: Bool
    private let pressed: Binding<Bool>?

    public init(label: String, value: String, icon: ZCIconName? = nil, delta: Double? = nil, deltaLabel: String? = nil, trend: [Double]? = nil, invert: Bool = false, filter: Bool = false, pressed: Binding<Bool>? = nil) {
        self.label = label
        self.value = value
        self.icon = icon
        self.delta = delta
        self.deltaLabel = deltaLabel
        self.trend = trend
        self.invert = invert
        self.filter = filter
        self.pressed = pressed
    }

    private var summary: String {
        var parts = ["\(label): \(value)"]
        if let delta { parts.append(zcFormatDelta(delta) + (deltaLabel.map { " " + $0 } ?? "")) }
        return parts.joined(separator: ", ")
    }

    public var body: some View {
        let c = theme.colors
        let on = filter && pressed?.wrappedValue == true
        let good = delta == nil || ((delta! >= 0) != invert)
        let tone = theme.tone(good ? .success : .danger)
        let shape = RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous)
        let trendIcon: ZCIconName = (delta ?? 0) >= 0 ? .lTrendingUp : .lTrendingDown
        let card = VStack(alignment: .leading, spacing: ZCSpace.v2) {
            HStack(spacing: ZCSpace.v2) {
                Text(label).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.textMuted).frame(maxWidth: .infinity, alignment: .leading)
                if let icon, width > 150 {
                    ZCIcon(icon, size: 16).foregroundStyle(c.text).frame(width: 32, height: 32).background(c.surface2, in: RoundedRectangle(cornerRadius: ZCRadius.sm, style: .continuous))
                }
            }
            Text(value).font(.zc(ZCTypeStyle(size: 24, lineHeight: 32, relativeTo: .title2), theme: theme).weight(.semibold).zcTabular()).foregroundStyle(c.text).lineLimit(1)
            if let delta, let trend {
                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 6) { pill(delta, trendIcon, tone); if let deltaLabel { muted(deltaLabel) }; ZCSparkline(values: trend, color: tone.fg) }
                    VStack(alignment: .leading, spacing: 6) { HStack(spacing: 6) { pill(delta, trendIcon, tone); if let deltaLabel { muted(deltaLabel) } }; ZCSparkline(values: trend, color: tone.fg) }
                }
            } else if let delta {
                HStack(spacing: ZCSpace.v1) {
                    ZCIcon(trendIcon, size: 16).foregroundStyle(tone.fg)
                    Text(zcFormatDelta(delta)).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(tone.fg)
                    if let deltaLabel { muted(deltaLabel) }
                }
            }
        }
        .padding(ZCSpace.v4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(c.surface, in: shape)
        .overlay(shape.stroke(on ? c.primary : c.border, lineWidth: on ? 2 : 1))
        .background(GeometryReader { g in Color.clear.onAppear { width = g.size.width }.onChange(of: g.size.width) { _, w in width = w } })
        if filter, let pressed {
            Button { pressed.wrappedValue.toggle() } label: { card }
                .buttonStyle(.plain)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(summary)
                .accessibilityAddTraits(on ? [.isButton, .isSelected] : [.isButton])
        } else {
            card.accessibilityElement(children: .ignore).accessibilityLabel(summary)
        }
    }

    private func muted(_ text: String) -> some View {
        Text(text).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(theme.colors.textMuted).lineLimit(1)
    }

    private func pill(_ delta: Double, _ icon: ZCIconName, _ tone: ZCToneColors) -> some View {
        HStack(spacing: ZCSpace.v1) {
            ZCIcon(icon, size: 16).foregroundStyle(tone.fg)
            Text(zcFormatDelta(delta)).font(.zc(ZCType.caption, theme: theme).weight(.medium)).foregroundStyle(tone.fg).lineLimit(1)
        }
        .padding(.horizontal, ZCSpace.v2)
        .padding(.vertical, 2)
        .background(tone.bg, in: Capsule())
    }
}

// MARK: - Monto

/// Monto: una línea con la moneda del país, números tabulares y la tipografía del contexto. Si el monto completo no cabe, muestra el abreviado
/// (K, M, MM) con subrayado punteado; al tocarlo se ve la cifra completa. VoiceOver siempre lee la cifra completa. No usar en tablas ni exportaciones.
public struct ZCMoneyText: View {
    @Environment(\.zcTheme) private var theme
    @State private var showFull = false
    private let amount: Double
    private let country: String
    private let style: ZCTypeStyle
    private let weight: Font.Weight?
    private let color: Color?

    public init(_ amount: Double, country: String, style: ZCTypeStyle = ZCType.body, weight: Font.Weight? = nil, color: Color? = nil) {
        self.amount = amount
        self.country = country
        self.style = style
        self.weight = weight
        self.color = color
    }

    public var body: some View {
        let full = ZCMoney.format(amount, country: country)
        let font = Font.zc(style, theme: theme).weight(weight ?? .regular).zcTabular()
        let tint = color ?? theme.colors.text
        ViewThatFits(in: .horizontal) {
            Text(full).font(font).foregroundStyle(tint).lineLimit(1).fixedSize(horizontal: true, vertical: false)
            Button { showFull = true } label: {
                Text(ZCMoney.formatCompact(amount, country: country)).font(font).foregroundStyle(tint).lineLimit(1)
                    .overlay(alignment: .bottom) { Line().stroke(tint.opacity(0.35), style: StrokeStyle(lineWidth: 1, dash: [2, 2])).frame(height: 1) }
            }
            .buttonStyle(.plain)
            .popover(isPresented: $showFull) {
                Text(full).font(font).foregroundStyle(theme.colors.text).padding(ZCSpace.v4).presentationCompactAdaptation(.popover)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(full)
    }

    private struct Line: Shape {
        func path(in rect: CGRect) -> Path {
            Path { p in p.move(to: CGPoint(x: 0, y: rect.midY)); p.addLine(to: CGPoint(x: rect.maxX, y: rect.midY)) }
        }
    }
}

// MARK: - Estados y medios de pago

/// Atajos a las máquinas de estado del dominio.
public enum ZCStates {
    public static var giftcard: ZCStateMachine { ZCDomainData.giftcard }
    public static var lot: ZCStateMachine { ZCDomainData.lot }
    public static var shipment: ZCStateMachine { ZCDomainData.shipment }
    public static var approval: ZCStateMachine { ZCDomainData.approval }
    public static var settlement: ZCStateMachine { ZCDomainData.settlement }
    public static var transfer: ZCStateMachine { ZCDomainData.transfer }
}

/// Badge de un estado de dominio: tono, ícono y texto salen de la máquina de estados, así lote, envío o giftcard se ven igual en web, Android y iOS.
/// Siempre ícono y texto.
public struct ZCStateBadge: View {
    private let machine: ZCStateMachine
    private let state: String

    public init(machine: ZCStateMachine, state: String) {
        self.machine = machine
        self.state = state
    }

    public var body: some View {
        if let look = machine.looks[state] {
            let iconKey = "zc_ic_" + look.icon.replacingOccurrences(of: ":", with: "_").replacingOccurrences(of: "-", with: "_")
            ZCBadge(ZCString.text(look.labelKey), tone: ZCTone(rawValue: look.tone) ?? .neutral, icon: ZCIconName(rawValue: iconKey))
        } else {
            ZCBadge(state)
        }
    }
}

public enum ZCPayMethod: Sendable {
    case yape, plin, pagoefectivo, puntos
    var text: String {
        switch self { case .yape: return "YAPE"; case .plin: return "PLIN"; case .pagoefectivo: return "PE"; case .puntos: return "PTS" }
    }
}

/// Medio de pago local: 22 pt de alto, radio 4, texto de 10 bold; colores de marca desde los tokens `pay*`. Decorativo (acompáñalo del nombre).
public struct ZCPayBadge: View {
    @Environment(\.zcTheme) private var theme
    private let method: ZCPayMethod

    public init(_ method: ZCPayMethod) { self.method = method }

    public var body: some View {
        let c = theme.colors
        let (bg, fg): (Color, Color) = {
            switch method {
            case .yape: return (c.payYape, c.onPayYape)
            case .plin: return (c.payPlin, c.onPayPlin)
            case .pagoefectivo: return (c.payPagoefectivo, c.onPayPagoefectivo)
            case .puntos: return (c.payPuntos, c.onPayPuntos)
            }
        }()
        Text(method.text)
            .font(.zc(ZCTypeStyle(size: 10, lineHeight: 14, relativeTo: .caption2), theme: theme).weight(.bold))
            .foregroundStyle(fg)
            .padding(.horizontal, 4)
            .frame(minWidth: 34, minHeight: 22)
            .background(bg, in: RoundedRectangle(cornerRadius: 4, style: .continuous))
            .accessibilityHidden(true)
    }
}

// MARK: - Producto y llamado

/// Tarjeta de producto: imagen 16:10 con cinta "Nueva" y favorito (40 pt, colores `media*`), nombre, descripción, "Desde" y monto, y botón de compra de solo ícono.
public struct ZCProductCard: View {
    @Environment(\.zcTheme) private var theme
    private let name: String
    private let price: Double
    private let country: String
    private let description: String?
    private let image: Image?
    private let isNew: Bool
    private let favorite: Binding<Bool>?
    private let onBuy: () -> Void

    public init(name: String, price: Double, country: String, description: String? = nil, image: Image? = nil, isNew: Bool = false, favorite: Binding<Bool>? = nil, onBuy: @escaping () -> Void) {
        self.name = name
        self.price = price
        self.country = country
        self.description = description
        self.image = image
        self.isNew = isNew
        self.favorite = favorite
        self.onBuy = onBuy
    }

    public var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: theme.shape.card, style: .continuous)
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .topLeading) {
                c.surface2
                if let image { image.resizable().scaledToFill() }
                if isNew {
                    Text(ZCString.text("mol.producto.nueva"))
                        .font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme).weight(.semibold))
                        .foregroundStyle(c.onBrandAccent)
                        .padding(.leading, 12).padding(.trailing, 10).padding(.vertical, 4)
                        .background(c.brandAccent, in: UnevenRoundedRectangle(topLeadingRadius: 0, bottomLeadingRadius: 0, bottomTrailingRadius: 25, topTrailingRadius: 25))
                        .padding(.top, 10)
                }
                if let favorite {
                    HStack { Spacer(); Button { favorite.wrappedValue.toggle() } label: {
                        ZCIcon(favorite.wrappedValue ? .sHeartBold : .sHeart, size: 20)
                            .foregroundStyle(favorite.wrappedValue ? c.dangerFg : c.mediaControlFg)
                            .frame(width: 40, height: 40).background(c.mediaControlBg, in: Circle())
                            .frame(width: 48, height: 48).contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(ZCString.text(favorite.wrappedValue ? "mol.producto.favQuitar" : "mol.producto.favAgregar", name))
                    .accessibilityAddTraits(favorite.wrappedValue ? .isSelected : []) }
                    .padding(4)
                }
            }
            .frame(maxWidth: .infinity)
            .aspectRatio(16.0 / 10.0, contentMode: .fit)
            .clipped()
            VStack(alignment: .leading, spacing: ZCSpace.v1) {
                Text(name).font(.zc(ZCType.body, theme: theme).weight(.semibold)).foregroundStyle(c.text)
                if let description { Text(description).font(.zc(ZCTypeStyle(size: 13, lineHeight: 20, relativeTo: .caption), theme: theme)).foregroundStyle(c.textMuted) }
            }
            .padding(ZCSpace.v4)
            HStack(spacing: ZCSpace.v2) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(ZCString.text("mol.producto.desde")).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
                    ZCMoneyText(price, country: country, style: ZCType.titleSm, weight: .bold)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                ZCIconButton(.sAltArrowRight, label: ZCString.text("mol.producto.comprar", name), variant: .primary, small: true, action: onBuy)
            }
            .padding(.horizontal, ZCSpace.v4)
            .padding(.bottom, ZCSpace.v4)
        }
        .background(c.surface, in: shape)
        .clipShape(shape)
        .overlay(shape.stroke(c.border))
    }
}

/// Tarjeta de llamado: fondo con 18 % del acento de marca, título, texto y botón; esquina con ícono sobre `secondary`.
public struct ZCCtaCard<Action: View>: View {
    @Environment(\.zcTheme) private var theme
    private let title: String
    private let text: String
    private let icon: ZCIconName
    private let action: Action

    public init(title: String, text: String, icon: ZCIconName, @ViewBuilder action: () -> Action) {
        self.title = title
        self.text = text
        self.icon = icon
        self.action = action()
    }

    public var body: some View {
        let c = theme.colors
        ZStack(alignment: .bottomTrailing) {
            VStack(alignment: .leading, spacing: ZCSpace.v3) {
                Text(title).font(.zc(ZCType.body, theme: theme).weight(.semibold)).foregroundStyle(c.text)
                Text(text).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(c.text).frame(maxWidth: 240, alignment: .leading)
                action
            }
            .padding(.init(top: 20, leading: 20, bottom: 64, trailing: 20))
            .frame(maxWidth: .infinity, alignment: .leading)
            ZCIcon(icon, size: 32).foregroundStyle(c.onSecondary).frame(width: 64, height: 56)
                .background(c.secondary, in: UnevenRoundedRectangle(topLeadingRadius: 18, bottomLeadingRadius: 0, bottomTrailingRadius: 0, topTrailingRadius: 0))
        }
        .frame(maxWidth: .infinity, minHeight: 160)
        .background { ZStack { c.surface; c.brandAccent.opacity(0.18) } }
        .clipShape(RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous))
        .accessibilityElement(children: .contain)
    }
}

public extension ZCCtaCard where Action == EmptyView {
    init(title: String, text: String, icon: ZCIconName) {
        self.init(title: title, text: text, icon: icon) { EmptyView() }
    }
}

