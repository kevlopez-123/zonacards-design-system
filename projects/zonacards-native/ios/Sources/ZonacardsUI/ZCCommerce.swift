import SwiftUI
import ZonacardsTokens

/// Distribución en filas que bajan de línea cuando no caben (como `flex-wrap` de la web).
struct ZCFlowLayout: Layout {
    var spacing: CGFloat = ZCSpace.v2
    var lineSpacing: CGFloat = ZCSpace.v2

    private func arrange(_ width: CGFloat, _ subviews: Subviews) -> (frames: [CGRect], size: CGSize) {
        var frames: [CGRect] = []
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0, maxX: CGFloat = 0
        for sub in subviews {
            let size = sub.sizeThatFits(.unspecified)
            if x > 0, x + size.width > width { y += rowHeight + lineSpacing; x = 0; rowHeight = 0 }
            frames.append(CGRect(x: x, y: y, width: size.width, height: size.height))
            x += size.width + spacing
            maxX = max(maxX, x - spacing)
            rowHeight = max(rowHeight, size.height)
        }
        return (frames, CGSize(width: maxX, height: y + rowHeight))
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        arrange(proposal.width ?? .infinity, subviews).size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(bounds.width, subviews)
        for (sub, frame) in zip(subviews, result.frames) {
            sub.place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY), proposal: ProposedViewSize(frame.size))
        }
    }
}

// MARK: - Pasos del checkout

/// Un paso del checkout. `summary` se muestra cuando el paso está completado.
public struct ZCCheckoutStep: Identifiable {
    public let id: String
    public let title: String
    public let summary: String?

    public init(id: String, title: String, summary: String? = nil) {
        self.id = id
        self.title = title
        self.summary = summary
    }
}

/// Pasos del checkout: una sección por paso (radio 16, borde); el actual abierto, los futuros al 60 %. Círculo de 28 pt: completado en `success` con check,
/// actual en `primary` con número, futuro solo con borde. Los completados muestran su resumen y "Editar". VoiceOver lee "completado", "paso actual" o
/// "bloqueado"; al cambiar de paso, el foco va al título. El botón "Guardar y continuar" lo pone la pantalla dentro del cuerpo.
public struct ZCCheckoutSteps<StepBody: View>: View {
    @Environment(\.zcTheme) private var theme
    @AccessibilityFocusState private var focusedStep: Int?
    private let steps: [ZCCheckoutStep]
    private let current: Binding<Int>
    private let stepBody: (Int) -> StepBody

    public init(steps: [ZCCheckoutStep], current: Binding<Int>, @ViewBuilder body: @escaping (_ index: Int) -> StepBody) {
        self.steps = steps
        self.current = current
        self.stepBody = body
    }

    public var body: some View {
        let c = theme.colors
        let now = current.wrappedValue
        let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
        VStack(spacing: ZCSpace.v3) {
            ForEach(Array(steps.enumerated()), id: \.offset) { i, step in
                let done = i < now, active = i == now
                let status = ZCString.text(done ? "mol.checkout.completo" : (active ? "mol.checkout.actual" : "mol.checkout.bloqueado"))
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: ZCSpace.v3) {
                        ZStack {
                            Circle().fill(done ? c.successFg : (active ? c.primary : c.surface))
                            Circle().stroke(done ? c.successFg : (active ? c.primary : c.borderStrong), lineWidth: 1.5)
                            if done { ZCIcon(.lCheck, size: 16).foregroundStyle(c.surface) }
                            else { Text("\(i + 1)").font(.zc(ZCType.caption, theme: theme).weight(.semibold)).foregroundStyle(active ? c.onPrimary : c.text) }
                        }
                        .frame(width: 28, height: 28)
                        .accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: 0) {
                            Text(step.title).font(.zc(ZCType.body, theme: theme).weight(.semibold)).foregroundStyle(c.text)
                            if done, let summary = step.summary { Text(summary).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted) }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel("\(step.title), \(status)")
                        .accessibilityAddTraits(.isHeader)
                        .accessibilityFocused($focusedStep, equals: i)
                        if done {
                            ZCButton(ZCString.text("mol.checkout.editarCorto"), variant: .ghost, size: .sm) { current.wrappedValue = i }
                                .accessibilityLabel(ZCString.text("mol.checkout.editar", step.title))
                        }
                    }
                    .padding(ZCSpace.v4)
                    .frame(minHeight: 60)
                    if active {
                        VStack(alignment: .leading, spacing: ZCSpace.v4) { stepBody(i) }
                            .padding(.horizontal, ZCSpace.v4)
                            .padding(.bottom, ZCSpace.v4)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(c.surface, in: shape)
                .overlay(shape.stroke(c.border))
                .opacity(i > now ? 0.6 : 1)
            }
        }
        .onChange(of: now) { _, v in focusedStep = v }
    }
}

// MARK: - Carrito

public struct ZCCartLine: Identifiable, Equatable {
    public let id: String
    public var name: String
    public var brand: String
    public var price: Double
    public var qty: Int
    public var note: String?
    public var category: String?

    public init(id: String, name: String, brand: String, price: Double, qty: Int, note: String? = nil, category: String? = nil) {
        self.id = id
        self.name = name
        self.brand = brand
        self.price = price
        self.qty = qty
        self.note = note
        self.category = category
    }
}

public struct ZCCartFee: Identifiable {
    public let label: String
    public let amount: Double
    public let info: String?
    public var id: String { label }

    public init(label: String, amount: Double, info: String? = nil) {
        self.label = label
        self.amount = amount
        self.info = info
    }
}

/// Carrito: "Tu carrito (n)", líneas con miniatura de 56 pt (44 en pantallas angostas), nombre, "marca · nota · precio c/u", cantidad de 1 a 10,
/// quitar (aviso "Producto eliminado") y total de la línea; `coupon` debajo de las líneas; resumen con subtotal, descuento en verde (tope el subtotal),
/// cargos con su ayuda y total; "Pago 100 % seguro". Vacío: estado con acción.
public struct ZCCart<Coupon: View, Empty: View>: View {
    @Environment(\.zcTheme) private var theme
    private let lines: Binding<[ZCCartLine]>
    private let country: String
    private let discount: Double
    private let fees: [ZCCartFee]
    private let toasts: ZCToastState?
    private let onRemoved: ((ZCCartLine) -> Void)?
    private let coupon: Coupon
    private let empty: Empty

    public init(
        lines: Binding<[ZCCartLine]>, country: String, discount: Double = 0, fees: [ZCCartFee] = [], toasts: ZCToastState? = nil,
        onRemoved: ((ZCCartLine) -> Void)? = nil, @ViewBuilder coupon: () -> Coupon, @ViewBuilder empty: () -> Empty
    ) {
        self.lines = lines
        self.country = country
        self.discount = discount
        self.fees = fees
        self.toasts = toasts
        self.onRemoved = onRemoved
        self.coupon = coupon()
        self.empty = empty()
    }

    private func money(_ a: Double) -> String { ZCMoney.format(a, country: country) }

    private func summaryRow(_ label: String, _ value: String, _ color: Color, info: String? = nil) -> some View {
        let c = theme.colors
        return HStack {
            HStack(spacing: ZCSpace.v1) {
                Text(label).font(.zc(ZCTypeStyle(size: 14.5, lineHeight: 24, relativeTo: .subheadline), theme: theme)).foregroundStyle(c.textMuted)
                if let info { InfoDot(label: label, info: info) }
            }
            Spacer()
            Text(value).font(.zc(ZCTypeStyle(size: 14.5, lineHeight: 24, relativeTo: .subheadline), theme: theme).zcTabular()).foregroundStyle(color)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label): \(value)")
    }

    public var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
        let items = lines.wrappedValue
        if items.isEmpty {
            ZCState(ZCString.text("mol.carrito.vacio"), icon: .sCartLarge2, text: ZCString.text("mol.carrito.vacioTexto")) { empty }
        } else {
            let count = items.reduce(0) { $0 + $1.qty }
            let subtotal = items.reduce(0) { $0 + $1.price * Double($1.qty) }
            let disc = min(max(discount, 0), subtotal)
            let total = max(0, subtotal - disc + fees.reduce(0) { $0 + $1.amount })
            VStack(alignment: .leading, spacing: ZCSpace.v4) {
                HStack(spacing: 0) {
                    Text(ZCString.text("mol.carrito.titulo")).font(.zc(ZCType.title, theme: theme).weight(.bold)).foregroundStyle(c.text)
                    Text(" (\(count))").font(.zc(ZCType.title, theme: theme)).foregroundStyle(c.textMuted)
                }
                .accessibilityElement(children: .combine)
                .accessibilityAddTraits(.isHeader)
                VStack(spacing: 0) {
                    ForEach(Array(items.enumerated()), id: \.offset) { i, line in
                        row(line)
                        if i < items.count - 1 { ZCDivider() }
                    }
                }
                .accessibilityElement(children: .contain)
                .accessibilityLabel(ZCString.text("mol.carrito.productos"))
                coupon
                VStack(spacing: 6) {
                    summaryRow(ZCString.text("mol.carrito.subtotal"), money(subtotal), c.text)
                    if disc > 0 { summaryRow(ZCString.text("mol.carrito.descuento"), "−" + money(disc), c.successFg) }
                    ForEach(fees) { summaryRow($0.label, money($0.amount), c.text, info: $0.info) }
                    ZCDivider()
                    HStack {
                        Text(ZCString.text("mol.carrito.total")).font(.zc(ZCType.titleSm, theme: theme).weight(.bold)).foregroundStyle(c.text)
                        Spacer()
                        Text(money(total)).font(.zc(ZCType.titleSm, theme: theme).weight(.bold).zcTabular()).foregroundStyle(c.text)
                    }
                    .padding(.top, ZCSpace.v2)
                    .accessibilityElement(children: .combine)
                }
                HStack(spacing: 6) {
                    ZCIcon(.sShieldCheck, size: 16)
                    Text(ZCString.text("mol.carrito.seguro")).font(.zc(ZCType.caption, theme: theme))
                }
                .foregroundStyle(c.successFg)
                .frame(maxWidth: .infinity)
            }
            .padding(ZCSpace.v4)
            .background(c.surface, in: shape)
            .overlay(shape.stroke(c.border))
        }
    }

    private func row(_ line: ZCCartLine) -> some View {
        let c = theme.colors
        let thumb: CGFloat = UIScreen.main.bounds.width < 480 ? 44 : 56
        let qty = Binding<Int>(
            get: { lines.wrappedValue.first { $0.id == line.id }?.qty ?? line.qty },
            set: { q in
                var all = lines.wrappedValue
                if let i = all.firstIndex(where: { $0.id == line.id }) { all[i].qty = q }
                lines.wrappedValue = all
            }
        )
        return HStack(alignment: .top, spacing: ZCSpace.v3) {
            ZCIcon(.sTicket, size: 20).foregroundStyle(c.textMuted).frame(width: thumb, height: thumb).background(c.surface2, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            VStack(alignment: .leading, spacing: ZCSpace.v2) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(line.name).font(.zc(ZCTypeStyle(size: 15, lineHeight: 21, relativeTo: .body), theme: theme).weight(.bold)).foregroundStyle(c.text)
                    Text([line.brand, line.note, ZCString.text("mol.carrito.cu", money(line.price))].compactMap { $0 }.joined(separator: " · "))
                        .font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
                }
                ZCFlowLayout(spacing: ZCSpace.v2, lineSpacing: ZCSpace.v1) {
                    ZCNumberField(value: qty, min: 1, max: 10, label: ZCString.text("mol.carrito.cantidadDe", line.name)).frame(width: 152)
                    ZCIconButton(.sTrashBinTrash, label: ZCString.text("mol.carrito.eliminar", line.name), small: true) {
                        lines.wrappedValue = lines.wrappedValue.filter { $0.id != line.id }
                        toasts?.success(ZCString.text("mol.carrito.eliminado"), text: line.name)
                        onRemoved?(line)
                    }
                    Text(money(line.price * Double(line.qty))).font(.zc(ZCType.body, theme: theme).weight(.bold).zcTabular()).foregroundStyle(c.text).lineLimit(1).frame(minHeight: 44)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, ZCSpace.v3)
    }
}

public extension ZCCart where Coupon == EmptyView, Empty == EmptyView {
    init(lines: Binding<[ZCCartLine]>, country: String, discount: Double = 0, fees: [ZCCartFee] = [], toasts: ZCToastState? = nil, onRemoved: ((ZCCartLine) -> Void)? = nil) {
        self.init(lines: lines, country: country, discount: discount, fees: fees, toasts: toasts, onRemoved: onRemoved, coupon: { EmptyView() }, empty: { EmptyView() })
    }
}

public extension ZCCart where Empty == EmptyView {
    init(lines: Binding<[ZCCartLine]>, country: String, discount: Double = 0, fees: [ZCCartFee] = [], toasts: ZCToastState? = nil, onRemoved: ((ZCCartLine) -> Void)? = nil, @ViewBuilder coupon: () -> Coupon) {
        self.init(lines: lines, country: country, discount: discount, fees: fees, toasts: toasts, onRemoved: onRemoved, coupon: coupon, empty: { EmptyView() })
    }
}

/// Punto "?" con la ayuda de un dato, en un popover.
private struct InfoDot: View {
    @Environment(\.zcTheme) private var theme
    @State private var show = false
    let label: String
    let info: String

    var body: some View {
        Button { show = true } label: {
            ZCIcon(.sQuestionCircle, size: 16).foregroundStyle(theme.colors.textSubtle).frame(width: 24, height: 24).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(label): \(info)")
        .popover(isPresented: $show) {
            Text(info).font(.zc(ZCType.bodySm, theme: theme)).foregroundStyle(theme.colors.text).padding(ZCSpace.v4).frame(maxWidth: 280, alignment: .leading)
                .presentationCompactAdaptation(.popover)
        }
    }
}

// MARK: - Elegir un monto

private struct ZCAmountChip: View {
    @Environment(\.zcTheme) private var theme
    let text: String
    let selected: Bool
    var soldOut = false
    var description: String?
    let action: () -> Void

    var body: some View {
        let c = theme.colors
        Button(action: action) {
            Text(text)
                .font(.zc(ZCType.body, theme: theme).weight(selected ? .semibold : .regular).zcTabular())
                .strikethrough(soldOut)
                .foregroundStyle(selected ? c.onPrimary : c.text)
                .padding(.horizontal, ZCSpace.v4)
                .frame(minHeight: ZCSize.targetSm)
                .background(selected ? c.primary : c.surface, in: Capsule())
                .overlay(Capsule().stroke(selected ? c.primary : c.borderStrong, lineWidth: 1))
                .opacity(soldOut ? 0.45 : 1)
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .disabled(soldOut)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(description ?? text)
        .accessibilityAddTraits(selected ? [.isButton, .isSelected] : [.isButton])
    }
}

/// Elegir un monto: montos como grupo de opciones, "Otro" abre un monto libre entre `min` y `max`, y los agotados van tachados y sin respuesta.
/// El mensaje del campo muestra "Total: S/ 50.00"; con "Otro" vacío o fuera de rango avisa. Los montos se dan en la moneda de `country`.
public struct ZCAmountPicker: View {
    @State private var other = false
    @State private var raw = ""
    @State private var touched = false
    private let label: String
    private let amounts: [Double]
    private let value: Binding<Double?>
    private let soldOut: [Double]
    private let allowOther: Bool
    private let min: Double
    private let max: Double
    private let country: String
    private let required: Bool

    public init(_ label: String, amounts: [Double], value: Binding<Double?>, soldOut: [Double] = [], allowOther: Bool = true, min: Double = 10, max: Double = 1000, country: String = "pe", required: Bool = false) {
        self.label = label
        self.amounts = amounts
        self.value = value
        self.soldOut = soldOut
        self.allowOther = allowOther
        self.min = min
        self.max = max
        self.country = country
        self.required = required
    }

    private func whole(_ v: Double) -> String { ZCMoney.formatWhole(v, country: country) }

    public var body: some View {
        let v = value.wrappedValue
        let error: String? = {
            guard other, touched else { return nil }
            guard let v else { return ZCString.text("mol.monto.ingresa") }
            return (v < min || v > max) ? ZCString.text("mol.monto.rango", whole(min), whole(max)) : nil
        }()
        let total = ZCString.text("mol.monto.total", v.map { ZCMoney.format($0, country: country) } ?? "—")
        ZCField(label, required: required, hint: total, error: error) {
            VStack(alignment: .leading, spacing: ZCSpace.v2) {
                ZCFlowLayout {
                    ForEach(amounts, id: \.self) { a in
                        ZCAmountChip(text: whole(a), selected: !other && v == a) { other = false; touched = false; value.wrappedValue = a }
                    }
                    if allowOther {
                        ZCAmountChip(text: ZCString.text("mol.monto.otro"), selected: other) { other = true; value.wrappedValue = Double(raw) }
                    }
                    ForEach(soldOut, id: \.self) { s in
                        ZCAmountChip(text: whole(s), selected: false, soldOut: true, description: ZCString.text("mol.monto.agotado", whole(s))) {}
                    }
                }
                if other {
                    ZCTextField(
                        ZCString.text("mol.monto.otroMonto"),
                        text: Binding(get: { raw }, set: { raw = $0; value.wrappedValue = Double($0) }),
                        placeholder: ZCString.text("mol.monto.entre", ZCMoney.formatNumber(min, country: country), ZCMoney.formatNumber(max, country: country)),
                        error: error, keyboard: .numberPad, allowed: "[0-9]", rejectMessage: ZCString.text("ui.soloEnteros"),
                        prefix: ZCMoney.currencySymbol(country), hideLabel: true, onBlur: { touched = true }
                    )
                }
            }
        }
    }
}

// MARK: - Cupones

public enum ZCCouponKind: Sendable { case pct, fix, gc }

/// `pct`: porcentaje del subtotal (0,10 = 10 %) · `fix`: monto fijo · `gc`: gift card con saldo. `solo`: no se combina con otros.
public struct ZCCoupon: Identifiable, Equatable, Sendable {
    public let code: String
    public let kind: ZCCouponKind
    public let value: Double
    public let description: String
    public let solo: Bool
    public var id: String { code }

    public init(code: String, kind: ZCCouponKind, value: Double, description: String, solo: Bool = false) {
        self.code = code
        self.kind = kind
        self.value = value
        self.description = description
        self.solo = solo
    }

    /// Descuento de un código (nunca más que el subtotal).
    public func discount(of subtotal: Double) -> Double { min(subtotal, kind == .pct ? subtotal * value : value) }
}

/// Descuento total de los códigos aplicados (nunca más que el subtotal).
public func zcCouponsTotal(_ coupons: [ZCCoupon], subtotal: Double) -> Double {
    min(subtotal, coupons.reduce(0) { $0 + $1.discount(of: subtotal) })
}

public enum ZCCouponCheck: Sendable {
    case valid(ZCCoupon)
    case notFound
    case expired(date: String)
}

/// Cupones y gift cards: hasta `max` códigos con las reglas de combinación. `validate` consulta el código (en la app, el servicio); el campo resuelve
/// repetidos, "no combinable" y el máximo, y avisa cada resultado. Los códigos se escriben en mayúsculas; "Listo" del teclado también aplica.
public struct ZCCouponField: View {
    @Environment(\.zcTheme) private var theme
    @State private var draft = ""
    @State private var busy = false
    @State private var error: String?
    @State private var success: String?
    @State private var note: String?
    private let label: String
    private let value: Binding<[ZCCoupon]>
    private let validate: (String) async throws -> ZCCouponCheck
    private let subtotal: Double
    private let country: String
    private let max: Int
    private let hint: String?
    private let optional: Bool

    public init(_ label: String, value: Binding<[ZCCoupon]>, subtotal: Double = 0, country: String = "pe", max: Int = 3, hint: String? = nil, optional: Bool = true, validate: @escaping (String) async throws -> ZCCouponCheck) {
        self.label = label
        self.value = value
        self.validate = validate
        self.subtotal = subtotal
        self.country = country
        self.max = max
        self.hint = hint
        self.optional = optional
    }

    private func fail(_ message: String) {
        error = message
        success = nil
    }

    private func apply() {
        let code = draft.trimmingCharacters(in: .whitespaces)
        guard !code.isEmpty, !busy else { return }
        if value.wrappedValue.contains(where: { $0.code == code }) { return fail(ZCString.text("mol.cupon.repetido")) }
        busy = true
        Task {
            let result = try? await validate(code)
            busy = false
            switch result {
            case nil: fail(ZCString.text("mol.cupon.errorServicio"))
            case .expired(let date): fail(ZCString.text("mol.cupon.vencido", code, date))
            case .notFound: fail(ZCString.text("mol.cupon.noExiste", code))
            case .valid(let coupon):
                if coupon.solo && !value.wrappedValue.isEmpty { fail(ZCString.text("mol.cupon.noCombina", code)) }
                else if value.wrappedValue.contains(where: \.solo) { fail(ZCString.text("mol.cupon.tieneSolo")) }
                else {
                    value.wrappedValue.append(coupon)
                    draft = ""; error = nil; note = nil
                    let left = max - value.wrappedValue.count
                    success = left > 0 ? ZCString.text("mol.cupon.aplicadoQuedan", code, left) : ZCString.text("mol.cupon.aplicadoMaximo", code)
                }
            }
        }
    }

    public var body: some View {
        let c = theme.colors
        let full = value.wrappedValue.count >= max
        ZCField(label, optional: optional, hint: note ?? hint, error: error, success: success) {
            VStack(alignment: .leading, spacing: ZCSpace.v2) {
                HStack(alignment: .top, spacing: ZCSpace.v2) {
                    ZCTextField(
                        label,
                        text: Binding(get: { draft }, set: { raw in draft = String(raw.uppercased().filter { ("A"..."Z").contains($0) || ("0"..."9").contains($0) || $0 == "-" }); error = nil }),
                        placeholder: full ? ZCString.text("mol.cupon.maximoAlcanzado", max) : ZCString.text("mol.cupon.placeholder"),
                        error: error, capitalization: .characters, submitLabel: .done,
                        hideLabel: true,
                        leading: AnyView(ZCIcon(.sTicketSale, size: 16).foregroundStyle(c.textMuted).padding(.leading, ZCSpace.v4).padding(.trailing, ZCSpace.v1)),
                        onSubmit: apply
                    )
                    .disabled(full)
                    ZCButton(ZCString.text("ui.aplicar"), variant: .outline, loading: busy, action: apply).disabled(draft.isEmpty || busy)
                }
                if !value.wrappedValue.isEmpty {
                    VStack(spacing: 6) {
                        ForEach(value.wrappedValue) { cp in applied(cp) }
                    }
                    .accessibilityElement(children: .contain)
                    .accessibilityLabel(ZCString.text("mol.cupon.aplicados"))
                }
            }
        }
    }

    private func applied(_ cp: ZCCoupon) -> some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: ZCRadius.sm, style: .continuous)
        let off = "−" + ZCMoney.format(cp.discount(of: subtotal), country: country)
        return HStack(spacing: ZCSpace.v3) {
            ZCIcon(cp.kind == .gc ? .sGift : .lBadgePercent, size: 16).foregroundStyle(c.successFg)
            VStack(alignment: .leading, spacing: 0) {
                Text(cp.code).font(.zc(ZCType.bodySm, theme: theme).weight(.bold)).foregroundStyle(c.text)
                Text(cp.description).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Text(off).font(.zc(ZCType.bodySm, theme: theme).weight(.semibold).zcTabular()).foregroundStyle(c.successFg)
            ZCIconButton(.lX, label: ZCString.text("mol.cupon.quitar", cp.code), small: true) {
                value.wrappedValue.removeAll { $0.code == cp.code }
                success = nil; error = nil
                note = ZCString.text("mol.cupon.quitado", cp.code)
            }
        }
        .padding(.leading, ZCSpace.v3)
        .background(c.successBg, in: shape)
        .overlay(shape.stroke(c.successBd, style: StrokeStyle(lineWidth: 1, dash: [4, 3])))
        .accessibilityElement(children: .contain)
    }
}
