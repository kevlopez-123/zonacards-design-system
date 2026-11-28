import SwiftUI
import ZonacardsTokens

// MARK: - Introducción

/// Una diapositiva de la introducción: título, texto y, opcional, una imagen de fondo o un ícono.
public struct ZCIntroSlide: Identifiable {
    public let id = UUID()
    public let title: String
    public let text: String
    public let image: Image?
    public let icon: ZCIconName?

    public init(title: String, text: String, image: Image? = nil, icon: ZCIconName? = nil) {
        self.title = title
        self.text = text
        self.image = image
        self.icon = icon
    }
}

/// Puntos de avance (introducción, pasos): el actual es una píldora; el resto, puntos. Anuncia "Paso 2 de 3". Solo informa: no se toca
/// (la navegación la hacen los botones).
public struct ZCStepDots: View {
    @Environment(\.zcTheme) private var theme
    private let total: Int
    private let current: Int
    private let color: Color?

    public init(total: Int, current: Int, color: Color? = nil) {
        self.total = total
        self.current = current
        self.color = color
    }

    public var body: some View {
        let tint = color ?? theme.colors.text
        HStack(spacing: ZCSpace.v2) {
            ForEach(0..<total, id: \.self) { i in
                Capsule().fill(tint).frame(width: i == current ? 24 : 6, height: 6).opacity(i == current ? 1 : 0.4)
            }
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(ZCString.text("mol.intro.paso", String(current + 1), String(total)))
    }
}

/// Introducción a pantalla completa de la primera vez: una diapositiva a la vez sobre fondo `primary`, puntos de avance, "Saltar" (salvo en la
/// última) y "Continuar", que en la última dice "Empezar". El título anuncia el cambio de diapositiva. La app guarda que ya la vio.
public struct ZCIntroSlides: View {
    @Environment(\.zcTheme) private var theme
    @State private var index = 0
    private let slides: [ZCIntroSlide]
    private let onFinished: () -> Void
    private let onSkipped: () -> Void

    public init(slides: [ZCIntroSlide], onFinished: @escaping () -> Void, onSkipped: @escaping () -> Void) {
        self.slides = slides
        self.onFinished = onFinished
        self.onSkipped = onSkipped
    }

    public var body: some View {
        if !slides.isEmpty {
            let c = theme.colors
            let i = min(max(index, 0), slides.count - 1)
            let last = i == slides.count - 1
            let s = slides[i]
            ZStack {
                c.primary.ignoresSafeArea()
                if let image = s.image { image.resizable().scaledToFill().opacity(0.45).ignoresSafeArea() }
                VStack(alignment: .leading, spacing: 0) {
                    VStack(alignment: .leading, spacing: ZCSpace.v3) {
                        Spacer(minLength: 0)
                        if let icon = s.icon { ZCIcon(icon, size: 32).foregroundStyle(c.onPrimary) }
                        Text(s.title).font(.zc(ZCType.displaySm, theme: theme).weight(ZCWeight.extrabold)).foregroundStyle(c.onPrimary).accessibilityAddTraits(.isHeader)
                        Text(s.text).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.onPrimary.opacity(0.9))
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                    ZCStepDots(total: slides.count, current: i, color: c.onPrimary).padding(.vertical, ZCSpace.v6)
                    HStack {
                        if !last { ZCButton(ZCString.text("mol.intro.saltar"), variant: .ghost, action: onSkipped).environment(\.zcOnPrimary, true) }
                        Spacer()
                        ZCButton(ZCString.text(last ? "mol.intro.empezar" : "mol.intro.continuar"), trailingIcon: .sArrowRight) {
                            if last { onFinished() } else { withAnimation { index = i + 1 } }
                        }
                        .environment(\.zcOnPrimary, true)
                    }
                }
                .padding(ZCSpace.v6)
            }
            .id(i)
            .onChange(of: index) { _, _ in
                AccessibilityNotification.ScreenChanged(nil).post()
            }
        }
    }
}

// MARK: - Sesión por expirar

private struct ZCSessionTimeoutSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var left: Int
    let onExtend: () -> Void
    let onLogout: () -> Void
    let finish: () -> Void

    init(seconds: Int, onExtend: @escaping () -> Void, onLogout: @escaping () -> Void, finish: @escaping () -> Void) {
        _left = State(initialValue: seconds)
        self.onExtend = onExtend
        self.onLogout = onLogout
        self.finish = finish
    }

    var body: some View {
        let text = ZCString.text("sesionExpira.texto", left)
        ZCSheetBody(title: ZCString.text("sesionExpira.titulo"), subtitle: text, closable: false, dismissible: false, hasFooter: true) {
            ZCFooterButton(ZCString.text("sesionExpira.cerrar"), variant: .outline) { finish(); onLogout() }
            ZCFooterButton(ZCString.text("sesionExpira.seguir")) { finish(); onExtend() }
        } content: {
            // La cuenta se anuncia cada 15 s, no cada segundo.
            Color.clear.frame(height: 1)
                .accessibilityElement()
                .accessibilityLabel(left % 15 == 0 ? text : "")
        }
        .task {
            while left > 0 {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if Task.isCancelled { return }
                left -= 1
            }
            finish()
            onLogout()
        }
    }
}

public extension View {
    /// Aviso de sesión por expirar: cuenta regresiva en una hoja. "Seguir conectado" extiende la sesión; "Cerrar sesión" o llegar a 0 la cierran.
    /// La app lo abre cuando detecta inactividad (por ejemplo, 14 de 15 minutos). No se cierra arrastrando.
    func zcSessionTimeout(isPresented: Binding<Bool>, seconds: Int = 60, onExtend: @escaping () -> Void, onLogout: @escaping () -> Void) -> some View {
        sheet(isPresented: isPresented) {
            ZCSessionTimeoutSheet(seconds: seconds, onExtend: onExtend, onLogout: onLogout) { isPresented.wrappedValue = false }
        }
    }
}

// MARK: - País de operación

/// País de operación de la barra superior: bandera y moneda. Abre la lista con moneda, identificador tributario y zona horaria; elegir uno define
/// moneda, impuesto y zona horaria. `allowed` limita la lista al alcance del rol: con un solo país se muestra fijo (sin menú) y un valor fuera del
/// alcance pasa al primer país permitido.
public struct ZCCountrySwitcher: View {
    @Environment(\.zcTheme) private var theme
    @State private var open = false
    private let value: Binding<String>
    private let allowed: [String]?

    public init(value: Binding<String>, allowed: [String]? = nil) {
        self.value = value
        self.allowed = allowed
    }

    private var countries: [ZCCountry] { ZCDomainData.countries.filter { allowed == nil || allowed!.contains($0.code) } }

    private var current: ZCCountry {
        countries.first { $0.code == value.wrappedValue } ?? ZCDomainData.countries.first { $0.code == (value.wrappedValue.isEmpty ? "pe" : value.wrappedValue) } ?? ZCDomainData.countries[0]
    }

    private var label: some View {
        HStack(spacing: ZCSpace.v2) {
            ZCFlag(current.code)
            if UIScreen.main.bounds.width >= 640 {
                Text(current.currency).font(.zc(ZCType.bodySm, theme: theme).zcTabular()).foregroundStyle(theme.colors.text)
            }
        }
        .padding(.horizontal, ZCSpace.v3)
        .frame(minHeight: ZCSize.targetSm)
        .contentShape(Rectangle())
    }

    public var body: some View {
        let list = countries
        Group {
            if list.count < 2 {
                label
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(ZCString.text("top.pais.fijo", current.name, current.currency))
            } else {
                Button { open = true } label: { label }
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(ZCString.text("top.pais.boton", current.name, current.currency))
                    .accessibilityAddTraits(.isButton)
                    .zcChoice(isPresented: $open, title: ZCString.text("top.pais.titulo")) { close in
                        ScrollView {
                            VStack(spacing: 2) {
                                ForEach(list, id: \.code) { cn in row(cn, close: close) }
                                Text(ZCString.text("top.pais.ayuda")).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(theme.colors.textMuted)
                                    .frame(maxWidth: .infinity, alignment: .leading).padding(ZCSpace.v2)
                            }
                            .padding(ZCSpace.v2)
                        }
                    }
            }
        }
        .onAppear(perform: normalize)
        .onChange(of: allowed ?? []) { _, _ in normalize() }
    }

    private func normalize() {
        if let first = countries.first, !countries.contains(where: { $0.code == value.wrappedValue }) { value.wrappedValue = first.code }
    }

    private func row(_ cn: ZCCountry, close: @escaping () -> Void) -> some View {
        let c = theme.colors
        let on = cn.code == value.wrappedValue
        let zone = cn.timeZone.split(separator: "/").last.map { $0.replacingOccurrences(of: "_", with: " ") } ?? cn.timeZone
        return Button { value.wrappedValue = cn.code; close() } label: {
            HStack(spacing: ZCSpace.v3) {
                Circle().stroke(on ? c.primary : c.borderStrong, lineWidth: 2).frame(width: 18, height: 18)
                    .overlay { if on { Circle().fill(c.primary).frame(width: 8, height: 8) } }
                ZCFlag(cn.code)
                VStack(alignment: .leading, spacing: 0) {
                    Text(cn.name).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.text)
                    Text("\(cn.currency) · \(cn.taxId) · \(zone)").font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.horizontal, ZCSpace.v3)
            .padding(.vertical, 6)
            .frame(minHeight: ZCSize.targetSm)
            .contentShape(RoundedRectangle(cornerRadius: ZCRadius.sm))
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(cn.name), \(cn.currency)")
        .accessibilityAddTraits(on ? [.isButton, .isSelected] : [.isButton])
    }
}
