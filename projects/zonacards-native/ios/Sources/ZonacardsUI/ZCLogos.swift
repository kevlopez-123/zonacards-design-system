import SwiftUI
import ZonacardsTokens

// MARK: - Trazados SVG

/// Analizador de trazados SVG (atributo `d`): M, L, H, V, C, S, Q, T, A y Z, en mayúscula (absoluto) y minúscula (relativo). SwiftUI no trae uno.
/// Los logos de la web usan arcos comprimidos ("a1 1 0 011 1", con las banderas pegadas), que se leen aquí carácter por carácter.
enum ZCSvgPath {
    private struct Reader {
        let s: [Character]
        var i = 0

        init(_ d: String) { s = Array(d) }

        var atEnd: Bool { i >= s.count }

        mutating func skipSeparators() { while i < s.count, s[i] == " " || s[i] == "," || s[i] == "\n" || s[i] == "\t" || s[i] == "\r" { i += 1 } }

        mutating func peekCommand() -> Character? {
            skipSeparators()
            guard i < s.count, s[i].isLetter else { return nil }
            return s[i]
        }

        mutating func hasNumber() -> Bool {
            skipSeparators()
            guard i < s.count else { return false }
            let c = s[i]
            return c.isNumber || c == "-" || c == "+" || c == "."
        }

        mutating func number() -> Double? {
            skipSeparators()
            let start = i
            var j = i
            var seenDot = false
            if j < s.count, s[j] == "-" || s[j] == "+" { j += 1 }
            while j < s.count {
                let c = s[j]
                if c.isNumber { j += 1 }
                else if c == ".", !seenDot { seenDot = true; j += 1 }
                else if c == "e" || c == "E" {
                    j += 1
                    if j < s.count, s[j] == "-" || s[j] == "+" { j += 1 }
                } else { break }
            }
            guard j > start, let v = Double(String(s[start..<j])) else { return nil }
            i = j
            return v
        }

        mutating func flag() -> Bool? {
            skipSeparators()
            guard i < s.count, s[i] == "0" || s[i] == "1" else { return nil }
            defer { i += 1 }
            return s[i] == "1"
        }
    }

    static func parse(_ d: String) -> Path {
        var path = Path()
        var r = Reader(d)
        var cp = CGPoint.zero, start = CGPoint.zero
        var lastCubic: CGPoint?, lastQuad: CGPoint?
        var command: Character = "M"
        while !r.atEnd {
            if let c = r.peekCommand() { command = c; r.i += 1 } else if !r.hasNumber() { break }
            let rel = command.isLowercase
            let up = Character(command.uppercased())
            func point(_ x: Double, _ y: Double) -> CGPoint { rel ? CGPoint(x: cp.x + x, y: cp.y + y) : CGPoint(x: x, y: y) }
            switch up {
            case "Z":
                path.closeSubpath()
                cp = start; lastCubic = nil; lastQuad = nil
            case "M", "L":
                var first = up == "M"
                while r.hasNumber() {
                    guard let x = r.number(), let y = r.number() else { break }
                    let p = point(x, y)
                    if first { path.move(to: p); start = p; first = false } else { path.addLine(to: p) }
                    cp = p
                    if up == "M" { command = rel ? "l" : "L" }
                }
                lastCubic = nil; lastQuad = nil
            case "H":
                while r.hasNumber() {
                    guard let x = r.number() else { break }
                    cp = CGPoint(x: rel ? cp.x + x : x, y: cp.y); path.addLine(to: cp)
                }
                lastCubic = nil; lastQuad = nil
            case "V":
                while r.hasNumber() {
                    guard let y = r.number() else { break }
                    cp = CGPoint(x: cp.x, y: rel ? cp.y + y : y); path.addLine(to: cp)
                }
                lastCubic = nil; lastQuad = nil
            case "C":
                while r.hasNumber() {
                    guard let a = r.number(), let b = r.number(), let c = r.number(), let d = r.number(), let x = r.number(), let y = r.number() else { break }
                    let c1 = point(a, b), c2 = point(c, d), e = point(x, y)
                    path.addCurve(to: e, control1: c1, control2: c2)
                    lastCubic = c2; cp = e
                }
                lastQuad = nil
            case "S":
                while r.hasNumber() {
                    guard let c = r.number(), let d = r.number(), let x = r.number(), let y = r.number() else { break }
                    let c1 = lastCubic.map { CGPoint(x: 2 * cp.x - $0.x, y: 2 * cp.y - $0.y) } ?? cp
                    let c2 = point(c, d), e = point(x, y)
                    path.addCurve(to: e, control1: c1, control2: c2)
                    lastCubic = c2; cp = e
                }
                lastQuad = nil
            case "Q":
                while r.hasNumber() {
                    guard let a = r.number(), let b = r.number(), let x = r.number(), let y = r.number() else { break }
                    let c1 = point(a, b), e = point(x, y)
                    path.addQuadCurve(to: e, control: c1)
                    lastQuad = c1; cp = e
                }
                lastCubic = nil
            case "T":
                while r.hasNumber() {
                    guard let x = r.number(), let y = r.number() else { break }
                    let c1 = lastQuad.map { CGPoint(x: 2 * cp.x - $0.x, y: 2 * cp.y - $0.y) } ?? cp
                    let e = point(x, y)
                    path.addQuadCurve(to: e, control: c1)
                    lastQuad = c1; cp = e
                }
                lastCubic = nil
            case "A":
                while r.hasNumber() {
                    guard let rx = r.number(), let ry = r.number(), let rot = r.number(), let large = r.flag(), let sweep = r.flag(), let x = r.number(), let y = r.number() else { break }
                    let e = point(x, y)
                    arc(&path, from: cp, rx: rx, ry: ry, rotation: rot, large: large, sweep: sweep, to: e)
                    cp = e
                }
                lastCubic = nil; lastQuad = nil
            default:
                return path   // comando desconocido: se corta aquí
            }
        }
        return path
    }

    /// Arco elíptico SVG (parametrización por extremos) convertido a curvas cúbicas de a lo más 90°.
    static func arc(_ path: inout Path, from p0: CGPoint, rx rxIn: Double, ry ryIn: Double, rotation: Double, large: Bool, sweep: Bool, to p1: CGPoint) {
        var rx = abs(rxIn), ry = abs(ryIn)
        if rx == 0 || ry == 0 || p0 == p1 { path.addLine(to: p1); return }
        let phi = rotation * .pi / 180
        let cosP = cos(phi), sinP = sin(phi)
        let dx = Double(p0.x - p1.x) / 2, dy = Double(p0.y - p1.y) / 2
        let x1p = cosP * dx + sinP * dy
        let y1p = -sinP * dx + cosP * dy
        let lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
        if lambda > 1 { let s = sqrt(lambda); rx *= s; ry *= s }
        let sign: Double = (large == sweep) ? -1 : 1
        let num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
        let den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
        let coef = den == 0 ? 0 : sign * sqrt(max(0, num / den))
        let cxp = coef * (rx * y1p / ry)
        let cyp = coef * (-(ry * x1p / rx))
        let cx = cosP * cxp - sinP * cyp + Double(p0.x + p1.x) / 2
        let cy = sinP * cxp + cosP * cyp + Double(p0.y + p1.y) / 2
        func angle(_ ux: Double, _ uy: Double, _ vx: Double, _ vy: Double) -> Double { atan2(ux * vy - uy * vx, ux * vx + uy * vy) }
        let ux = (x1p - cxp) / rx, uy = (y1p - cyp) / ry
        let vx = (-x1p - cxp) / rx, vy = (-y1p - cyp) / ry
        let theta1 = angle(1, 0, ux, uy)
        var dTheta = angle(ux, uy, vx, vy)
        if !sweep && dTheta > 0 { dTheta -= 2 * .pi } else if sweep && dTheta < 0 { dTheta += 2 * .pi }
        let segments = max(1, Int((abs(dTheta) / (.pi / 2)).rounded(.up)))
        let delta = dTheta / Double(segments)
        let t = 4.0 / 3.0 * tan(delta / 4)
        var th = theta1
        func pt(_ x: Double, _ y: Double) -> CGPoint {
            let X = x * rx, Y = y * ry
            return CGPoint(x: cosP * X - sinP * Y + cx, y: sinP * X + cosP * Y + cy)
        }
        for _ in 0..<segments {
            let c1 = cos(th), s1 = sin(th), c2 = cos(th + delta), s2 = sin(th + delta)
            path.addCurve(to: pt(c2, s2), control1: pt(c1 - t * s1, s1 + t * c1), control2: pt(c2 + t * s2, s2 - t * c2))
            th += delta
        }
    }
}

// MARK: - Registro de logos

private func zcColor(hex: String) -> Color {
    let h = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
    guard h.count == 6, let v = UInt32(h, radix: 16) else { return .black }
    return Color(.sRGB, red: Double((v >> 16) & 255) / 255, green: Double((v >> 8) & 255) / 255, blue: Double(v & 255) / 255, opacity: 1)
}

struct ZCLogoEntry { let title: String; let hex: String; let path: Path }
struct ZCSsoEntry { let w: CGFloat; let h: CGFloat; let parts: [(fill: Color?, path: Path)] }

/// Logos de la web (Simple Icons y los de acceso) leídos de `logos.json`, el mismo archivo que usan la web y Android.
enum ZCLogoRegistry {
    static let shared: (logos: [String: ZCLogoEntry], sso: [String: ZCSsoEntry]) = {
        guard let data = ZCData.json("logos"), let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return ([:], [:]) }
        var logos: [String: ZCLogoEntry] = [:]
        for (k, v) in root["logos"] as? [String: [String: Any]] ?? [:] {
            guard let t = v["t"] as? String, let h = v["h"] as? String, let d = v["d"] as? String else { continue }
            logos[k] = ZCLogoEntry(title: t, hex: h, path: ZCSvgPath.parse(d))
        }
        var sso: [String: ZCSsoEntry] = [:]
        for (k, v) in root["sso"] as? [String: [String: Any]] ?? [:] {
            guard let w = v["w"] as? Double, let h = v["h"] as? Double else { continue }
            let parts = (v["paths"] as? [[String: Any]] ?? []).compactMap { p -> (fill: Color?, path: Path)? in
                guard let d = p["d"] as? String else { return nil }
                return ((p["fill"] as? String).map(zcColor(hex:)), ZCSvgPath.parse(d))
            }
            sso[k] = ZCSsoEntry(w: CGFloat(w), h: CGFloat(h), parts: parts)
        }
        return (logos, sso)
    }()
}

/// Logo de un medio de pago, red o marca: color de marca por defecto; `mono` usa el color del texto. Los negros pasan al color del texto para verse en
/// oscuro. Con `label` es una imagen con nombre ("Visa"); sin él es decorativo y el texto va al lado. Un nombre desconocido muestra sus dos primeras letras.
/// Úsalos solo para identificar medios de pago, redes y comercios.
public struct ZCLogo: View {
    @Environment(\.zcTheme) private var theme
    private let name: String
    private let size: CGFloat
    private let mono: Bool
    private let label: Bool

    public init(_ name: String, size: CGFloat = 24, mono: Bool = false, label: Bool = false) {
        self.name = name
        self.size = size
        self.mono = mono
        self.label = label
    }

    public var body: some View {
        let c = theme.colors
        if let entry = ZCLogoRegistry.shared.logos[name] {
            let color: Color = mono ? c.text : (entry.hex.lowercased() == "000000" ? c.text : zcColor(hex: entry.hex))
            Canvas { ctx, canvasSize in
                let s = min(canvasSize.width, canvasSize.height) / 24
                ctx.fill(entry.path.applying(CGAffineTransform(scaleX: s, y: s)), with: .color(color))
            }
            .frame(width: size, height: size)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(label ? entry.title : "")
            .accessibilityHidden(!label)
            .accessibilityAddTraits(label ? .isImage : [])
        } else {
            Text(String(name.prefix(2)).uppercased()).font(.zc(ZCType.xxs, theme: theme).weight(ZCWeight.bold)).foregroundStyle(c.text)
                .frame(width: size, height: size).background(c.surface3, in: RoundedRectangle(cornerRadius: ZCRadius.xs, style: .continuous))
                .accessibilityHidden(true)
        }
    }
}

// MARK: - Acceso con proveedor

public enum ZCSsoProvider: Sendable { case google, apple, microsoft }
public enum ZCSsoTheme: Sendable { case light, dark, neutral, black, white, outline }
public enum ZCSsoText: Sendable { case `continue`, signin, signup }

/// Acceso con Google, Apple o Microsoft (Entra ID) según la guía de cada marca: logo sin modificar, texto aprobado y colores propios (tokens `sso*`).
/// Pastilla para Google y Apple, rectángulo para Microsoft. `text = nil` deja solo el logo, con su nombre para VoiceOver. `loading` muestra "Redirigiendo…"
/// mientras se abre el proveedor. Este botón solo dibuja y avisa: el flujo (`ASAuthorizationController` para Apple, `ASWebAuthenticationSession` para los
/// demás) lo hace la app. Apple pide ofrecer "Iniciar sesión con Apple" si hay otros accesos de terceros.
public struct ZCSsoButton: View {
    @Environment(\.zcTheme) private var theme
    private let provider: ZCSsoProvider
    private let ssoTheme: ZCSsoTheme
    private let text: ZCSsoText?
    private let block: Bool
    private let loading: Bool
    private let action: () -> Void

    public init(_ provider: ZCSsoProvider, theme: ZCSsoTheme? = nil, text: ZCSsoText? = .continue, block: Bool = false, loading: Bool = false, action: @escaping () -> Void) {
        self.provider = provider
        self.ssoTheme = theme ?? (provider == .apple ? .black : .light)
        self.text = text
        self.block = block
        self.loading = loading
        self.action = action
    }

    private func look(_ c: ZCColors) -> (bg: Color, fg: Color, border: Color) {
        switch (provider, ssoTheme) {
        case (.google, .dark): return (c.ssoGoogleDarkBg, c.ssoGoogleDarkFg, c.ssoGoogleDarkBd)
        case (.google, .neutral): return (c.ssoGoogleNeutralBg, c.ssoGoogleNeutralFg, .clear)
        case (.apple, .white): return (c.ssoAppleWhite, c.ssoAppleBlack, c.border)
        case (.apple, .outline): return (c.ssoAppleWhite, c.ssoAppleBlack, c.ssoAppleBlack)
        case (.apple, .black): return (c.ssoAppleBlack, c.ssoAppleWhite, c.ssoAppleBlack)
        case (.microsoft, .dark): return (c.ssoMsDarkBg, c.ssoAppleWhite, c.ssoMsDarkBg)
        default:
            switch provider {
            case .google: return (c.ssoGoogleLightBg, c.ssoGoogleLightFg, c.ssoGoogleLightBd)
            case .apple: return (c.ssoAppleBlack, c.ssoAppleWhite, c.ssoAppleBlack)
            case .microsoft: return (c.ssoAppleWhite, c.ssoMsLightFg, c.ssoMsLightBd)
            }
        }
    }

    public var body: some View {
        let c = theme.colors
        let look = look(c)
        let (key, logoW): (String, CGFloat) = { switch provider { case .google: return ("google-icon", 18); case .apple: return ("apple", 16); case .microsoft: return ("microsoft-icon", 20) } }()
        let nameKey: String = { switch provider { case .google: return "mol.sso.google"; case .apple: return "mol.sso.apple"; case .microsoft: return "mol.sso.microsoft" } }()
        let name = ZCString.text(nameKey)
        let textKey: String = { switch text { case .continue?: return "mol.sso.continue"; case .signup?: return "mol.sso.signup"; default: return "mol.sso.signin" } }()
        let label = ZCString.text(textKey, name)
        let shape = RoundedRectangle(cornerRadius: provider == .microsoft ? 2 : ZCRadius.full, style: .continuous)
        Button(action: action) {
            HStack(spacing: 10) {
                if let entry = ZCLogoRegistry.shared.sso[key] {
                    Canvas { ctx, size in
                        let s = size.width / entry.w
                        for part in entry.parts { ctx.fill(part.path.applying(CGAffineTransform(scaleX: s, y: s)), with: .color(part.fill ?? look.fg)) }
                    }
                    .frame(width: logoW, height: logoW * entry.h / entry.w)
                }
                if text != nil {
                    Text(loading ? ZCString.text("mol.sso.redirigiendo") : label)
                        .font(.zc(ZCType.body, theme: theme).weight(provider == .microsoft ? .semibold : .medium))
                        .foregroundStyle(look.fg).lineLimit(1)
                }
            }
            .padding(.horizontal, text == nil ? 0 : ZCSpace.v4)
            .frame(maxWidth: text == nil ? ZCSize.target : (block ? .infinity : 400))
            .frame(minHeight: ZCSize.target)
            .background(look.bg, in: shape)
            .overlay(shape.stroke(look.border))
            .opacity(loading ? 0.6 : 1)
            .contentShape(shape)
        }
        .buttonStyle(.plain)
        .disabled(loading)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .accessibilityValue(loading ? ZCString.text("mol.sso.redirigiendo") : "")
        .accessibilityAddTraits(.isButton)
    }
}
