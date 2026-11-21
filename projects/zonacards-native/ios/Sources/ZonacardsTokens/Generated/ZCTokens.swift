// Archivo generado por scripts/build-native.mjs. No editar a mano.
// @zonacards/ui 2.0.0
import SwiftUI

public struct ZCShadowLayer: Sendable { public let color: Color; public let x, y, blur, spread: CGFloat }

/// Paleta completa de un tema (marca × modo). Úsala desde el entorno: `@Environment(\.zcTheme)`.
public struct ZCColors: Sendable {
    public let accentBd: Color
    public let accentBg: Color
    public let accentFg: Color
    public let bg: Color
    public let border: Color
    public let borderStrong: Color
    public let brandAccent: Color
    public let brandPrimary: Color
    public let brandSecondary: Color
    public let brandWhatsapp: Color
    public let cameraBg: Color
    public let cameraBtn: Color
    public let cameraFg: Color
    public let cameraMask: Color
    public let chart1: Color
    public let chart2: Color
    public let chart3: Color
    public let chart4: Color
    public let chart5: Color
    public let chart6: Color
    public let codeBg: Color
    public let codeFg: Color
    public let codeKey: Color
    public let codeLiteral: Color
    public let codeMuted: Color
    public let codeNumber: Color
    public let codeString: Color
    public let dangerBd: Color
    public let dangerBg: Color
    public let dangerFg: Color
    public let deviceFrame: Color
    public let emailHover: Color
    public let emailInk: Color
    public let emailMuted: Color
    public let emailPaper: Color
    public let emailRule: Color
    public let emailSelected: Color
    public let emailText: Color
    public let fieldBd: Color
    public let fieldBg: Color
    public let focus: Color
    public let infoBd: Color
    public let infoBg: Color
    public let infoFg: Color
    public let lockFg: Color
    public let lockFrom: Color
    public let lockTo: Color
    public let mapLand: Color
    public let mapLine: Color
    public let mapScope: Color
    public let mapWater: Color
    public let mediaControlBg: Color
    public let mediaControlFg: Color
    public let mediaOverlayBg: Color
    public let mediaOverlayFg: Color
    public let neutral100: Color
    public let neutral200: Color
    public let neutral300: Color
    public let neutral400: Color
    public let neutral450: Color
    public let neutral50: Color
    public let neutral500: Color
    public let neutral600: Color
    public let neutral700: Color
    public let neutral800: Color
    public let neutral900: Color
    public let neutral950: Color
    public let neutralBd: Color
    public let neutralBg: Color
    public let neutralFg: Color
    public let onBrandAccent: Color
    public let onBrandWhatsapp: Color
    public let onPayPagoefectivo: Color
    public let onPayPlin: Color
    public let onPayPuntos: Color
    public let onPayYape: Color
    public let onPrimary: Color
    public let onSecondary: Color
    public let overlay: Color
    public let payPagoefectivo: Color
    public let payPlin: Color
    public let payPuntos: Color
    public let payYape: Color
    public let primary: Color
    public let pushBg: Color
    public let pushFg: Color
    public let pushMuted: Color
    public let qrBg: Color
    public let qrFg: Color
    public let rowSelectedBg: Color
    public let scrimStrong: Color
    public let secondary: Color
    public let sidebarActiveBg: Color
    public let sidebarBg: Color
    public let sidebarBorder: Color
    public let sidebarBrandActiveBg: Color
    public let sidebarBrandBg: Color
    public let sidebarBrandBorder: Color
    public let sidebarBrandFg: Color
    public let sidebarBrandFgActive: Color
    public let sidebarBrandHoverBg: Color
    public let sidebarFg: Color
    public let sidebarFgActive: Color
    public let sidebarHoverBg: Color
    public let sidebarTintBg: Color
    public let ssoAppleBlack: Color
    public let ssoAppleWhite: Color
    public let ssoGoogleDarkBd: Color
    public let ssoGoogleDarkBg: Color
    public let ssoGoogleDarkFg: Color
    public let ssoGoogleLightBd: Color
    public let ssoGoogleLightBg: Color
    public let ssoGoogleLightFg: Color
    public let ssoGoogleLightHover: Color
    public let ssoGoogleNeutralBg: Color
    public let ssoGoogleNeutralFg: Color
    public let ssoMsDarkBg: Color
    public let ssoMsLightBd: Color
    public let ssoMsLightFg: Color
    public let successBd: Color
    public let successBg: Color
    public let successFg: Color
    public let surface: Color
    public let surface2: Color
    public let surface3: Color
    public let text: Color
    public let textMuted: Color
    public let textSubtle: Color
    public let thumb: Color
    public let warningBd: Color
    public let warningBg: Color
    public let warningFg: Color
}

/// Forma y estilo de la marca: radios de control, tarjeta, hoja y botón, y alto de los campos. Se lee con theme.shape.
public struct ZCShape: Sendable { public let control, card, sheet, button, fieldH: CGFloat }

public struct ZCShadows: Sendable {
    public let hairline: [ZCShadowLayer]
    public let v1: [ZCShadowLayer]
    public let v2: [ZCShadowLayer]
    public let xs: [ZCShadowLayer]
}

public enum ZCBrand: String, CaseIterable, Sendable { case zonacards; case giftealo; case enjoy; case motiva }

public struct ZCTheme: Sendable {
    public let brand: ZCBrand
    public let isDark: Bool
    public let fontFamily: String
    public let colors: ZCColors
    public let shadows: ZCShadows
    public let shape: ZCShape

    public static func resolve(_ brand: ZCBrand, dark: Bool) -> ZCTheme {
        switch (brand, dark) {
        case (.zonacards, false): return .zonacardsLight
        case (.zonacards, true): return .zonacardsDark
        case (.giftealo, false): return .giftealoLight
        case (.giftealo, true): return .giftealoDark
        case (.enjoy, false): return .enjoyLight
        case (.enjoy, true): return .enjoyDark
        case (.motiva, false): return .motivaLight
        case (.motiva, true): return .motivaDark
        }
    }

    public static let zonacardsLight = ZCTheme(brand: .zonacards, isDark: false, fontFamily: "Figtree",
        colors: ZCColors(
            accentBd: Color(.sRGB, red: 0.8471, green: 0.7059, blue: 0.9961, opacity: 1),
            accentBg: Color(.sRGB, red: 0.9804, green: 0.9608, blue: 1, opacity: 1),
            accentFg: Color(.sRGB, red: 0.4941, green: 0.1333, blue: 0.8078, opacity: 1),
            bg: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            border: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            borderStrong: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            brandAccent: Color(.sRGB, red: 0.9725, green: 0.6824, blue: 0.1373, opacity: 1),
            brandPrimary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            brandSecondary: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            brandWhatsapp: Color(.sRGB, red: 0.1451, green: 0.8275, blue: 0.4, opacity: 1),
            cameraBg: Color(.sRGB, red: 0.0431, green: 0.0588, blue: 0.0902, opacity: 1),
            cameraBtn: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            cameraFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            cameraMask: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            chart1: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            chart2: Color(.sRGB, red: 0.9608, green: 0.6196, blue: 0.0431, opacity: 1),
            chart3: Color(.sRGB, red: 0.051, green: 0.5804, blue: 0.5333, opacity: 1),
            chart4: Color(.sRGB, red: 0.4863, green: 0.2275, blue: 0.9294, opacity: 1),
            chart5: Color(.sRGB, red: 0.8824, green: 0.1137, blue: 0.2824, opacity: 1),
            chart6: Color(.sRGB, red: 0.3922, green: 0.4549, blue: 0.5451, opacity: 1),
            codeBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            codeFg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            codeKey: Color(.sRGB, red: 0.1137, green: 0.3059, blue: 0.8471, opacity: 1),
            codeLiteral: Color(.sRGB, red: 0.4863, green: 0.2275, blue: 0.9294, opacity: 1),
            codeMuted: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            codeNumber: Color(.sRGB, red: 0.6314, green: 0.3843, blue: 0.0275, opacity: 1),
            codeString: Color(.sRGB, red: 0.0157, green: 0.4706, blue: 0.3412, opacity: 1),
            dangerBd: Color(.sRGB, red: 0.9882, green: 0.6471, blue: 0.6471, opacity: 1),
            dangerBg: Color(.sRGB, red: 0.9961, green: 0.949, blue: 0.949, opacity: 1),
            dangerFg: Color(.sRGB, red: 0.7255, green: 0.1098, blue: 0.1098, opacity: 1),
            deviceFrame: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailHover: Color(.sRGB, red: 0.7137, green: 0.7843, blue: 0.902, opacity: 1),
            emailInk: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailMuted: Color(.sRGB, red: 0.4, green: 0.4, blue: 0.4, opacity: 1),
            emailPaper: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            emailRule: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            emailSelected: Color(.sRGB, red: 0.1451, green: 0.3882, blue: 0.9216, opacity: 1),
            emailText: Color(.sRGB, red: 0.2, green: 0.2, blue: 0.2, opacity: 1),
            fieldBd: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            fieldBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            focus: Color(.sRGB, red: 0.1451, green: 0.3882, blue: 0.9216, opacity: 1),
            infoBd: Color(.sRGB, red: 0.5765, green: 0.7725, blue: 0.9922, opacity: 1),
            infoBg: Color(.sRGB, red: 0.9373, green: 0.9647, blue: 1, opacity: 1),
            infoFg: Color(.sRGB, red: 0.1137, green: 0.3059, blue: 0.8471, opacity: 1),
            lockFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            lockFrom: Color(.sRGB, red: 0.1176, green: 0.2275, blue: 0.5412, opacity: 1),
            lockTo: Color(.sRGB, red: 0.0549, green: 0.102, blue: 0.1882, opacity: 1),
            mapLand: Color(.sRGB, red: 0.9059, green: 0.898, blue: 0.8941, opacity: 1),
            mapLine: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            mapScope: Color(.sRGB, red: 0.7647, green: 0.8235, blue: 0.9255, opacity: 1),
            mapWater: Color(.sRGB, red: 0.9725, green: 0.9804, blue: 0.9882, opacity: 1),
            mediaControlBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.92),
            mediaControlFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            mediaOverlayBg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            mediaOverlayFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            neutral100: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            neutral200: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            neutral300: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            neutral400: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            neutral450: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            neutral50: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            neutral500: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            neutral600: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            neutral700: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            neutral800: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            neutral900: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            neutral950: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            neutralBd: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            neutralBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            neutralFg: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            onBrandAccent: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            onBrandWhatsapp: Color(.sRGB, red: 0, green: 0.2314, blue: 0.1059, opacity: 1),
            onPayPagoefectivo: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            onPayPlin: Color(.sRGB, red: 0.0431, green: 0.0863, blue: 0.149, opacity: 1),
            onPayPuntos: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPayYape: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPrimary: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onSecondary: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            overlay: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.45),
            payPagoefectivo: Color(.sRGB, red: 1, green: 0.8, blue: 0, opacity: 1),
            payPlin: Color(.sRGB, red: 0, green: 0.7098, blue: 0.8863, opacity: 1),
            payPuntos: Color(.sRGB, red: 0.7686, green: 0.0706, blue: 0.1882, opacity: 1),
            payYape: Color(.sRGB, red: 0.4549, green: 0.1333, blue: 0.5176, opacity: 1),
            primary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            pushBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.82),
            pushFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            pushMuted: Color(.sRGB, red: 0.3333, green: 0.3333, blue: 0.3333, opacity: 1),
            qrBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            qrFg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            rowSelectedBg: Color(.sRGB, red: 0.9569, green: 0.9765, blue: 1, opacity: 1),
            scrimStrong: Color(.sRGB, red: 0.0392, green: 0.0549, blue: 0.0863, opacity: 0.62),
            secondary: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            sidebarActiveBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            sidebarBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            sidebarBorder: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            sidebarBrandActiveBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.14),
            sidebarBrandBg: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            sidebarBrandBorder: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.1),
            sidebarBrandFg: Color(.sRGB, red: 0.7804, green: 0.8314, blue: 0.9255, opacity: 1),
            sidebarBrandFgActive: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            sidebarBrandHoverBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            sidebarFg: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            sidebarFgActive: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            sidebarHoverBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            sidebarTintBg: Color(.sRGB, red: 0.9255, green: 0.9294, blue: 0.9373, opacity: 1),
            ssoAppleBlack: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            ssoAppleWhite: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleDarkBd: Color(.sRGB, red: 0.5569, green: 0.5686, blue: 0.5608, opacity: 1),
            ssoGoogleDarkBg: Color(.sRGB, red: 0.0745, green: 0.0745, blue: 0.0784, opacity: 1),
            ssoGoogleDarkFg: Color(.sRGB, red: 0.8902, green: 0.8902, blue: 0.8902, opacity: 1),
            ssoGoogleLightBd: Color(.sRGB, red: 0.4549, green: 0.4667, blue: 0.4588, opacity: 1),
            ssoGoogleLightBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleLightFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoGoogleLightHover: Color(.sRGB, red: 0.9725, green: 0.9804, blue: 1, opacity: 1),
            ssoGoogleNeutralBg: Color(.sRGB, red: 0.949, green: 0.949, blue: 0.949, opacity: 1),
            ssoGoogleNeutralFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoMsDarkBg: Color(.sRGB, red: 0.1843, green: 0.1843, blue: 0.1843, opacity: 1),
            ssoMsLightBd: Color(.sRGB, red: 0.549, green: 0.549, blue: 0.549, opacity: 1),
            ssoMsLightFg: Color(.sRGB, red: 0.3686, green: 0.3686, blue: 0.3686, opacity: 1),
            successBd: Color(.sRGB, red: 0.5255, green: 0.9373, blue: 0.6745, opacity: 1),
            successBg: Color(.sRGB, red: 0.9412, green: 0.9922, blue: 0.9569, opacity: 1),
            successFg: Color(.sRGB, red: 0.0824, green: 0.502, blue: 0.2392, opacity: 1),
            surface: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            surface2: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            surface3: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            text: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            textMuted: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            textSubtle: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            thumb: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            warningBd: Color(.sRGB, red: 0.9882, green: 0.8275, blue: 0.302, opacity: 1),
            warningBg: Color(.sRGB, red: 1, green: 0.9843, blue: 0.9216, opacity: 1),
            warningFg: Color(.sRGB, red: 0.7059, green: 0.3255, blue: 0.0353, opacity: 1)
        ),
        shadows: ZCShadows(
            hairline: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.08), x: 0, y: 0, blur: 0, spread: 1)],
            v1: [ZCShadowLayer(color: Color(.sRGB, red: 0.0627, green: 0.0941, blue: 0.1569, opacity: 0.04), x: 0, y: 1, blur: 2, spread: 0), ZCShadowLayer(color: Color(.sRGB, red: 0.4118, green: 0.4235, blue: 0.502, opacity: 0.06), x: 0, y: 8, blur: 24, spread: 0)],
            v2: [ZCShadowLayer(color: Color(.sRGB, red: 0.0588, green: 0.0902, blue: 0.1647, opacity: 0.16), x: 0, y: 24, blur: 48, spread: 0)],
            xs: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.1), x: 0, y: 1, blur: 2, spread: 0)]
        ),
        shape: ZCShape(control: 8, card: 16, sheet: 24, button: 9999, fieldH: 56))

    public static let zonacardsDark = ZCTheme(brand: .zonacards, isDark: true, fontFamily: "Figtree",
        colors: ZCColors(
            accentBd: Color(.sRGB, red: 0.7529, green: 0.5176, blue: 0.9882, opacity: 0.4),
            accentBg: Color(.sRGB, red: 0.6588, green: 0.3333, blue: 0.9686, opacity: 0.15),
            accentFg: Color(.sRGB, red: 0.7529, green: 0.5176, blue: 0.9882, opacity: 1),
            bg: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            border: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            borderStrong: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            brandAccent: Color(.sRGB, red: 0.9725, green: 0.6824, blue: 0.1373, opacity: 1),
            brandPrimary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            brandSecondary: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            brandWhatsapp: Color(.sRGB, red: 0.1451, green: 0.8275, blue: 0.4, opacity: 1),
            cameraBg: Color(.sRGB, red: 0.0431, green: 0.0588, blue: 0.0902, opacity: 1),
            cameraBtn: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            cameraFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            cameraMask: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            chart1: Color(.sRGB, red: 0.5765, green: 0.7059, blue: 0.9255, opacity: 1),
            chart2: Color(.sRGB, red: 0.9843, green: 0.749, blue: 0.1412, opacity: 1),
            chart3: Color(.sRGB, red: 0.1765, green: 0.8314, blue: 0.749, opacity: 1),
            chart4: Color(.sRGB, red: 0.6549, green: 0.5451, blue: 0.9804, opacity: 1),
            chart5: Color(.sRGB, red: 0.9843, green: 0.4431, blue: 0.5216, opacity: 1),
            chart6: Color(.sRGB, red: 0.5804, green: 0.6392, blue: 0.7216, opacity: 1),
            codeBg: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            codeFg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            codeKey: Color(.sRGB, red: 0.5765, green: 0.7725, blue: 0.9922, opacity: 1),
            codeLiteral: Color(.sRGB, red: 0.7686, green: 0.7098, blue: 0.9922, opacity: 1),
            codeMuted: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            codeNumber: Color(.sRGB, red: 0.9882, green: 0.8275, blue: 0.302, opacity: 1),
            codeString: Color(.sRGB, red: 0.4314, green: 0.9059, blue: 0.7176, opacity: 1),
            dangerBd: Color(.sRGB, red: 0.9725, green: 0.4431, blue: 0.4431, opacity: 0.4),
            dangerBg: Color(.sRGB, red: 0.9373, green: 0.2667, blue: 0.2667, opacity: 0.15),
            dangerFg: Color(.sRGB, red: 0.9725, green: 0.4431, blue: 0.4431, opacity: 1),
            deviceFrame: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailHover: Color(.sRGB, red: 0.7137, green: 0.7843, blue: 0.902, opacity: 1),
            emailInk: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailMuted: Color(.sRGB, red: 0.4, green: 0.4, blue: 0.4, opacity: 1),
            emailPaper: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            emailRule: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            emailSelected: Color(.sRGB, red: 0.1451, green: 0.3882, blue: 0.9216, opacity: 1),
            emailText: Color(.sRGB, red: 0.2, green: 0.2, blue: 0.2, opacity: 1),
            fieldBd: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            fieldBg: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            focus: Color(.sRGB, red: 0.3765, green: 0.6471, blue: 0.9804, opacity: 1),
            infoBd: Color(.sRGB, red: 0.3765, green: 0.6471, blue: 0.9804, opacity: 0.4),
            infoBg: Color(.sRGB, red: 0.2314, green: 0.5098, blue: 0.9647, opacity: 0.15),
            infoFg: Color(.sRGB, red: 0.3765, green: 0.6471, blue: 0.9804, opacity: 1),
            lockFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            lockFrom: Color(.sRGB, red: 0.1176, green: 0.2275, blue: 0.5412, opacity: 1),
            lockTo: Color(.sRGB, red: 0.0549, green: 0.102, blue: 0.1882, opacity: 1),
            mapLand: Color(.sRGB, red: 0.1686, green: 0.1686, blue: 0.1686, opacity: 1),
            mapLine: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            mapScope: Color(.sRGB, red: 0.1765, green: 0.251, blue: 0.4, opacity: 1),
            mapWater: Color(.sRGB, red: 0.0784, green: 0.0784, blue: 0.0784, opacity: 1),
            mediaControlBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.92),
            mediaControlFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            mediaOverlayBg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            mediaOverlayFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            neutral100: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            neutral200: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            neutral300: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            neutral400: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            neutral450: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            neutral50: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            neutral500: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            neutral600: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            neutral700: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            neutral800: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            neutral900: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            neutral950: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            neutralBd: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            neutralBg: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            neutralFg: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            onBrandAccent: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            onBrandWhatsapp: Color(.sRGB, red: 0, green: 0.2314, blue: 0.1059, opacity: 1),
            onPayPagoefectivo: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            onPayPlin: Color(.sRGB, red: 0.0431, green: 0.0863, blue: 0.149, opacity: 1),
            onPayPuntos: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPayYape: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPrimary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            onSecondary: Color(.sRGB, red: 0.0431, green: 0.0706, blue: 0.1255, opacity: 1),
            overlay: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.6),
            payPagoefectivo: Color(.sRGB, red: 1, green: 0.8, blue: 0, opacity: 1),
            payPlin: Color(.sRGB, red: 0, green: 0.7098, blue: 0.8863, opacity: 1),
            payPuntos: Color(.sRGB, red: 0.7686, green: 0.0706, blue: 0.1882, opacity: 1),
            payYape: Color(.sRGB, red: 0.4549, green: 0.1333, blue: 0.5176, opacity: 1),
            primary: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            pushBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.82),
            pushFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            pushMuted: Color(.sRGB, red: 0.3333, green: 0.3333, blue: 0.3333, opacity: 1),
            qrBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            qrFg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            rowSelectedBg: Color(.sRGB, red: 0.9569, green: 0.9765, blue: 1, opacity: 1),
            scrimStrong: Color(.sRGB, red: 0.0392, green: 0.0549, blue: 0.0863, opacity: 0.62),
            secondary: Color(.sRGB, red: 0.7804, green: 0.8314, blue: 0.9255, opacity: 1),
            sidebarActiveBg: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            sidebarBg: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            sidebarBorder: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            sidebarBrandActiveBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.14),
            sidebarBrandBg: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            sidebarBrandBorder: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.1),
            sidebarBrandFg: Color(.sRGB, red: 0.7804, green: 0.8314, blue: 0.9255, opacity: 1),
            sidebarBrandFgActive: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            sidebarBrandHoverBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            sidebarFg: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            sidebarFgActive: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            sidebarHoverBg: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            sidebarTintBg: Color(.sRGB, red: 0.9255, green: 0.9294, blue: 0.9373, opacity: 1),
            ssoAppleBlack: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            ssoAppleWhite: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleDarkBd: Color(.sRGB, red: 0.5569, green: 0.5686, blue: 0.5608, opacity: 1),
            ssoGoogleDarkBg: Color(.sRGB, red: 0.0745, green: 0.0745, blue: 0.0784, opacity: 1),
            ssoGoogleDarkFg: Color(.sRGB, red: 0.8902, green: 0.8902, blue: 0.8902, opacity: 1),
            ssoGoogleLightBd: Color(.sRGB, red: 0.4549, green: 0.4667, blue: 0.4588, opacity: 1),
            ssoGoogleLightBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleLightFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoGoogleLightHover: Color(.sRGB, red: 0.9725, green: 0.9804, blue: 1, opacity: 1),
            ssoGoogleNeutralBg: Color(.sRGB, red: 0.949, green: 0.949, blue: 0.949, opacity: 1),
            ssoGoogleNeutralFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoMsDarkBg: Color(.sRGB, red: 0.1843, green: 0.1843, blue: 0.1843, opacity: 1),
            ssoMsLightBd: Color(.sRGB, red: 0.549, green: 0.549, blue: 0.549, opacity: 1),
            ssoMsLightFg: Color(.sRGB, red: 0.3686, green: 0.3686, blue: 0.3686, opacity: 1),
            successBd: Color(.sRGB, red: 0.2902, green: 0.8706, blue: 0.502, opacity: 0.4),
            successBg: Color(.sRGB, red: 0.1333, green: 0.7725, blue: 0.3686, opacity: 0.15),
            successFg: Color(.sRGB, red: 0.2902, green: 0.8706, blue: 0.502, opacity: 1),
            surface: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            surface2: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            surface3: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            text: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            textMuted: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            textSubtle: Color(.sRGB, red: 0.5843, green: 0.5843, blue: 0.5843, opacity: 1),
            thumb: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            warningBd: Color(.sRGB, red: 0.9843, green: 0.749, blue: 0.1412, opacity: 0.4),
            warningBg: Color(.sRGB, red: 0.9608, green: 0.6196, blue: 0.0431, opacity: 0.15),
            warningFg: Color(.sRGB, red: 0.9843, green: 0.749, blue: 0.1412, opacity: 1)
        ),
        shadows: ZCShadows(
            hairline: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.08), x: 0, y: 0, blur: 0, spread: 1)],
            v1: [],
            v2: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.5), x: 0, y: 24, blur: 48, spread: 0)],
            xs: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.1), x: 0, y: 1, blur: 2, spread: 0)]
        ),
        shape: ZCShape(control: 8, card: 16, sheet: 24, button: 9999, fieldH: 56))

    public static let giftealoLight = ZCTheme(brand: .giftealo, isDark: false, fontFamily: "Lato",
        colors: ZCColors(
            accentBd: Color(.sRGB, red: 0.8471, green: 0.7059, blue: 0.9961, opacity: 1),
            accentBg: Color(.sRGB, red: 0.9804, green: 0.9608, blue: 1, opacity: 1),
            accentFg: Color(.sRGB, red: 0.4941, green: 0.1333, blue: 0.8078, opacity: 1),
            bg: Color(.sRGB, red: 0.9608, green: 0.9725, blue: 0.9882, opacity: 1),
            border: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            borderStrong: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            brandAccent: Color(.sRGB, red: 0, green: 0.6196, blue: 0.8706, opacity: 1),
            brandPrimary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            brandSecondary: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            brandWhatsapp: Color(.sRGB, red: 0.1451, green: 0.8275, blue: 0.4, opacity: 1),
            cameraBg: Color(.sRGB, red: 0.0431, green: 0.0588, blue: 0.0902, opacity: 1),
            cameraBtn: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            cameraFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            cameraMask: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            chart1: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            chart2: Color(.sRGB, red: 0, green: 0.6196, blue: 0.8706, opacity: 1),
            chart3: Color(.sRGB, red: 0.051, green: 0.5804, blue: 0.5333, opacity: 1),
            chart4: Color(.sRGB, red: 0.4863, green: 0.2275, blue: 0.9294, opacity: 1),
            chart5: Color(.sRGB, red: 0.8824, green: 0.1137, blue: 0.2824, opacity: 1),
            chart6: Color(.sRGB, red: 0.3922, green: 0.4549, blue: 0.5451, opacity: 1),
            codeBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            codeFg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            codeKey: Color(.sRGB, red: 0.1137, green: 0.3059, blue: 0.8471, opacity: 1),
            codeLiteral: Color(.sRGB, red: 0.4863, green: 0.2275, blue: 0.9294, opacity: 1),
            codeMuted: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            codeNumber: Color(.sRGB, red: 0.6314, green: 0.3843, blue: 0.0275, opacity: 1),
            codeString: Color(.sRGB, red: 0.0157, green: 0.4706, blue: 0.3412, opacity: 1),
            dangerBd: Color(.sRGB, red: 0.9882, green: 0.6471, blue: 0.6471, opacity: 1),
            dangerBg: Color(.sRGB, red: 0.9961, green: 0.949, blue: 0.949, opacity: 1),
            dangerFg: Color(.sRGB, red: 0.7255, green: 0.1098, blue: 0.1098, opacity: 1),
            deviceFrame: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailHover: Color(.sRGB, red: 0.7137, green: 0.7843, blue: 0.902, opacity: 1),
            emailInk: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailMuted: Color(.sRGB, red: 0.4, green: 0.4, blue: 0.4, opacity: 1),
            emailPaper: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            emailRule: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            emailSelected: Color(.sRGB, red: 0.1451, green: 0.3882, blue: 0.9216, opacity: 1),
            emailText: Color(.sRGB, red: 0.2, green: 0.2, blue: 0.2, opacity: 1),
            fieldBd: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            fieldBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            focus: Color(.sRGB, red: 0, green: 0.4667, blue: 0.6588, opacity: 1),
            infoBd: Color(.sRGB, red: 0.5765, green: 0.7725, blue: 0.9922, opacity: 1),
            infoBg: Color(.sRGB, red: 0.9373, green: 0.9647, blue: 1, opacity: 1),
            infoFg: Color(.sRGB, red: 0.1137, green: 0.3059, blue: 0.8471, opacity: 1),
            lockFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            lockFrom: Color(.sRGB, red: 0.1176, green: 0.2275, blue: 0.5412, opacity: 1),
            lockTo: Color(.sRGB, red: 0.0549, green: 0.102, blue: 0.1882, opacity: 1),
            mapLand: Color(.sRGB, red: 0.9059, green: 0.898, blue: 0.8941, opacity: 1),
            mapLine: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            mapScope: Color(.sRGB, red: 0.7647, green: 0.8235, blue: 0.9255, opacity: 1),
            mapWater: Color(.sRGB, red: 0.9725, green: 0.9804, blue: 0.9882, opacity: 1),
            mediaControlBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.92),
            mediaControlFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            mediaOverlayBg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            mediaOverlayFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            neutral100: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            neutral200: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            neutral300: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            neutral400: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            neutral450: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            neutral50: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            neutral500: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            neutral600: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            neutral700: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            neutral800: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            neutral900: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            neutral950: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            neutralBd: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            neutralBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            neutralFg: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            onBrandAccent: Color(.sRGB, red: 0.0431, green: 0.0863, blue: 0.149, opacity: 1),
            onBrandWhatsapp: Color(.sRGB, red: 0, green: 0.2314, blue: 0.1059, opacity: 1),
            onPayPagoefectivo: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            onPayPlin: Color(.sRGB, red: 0.0431, green: 0.0863, blue: 0.149, opacity: 1),
            onPayPuntos: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPayYape: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPrimary: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onSecondary: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            overlay: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.45),
            payPagoefectivo: Color(.sRGB, red: 1, green: 0.8, blue: 0, opacity: 1),
            payPlin: Color(.sRGB, red: 0, green: 0.7098, blue: 0.8863, opacity: 1),
            payPuntos: Color(.sRGB, red: 0.7686, green: 0.0706, blue: 0.1882, opacity: 1),
            payYape: Color(.sRGB, red: 0.4549, green: 0.1333, blue: 0.5176, opacity: 1),
            primary: Color(.sRGB, red: 0, green: 0.4667, blue: 0.6588, opacity: 1),
            pushBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.82),
            pushFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            pushMuted: Color(.sRGB, red: 0.3333, green: 0.3333, blue: 0.3333, opacity: 1),
            qrBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            qrFg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            rowSelectedBg: Color(.sRGB, red: 0.9569, green: 0.9765, blue: 1, opacity: 1),
            scrimStrong: Color(.sRGB, red: 0.0392, green: 0.0549, blue: 0.0863, opacity: 0.62),
            secondary: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            sidebarActiveBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            sidebarBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            sidebarBorder: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            sidebarBrandActiveBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.14),
            sidebarBrandBg: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            sidebarBrandBorder: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.1),
            sidebarBrandFg: Color(.sRGB, red: 0.7804, green: 0.8314, blue: 0.9255, opacity: 1),
            sidebarBrandFgActive: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            sidebarBrandHoverBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            sidebarFg: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            sidebarFgActive: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            sidebarHoverBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            sidebarTintBg: Color(.sRGB, red: 0.9255, green: 0.9294, blue: 0.9373, opacity: 1),
            ssoAppleBlack: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            ssoAppleWhite: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleDarkBd: Color(.sRGB, red: 0.5569, green: 0.5686, blue: 0.5608, opacity: 1),
            ssoGoogleDarkBg: Color(.sRGB, red: 0.0745, green: 0.0745, blue: 0.0784, opacity: 1),
            ssoGoogleDarkFg: Color(.sRGB, red: 0.8902, green: 0.8902, blue: 0.8902, opacity: 1),
            ssoGoogleLightBd: Color(.sRGB, red: 0.4549, green: 0.4667, blue: 0.4588, opacity: 1),
            ssoGoogleLightBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleLightFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoGoogleLightHover: Color(.sRGB, red: 0.9725, green: 0.9804, blue: 1, opacity: 1),
            ssoGoogleNeutralBg: Color(.sRGB, red: 0.949, green: 0.949, blue: 0.949, opacity: 1),
            ssoGoogleNeutralFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoMsDarkBg: Color(.sRGB, red: 0.1843, green: 0.1843, blue: 0.1843, opacity: 1),
            ssoMsLightBd: Color(.sRGB, red: 0.549, green: 0.549, blue: 0.549, opacity: 1),
            ssoMsLightFg: Color(.sRGB, red: 0.3686, green: 0.3686, blue: 0.3686, opacity: 1),
            successBd: Color(.sRGB, red: 0.5255, green: 0.9373, blue: 0.6745, opacity: 1),
            successBg: Color(.sRGB, red: 0.9412, green: 0.9922, blue: 0.9569, opacity: 1),
            successFg: Color(.sRGB, red: 0.0824, green: 0.502, blue: 0.2392, opacity: 1),
            surface: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            surface2: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            surface3: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            text: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            textMuted: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            textSubtle: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            thumb: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            warningBd: Color(.sRGB, red: 0.9882, green: 0.8275, blue: 0.302, opacity: 1),
            warningBg: Color(.sRGB, red: 1, green: 0.9843, blue: 0.9216, opacity: 1),
            warningFg: Color(.sRGB, red: 0.7059, green: 0.3255, blue: 0.0353, opacity: 1)
        ),
        shadows: ZCShadows(
            hairline: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.08), x: 0, y: 0, blur: 0, spread: 1)],
            v1: [ZCShadowLayer(color: Color(.sRGB, red: 0.0627, green: 0.0941, blue: 0.1569, opacity: 0.04), x: 0, y: 1, blur: 2, spread: 0), ZCShadowLayer(color: Color(.sRGB, red: 0.4118, green: 0.4235, blue: 0.502, opacity: 0.06), x: 0, y: 8, blur: 24, spread: 0)],
            v2: [ZCShadowLayer(color: Color(.sRGB, red: 0.0588, green: 0.0902, blue: 0.1647, opacity: 0.16), x: 0, y: 24, blur: 48, spread: 0)],
            xs: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.1), x: 0, y: 1, blur: 2, spread: 0)]
        ),
        shape: ZCShape(control: 8, card: 16, sheet: 24, button: 9999, fieldH: 56))

    public static let giftealoDark = ZCTheme(brand: .giftealo, isDark: true, fontFamily: "Lato",
        colors: ZCColors(
            accentBd: Color(.sRGB, red: 0.7529, green: 0.5176, blue: 0.9882, opacity: 0.4),
            accentBg: Color(.sRGB, red: 0.6588, green: 0.3333, blue: 0.9686, opacity: 0.15),
            accentFg: Color(.sRGB, red: 0.7529, green: 0.5176, blue: 0.9882, opacity: 1),
            bg: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            border: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            borderStrong: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            brandAccent: Color(.sRGB, red: 0, green: 0.6196, blue: 0.8706, opacity: 1),
            brandPrimary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            brandSecondary: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            brandWhatsapp: Color(.sRGB, red: 0.1451, green: 0.8275, blue: 0.4, opacity: 1),
            cameraBg: Color(.sRGB, red: 0.0431, green: 0.0588, blue: 0.0902, opacity: 1),
            cameraBtn: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            cameraFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            cameraMask: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            chart1: Color(.sRGB, red: 0.5765, green: 0.7059, blue: 0.9255, opacity: 1),
            chart2: Color(.sRGB, red: 0.9843, green: 0.749, blue: 0.1412, opacity: 1),
            chart3: Color(.sRGB, red: 0.1765, green: 0.8314, blue: 0.749, opacity: 1),
            chart4: Color(.sRGB, red: 0.6549, green: 0.5451, blue: 0.9804, opacity: 1),
            chart5: Color(.sRGB, red: 0.9843, green: 0.4431, blue: 0.5216, opacity: 1),
            chart6: Color(.sRGB, red: 0.5804, green: 0.6392, blue: 0.7216, opacity: 1),
            codeBg: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            codeFg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            codeKey: Color(.sRGB, red: 0.5765, green: 0.7725, blue: 0.9922, opacity: 1),
            codeLiteral: Color(.sRGB, red: 0.7686, green: 0.7098, blue: 0.9922, opacity: 1),
            codeMuted: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            codeNumber: Color(.sRGB, red: 0.9882, green: 0.8275, blue: 0.302, opacity: 1),
            codeString: Color(.sRGB, red: 0.4314, green: 0.9059, blue: 0.7176, opacity: 1),
            dangerBd: Color(.sRGB, red: 0.9725, green: 0.4431, blue: 0.4431, opacity: 0.4),
            dangerBg: Color(.sRGB, red: 0.9373, green: 0.2667, blue: 0.2667, opacity: 0.15),
            dangerFg: Color(.sRGB, red: 0.9725, green: 0.4431, blue: 0.4431, opacity: 1),
            deviceFrame: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailHover: Color(.sRGB, red: 0.7137, green: 0.7843, blue: 0.902, opacity: 1),
            emailInk: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailMuted: Color(.sRGB, red: 0.4, green: 0.4, blue: 0.4, opacity: 1),
            emailPaper: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            emailRule: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            emailSelected: Color(.sRGB, red: 0.1451, green: 0.3882, blue: 0.9216, opacity: 1),
            emailText: Color(.sRGB, red: 0.2, green: 0.2, blue: 0.2, opacity: 1),
            fieldBd: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            fieldBg: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            focus: Color(.sRGB, red: 0.3765, green: 0.6471, blue: 0.9804, opacity: 1),
            infoBd: Color(.sRGB, red: 0.3765, green: 0.6471, blue: 0.9804, opacity: 0.4),
            infoBg: Color(.sRGB, red: 0.2314, green: 0.5098, blue: 0.9647, opacity: 0.15),
            infoFg: Color(.sRGB, red: 0.3765, green: 0.6471, blue: 0.9804, opacity: 1),
            lockFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            lockFrom: Color(.sRGB, red: 0.1176, green: 0.2275, blue: 0.5412, opacity: 1),
            lockTo: Color(.sRGB, red: 0.0549, green: 0.102, blue: 0.1882, opacity: 1),
            mapLand: Color(.sRGB, red: 0.1686, green: 0.1686, blue: 0.1686, opacity: 1),
            mapLine: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            mapScope: Color(.sRGB, red: 0.1765, green: 0.251, blue: 0.4, opacity: 1),
            mapWater: Color(.sRGB, red: 0.0784, green: 0.0784, blue: 0.0784, opacity: 1),
            mediaControlBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.92),
            mediaControlFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            mediaOverlayBg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            mediaOverlayFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            neutral100: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            neutral200: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            neutral300: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            neutral400: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            neutral450: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            neutral50: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            neutral500: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            neutral600: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            neutral700: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            neutral800: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            neutral900: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            neutral950: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            neutralBd: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            neutralBg: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            neutralFg: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            onBrandAccent: Color(.sRGB, red: 0.0431, green: 0.0863, blue: 0.149, opacity: 1),
            onBrandWhatsapp: Color(.sRGB, red: 0, green: 0.2314, blue: 0.1059, opacity: 1),
            onPayPagoefectivo: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            onPayPlin: Color(.sRGB, red: 0.0431, green: 0.0863, blue: 0.149, opacity: 1),
            onPayPuntos: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPayYape: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPrimary: Color(.sRGB, red: 0.0431, green: 0.0863, blue: 0.149, opacity: 1),
            onSecondary: Color(.sRGB, red: 0.0431, green: 0.0706, blue: 0.1255, opacity: 1),
            overlay: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.6),
            payPagoefectivo: Color(.sRGB, red: 1, green: 0.8, blue: 0, opacity: 1),
            payPlin: Color(.sRGB, red: 0, green: 0.7098, blue: 0.8863, opacity: 1),
            payPuntos: Color(.sRGB, red: 0.7686, green: 0.0706, blue: 0.1882, opacity: 1),
            payYape: Color(.sRGB, red: 0.4549, green: 0.1333, blue: 0.5176, opacity: 1),
            primary: Color(.sRGB, red: 0.298, green: 0.7647, blue: 0.9412, opacity: 1),
            pushBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.82),
            pushFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            pushMuted: Color(.sRGB, red: 0.3333, green: 0.3333, blue: 0.3333, opacity: 1),
            qrBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            qrFg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            rowSelectedBg: Color(.sRGB, red: 0.9569, green: 0.9765, blue: 1, opacity: 1),
            scrimStrong: Color(.sRGB, red: 0.0392, green: 0.0549, blue: 0.0863, opacity: 0.62),
            secondary: Color(.sRGB, red: 0.7294, green: 0.9059, blue: 1, opacity: 1),
            sidebarActiveBg: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            sidebarBg: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            sidebarBorder: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            sidebarBrandActiveBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.14),
            sidebarBrandBg: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            sidebarBrandBorder: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.1),
            sidebarBrandFg: Color(.sRGB, red: 0.7804, green: 0.8314, blue: 0.9255, opacity: 1),
            sidebarBrandFgActive: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            sidebarBrandHoverBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            sidebarFg: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            sidebarFgActive: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            sidebarHoverBg: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            sidebarTintBg: Color(.sRGB, red: 0.9255, green: 0.9294, blue: 0.9373, opacity: 1),
            ssoAppleBlack: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            ssoAppleWhite: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleDarkBd: Color(.sRGB, red: 0.5569, green: 0.5686, blue: 0.5608, opacity: 1),
            ssoGoogleDarkBg: Color(.sRGB, red: 0.0745, green: 0.0745, blue: 0.0784, opacity: 1),
            ssoGoogleDarkFg: Color(.sRGB, red: 0.8902, green: 0.8902, blue: 0.8902, opacity: 1),
            ssoGoogleLightBd: Color(.sRGB, red: 0.4549, green: 0.4667, blue: 0.4588, opacity: 1),
            ssoGoogleLightBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleLightFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoGoogleLightHover: Color(.sRGB, red: 0.9725, green: 0.9804, blue: 1, opacity: 1),
            ssoGoogleNeutralBg: Color(.sRGB, red: 0.949, green: 0.949, blue: 0.949, opacity: 1),
            ssoGoogleNeutralFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoMsDarkBg: Color(.sRGB, red: 0.1843, green: 0.1843, blue: 0.1843, opacity: 1),
            ssoMsLightBd: Color(.sRGB, red: 0.549, green: 0.549, blue: 0.549, opacity: 1),
            ssoMsLightFg: Color(.sRGB, red: 0.3686, green: 0.3686, blue: 0.3686, opacity: 1),
            successBd: Color(.sRGB, red: 0.2902, green: 0.8706, blue: 0.502, opacity: 0.4),
            successBg: Color(.sRGB, red: 0.1333, green: 0.7725, blue: 0.3686, opacity: 0.15),
            successFg: Color(.sRGB, red: 0.2902, green: 0.8706, blue: 0.502, opacity: 1),
            surface: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            surface2: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            surface3: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            text: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            textMuted: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            textSubtle: Color(.sRGB, red: 0.5843, green: 0.5843, blue: 0.5843, opacity: 1),
            thumb: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            warningBd: Color(.sRGB, red: 0.9843, green: 0.749, blue: 0.1412, opacity: 0.4),
            warningBg: Color(.sRGB, red: 0.9608, green: 0.6196, blue: 0.0431, opacity: 0.15),
            warningFg: Color(.sRGB, red: 0.9843, green: 0.749, blue: 0.1412, opacity: 1)
        ),
        shadows: ZCShadows(
            hairline: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.08), x: 0, y: 0, blur: 0, spread: 1)],
            v1: [],
            v2: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.5), x: 0, y: 24, blur: 48, spread: 0)],
            xs: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.1), x: 0, y: 1, blur: 2, spread: 0)]
        ),
        shape: ZCShape(control: 8, card: 16, sheet: 24, button: 9999, fieldH: 56))

    public static let enjoyLight = ZCTheme(brand: .enjoy, isDark: false, fontFamily: "Outfit",
        colors: ZCColors(
            accentBd: Color(.sRGB, red: 0.8471, green: 0.7059, blue: 0.9961, opacity: 1),
            accentBg: Color(.sRGB, red: 0.9804, green: 0.9608, blue: 1, opacity: 1),
            accentFg: Color(.sRGB, red: 0.4941, green: 0.1333, blue: 0.8078, opacity: 1),
            bg: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            border: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            borderStrong: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            brandAccent: Color(.sRGB, red: 0.9725, green: 0.6824, blue: 0.1373, opacity: 1),
            brandPrimary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            brandSecondary: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            brandWhatsapp: Color(.sRGB, red: 0.1451, green: 0.8275, blue: 0.4, opacity: 1),
            cameraBg: Color(.sRGB, red: 0.0431, green: 0.0588, blue: 0.0902, opacity: 1),
            cameraBtn: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            cameraFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            cameraMask: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            chart1: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            chart2: Color(.sRGB, red: 0.9608, green: 0.6196, blue: 0.0431, opacity: 1),
            chart3: Color(.sRGB, red: 0.051, green: 0.5804, blue: 0.5333, opacity: 1),
            chart4: Color(.sRGB, red: 0.4863, green: 0.2275, blue: 0.9294, opacity: 1),
            chart5: Color(.sRGB, red: 0.8824, green: 0.1137, blue: 0.2824, opacity: 1),
            chart6: Color(.sRGB, red: 0.3922, green: 0.4549, blue: 0.5451, opacity: 1),
            codeBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            codeFg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            codeKey: Color(.sRGB, red: 0.1137, green: 0.3059, blue: 0.8471, opacity: 1),
            codeLiteral: Color(.sRGB, red: 0.4863, green: 0.2275, blue: 0.9294, opacity: 1),
            codeMuted: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            codeNumber: Color(.sRGB, red: 0.6314, green: 0.3843, blue: 0.0275, opacity: 1),
            codeString: Color(.sRGB, red: 0.0157, green: 0.4706, blue: 0.3412, opacity: 1),
            dangerBd: Color(.sRGB, red: 0.9882, green: 0.6471, blue: 0.6471, opacity: 1),
            dangerBg: Color(.sRGB, red: 0.9961, green: 0.949, blue: 0.949, opacity: 1),
            dangerFg: Color(.sRGB, red: 0.7255, green: 0.1098, blue: 0.1098, opacity: 1),
            deviceFrame: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailHover: Color(.sRGB, red: 0.7137, green: 0.7843, blue: 0.902, opacity: 1),
            emailInk: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailMuted: Color(.sRGB, red: 0.4, green: 0.4, blue: 0.4, opacity: 1),
            emailPaper: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            emailRule: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            emailSelected: Color(.sRGB, red: 0.1451, green: 0.3882, blue: 0.9216, opacity: 1),
            emailText: Color(.sRGB, red: 0.2, green: 0.2, blue: 0.2, opacity: 1),
            fieldBd: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            fieldBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            focus: Color(.sRGB, red: 0.1451, green: 0.3882, blue: 0.9216, opacity: 1),
            infoBd: Color(.sRGB, red: 0.5765, green: 0.7725, blue: 0.9922, opacity: 1),
            infoBg: Color(.sRGB, red: 0.9373, green: 0.9647, blue: 1, opacity: 1),
            infoFg: Color(.sRGB, red: 0.1137, green: 0.3059, blue: 0.8471, opacity: 1),
            lockFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            lockFrom: Color(.sRGB, red: 0.1176, green: 0.2275, blue: 0.5412, opacity: 1),
            lockTo: Color(.sRGB, red: 0.0549, green: 0.102, blue: 0.1882, opacity: 1),
            mapLand: Color(.sRGB, red: 0.9059, green: 0.898, blue: 0.8941, opacity: 1),
            mapLine: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            mapScope: Color(.sRGB, red: 0.7647, green: 0.8235, blue: 0.9255, opacity: 1),
            mapWater: Color(.sRGB, red: 0.9725, green: 0.9804, blue: 0.9882, opacity: 1),
            mediaControlBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.92),
            mediaControlFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            mediaOverlayBg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            mediaOverlayFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            neutral100: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            neutral200: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            neutral300: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            neutral400: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            neutral450: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            neutral50: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            neutral500: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            neutral600: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            neutral700: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            neutral800: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            neutral900: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            neutral950: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            neutralBd: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            neutralBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            neutralFg: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            onBrandAccent: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            onBrandWhatsapp: Color(.sRGB, red: 0, green: 0.2314, blue: 0.1059, opacity: 1),
            onPayPagoefectivo: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            onPayPlin: Color(.sRGB, red: 0.0431, green: 0.0863, blue: 0.149, opacity: 1),
            onPayPuntos: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPayYape: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPrimary: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onSecondary: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            overlay: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.45),
            payPagoefectivo: Color(.sRGB, red: 1, green: 0.8, blue: 0, opacity: 1),
            payPlin: Color(.sRGB, red: 0, green: 0.7098, blue: 0.8863, opacity: 1),
            payPuntos: Color(.sRGB, red: 0.7686, green: 0.0706, blue: 0.1882, opacity: 1),
            payYape: Color(.sRGB, red: 0.4549, green: 0.1333, blue: 0.5176, opacity: 1),
            primary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            pushBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.82),
            pushFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            pushMuted: Color(.sRGB, red: 0.3333, green: 0.3333, blue: 0.3333, opacity: 1),
            qrBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            qrFg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            rowSelectedBg: Color(.sRGB, red: 0.9569, green: 0.9765, blue: 1, opacity: 1),
            scrimStrong: Color(.sRGB, red: 0.0392, green: 0.0549, blue: 0.0863, opacity: 0.62),
            secondary: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            sidebarActiveBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            sidebarBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            sidebarBorder: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            sidebarBrandActiveBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.14),
            sidebarBrandBg: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            sidebarBrandBorder: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.1),
            sidebarBrandFg: Color(.sRGB, red: 0.7804, green: 0.8314, blue: 0.9255, opacity: 1),
            sidebarBrandFgActive: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            sidebarBrandHoverBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            sidebarFg: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            sidebarFgActive: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            sidebarHoverBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            sidebarTintBg: Color(.sRGB, red: 0.9255, green: 0.9294, blue: 0.9373, opacity: 1),
            ssoAppleBlack: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            ssoAppleWhite: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleDarkBd: Color(.sRGB, red: 0.5569, green: 0.5686, blue: 0.5608, opacity: 1),
            ssoGoogleDarkBg: Color(.sRGB, red: 0.0745, green: 0.0745, blue: 0.0784, opacity: 1),
            ssoGoogleDarkFg: Color(.sRGB, red: 0.8902, green: 0.8902, blue: 0.8902, opacity: 1),
            ssoGoogleLightBd: Color(.sRGB, red: 0.4549, green: 0.4667, blue: 0.4588, opacity: 1),
            ssoGoogleLightBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleLightFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoGoogleLightHover: Color(.sRGB, red: 0.9725, green: 0.9804, blue: 1, opacity: 1),
            ssoGoogleNeutralBg: Color(.sRGB, red: 0.949, green: 0.949, blue: 0.949, opacity: 1),
            ssoGoogleNeutralFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoMsDarkBg: Color(.sRGB, red: 0.1843, green: 0.1843, blue: 0.1843, opacity: 1),
            ssoMsLightBd: Color(.sRGB, red: 0.549, green: 0.549, blue: 0.549, opacity: 1),
            ssoMsLightFg: Color(.sRGB, red: 0.3686, green: 0.3686, blue: 0.3686, opacity: 1),
            successBd: Color(.sRGB, red: 0.5255, green: 0.9373, blue: 0.6745, opacity: 1),
            successBg: Color(.sRGB, red: 0.9412, green: 0.9922, blue: 0.9569, opacity: 1),
            successFg: Color(.sRGB, red: 0.0824, green: 0.502, blue: 0.2392, opacity: 1),
            surface: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            surface2: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            surface3: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            text: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            textMuted: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            textSubtle: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            thumb: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            warningBd: Color(.sRGB, red: 0.9882, green: 0.8275, blue: 0.302, opacity: 1),
            warningBg: Color(.sRGB, red: 1, green: 0.9843, blue: 0.9216, opacity: 1),
            warningFg: Color(.sRGB, red: 0.7059, green: 0.3255, blue: 0.0353, opacity: 1)
        ),
        shadows: ZCShadows(
            hairline: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.08), x: 0, y: 0, blur: 0, spread: 1)],
            v1: [ZCShadowLayer(color: Color(.sRGB, red: 0.0627, green: 0.0941, blue: 0.1569, opacity: 0.04), x: 0, y: 1, blur: 2, spread: 0), ZCShadowLayer(color: Color(.sRGB, red: 0.4118, green: 0.4235, blue: 0.502, opacity: 0.06), x: 0, y: 8, blur: 24, spread: 0)],
            v2: [ZCShadowLayer(color: Color(.sRGB, red: 0.0588, green: 0.0902, blue: 0.1647, opacity: 0.16), x: 0, y: 24, blur: 48, spread: 0)],
            xs: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.1), x: 0, y: 1, blur: 2, spread: 0)]
        ),
        shape: ZCShape(control: 24, card: 28, sheet: 28, button: 9999, fieldH: 56))

    public static let enjoyDark = ZCTheme(brand: .enjoy, isDark: true, fontFamily: "Outfit",
        colors: ZCColors(
            accentBd: Color(.sRGB, red: 0.7529, green: 0.5176, blue: 0.9882, opacity: 0.4),
            accentBg: Color(.sRGB, red: 0.6588, green: 0.3333, blue: 0.9686, opacity: 0.15),
            accentFg: Color(.sRGB, red: 0.7529, green: 0.5176, blue: 0.9882, opacity: 1),
            bg: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            border: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            borderStrong: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            brandAccent: Color(.sRGB, red: 0.9725, green: 0.6824, blue: 0.1373, opacity: 1),
            brandPrimary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            brandSecondary: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            brandWhatsapp: Color(.sRGB, red: 0.1451, green: 0.8275, blue: 0.4, opacity: 1),
            cameraBg: Color(.sRGB, red: 0.0431, green: 0.0588, blue: 0.0902, opacity: 1),
            cameraBtn: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            cameraFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            cameraMask: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            chart1: Color(.sRGB, red: 0.5765, green: 0.7059, blue: 0.9255, opacity: 1),
            chart2: Color(.sRGB, red: 0.9843, green: 0.749, blue: 0.1412, opacity: 1),
            chart3: Color(.sRGB, red: 0.1765, green: 0.8314, blue: 0.749, opacity: 1),
            chart4: Color(.sRGB, red: 0.6549, green: 0.5451, blue: 0.9804, opacity: 1),
            chart5: Color(.sRGB, red: 0.9843, green: 0.4431, blue: 0.5216, opacity: 1),
            chart6: Color(.sRGB, red: 0.5804, green: 0.6392, blue: 0.7216, opacity: 1),
            codeBg: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            codeFg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            codeKey: Color(.sRGB, red: 0.5765, green: 0.7725, blue: 0.9922, opacity: 1),
            codeLiteral: Color(.sRGB, red: 0.7686, green: 0.7098, blue: 0.9922, opacity: 1),
            codeMuted: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            codeNumber: Color(.sRGB, red: 0.9882, green: 0.8275, blue: 0.302, opacity: 1),
            codeString: Color(.sRGB, red: 0.4314, green: 0.9059, blue: 0.7176, opacity: 1),
            dangerBd: Color(.sRGB, red: 0.9725, green: 0.4431, blue: 0.4431, opacity: 0.4),
            dangerBg: Color(.sRGB, red: 0.9373, green: 0.2667, blue: 0.2667, opacity: 0.15),
            dangerFg: Color(.sRGB, red: 0.9725, green: 0.4431, blue: 0.4431, opacity: 1),
            deviceFrame: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailHover: Color(.sRGB, red: 0.7137, green: 0.7843, blue: 0.902, opacity: 1),
            emailInk: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailMuted: Color(.sRGB, red: 0.4, green: 0.4, blue: 0.4, opacity: 1),
            emailPaper: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            emailRule: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            emailSelected: Color(.sRGB, red: 0.1451, green: 0.3882, blue: 0.9216, opacity: 1),
            emailText: Color(.sRGB, red: 0.2, green: 0.2, blue: 0.2, opacity: 1),
            fieldBd: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            fieldBg: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            focus: Color(.sRGB, red: 0.3765, green: 0.6471, blue: 0.9804, opacity: 1),
            infoBd: Color(.sRGB, red: 0.3765, green: 0.6471, blue: 0.9804, opacity: 0.4),
            infoBg: Color(.sRGB, red: 0.2314, green: 0.5098, blue: 0.9647, opacity: 0.15),
            infoFg: Color(.sRGB, red: 0.3765, green: 0.6471, blue: 0.9804, opacity: 1),
            lockFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            lockFrom: Color(.sRGB, red: 0.1176, green: 0.2275, blue: 0.5412, opacity: 1),
            lockTo: Color(.sRGB, red: 0.0549, green: 0.102, blue: 0.1882, opacity: 1),
            mapLand: Color(.sRGB, red: 0.1686, green: 0.1686, blue: 0.1686, opacity: 1),
            mapLine: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            mapScope: Color(.sRGB, red: 0.1765, green: 0.251, blue: 0.4, opacity: 1),
            mapWater: Color(.sRGB, red: 0.0784, green: 0.0784, blue: 0.0784, opacity: 1),
            mediaControlBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.92),
            mediaControlFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            mediaOverlayBg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            mediaOverlayFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            neutral100: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            neutral200: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            neutral300: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            neutral400: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            neutral450: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            neutral50: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            neutral500: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            neutral600: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            neutral700: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            neutral800: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            neutral900: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            neutral950: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            neutralBd: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            neutralBg: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            neutralFg: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            onBrandAccent: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            onBrandWhatsapp: Color(.sRGB, red: 0, green: 0.2314, blue: 0.1059, opacity: 1),
            onPayPagoefectivo: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            onPayPlin: Color(.sRGB, red: 0.0431, green: 0.0863, blue: 0.149, opacity: 1),
            onPayPuntos: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPayYape: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPrimary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            onSecondary: Color(.sRGB, red: 0.0431, green: 0.0706, blue: 0.1255, opacity: 1),
            overlay: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.6),
            payPagoefectivo: Color(.sRGB, red: 1, green: 0.8, blue: 0, opacity: 1),
            payPlin: Color(.sRGB, red: 0, green: 0.7098, blue: 0.8863, opacity: 1),
            payPuntos: Color(.sRGB, red: 0.7686, green: 0.0706, blue: 0.1882, opacity: 1),
            payYape: Color(.sRGB, red: 0.4549, green: 0.1333, blue: 0.5176, opacity: 1),
            primary: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            pushBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.82),
            pushFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            pushMuted: Color(.sRGB, red: 0.3333, green: 0.3333, blue: 0.3333, opacity: 1),
            qrBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            qrFg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            rowSelectedBg: Color(.sRGB, red: 0.9569, green: 0.9765, blue: 1, opacity: 1),
            scrimStrong: Color(.sRGB, red: 0.0392, green: 0.0549, blue: 0.0863, opacity: 0.62),
            secondary: Color(.sRGB, red: 0.7804, green: 0.8314, blue: 0.9255, opacity: 1),
            sidebarActiveBg: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            sidebarBg: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            sidebarBorder: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            sidebarBrandActiveBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.14),
            sidebarBrandBg: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            sidebarBrandBorder: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.1),
            sidebarBrandFg: Color(.sRGB, red: 0.7804, green: 0.8314, blue: 0.9255, opacity: 1),
            sidebarBrandFgActive: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            sidebarBrandHoverBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            sidebarFg: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            sidebarFgActive: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            sidebarHoverBg: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            sidebarTintBg: Color(.sRGB, red: 0.9255, green: 0.9294, blue: 0.9373, opacity: 1),
            ssoAppleBlack: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            ssoAppleWhite: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleDarkBd: Color(.sRGB, red: 0.5569, green: 0.5686, blue: 0.5608, opacity: 1),
            ssoGoogleDarkBg: Color(.sRGB, red: 0.0745, green: 0.0745, blue: 0.0784, opacity: 1),
            ssoGoogleDarkFg: Color(.sRGB, red: 0.8902, green: 0.8902, blue: 0.8902, opacity: 1),
            ssoGoogleLightBd: Color(.sRGB, red: 0.4549, green: 0.4667, blue: 0.4588, opacity: 1),
            ssoGoogleLightBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleLightFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoGoogleLightHover: Color(.sRGB, red: 0.9725, green: 0.9804, blue: 1, opacity: 1),
            ssoGoogleNeutralBg: Color(.sRGB, red: 0.949, green: 0.949, blue: 0.949, opacity: 1),
            ssoGoogleNeutralFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoMsDarkBg: Color(.sRGB, red: 0.1843, green: 0.1843, blue: 0.1843, opacity: 1),
            ssoMsLightBd: Color(.sRGB, red: 0.549, green: 0.549, blue: 0.549, opacity: 1),
            ssoMsLightFg: Color(.sRGB, red: 0.3686, green: 0.3686, blue: 0.3686, opacity: 1),
            successBd: Color(.sRGB, red: 0.2902, green: 0.8706, blue: 0.502, opacity: 0.4),
            successBg: Color(.sRGB, red: 0.1333, green: 0.7725, blue: 0.3686, opacity: 0.15),
            successFg: Color(.sRGB, red: 0.2902, green: 0.8706, blue: 0.502, opacity: 1),
            surface: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            surface2: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            surface3: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            text: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            textMuted: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            textSubtle: Color(.sRGB, red: 0.5843, green: 0.5843, blue: 0.5843, opacity: 1),
            thumb: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            warningBd: Color(.sRGB, red: 0.9843, green: 0.749, blue: 0.1412, opacity: 0.4),
            warningBg: Color(.sRGB, red: 0.9608, green: 0.6196, blue: 0.0431, opacity: 0.15),
            warningFg: Color(.sRGB, red: 0.9843, green: 0.749, blue: 0.1412, opacity: 1)
        ),
        shadows: ZCShadows(
            hairline: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.08), x: 0, y: 0, blur: 0, spread: 1)],
            v1: [],
            v2: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.5), x: 0, y: 24, blur: 48, spread: 0)],
            xs: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.1), x: 0, y: 1, blur: 2, spread: 0)]
        ),
        shape: ZCShape(control: 24, card: 28, sheet: 28, button: 9999, fieldH: 56))

    public static let motivaLight = ZCTheme(brand: .motiva, isDark: false, fontFamily: "Geist",
        colors: ZCColors(
            accentBd: Color(.sRGB, red: 0.8471, green: 0.7059, blue: 0.9961, opacity: 1),
            accentBg: Color(.sRGB, red: 0.9804, green: 0.9608, blue: 1, opacity: 1),
            accentFg: Color(.sRGB, red: 0.4941, green: 0.1333, blue: 0.8078, opacity: 1),
            bg: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            border: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            borderStrong: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            brandAccent: Color(.sRGB, red: 0.0784, green: 0.7216, blue: 0.651, opacity: 1),
            brandPrimary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            brandSecondary: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            brandWhatsapp: Color(.sRGB, red: 0.1451, green: 0.8275, blue: 0.4, opacity: 1),
            cameraBg: Color(.sRGB, red: 0.0431, green: 0.0588, blue: 0.0902, opacity: 1),
            cameraBtn: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            cameraFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            cameraMask: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            chart1: Color(.sRGB, red: 0.0588, green: 0.4627, blue: 0.4314, opacity: 1),
            chart2: Color(.sRGB, red: 0.9608, green: 0.6196, blue: 0.0431, opacity: 1),
            chart3: Color(.sRGB, red: 0.051, green: 0.5804, blue: 0.5333, opacity: 1),
            chart4: Color(.sRGB, red: 0.4863, green: 0.2275, blue: 0.9294, opacity: 1),
            chart5: Color(.sRGB, red: 0.8824, green: 0.1137, blue: 0.2824, opacity: 1),
            chart6: Color(.sRGB, red: 0.3922, green: 0.4549, blue: 0.5451, opacity: 1),
            codeBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            codeFg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            codeKey: Color(.sRGB, red: 0.1137, green: 0.3059, blue: 0.8471, opacity: 1),
            codeLiteral: Color(.sRGB, red: 0.4863, green: 0.2275, blue: 0.9294, opacity: 1),
            codeMuted: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            codeNumber: Color(.sRGB, red: 0.6314, green: 0.3843, blue: 0.0275, opacity: 1),
            codeString: Color(.sRGB, red: 0.0157, green: 0.4706, blue: 0.3412, opacity: 1),
            dangerBd: Color(.sRGB, red: 0.9882, green: 0.6471, blue: 0.6471, opacity: 1),
            dangerBg: Color(.sRGB, red: 0.9961, green: 0.949, blue: 0.949, opacity: 1),
            dangerFg: Color(.sRGB, red: 0.7255, green: 0.1098, blue: 0.1098, opacity: 1),
            deviceFrame: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailHover: Color(.sRGB, red: 0.7137, green: 0.7843, blue: 0.902, opacity: 1),
            emailInk: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailMuted: Color(.sRGB, red: 0.4, green: 0.4, blue: 0.4, opacity: 1),
            emailPaper: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            emailRule: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            emailSelected: Color(.sRGB, red: 0.1451, green: 0.3882, blue: 0.9216, opacity: 1),
            emailText: Color(.sRGB, red: 0.2, green: 0.2, blue: 0.2, opacity: 1),
            fieldBd: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            fieldBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            focus: Color(.sRGB, red: 0.1451, green: 0.3882, blue: 0.9216, opacity: 1),
            infoBd: Color(.sRGB, red: 0.5765, green: 0.7725, blue: 0.9922, opacity: 1),
            infoBg: Color(.sRGB, red: 0.9373, green: 0.9647, blue: 1, opacity: 1),
            infoFg: Color(.sRGB, red: 0.1137, green: 0.3059, blue: 0.8471, opacity: 1),
            lockFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            lockFrom: Color(.sRGB, red: 0.1176, green: 0.2275, blue: 0.5412, opacity: 1),
            lockTo: Color(.sRGB, red: 0.0549, green: 0.102, blue: 0.1882, opacity: 1),
            mapLand: Color(.sRGB, red: 0.9059, green: 0.898, blue: 0.8941, opacity: 1),
            mapLine: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            mapScope: Color(.sRGB, red: 0.7647, green: 0.8235, blue: 0.9255, opacity: 1),
            mapWater: Color(.sRGB, red: 0.9725, green: 0.9804, blue: 0.9882, opacity: 1),
            mediaControlBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.92),
            mediaControlFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            mediaOverlayBg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            mediaOverlayFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            neutral100: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            neutral200: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            neutral300: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            neutral400: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            neutral450: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            neutral50: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            neutral500: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            neutral600: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            neutral700: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            neutral800: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            neutral900: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            neutral950: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            neutralBd: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            neutralBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            neutralFg: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            onBrandAccent: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            onBrandWhatsapp: Color(.sRGB, red: 0, green: 0.2314, blue: 0.1059, opacity: 1),
            onPayPagoefectivo: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            onPayPlin: Color(.sRGB, red: 0.0431, green: 0.0863, blue: 0.149, opacity: 1),
            onPayPuntos: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPayYape: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPrimary: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onSecondary: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            overlay: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.45),
            payPagoefectivo: Color(.sRGB, red: 1, green: 0.8, blue: 0, opacity: 1),
            payPlin: Color(.sRGB, red: 0, green: 0.7098, blue: 0.8863, opacity: 1),
            payPuntos: Color(.sRGB, red: 0.7686, green: 0.0706, blue: 0.1882, opacity: 1),
            payYape: Color(.sRGB, red: 0.4549, green: 0.1333, blue: 0.5176, opacity: 1),
            primary: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            pushBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.82),
            pushFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            pushMuted: Color(.sRGB, red: 0.3333, green: 0.3333, blue: 0.3333, opacity: 1),
            qrBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            qrFg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            rowSelectedBg: Color(.sRGB, red: 0.9569, green: 0.9765, blue: 1, opacity: 1),
            scrimStrong: Color(.sRGB, red: 0.0392, green: 0.0549, blue: 0.0863, opacity: 0.62),
            secondary: Color(.sRGB, red: 0.0588, green: 0.2392, blue: 0.2275, opacity: 1),
            sidebarActiveBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            sidebarBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            sidebarBorder: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            sidebarBrandActiveBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.14),
            sidebarBrandBg: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            sidebarBrandBorder: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.1),
            sidebarBrandFg: Color(.sRGB, red: 0.7804, green: 0.8314, blue: 0.9255, opacity: 1),
            sidebarBrandFgActive: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            sidebarBrandHoverBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            sidebarFg: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            sidebarFgActive: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            sidebarHoverBg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            sidebarTintBg: Color(.sRGB, red: 0.9255, green: 0.9294, blue: 0.9373, opacity: 1),
            ssoAppleBlack: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            ssoAppleWhite: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleDarkBd: Color(.sRGB, red: 0.5569, green: 0.5686, blue: 0.5608, opacity: 1),
            ssoGoogleDarkBg: Color(.sRGB, red: 0.0745, green: 0.0745, blue: 0.0784, opacity: 1),
            ssoGoogleDarkFg: Color(.sRGB, red: 0.8902, green: 0.8902, blue: 0.8902, opacity: 1),
            ssoGoogleLightBd: Color(.sRGB, red: 0.4549, green: 0.4667, blue: 0.4588, opacity: 1),
            ssoGoogleLightBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleLightFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoGoogleLightHover: Color(.sRGB, red: 0.9725, green: 0.9804, blue: 1, opacity: 1),
            ssoGoogleNeutralBg: Color(.sRGB, red: 0.949, green: 0.949, blue: 0.949, opacity: 1),
            ssoGoogleNeutralFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoMsDarkBg: Color(.sRGB, red: 0.1843, green: 0.1843, blue: 0.1843, opacity: 1),
            ssoMsLightBd: Color(.sRGB, red: 0.549, green: 0.549, blue: 0.549, opacity: 1),
            ssoMsLightFg: Color(.sRGB, red: 0.3686, green: 0.3686, blue: 0.3686, opacity: 1),
            successBd: Color(.sRGB, red: 0.5255, green: 0.9373, blue: 0.6745, opacity: 1),
            successBg: Color(.sRGB, red: 0.9412, green: 0.9922, blue: 0.9569, opacity: 1),
            successFg: Color(.sRGB, red: 0.0824, green: 0.502, blue: 0.2392, opacity: 1),
            surface: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            surface2: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            surface3: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            text: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            textMuted: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            textSubtle: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            thumb: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            warningBd: Color(.sRGB, red: 0.9882, green: 0.8275, blue: 0.302, opacity: 1),
            warningBg: Color(.sRGB, red: 1, green: 0.9843, blue: 0.9216, opacity: 1),
            warningFg: Color(.sRGB, red: 0.7059, green: 0.3255, blue: 0.0353, opacity: 1)
        ),
        shadows: ZCShadows(
            hairline: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.08), x: 0, y: 0, blur: 0, spread: 1)],
            v1: [ZCShadowLayer(color: Color(.sRGB, red: 0.0627, green: 0.0941, blue: 0.1569, opacity: 0.04), x: 0, y: 1, blur: 2, spread: 0), ZCShadowLayer(color: Color(.sRGB, red: 0.4118, green: 0.4235, blue: 0.502, opacity: 0.06), x: 0, y: 8, blur: 24, spread: 0)],
            v2: [ZCShadowLayer(color: Color(.sRGB, red: 0.0588, green: 0.0902, blue: 0.1647, opacity: 0.16), x: 0, y: 24, blur: 48, spread: 0)],
            xs: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.1), x: 0, y: 1, blur: 2, spread: 0)]
        ),
        shape: ZCShape(control: 8, card: 16, sheet: 24, button: 9999, fieldH: 56))

    public static let motivaDark = ZCTheme(brand: .motiva, isDark: true, fontFamily: "Geist",
        colors: ZCColors(
            accentBd: Color(.sRGB, red: 0.7529, green: 0.5176, blue: 0.9882, opacity: 0.4),
            accentBg: Color(.sRGB, red: 0.6588, green: 0.3333, blue: 0.9686, opacity: 0.15),
            accentFg: Color(.sRGB, red: 0.7529, green: 0.5176, blue: 0.9882, opacity: 1),
            bg: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            border: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            borderStrong: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            brandAccent: Color(.sRGB, red: 0.0784, green: 0.7216, blue: 0.651, opacity: 1),
            brandPrimary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            brandSecondary: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            brandWhatsapp: Color(.sRGB, red: 0.1451, green: 0.8275, blue: 0.4, opacity: 1),
            cameraBg: Color(.sRGB, red: 0.0431, green: 0.0588, blue: 0.0902, opacity: 1),
            cameraBtn: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            cameraFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            cameraMask: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            chart1: Color(.sRGB, red: 0.5765, green: 0.7059, blue: 0.9255, opacity: 1),
            chart2: Color(.sRGB, red: 0.9843, green: 0.749, blue: 0.1412, opacity: 1),
            chart3: Color(.sRGB, red: 0.1765, green: 0.8314, blue: 0.749, opacity: 1),
            chart4: Color(.sRGB, red: 0.6549, green: 0.5451, blue: 0.9804, opacity: 1),
            chart5: Color(.sRGB, red: 0.9843, green: 0.4431, blue: 0.5216, opacity: 1),
            chart6: Color(.sRGB, red: 0.5804, green: 0.6392, blue: 0.7216, opacity: 1),
            codeBg: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            codeFg: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            codeKey: Color(.sRGB, red: 0.5765, green: 0.7725, blue: 0.9922, opacity: 1),
            codeLiteral: Color(.sRGB, red: 0.7686, green: 0.7098, blue: 0.9922, opacity: 1),
            codeMuted: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            codeNumber: Color(.sRGB, red: 0.9882, green: 0.8275, blue: 0.302, opacity: 1),
            codeString: Color(.sRGB, red: 0.4314, green: 0.9059, blue: 0.7176, opacity: 1),
            dangerBd: Color(.sRGB, red: 0.9725, green: 0.4431, blue: 0.4431, opacity: 0.4),
            dangerBg: Color(.sRGB, red: 0.9373, green: 0.2667, blue: 0.2667, opacity: 0.15),
            dangerFg: Color(.sRGB, red: 0.9725, green: 0.4431, blue: 0.4431, opacity: 1),
            deviceFrame: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailHover: Color(.sRGB, red: 0.7137, green: 0.7843, blue: 0.902, opacity: 1),
            emailInk: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            emailMuted: Color(.sRGB, red: 0.4, green: 0.4, blue: 0.4, opacity: 1),
            emailPaper: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            emailRule: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            emailSelected: Color(.sRGB, red: 0.1451, green: 0.3882, blue: 0.9216, opacity: 1),
            emailText: Color(.sRGB, red: 0.2, green: 0.2, blue: 0.2, opacity: 1),
            fieldBd: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            fieldBg: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            focus: Color(.sRGB, red: 0.3765, green: 0.6471, blue: 0.9804, opacity: 1),
            infoBd: Color(.sRGB, red: 0.3765, green: 0.6471, blue: 0.9804, opacity: 0.4),
            infoBg: Color(.sRGB, red: 0.2314, green: 0.5098, blue: 0.9647, opacity: 0.15),
            infoFg: Color(.sRGB, red: 0.3765, green: 0.6471, blue: 0.9804, opacity: 1),
            lockFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            lockFrom: Color(.sRGB, red: 0.1176, green: 0.2275, blue: 0.5412, opacity: 1),
            lockTo: Color(.sRGB, red: 0.0549, green: 0.102, blue: 0.1882, opacity: 1),
            mapLand: Color(.sRGB, red: 0.1686, green: 0.1686, blue: 0.1686, opacity: 1),
            mapLine: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            mapScope: Color(.sRGB, red: 0.1765, green: 0.251, blue: 0.4, opacity: 1),
            mapWater: Color(.sRGB, red: 0.0784, green: 0.0784, blue: 0.0784, opacity: 1),
            mediaControlBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.92),
            mediaControlFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            mediaOverlayBg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.55),
            mediaOverlayFg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            neutral100: Color(.sRGB, red: 0.9608, green: 0.9608, blue: 0.9608, opacity: 1),
            neutral200: Color(.sRGB, red: 0.898, green: 0.898, blue: 0.898, opacity: 1),
            neutral300: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            neutral400: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            neutral450: Color(.sRGB, red: 0.5569, green: 0.5569, blue: 0.5569, opacity: 1),
            neutral50: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            neutral500: Color(.sRGB, red: 0.451, green: 0.451, blue: 0.451, opacity: 1),
            neutral600: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            neutral700: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            neutral800: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            neutral900: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            neutral950: Color(.sRGB, red: 0.0392, green: 0.0392, blue: 0.0392, opacity: 1),
            neutralBd: Color(.sRGB, red: 0.3216, green: 0.3216, blue: 0.3216, opacity: 1),
            neutralBg: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            neutralFg: Color(.sRGB, red: 0.8314, green: 0.8314, blue: 0.8314, opacity: 1),
            onBrandAccent: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            onBrandWhatsapp: Color(.sRGB, red: 0, green: 0.2314, blue: 0.1059, opacity: 1),
            onPayPagoefectivo: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            onPayPlin: Color(.sRGB, red: 0.0431, green: 0.0863, blue: 0.149, opacity: 1),
            onPayPuntos: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPayYape: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            onPrimary: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            onSecondary: Color(.sRGB, red: 0.0431, green: 0.0706, blue: 0.1255, opacity: 1),
            overlay: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.6),
            payPagoefectivo: Color(.sRGB, red: 1, green: 0.8, blue: 0, opacity: 1),
            payPlin: Color(.sRGB, red: 0, green: 0.7098, blue: 0.8863, opacity: 1),
            payPuntos: Color(.sRGB, red: 0.7686, green: 0.0706, blue: 0.1882, opacity: 1),
            payYape: Color(.sRGB, red: 0.4549, green: 0.1333, blue: 0.5176, opacity: 1),
            primary: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            pushBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.82),
            pushFg: Color(.sRGB, red: 0.0667, green: 0.0667, blue: 0.0667, opacity: 1),
            pushMuted: Color(.sRGB, red: 0.3333, green: 0.3333, blue: 0.3333, opacity: 1),
            qrBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            qrFg: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            rowSelectedBg: Color(.sRGB, red: 0.9569, green: 0.9765, blue: 1, opacity: 1),
            scrimStrong: Color(.sRGB, red: 0.0392, green: 0.0549, blue: 0.0863, opacity: 0.62),
            secondary: Color(.sRGB, red: 0.7804, green: 0.8314, blue: 0.9255, opacity: 1),
            sidebarActiveBg: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            sidebarBg: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            sidebarBorder: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            sidebarBrandActiveBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.14),
            sidebarBrandBg: Color(.sRGB, red: 0.0902, green: 0.1608, blue: 0.2824, opacity: 1),
            sidebarBrandBorder: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.1),
            sidebarBrandFg: Color(.sRGB, red: 0.7804, green: 0.8314, blue: 0.9255, opacity: 1),
            sidebarBrandFgActive: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            sidebarBrandHoverBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 0.08),
            sidebarFg: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            sidebarFgActive: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            sidebarHoverBg: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            sidebarTintBg: Color(.sRGB, red: 0.9255, green: 0.9294, blue: 0.9373, opacity: 1),
            ssoAppleBlack: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 1),
            ssoAppleWhite: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleDarkBd: Color(.sRGB, red: 0.5569, green: 0.5686, blue: 0.5608, opacity: 1),
            ssoGoogleDarkBg: Color(.sRGB, red: 0.0745, green: 0.0745, blue: 0.0784, opacity: 1),
            ssoGoogleDarkFg: Color(.sRGB, red: 0.8902, green: 0.8902, blue: 0.8902, opacity: 1),
            ssoGoogleLightBd: Color(.sRGB, red: 0.4549, green: 0.4667, blue: 0.4588, opacity: 1),
            ssoGoogleLightBg: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            ssoGoogleLightFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoGoogleLightHover: Color(.sRGB, red: 0.9725, green: 0.9804, blue: 1, opacity: 1),
            ssoGoogleNeutralBg: Color(.sRGB, red: 0.949, green: 0.949, blue: 0.949, opacity: 1),
            ssoGoogleNeutralFg: Color(.sRGB, red: 0.1216, green: 0.1216, blue: 0.1216, opacity: 1),
            ssoMsDarkBg: Color(.sRGB, red: 0.1843, green: 0.1843, blue: 0.1843, opacity: 1),
            ssoMsLightBd: Color(.sRGB, red: 0.549, green: 0.549, blue: 0.549, opacity: 1),
            ssoMsLightFg: Color(.sRGB, red: 0.3686, green: 0.3686, blue: 0.3686, opacity: 1),
            successBd: Color(.sRGB, red: 0.2902, green: 0.8706, blue: 0.502, opacity: 0.4),
            successBg: Color(.sRGB, red: 0.1333, green: 0.7725, blue: 0.3686, opacity: 0.15),
            successFg: Color(.sRGB, red: 0.2902, green: 0.8706, blue: 0.502, opacity: 1),
            surface: Color(.sRGB, red: 0.0902, green: 0.0902, blue: 0.0902, opacity: 1),
            surface2: Color(.sRGB, red: 0.149, green: 0.149, blue: 0.149, opacity: 1),
            surface3: Color(.sRGB, red: 0.251, green: 0.251, blue: 0.251, opacity: 1),
            text: Color(.sRGB, red: 0.9804, green: 0.9804, blue: 0.9804, opacity: 1),
            textMuted: Color(.sRGB, red: 0.6392, green: 0.6392, blue: 0.6392, opacity: 1),
            textSubtle: Color(.sRGB, red: 0.5843, green: 0.5843, blue: 0.5843, opacity: 1),
            thumb: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
            warningBd: Color(.sRGB, red: 0.9843, green: 0.749, blue: 0.1412, opacity: 0.4),
            warningBg: Color(.sRGB, red: 0.9608, green: 0.6196, blue: 0.0431, opacity: 0.15),
            warningFg: Color(.sRGB, red: 0.9843, green: 0.749, blue: 0.1412, opacity: 1)
        ),
        shadows: ZCShadows(
            hairline: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.08), x: 0, y: 0, blur: 0, spread: 1)],
            v1: [],
            v2: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.5), x: 0, y: 24, blur: 48, spread: 0)],
            xs: [ZCShadowLayer(color: Color(.sRGB, red: 0, green: 0, blue: 0, opacity: 0.1), x: 0, y: 1, blur: 2, spread: 0)]
        ),
        shape: ZCShape(control: 8, card: 16, sheet: 24, button: 9999, fieldH: 56))

}

private struct ZCThemeKey: EnvironmentKey { static let defaultValue = ZCTheme.zonacardsLight }
public extension EnvironmentValues {
    var zcTheme: ZCTheme { get { self[ZCThemeKey.self] } set { self[ZCThemeKey.self] = newValue } }
}

/// Espaciado en puntos (1 px CSS = 1 pt).
public enum ZCSpace {
    public static let v1: CGFloat = 4
    public static let v2: CGFloat = 8
    public static let v3: CGFloat = 12
    public static let v4: CGFloat = 16
    public static let v5: CGFloat = 20
    public static let v6: CGFloat = 24
    public static let v8: CGFloat = 32
    public static let v10: CGFloat = 40
    public static let v12: CGFloat = 48
}

/// Radios de esquina en puntos.
public enum ZCRadius {
    public static let xs: CGFloat = 6
    public static let ms: CGFloat = 12
    public static let sm: CGFloat = 8
    public static let md: CGFloat = 16
    public static let lg: CGFloat = 24
    public static let full: CGFloat = 9999
}

/// Medidas de componentes en puntos. Toque mínimo en iOS: 44 pt.
public enum ZCSize {
    public static let target: CGFloat = 56
    public static let targetSm: CGFloat = 44
    public static let iconBtn: CGFloat = 48
    public static let line: CGFloat = 20
    public static let topbarH: CGFloat = 68
    public static let drawerW: CGFloat = 460
    public static let modalW: CGFloat = 520
    public static let modalWLg: CGFloat = 760
    public static let sheetW: CGFloat = 560
    public static let tableRow: CGFloat = 56
    public static let tableRowCompact: CGFloat = 44
    public static let cardWSm: CGFloat = 192
    public static let cardW: CGFloat = 288
    public static let cardWLg: CGFloat = 320
}

public struct ZCTypeStyle: Sendable {
    public let size: CGFloat
    public let lineHeight: CGFloat
    public let relativeTo: Font.TextStyle
    public init(size: CGFloat, lineHeight: CGFloat, relativeTo: Font.TextStyle) { self.size = size; self.lineHeight = lineHeight; self.relativeTo = relativeTo }
}

/// Escala tipográfica. `Font.zc(.body, theme:)` escala con Dynamic Type.
public enum ZCType {
    public static let xxs = ZCTypeStyle(size: 10, lineHeight: 14, relativeTo: .caption2)
    public static let tiny = ZCTypeStyle(size: 11, lineHeight: 16, relativeTo: .caption2)
    public static let caption = ZCTypeStyle(size: 13, lineHeight: 18, relativeTo: .caption)
    public static let bodySm = ZCTypeStyle(size: 14.5, lineHeight: 21, relativeTo: .subheadline)
    public static let body = ZCTypeStyle(size: 15, lineHeight: 22, relativeTo: .body)
    public static let titleSm = ZCTypeStyle(size: 17, lineHeight: 24, relativeTo: .headline)
    public static let title = ZCTypeStyle(size: 19, lineHeight: 26, relativeTo: .title3)
    public static let heading = ZCTypeStyle(size: 22, lineHeight: 28, relativeTo: .title2)
    public static let displaySm = ZCTypeStyle(size: 26, lineHeight: 34, relativeTo: .title)
    public static let display = ZCTypeStyle(size: 30, lineHeight: 36, relativeTo: .largeTitle)
    public static let displayLg = ZCTypeStyle(size: 34, lineHeight: 40, relativeTo: .largeTitle)
}

public extension Font {
    static func zc(_ style: ZCTypeStyle, theme: ZCTheme = .zonacardsLight) -> Font {
        .custom(theme.fontFamily, size: style.size, relativeTo: style.relativeTo)
    }
}

/// Movimiento: duraciones en segundos y curvas. Con "Reducir movimiento" usa `ZCMotion.animation(_:reduceMotion:)`.
public enum ZCMotion {
    public static let `default`: Double = 0.16
    public static let fast: Double = 0.12
    public static let base: Double = 0.2
    public static let slow: Double = 0.28
    public static let exit: Double = 0.16
    public static let easeCurve: (Double, Double, Double, Double) = (0.2, 0.7, 0.2, 1)
    public static let standardCurve: (Double, Double, Double, Double) = (0.2, 0, 0, 1)
    public static let enterCurve: (Double, Double, Double, Double) = (0.32, 0.72, 0, 1)
    public static let exitCurve: (Double, Double, Double, Double) = (0.3, 0, 0.8, 0.15)

    public static func animation(_ duration: Double, curve: (Double, Double, Double, Double) = standardCurve, reduceMotion: Bool) -> Animation? {
        reduceMotion ? nil : .timingCurve(curve.0, curve.1, curve.2, curve.3, duration: duration)
    }
}
