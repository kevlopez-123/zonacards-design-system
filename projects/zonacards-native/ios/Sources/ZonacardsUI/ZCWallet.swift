import CoreImage
import CoreImage.CIFilterBuiltins
import SwiftUI
import ZonacardsTokens

public enum ZCWalletOs: Sendable { case apple, google }
public enum ZCBarcode: Sendable { case qr, code128, code39 }

// MARK: - Código QR o de barras

/// Patrones de Code 39: 9 elementos (barra, espacio, barra…), `w` ancho y `n` angosto; siempre exactamente tres anchos.
enum ZCCode39 {
    static let patterns: [Character: String] = [
        "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw", "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw",
        "8": "wnnwnnwnn", "9": "nnwwnnwnn", "A": "wnnnnwnnw", "B": "nnwnnwnnw", "C": "wnwnnwnnn", "D": "nnnnwwnnw", "E": "wnnnwwnnn", "F": "nnwnwwnnn",
        "G": "nnnnnwwnw", "H": "wnnnnwwnn", "I": "nnwnnwwnn", "J": "nnnnwwwnn", "K": "wnnnnnnww", "L": "nnwnnnnww", "M": "wnwnnnnwn", "N": "nnnnwnnww",
        "O": "wnnnwnnwn", "P": "nnwnwnnwn", "Q": "nnnnnnwww", "R": "wnnnnnwwn", "S": "nnwnnnwwn", "T": "nnnnwnwwn", "U": "wwnnnnnnw", "V": "nwwnnnnnw",
        "W": "wwwnnnnnn", "X": "nwnnwnnnw", "Y": "wwnnwnnnn", "Z": "nwwnwnnnn", "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "*": "nwnnwnwnn",
        "$": "nwnwnwnnn", "/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn"
    ]

    /// Anchos (en módulos de 1 o 3) de barras y espacios alternados, con `*` al inicio y al final y un espacio angosto entre caracteres. Nulo si hay caracteres no válidos.
    static func modules(_ value: String) -> [(bar: Bool, width: Int)]? {
        let text = "*" + value.uppercased() + "*"
        var out: [(Bool, Int)] = []
        for (i, ch) in text.enumerated() {
            guard let pattern = patterns[ch] else { return nil }
            if i > 0 { out.append((false, 1)) }
            for (j, e) in pattern.enumerated() { out.append((j % 2 == 0, e == "w" ? 3 : 1)) }
        }
        return out.map { (bar: $0.0, width: $0.1) }
    }
}

private enum ZCCodeRender {
    static let context = CIContext()

    static func image(_ ci: CIImage?) -> UIImage? {
        guard let ci, let cg = context.createCGImage(ci, from: ci.extent) else { return nil }
        return UIImage(cgImage: cg)
    }

    static func qr(_ value: String) -> UIImage? {
        let f = CIFilter.qrCodeGenerator()
        f.message = Data(value.utf8)
        f.correctionLevel = "M"
        return image(f.outputImage)
    }

    static func code128(_ value: String) -> UIImage? {
        let f = CIFilter.code128BarcodeGenerator()
        f.message = Data(value.utf8)
        f.quietSpace = 0
        return image(f.outputImage)
    }
}

/// Código QR o de barras real, siempre negro sobre blanco (tokens `qr*`) con el número debajo. Decorativo: el pase que lo contiene lo anuncia.
public struct ZCCodeImage: View {
    @Environment(\.zcTheme) private var theme
    private let value: String
    private let format: ZCBarcode
    private let caption: String?

    /// `caption` es el texto bajo el código; por defecto, el mismo valor. `showsValue: false` lo oculta.
    public init(_ value: String, format: ZCBarcode, caption: String? = nil, showsValue: Bool = true) {
        self.value = value
        self.format = format
        self.caption = caption ?? (showsValue ? value : nil)
    }

    public var body: some View {
        let c = theme.colors
        VStack(spacing: ZCSpace.v1) {
            switch format {
            case .qr:
                if let img = ZCCodeRender.qr(value) { Image(uiImage: img).resizable().interpolation(.none).frame(width: 120, height: 120) }
            case .code128:
                if let img = ZCCodeRender.code128(value) { Image(uiImage: img).resizable().interpolation(.none).frame(maxWidth: 240).frame(height: 56) }
            case .code39:
                if let mods = ZCCode39.modules(value) {
                    let total = mods.reduce(0) { $0 + $1.width }
                    Canvas { ctx, size in
                        let unit = size.width / CGFloat(total)
                        var x: CGFloat = 0
                        for m in mods {
                            let w = CGFloat(m.width) * unit
                            if m.bar { ctx.fill(Path(CGRect(x: x, y: 0, width: w + 0.5, height: size.height)), with: .color(c.qrFg)) }
                            x += w
                        }
                    }
                    .frame(maxWidth: 240).frame(height: 56)
                }
            }
            if let caption {
                Text(caption).font(.zc(ZCType.tiny, theme: theme).weight(ZCWeight.medium)).tracking(0.9).foregroundStyle(c.qrFg)
            }
        }
        .padding(ZCSpace.v2)
        .background(c.qrBg, in: RoundedRectangle(cornerRadius: ZCRadius.sm, style: .continuous))
        .accessibilityHidden(true)
    }
}

// MARK: - Pase de puntos

/// Datos de un pase de fidelidad. Los colores del pase vienen de la marca del programa (no de los tokens del sistema).
public struct ZCLoyaltyPass {
    public let program: String
    public let member: String
    public let points: Int
    public let tier: String
    public let bg: Color
    public let fg: Color
    public let label: Color
    public let code: String
    public let art: Image?

    public init(program: String, member: String, points: Int, tier: String, bg: Color, fg: Color, label: Color, code: String, art: Image? = nil) {
        self.program = program
        self.member = member
        self.points = points
        self.tier = tier
        self.bg = bg
        self.fg = fg
        self.label = label
        self.code = code
        self.art = art
    }
}

private let passLabel = ZCTypeStyle(size: 10, lineHeight: 14, relativeTo: .caption)

/// Reverso de un pase: filas etiqueta y valor separadas (como el reverso de Apple o los "Detalles" de Google).
private struct ZCPassBack: View {
    @Environment(\.zcTheme) private var theme
    let os: ZCWalletOs
    let rows: [(String, String)]

    var body: some View {
        let c = theme.colors
        let shape = RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous)
        VStack(alignment: .leading, spacing: ZCSpace.v3) {
            HStack {
                Text(os == .apple ? (rows.first?.1 ?? "") : ZCString.text("mol.wallet.detalles")).font(.zc(ZCType.body, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(c.text)
                Spacer()
                if os == .apple { Text(ZCString.text("mol.wallet.listo")).font(.zc(ZCType.body, theme: theme)).underline().foregroundStyle(c.primary) }
            }
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                VStack(alignment: .leading, spacing: 0) {
                    ZCDivider()
                    VStack(alignment: .leading, spacing: 0) {
                        Text(row.0).font(.zc(ZCType.caption, theme: theme)).foregroundStyle(c.textMuted)
                        Text(row.1).font(.zc(ZCType.body, theme: theme)).foregroundStyle(c.text)
                    }
                    .padding(.vertical, ZCSpace.v2)
                }
            }
        }
        .padding(ZCSpace.v4)
        .background(c.surface, in: shape)
        .overlay(shape.stroke(c.border))
    }
}

/// Pase de puntos en Apple o Google Wallet: vista aproximada del pase real, ancho máximo 320 pt. VoiceOver lo lee como una imagen
/// ("Pase de Apple Wallet: …"). `back` muestra el reverso.
public struct ZCWalletPass: View {
    @Environment(\.zcTheme) private var theme
    private let pass: ZCLoyaltyPass
    private let os: ZCWalletOs
    private let country: String
    private let back: Bool

    public init(pass: ZCLoyaltyPass, os: ZCWalletOs = .apple, country: String = "pe", back: Bool = false) {
        self.pass = pass
        self.os = os
        self.country = country
        self.back = back
    }

    private func tag(_ text: String) -> some View {
        Text(text.uppercased()).font(.zc(passLabel, theme: theme).weight(ZCWeight.semibold)).tracking(0.6).foregroundStyle(pass.label)
    }

    private func initial(_ size: CGFloat, radius: CGFloat?) -> some View {
        let shape: AnyShape = radius.map { AnyShape(RoundedRectangle(cornerRadius: $0, style: .continuous)) } ?? AnyShape(Circle())
        return Text(String(pass.program.prefix(1))).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme).weight(ZCWeight.bold)).foregroundStyle(pass.bg)
            .frame(width: size, height: size).background(pass.fg, in: shape)
    }

    public var body: some View {
        let pts = NumberFormatter.localizedString(from: NSNumber(value: pass.points), number: .decimal)
        let worth = ZCMoney.format(Double(pass.points) / 100, country: country)
        let a11y = os == .apple ? ZCString.text("mol.wallet.ariaApple", pass.program, pts, pass.tier) : ZCString.text("mol.wallet.ariaGoogle", pass.program, pts)
        Group {
            if back {
                ZCPassBack(os: os, rows: [(ZCString.text("mol.wallet.programa"), pass.program), (ZCString.text("mol.wallet.comoUsar"), ZCString.text("mol.wallet.comoUsarTexto"))])
            } else if os == .apple {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: ZCSpace.v2) {
                        initial(28, radius: 8)
                        Text(pass.program).font(.zc(ZCType.body, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(pass.fg).frame(maxWidth: .infinity, alignment: .leading)
                        VStack(alignment: .trailing, spacing: 0) {
                            tag(ZCString.text("mol.wallet.nivel"))
                            Text(pass.tier).font(.zc(ZCType.body, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(pass.fg)
                        }
                    }
                    if let art = pass.art { art.resizable().scaledToFill().frame(maxWidth: .infinity).aspectRatio(3, contentMode: .fit).clipped().padding(.horizontal, -14) }
                    VStack(alignment: .leading, spacing: 0) {
                        tag(ZCString.text("mol.wallet.puntos"))
                        Text(pts).font(.zc(ZCTypeStyle(size: 30, lineHeight: 33, relativeTo: .largeTitle), theme: theme).weight(ZCWeight.semibold).zcTabular()).foregroundStyle(pass.fg)
                    }
                    HStack {
                        VStack(alignment: .leading, spacing: 0) { tag(ZCString.text("mol.wallet.miembro")); Text(pass.member).font(.zc(ZCType.body, theme: theme)).foregroundStyle(pass.fg) }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 0) { tag(ZCString.text("mol.wallet.equivale")); Text(worth).font(.zc(ZCType.body, theme: theme)).foregroundStyle(pass.fg) }
                    }
                    ZCCodeImage(pass.code, format: .qr).frame(maxWidth: .infinity)
                }
                .padding(14)
                .background(pass.bg, in: RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous))
                .clipShape(RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous))
                .shadow(color: .black.opacity(0.18), radius: 12, y: 4)
            } else {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: ZCSpace.v2) {
                        initial(32, radius: nil)
                        Text(pass.program).font(.zc(ZCType.body, theme: theme)).foregroundStyle(pass.fg)
                    }
                    Text(pass.member).font(.zc(ZCType.heading, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(pass.fg)
                    HStack(spacing: 24) {
                        VStack(alignment: .leading, spacing: 0) { Text(ZCString.text("mol.wallet.puntosG")).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(pass.fg.opacity(0.8)); Text(pts).font(.zc(ZCType.body, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(pass.fg) }
                        VStack(alignment: .leading, spacing: 0) { Text(ZCString.text("mol.wallet.nivelG")).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(pass.fg.opacity(0.8)); Text(pass.tier).font(.zc(ZCType.body, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(pass.fg) }
                    }
                    ZCCodeImage(pass.code, format: .qr).frame(maxWidth: .infinity)
                    if let art = pass.art { art.resizable().scaledToFill().frame(maxWidth: .infinity).aspectRatio(3, contentMode: .fit).clipped().padding(.horizontal, -16) }
                }
                .padding(ZCSpace.v4)
                .background(pass.bg, in: RoundedRectangle(cornerRadius: ZCRadius.lg, style: .continuous))
                .clipShape(RoundedRectangle(cornerRadius: ZCRadius.lg, style: .continuous))
            }
        }
        .frame(maxWidth: 320)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(a11y)
        .accessibilityAddTraits(.isImage)
    }
}

// MARK: - Giftcard en wallet

/// Datos de una giftcard en wallet. `expires` en ISO (`aaaa-mm-dd`); colores del emisor.
public struct ZCGiftcardData {
    public let issuer: String
    public let title: String
    public let balance: Double
    public let number: String
    public let pin: String?
    public let expires: String?
    public let barcode: ZCBarcode
    public let image: Image?
    public let bg: Color
    public let fg: Color
    public let label: Color
    public let terms: String?
    public let support: String?

    public init(issuer: String, title: String, balance: Double, number: String, pin: String? = nil, expires: String? = nil, barcode: ZCBarcode = .code128, image: Image? = nil, bg: Color, fg: Color, label: Color, terms: String? = nil, support: String? = nil) {
        self.issuer = issuer
        self.title = title
        self.balance = balance
        self.number = number
        self.pin = pin
        self.expires = expires
        self.barcode = barcode
        self.image = image
        self.bg = bg
        self.fg = fg
        self.label = label
        self.terms = terms
        self.support = support
    }
}

/// Giftcard en Apple o Google Wallet: saldo, número enmascarado (•••• 1234), vencimiento y código. En Apple el PIN solo va en el reverso y Code 39 se
/// muestra como QR con aviso. Debajo, siempre, la nota de vista aproximada.
public struct ZCGiftcardPass: View {
    @Environment(\.zcTheme) private var theme
    private let card: ZCGiftcardData
    private let country: String
    private let os: ZCWalletOs
    private let back: Bool

    public init(card: ZCGiftcardData, country: String, os: ZCWalletOs = .google, back: Bool = false) {
        self.card = card
        self.country = country
        self.os = os
        self.back = back
    }

    private func tag(_ text: String, _ color: Color) -> some View {
        Text(text.uppercased()).font(.zc(passLabel, theme: theme).weight(ZCWeight.semibold)).tracking(0.6).foregroundStyle(color)
    }

    public var body: some View {
        let c = theme.colors
        let balance = ZCMoney.format(card.balance, country: country)
        let masked = "•••• " + card.number.suffix(4)
        let expires = card.expires.flatMap { ZCDates.isIsoDate($0) ? ZCDates.formatDmy($0) : nil }
        let walletName = os == .apple ? "Apple Wallet" : "Google Wallet"
        let code: ZCBarcode = (os == .apple && card.barcode == .code39) ? .qr : card.barcode
        VStack(alignment: .leading, spacing: ZCSpace.v2) {
            Group {
                if back {
                    ZCPassBack(os: os, rows: backRows(expires))
                } else if os == .apple {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text(card.issuer).font(.zc(ZCType.body, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(card.fg).frame(maxWidth: .infinity, alignment: .leading)
                            tag(ZCString.text("mol.giftcard.saldo"), card.label)
                        }
                        ZStack(alignment: .bottomLeading) {
                            card.label.opacity(0.2)
                            if let image = card.image { image.resizable().scaledToFill() }
                            Text(balance).font(.zc(ZCTypeStyle(size: 30, lineHeight: 36, relativeTo: .largeTitle), theme: theme).zcTabular()).foregroundStyle(.white)
                                .shadow(color: .black.opacity(0.35), radius: 3, y: 1).padding(14)
                        }
                        .frame(maxWidth: .infinity).aspectRatio(375.0 / 144.0, contentMode: .fit).clipped().padding(.horizontal, -14)
                        HStack {
                            VStack(alignment: .leading, spacing: 0) { tag(ZCString.text("mol.giftcard.tarjeta"), card.label); Text(masked).font(.zc(ZCType.body, theme: theme)).foregroundStyle(card.fg) }
                            Spacer()
                            if let expires { VStack(alignment: .trailing, spacing: 0) { tag(ZCString.text("mol.giftcard.vence"), card.label); Text(expires).font(.zc(ZCType.body, theme: theme)).foregroundStyle(card.fg) } }
                        }
                        ZCCodeImage(card.number, format: code).frame(maxWidth: .infinity)
                    }
                    .padding(14)
                    .background(card.bg, in: RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous))
                    .clipShape(RoundedRectangle(cornerRadius: ZCRadius.md, style: .continuous))
                    .shadow(color: .black.opacity(0.18), radius: 12, y: 4)
                } else {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack(spacing: ZCSpace.v2) {
                            Text(String(card.issuer.prefix(1))).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme).weight(ZCWeight.bold)).foregroundStyle(card.bg)
                                .frame(width: 32, height: 32).background(card.fg, in: Circle())
                            Text(card.issuer).font(.zc(ZCType.body, theme: theme)).foregroundStyle(card.fg).lineLimit(1).frame(maxWidth: .infinity, alignment: .leading)
                            Text(balance).font(.zc(ZCType.body, theme: theme).weight(ZCWeight.bold)).foregroundStyle(card.fg)
                        }
                        .padding(.horizontal, ZCSpace.v4).padding(.top, ZCSpace.v4)
                        Text(card.title).font(.zc(ZCType.heading, theme: theme).weight(ZCWeight.semibold)).foregroundStyle(card.fg).padding(.horizontal, ZCSpace.v4)
                        if let image = card.image { image.resizable().scaledToFill().frame(maxWidth: .infinity).aspectRatio(5.0 / 4.0, contentMode: .fit).clipped() }
                        HStack(alignment: .top) {
                            if card.pin != nil { VStack(alignment: .leading, spacing: 0) { tag(ZCString.text("mol.giftcard.pin"), card.label); Text("••••").font(.zc(ZCType.body, theme: theme)).foregroundStyle(card.fg) } }
                            Spacer()
                            if let expires { VStack(alignment: .trailing, spacing: 0) { tag(ZCString.text("mol.giftcard.venceG"), card.label); Text(expires).font(.zc(ZCType.body, theme: theme)).foregroundStyle(card.fg) } }
                        }
                        .padding(.horizontal, ZCSpace.v4)
                        ZCCodeImage(card.number, format: code).frame(maxWidth: .infinity).padding(.horizontal, ZCSpace.v4)
                    }
                    .padding(.bottom, ZCSpace.v4)
                    .background(card.bg, in: RoundedRectangle(cornerRadius: ZCRadius.lg, style: .continuous))
                    .clipShape(RoundedRectangle(cornerRadius: ZCRadius.lg, style: .continuous))
                }
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(ZCString.text("mol.giftcard.aria", card.issuer, walletName, balance))
            .accessibilityAddTraits(.isImage)
            if os == .apple && card.barcode == .code39 && !back {
                Text(ZCString.text("mol.giftcard.respaldoApple")).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(c.textMuted)
            }
            Text(ZCString.text("mol.giftcard.aproximada")).font(.zc(ZCTypeStyle(size: 12, lineHeight: 16, relativeTo: .caption), theme: theme)).foregroundStyle(c.textMuted)
        }
        .frame(maxWidth: 320, alignment: .leading)
    }

    private func backRows(_ expires: String?) -> [(String, String)] {
        var rows: [(String, String)] = [(ZCString.text("mol.giftcard.tarjeta"), card.number)]
        if os == .apple, let pin = card.pin { rows.append((ZCString.text("mol.giftcard.pin"), pin)) }
        if let expires { rows.append((ZCString.text("mol.giftcard.venceG"), expires)) }
        rows.append((ZCString.text("mol.wallet.comoUsar"), ZCString.text("mol.giftcard.comoUsar")))
        if let terms = card.terms { rows.append((ZCString.text("mol.giftcard.terminos"), terms)) }
        if let support = card.support { rows.append((ZCString.text("mol.wallet.atencion"), support)) }
        return rows
    }
}
