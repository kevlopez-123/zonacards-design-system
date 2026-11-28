// Archivo generado por scripts/build-native.mjs. No editar a mano.
// @zonacards/ui 2.0.0
package com.zonacards.ui.tokens

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Immutable
data class ZcShadowLayer(val color: Color, val x: Float, val y: Float, val blur: Float, val spread: Float)

/** Paleta completa de un tema (marca × modo). Úsala con LocalZcTheme.current.colors. */
@Immutable
class ZcColors internal constructor(private val argb: LongArray) {
    val accentBd: Color get() = Color(argb[0])
    val accentBg: Color get() = Color(argb[1])
    val accentFg: Color get() = Color(argb[2])
    val bg: Color get() = Color(argb[3])
    val border: Color get() = Color(argb[4])
    val borderStrong: Color get() = Color(argb[5])
    val brandAccent: Color get() = Color(argb[6])
    val brandPrimary: Color get() = Color(argb[7])
    val brandSecondary: Color get() = Color(argb[8])
    val brandWhatsapp: Color get() = Color(argb[9])
    val cameraBg: Color get() = Color(argb[10])
    val cameraBtn: Color get() = Color(argb[11])
    val cameraFg: Color get() = Color(argb[12])
    val cameraMask: Color get() = Color(argb[13])
    val chart1: Color get() = Color(argb[14])
    val chart2: Color get() = Color(argb[15])
    val chart3: Color get() = Color(argb[16])
    val chart4: Color get() = Color(argb[17])
    val chart5: Color get() = Color(argb[18])
    val chart6: Color get() = Color(argb[19])
    val codeBg: Color get() = Color(argb[20])
    val codeFg: Color get() = Color(argb[21])
    val codeKey: Color get() = Color(argb[22])
    val codeLiteral: Color get() = Color(argb[23])
    val codeMuted: Color get() = Color(argb[24])
    val codeNumber: Color get() = Color(argb[25])
    val codeString: Color get() = Color(argb[26])
    val dangerBd: Color get() = Color(argb[27])
    val dangerBg: Color get() = Color(argb[28])
    val dangerFg: Color get() = Color(argb[29])
    val deviceFrame: Color get() = Color(argb[30])
    val emailHover: Color get() = Color(argb[31])
    val emailInk: Color get() = Color(argb[32])
    val emailMuted: Color get() = Color(argb[33])
    val emailPaper: Color get() = Color(argb[34])
    val emailRule: Color get() = Color(argb[35])
    val emailSelected: Color get() = Color(argb[36])
    val emailText: Color get() = Color(argb[37])
    val fieldBd: Color get() = Color(argb[38])
    val fieldBg: Color get() = Color(argb[39])
    val focus: Color get() = Color(argb[40])
    val infoBd: Color get() = Color(argb[41])
    val infoBg: Color get() = Color(argb[42])
    val infoFg: Color get() = Color(argb[43])
    val lockFg: Color get() = Color(argb[44])
    val lockFrom: Color get() = Color(argb[45])
    val lockTo: Color get() = Color(argb[46])
    val mapLand: Color get() = Color(argb[47])
    val mapLine: Color get() = Color(argb[48])
    val mapScope: Color get() = Color(argb[49])
    val mapWater: Color get() = Color(argb[50])
    val mediaControlBg: Color get() = Color(argb[51])
    val mediaControlFg: Color get() = Color(argb[52])
    val mediaOverlayBg: Color get() = Color(argb[53])
    val mediaOverlayFg: Color get() = Color(argb[54])
    val neutral100: Color get() = Color(argb[55])
    val neutral200: Color get() = Color(argb[56])
    val neutral300: Color get() = Color(argb[57])
    val neutral400: Color get() = Color(argb[58])
    val neutral450: Color get() = Color(argb[59])
    val neutral50: Color get() = Color(argb[60])
    val neutral500: Color get() = Color(argb[61])
    val neutral550: Color get() = Color(argb[62])
    val neutral600: Color get() = Color(argb[63])
    val neutral700: Color get() = Color(argb[64])
    val neutral800: Color get() = Color(argb[65])
    val neutral900: Color get() = Color(argb[66])
    val neutral950: Color get() = Color(argb[67])
    val neutralBd: Color get() = Color(argb[68])
    val neutralBg: Color get() = Color(argb[69])
    val neutralFg: Color get() = Color(argb[70])
    val onBrandAccent: Color get() = Color(argb[71])
    val onBrandWhatsapp: Color get() = Color(argb[72])
    val onPayPagoefectivo: Color get() = Color(argb[73])
    val onPayPlin: Color get() = Color(argb[74])
    val onPayPuntos: Color get() = Color(argb[75])
    val onPayYape: Color get() = Color(argb[76])
    val onPrimary: Color get() = Color(argb[77])
    val onSecondary: Color get() = Color(argb[78])
    val overlay: Color get() = Color(argb[79])
    val payPagoefectivo: Color get() = Color(argb[80])
    val payPlin: Color get() = Color(argb[81])
    val payPuntos: Color get() = Color(argb[82])
    val payYape: Color get() = Color(argb[83])
    val primary: Color get() = Color(argb[84])
    val pushBg: Color get() = Color(argb[85])
    val pushFg: Color get() = Color(argb[86])
    val pushMuted: Color get() = Color(argb[87])
    val qrBg: Color get() = Color(argb[88])
    val qrFg: Color get() = Color(argb[89])
    val rowSelectedBg: Color get() = Color(argb[90])
    val scrimStrong: Color get() = Color(argb[91])
    val secondary: Color get() = Color(argb[92])
    val sidebarActiveBg: Color get() = Color(argb[93])
    val sidebarBg: Color get() = Color(argb[94])
    val sidebarBorder: Color get() = Color(argb[95])
    val sidebarBrandActiveBg: Color get() = Color(argb[96])
    val sidebarBrandBg: Color get() = Color(argb[97])
    val sidebarBrandBorder: Color get() = Color(argb[98])
    val sidebarBrandFg: Color get() = Color(argb[99])
    val sidebarBrandFgActive: Color get() = Color(argb[100])
    val sidebarBrandHoverBg: Color get() = Color(argb[101])
    val sidebarFg: Color get() = Color(argb[102])
    val sidebarFgActive: Color get() = Color(argb[103])
    val sidebarHoverBg: Color get() = Color(argb[104])
    val sidebarTintBg: Color get() = Color(argb[105])
    val ssoAppleBlack: Color get() = Color(argb[106])
    val ssoAppleWhite: Color get() = Color(argb[107])
    val ssoGoogleDarkBd: Color get() = Color(argb[108])
    val ssoGoogleDarkBg: Color get() = Color(argb[109])
    val ssoGoogleDarkFg: Color get() = Color(argb[110])
    val ssoGoogleLightBd: Color get() = Color(argb[111])
    val ssoGoogleLightBg: Color get() = Color(argb[112])
    val ssoGoogleLightFg: Color get() = Color(argb[113])
    val ssoGoogleLightHover: Color get() = Color(argb[114])
    val ssoGoogleNeutralBg: Color get() = Color(argb[115])
    val ssoGoogleNeutralFg: Color get() = Color(argb[116])
    val ssoMsDarkBg: Color get() = Color(argb[117])
    val ssoMsLightBd: Color get() = Color(argb[118])
    val ssoMsLightFg: Color get() = Color(argb[119])
    val successBd: Color get() = Color(argb[120])
    val successBg: Color get() = Color(argb[121])
    val successFg: Color get() = Color(argb[122])
    val surface: Color get() = Color(argb[123])
    val surface2: Color get() = Color(argb[124])
    val surface3: Color get() = Color(argb[125])
    val text: Color get() = Color(argb[126])
    val textMuted: Color get() = Color(argb[127])
    val textSubtle: Color get() = Color(argb[128])
    val thumb: Color get() = Color(argb[129])
    val warningBd: Color get() = Color(argb[130])
    val warningBg: Color get() = Color(argb[131])
    val warningFg: Color get() = Color(argb[132])
}

@Immutable
data class ZcShadows(
    val hairline: List<ZcShadowLayer>,
    val v1: List<ZcShadowLayer>,
    val v2: List<ZcShadowLayer>,
    val xs: List<ZcShadowLayer>,
)

/** Forma y estilo de la marca: radios de control, tarjeta, hoja y botón, y alto de los campos. */
@Immutable
data class ZcShape(val control: Dp, val card: Dp, val sheet: Dp, val button: Dp, val fieldH: Dp)

enum class ZcBrand { ZONACARDS, GIFTEALO, ENJOY, MOTIVA }

@Immutable
data class ZcTheme(val brand: ZcBrand, val isDark: Boolean, val fontFamily: String, val colors: ZcColors, val shadows: ZcShadows, val shape: ZcShape) {
    companion object {
        fun resolve(brand: ZcBrand, dark: Boolean): ZcTheme = when (brand) {
            ZcBrand.ZONACARDS -> if (dark) zonacardsDark else zonacardsLight
            ZcBrand.GIFTEALO -> if (dark) giftealoDark else giftealoLight
            ZcBrand.ENJOY -> if (dark) enjoyDark else enjoyLight
            ZcBrand.MOTIVA -> if (dark) motivaDark else motivaLight
        }

        val zonacardsLight = ZcTheme(ZcBrand.ZONACARDS, false, "Figtree",
            ZcColors(longArrayOf(
                0xFFD8B4FE, // accentBd
                0xFFFAF5FF, // accentBg
                0xFF7E22CE, // accentFg
                0xFFFAFAFA, // bg
                0xFFE5E5E5, // border
                0xFF8E8E8E, // borderStrong
                0xFFF8AE23, // brandAccent
                0xFF000000, // brandPrimary
                0xFF172948, // brandSecondary
                0xFF25D366, // brandWhatsapp
                0xFF0B0F17, // cameraBg
                0x14FFFFFF, // cameraBtn
                0xFFFFFFFF, // cameraFg
                0x8C000000, // cameraMask
                0xFF172948, // chart1
                0xFFF59E0B, // chart2
                0xFF0D9488, // chart3
                0xFF7C3AED, // chart4
                0xFFE11D48, // chart5
                0xFF64748B, // chart6
                0xFFF5F5F5, // codeBg
                0xFF000000, // codeFg
                0xFF1D4ED8, // codeKey
                0xFF7C3AED, // codeLiteral
                0xFF525252, // codeMuted
                0xFFA16207, // codeNumber
                0xFF047857, // codeString
                0xFFFCA5A5, // dangerBd
                0xFFFEF2F2, // dangerBg
                0xFFB91C1C, // dangerFg
                0xFF111111, // deviceFrame
                0xFFB6C8E6, // emailHover
                0xFF111111, // emailInk
                0xFF666666, // emailMuted
                0xFFFFFFFF, // emailPaper
                0xFFE5E5E5, // emailRule
                0xFF2563EB, // emailSelected
                0xFF333333, // emailText
                0xFF8E8E8E, // fieldBd
                0xFFFFFFFF, // fieldBg
                0xFF2563EB, // focus
                0xFF93C5FD, // infoBd
                0xFFEFF6FF, // infoBg
                0xFF1D4ED8, // infoFg
                0xFFFFFFFF, // lockFg
                0xFF1E3A8A, // lockFrom
                0xFF0E1A30, // lockTo
                0xFFE7E5E4, // mapLand
                0xFFFFFFFF, // mapLine
                0xFFC3D2EC, // mapScope
                0xFFF8FAFC, // mapWater
                0xEBFFFFFF, // mediaControlBg
                0xFF111111, // mediaControlFg
                0x8C000000, // mediaOverlayBg
                0xFFFFFFFF, // mediaOverlayFg
                0xFFF5F5F5, // neutral100
                0xFFE5E5E5, // neutral200
                0xFFD4D4D4, // neutral300
                0xFFA3A3A3, // neutral400
                0xFF8E8E8E, // neutral450
                0xFFFAFAFA, // neutral50
                0xFF737373, // neutral500
                0xFF666666, // neutral550
                0xFF525252, // neutral600
                0xFF404040, // neutral700
                0xFF262626, // neutral800
                0xFF171717, // neutral900
                0xFF0A0A0A, // neutral950
                0xFFD4D4D4, // neutralBd
                0xFFF5F5F5, // neutralBg
                0xFF404040, // neutralFg
                0xFF000000, // onBrandAccent
                0xFF003B1B, // onBrandWhatsapp
                0xFF111111, // onPayPagoefectivo
                0xFF0B1626, // onPayPlin
                0xFFFFFFFF, // onPayPuntos
                0xFFFFFFFF, // onPayYape
                0xFFFFFFFF, // onPrimary
                0xFFFFFFFF, // onSecondary
                0x73000000, // overlay
                0xFFFFCC00, // payPagoefectivo
                0xFF00B5E2, // payPlin
                0xFFC41230, // payPuntos
                0xFF742284, // payYape
                0xFF000000, // primary
                0xD1FFFFFF, // pushBg
                0xFF111111, // pushFg
                0xFF555555, // pushMuted
                0xFFFFFFFF, // qrBg
                0xFF000000, // qrFg
                0xFFF4F9FF, // rowSelectedBg
                0x9E0A0E16, // scrimStrong
                0xFF172948, // secondary
                0xFFF5F5F5, // sidebarActiveBg
                0xFFFFFFFF, // sidebarBg
                0xFFE5E5E5, // sidebarBorder
                0x24FFFFFF, // sidebarBrandActiveBg
                0xFF172948, // sidebarBrandBg
                0x1AFFFFFF, // sidebarBrandBorder
                0xFFC7D4EC, // sidebarBrandFg
                0xFFFFFFFF, // sidebarBrandFgActive
                0x14FFFFFF, // sidebarBrandHoverBg
                0xFF525252, // sidebarFg
                0xFF000000, // sidebarFgActive
                0xFFF5F5F5, // sidebarHoverBg
                0xFFECEDEF, // sidebarTintBg
                0xFF000000, // ssoAppleBlack
                0xFFFFFFFF, // ssoAppleWhite
                0xFF8E918F, // ssoGoogleDarkBd
                0xFF131314, // ssoGoogleDarkBg
                0xFFE3E3E3, // ssoGoogleDarkFg
                0xFF747775, // ssoGoogleLightBd
                0xFFFFFFFF, // ssoGoogleLightBg
                0xFF1F1F1F, // ssoGoogleLightFg
                0xFFF8FAFF, // ssoGoogleLightHover
                0xFFF2F2F2, // ssoGoogleNeutralBg
                0xFF1F1F1F, // ssoGoogleNeutralFg
                0xFF2F2F2F, // ssoMsDarkBg
                0xFF8C8C8C, // ssoMsLightBd
                0xFF5E5E5E, // ssoMsLightFg
                0xFF86EFAC, // successBd
                0xFFF0FDF4, // successBg
                0xFF15803D, // successFg
                0xFFFFFFFF, // surface
                0xFFF5F5F5, // surface2
                0xFFE5E5E5, // surface3
                0xFF000000, // text
                0xFF525252, // textMuted
                0xFF666666, // textSubtle
                0xFFFFFFFF, // thumb
                0xFFFCD34D, // warningBd
                0xFFFFFBEB, // warningBg
                0xFFB45309, // warningFg
            )),
            ZcShadows(
                hairline = listOf(ZcShadowLayer(Color(0x14000000), 0f, 0f, 0f, 1f)),
                v1 = listOf(ZcShadowLayer(Color(0x0A101828), 0f, 1f, 2f, 0f), ZcShadowLayer(Color(0x0F696C80), 0f, 8f, 24f, 0f)),
                v2 = listOf(ZcShadowLayer(Color(0x290F172A), 0f, 24f, 48f, 0f)),
                xs = listOf(ZcShadowLayer(Color(0x1A000000), 0f, 1f, 2f, 0f)),
            ),
            ZcShape(8.dp, 16.dp, 24.dp, 9999.dp, 56.dp))

        val zonacardsDark = ZcTheme(ZcBrand.ZONACARDS, true, "Figtree",
            ZcColors(longArrayOf(
                0x66C084FC, // accentBd
                0x26A855F7, // accentBg
                0xFFC084FC, // accentFg
                0xFF0A0A0A, // bg
                0xFF404040, // border
                0xFF737373, // borderStrong
                0xFFF8AE23, // brandAccent
                0xFF000000, // brandPrimary
                0xFF172948, // brandSecondary
                0xFF25D366, // brandWhatsapp
                0xFF0B0F17, // cameraBg
                0x14FFFFFF, // cameraBtn
                0xFFFFFFFF, // cameraFg
                0x8C000000, // cameraMask
                0xFF93B4EC, // chart1
                0xFFFBBF24, // chart2
                0xFF2DD4BF, // chart3
                0xFFA78BFA, // chart4
                0xFFFB7185, // chart5
                0xFF94A3B8, // chart6
                0xFF0A0A0A, // codeBg
                0xFFF5F5F5, // codeFg
                0xFF93C5FD, // codeKey
                0xFFC4B5FD, // codeLiteral
                0xFFA3A3A3, // codeMuted
                0xFFFCD34D, // codeNumber
                0xFF6EE7B7, // codeString
                0x66F87171, // dangerBd
                0x26EF4444, // dangerBg
                0xFFF87171, // dangerFg
                0xFF111111, // deviceFrame
                0xFFB6C8E6, // emailHover
                0xFF111111, // emailInk
                0xFF666666, // emailMuted
                0xFFFFFFFF, // emailPaper
                0xFFE5E5E5, // emailRule
                0xFF2563EB, // emailSelected
                0xFF333333, // emailText
                0xFF737373, // fieldBd
                0xFF171717, // fieldBg
                0xFF60A5FA, // focus
                0x6660A5FA, // infoBd
                0x263B82F6, // infoBg
                0xFF60A5FA, // infoFg
                0xFFFFFFFF, // lockFg
                0xFF1E3A8A, // lockFrom
                0xFF0E1A30, // lockTo
                0xFF2B2B2B, // mapLand
                0xFF0A0A0A, // mapLine
                0xFF2D4066, // mapScope
                0xFF141414, // mapWater
                0xEBFFFFFF, // mediaControlBg
                0xFF111111, // mediaControlFg
                0x8C000000, // mediaOverlayBg
                0xFFFFFFFF, // mediaOverlayFg
                0xFFF5F5F5, // neutral100
                0xFFE5E5E5, // neutral200
                0xFFD4D4D4, // neutral300
                0xFFA3A3A3, // neutral400
                0xFF8E8E8E, // neutral450
                0xFFFAFAFA, // neutral50
                0xFF737373, // neutral500
                0xFF666666, // neutral550
                0xFF525252, // neutral600
                0xFF404040, // neutral700
                0xFF262626, // neutral800
                0xFF171717, // neutral900
                0xFF0A0A0A, // neutral950
                0xFF525252, // neutralBd
                0xFF262626, // neutralBg
                0xFFD4D4D4, // neutralFg
                0xFF000000, // onBrandAccent
                0xFF003B1B, // onBrandWhatsapp
                0xFF111111, // onPayPagoefectivo
                0xFF0B1626, // onPayPlin
                0xFFFFFFFF, // onPayPuntos
                0xFFFFFFFF, // onPayYape
                0xFF000000, // onPrimary
                0xFF0B1220, // onSecondary
                0x99000000, // overlay
                0xFFFFCC00, // payPagoefectivo
                0xFF00B5E2, // payPlin
                0xFFC41230, // payPuntos
                0xFF742284, // payYape
                0xFFFFFFFF, // primary
                0xD1FFFFFF, // pushBg
                0xFF111111, // pushFg
                0xFF555555, // pushMuted
                0xFFFFFFFF, // qrBg
                0xFF000000, // qrFg
                0xFFF4F9FF, // rowSelectedBg
                0x9E0A0E16, // scrimStrong
                0xFFC7D4EC, // secondary
                0xFF262626, // sidebarActiveBg
                0xFF171717, // sidebarBg
                0xFF262626, // sidebarBorder
                0x24FFFFFF, // sidebarBrandActiveBg
                0xFF172948, // sidebarBrandBg
                0x1AFFFFFF, // sidebarBrandBorder
                0xFFC7D4EC, // sidebarBrandFg
                0xFFFFFFFF, // sidebarBrandFgActive
                0x14FFFFFF, // sidebarBrandHoverBg
                0xFFA3A3A3, // sidebarFg
                0xFFFAFAFA, // sidebarFgActive
                0xFF262626, // sidebarHoverBg
                0xFFECEDEF, // sidebarTintBg
                0xFF000000, // ssoAppleBlack
                0xFFFFFFFF, // ssoAppleWhite
                0xFF8E918F, // ssoGoogleDarkBd
                0xFF131314, // ssoGoogleDarkBg
                0xFFE3E3E3, // ssoGoogleDarkFg
                0xFF747775, // ssoGoogleLightBd
                0xFFFFFFFF, // ssoGoogleLightBg
                0xFF1F1F1F, // ssoGoogleLightFg
                0xFFF8FAFF, // ssoGoogleLightHover
                0xFFF2F2F2, // ssoGoogleNeutralBg
                0xFF1F1F1F, // ssoGoogleNeutralFg
                0xFF2F2F2F, // ssoMsDarkBg
                0xFF8C8C8C, // ssoMsLightBd
                0xFF5E5E5E, // ssoMsLightFg
                0x664ADE80, // successBd
                0x2622C55E, // successBg
                0xFF4ADE80, // successFg
                0xFF171717, // surface
                0xFF262626, // surface2
                0xFF404040, // surface3
                0xFFFAFAFA, // text
                0xFFA3A3A3, // textMuted
                0xFF959595, // textSubtle
                0xFFFFFFFF, // thumb
                0x66FBBF24, // warningBd
                0x26F59E0B, // warningBg
                0xFFFBBF24, // warningFg
            )),
            ZcShadows(
                hairline = listOf(ZcShadowLayer(Color(0x14000000), 0f, 0f, 0f, 1f)),
                v1 = listOf(),
                v2 = listOf(ZcShadowLayer(Color(0x80000000), 0f, 24f, 48f, 0f)),
                xs = listOf(ZcShadowLayer(Color(0x1A000000), 0f, 1f, 2f, 0f)),
            ),
            ZcShape(8.dp, 16.dp, 24.dp, 9999.dp, 56.dp))

        val giftealoLight = ZcTheme(ZcBrand.GIFTEALO, false, "Lato",
            ZcColors(longArrayOf(
                0xFFD8B4FE, // accentBd
                0xFFFAF5FF, // accentBg
                0xFF7E22CE, // accentFg
                0xFFF5F8FC, // bg
                0xFFE5E5E5, // border
                0xFF8E8E8E, // borderStrong
                0xFF009EDE, // brandAccent
                0xFF000000, // brandPrimary
                0xFF172948, // brandSecondary
                0xFF25D366, // brandWhatsapp
                0xFF0B0F17, // cameraBg
                0x14FFFFFF, // cameraBtn
                0xFFFFFFFF, // cameraFg
                0x8C000000, // cameraMask
                0xFF172948, // chart1
                0xFF009EDE, // chart2
                0xFF0D9488, // chart3
                0xFF7C3AED, // chart4
                0xFFE11D48, // chart5
                0xFF64748B, // chart6
                0xFFF5F5F5, // codeBg
                0xFF000000, // codeFg
                0xFF1D4ED8, // codeKey
                0xFF7C3AED, // codeLiteral
                0xFF525252, // codeMuted
                0xFFA16207, // codeNumber
                0xFF047857, // codeString
                0xFFFCA5A5, // dangerBd
                0xFFFEF2F2, // dangerBg
                0xFFB91C1C, // dangerFg
                0xFF111111, // deviceFrame
                0xFFB6C8E6, // emailHover
                0xFF111111, // emailInk
                0xFF666666, // emailMuted
                0xFFFFFFFF, // emailPaper
                0xFFE5E5E5, // emailRule
                0xFF2563EB, // emailSelected
                0xFF333333, // emailText
                0xFF8E8E8E, // fieldBd
                0xFFFFFFFF, // fieldBg
                0xFF0077A8, // focus
                0xFF93C5FD, // infoBd
                0xFFEFF6FF, // infoBg
                0xFF1D4ED8, // infoFg
                0xFFFFFFFF, // lockFg
                0xFF1E3A8A, // lockFrom
                0xFF0E1A30, // lockTo
                0xFFE7E5E4, // mapLand
                0xFFFFFFFF, // mapLine
                0xFFC3D2EC, // mapScope
                0xFFF8FAFC, // mapWater
                0xEBFFFFFF, // mediaControlBg
                0xFF111111, // mediaControlFg
                0x8C000000, // mediaOverlayBg
                0xFFFFFFFF, // mediaOverlayFg
                0xFFF5F5F5, // neutral100
                0xFFE5E5E5, // neutral200
                0xFFD4D4D4, // neutral300
                0xFFA3A3A3, // neutral400
                0xFF8E8E8E, // neutral450
                0xFFFAFAFA, // neutral50
                0xFF737373, // neutral500
                0xFF666666, // neutral550
                0xFF525252, // neutral600
                0xFF404040, // neutral700
                0xFF262626, // neutral800
                0xFF171717, // neutral900
                0xFF0A0A0A, // neutral950
                0xFFD4D4D4, // neutralBd
                0xFFF5F5F5, // neutralBg
                0xFF404040, // neutralFg
                0xFF0B1626, // onBrandAccent
                0xFF003B1B, // onBrandWhatsapp
                0xFF111111, // onPayPagoefectivo
                0xFF0B1626, // onPayPlin
                0xFFFFFFFF, // onPayPuntos
                0xFFFFFFFF, // onPayYape
                0xFFFFFFFF, // onPrimary
                0xFFFFFFFF, // onSecondary
                0x73000000, // overlay
                0xFFFFCC00, // payPagoefectivo
                0xFF00B5E2, // payPlin
                0xFFC41230, // payPuntos
                0xFF742284, // payYape
                0xFF0077A8, // primary
                0xD1FFFFFF, // pushBg
                0xFF111111, // pushFg
                0xFF555555, // pushMuted
                0xFFFFFFFF, // qrBg
                0xFF000000, // qrFg
                0xFFF4F9FF, // rowSelectedBg
                0x9E0A0E16, // scrimStrong
                0xFF172948, // secondary
                0xFFF5F5F5, // sidebarActiveBg
                0xFFFFFFFF, // sidebarBg
                0xFFE5E5E5, // sidebarBorder
                0x24FFFFFF, // sidebarBrandActiveBg
                0xFF172948, // sidebarBrandBg
                0x1AFFFFFF, // sidebarBrandBorder
                0xFFC7D4EC, // sidebarBrandFg
                0xFFFFFFFF, // sidebarBrandFgActive
                0x14FFFFFF, // sidebarBrandHoverBg
                0xFF525252, // sidebarFg
                0xFF000000, // sidebarFgActive
                0xFFF5F5F5, // sidebarHoverBg
                0xFFECEDEF, // sidebarTintBg
                0xFF000000, // ssoAppleBlack
                0xFFFFFFFF, // ssoAppleWhite
                0xFF8E918F, // ssoGoogleDarkBd
                0xFF131314, // ssoGoogleDarkBg
                0xFFE3E3E3, // ssoGoogleDarkFg
                0xFF747775, // ssoGoogleLightBd
                0xFFFFFFFF, // ssoGoogleLightBg
                0xFF1F1F1F, // ssoGoogleLightFg
                0xFFF8FAFF, // ssoGoogleLightHover
                0xFFF2F2F2, // ssoGoogleNeutralBg
                0xFF1F1F1F, // ssoGoogleNeutralFg
                0xFF2F2F2F, // ssoMsDarkBg
                0xFF8C8C8C, // ssoMsLightBd
                0xFF5E5E5E, // ssoMsLightFg
                0xFF86EFAC, // successBd
                0xFFF0FDF4, // successBg
                0xFF15803D, // successFg
                0xFFFFFFFF, // surface
                0xFFF5F5F5, // surface2
                0xFFE5E5E5, // surface3
                0xFF000000, // text
                0xFF525252, // textMuted
                0xFF666666, // textSubtle
                0xFFFFFFFF, // thumb
                0xFFFCD34D, // warningBd
                0xFFFFFBEB, // warningBg
                0xFFB45309, // warningFg
            )),
            ZcShadows(
                hairline = listOf(ZcShadowLayer(Color(0x14000000), 0f, 0f, 0f, 1f)),
                v1 = listOf(ZcShadowLayer(Color(0x0A101828), 0f, 1f, 2f, 0f), ZcShadowLayer(Color(0x0F696C80), 0f, 8f, 24f, 0f)),
                v2 = listOf(ZcShadowLayer(Color(0x290F172A), 0f, 24f, 48f, 0f)),
                xs = listOf(ZcShadowLayer(Color(0x1A000000), 0f, 1f, 2f, 0f)),
            ),
            ZcShape(8.dp, 16.dp, 24.dp, 9999.dp, 56.dp))

        val giftealoDark = ZcTheme(ZcBrand.GIFTEALO, true, "Lato",
            ZcColors(longArrayOf(
                0x66C084FC, // accentBd
                0x26A855F7, // accentBg
                0xFFC084FC, // accentFg
                0xFF0A0A0A, // bg
                0xFF404040, // border
                0xFF737373, // borderStrong
                0xFF009EDE, // brandAccent
                0xFF000000, // brandPrimary
                0xFF172948, // brandSecondary
                0xFF25D366, // brandWhatsapp
                0xFF0B0F17, // cameraBg
                0x14FFFFFF, // cameraBtn
                0xFFFFFFFF, // cameraFg
                0x8C000000, // cameraMask
                0xFF93B4EC, // chart1
                0xFFFBBF24, // chart2
                0xFF2DD4BF, // chart3
                0xFFA78BFA, // chart4
                0xFFFB7185, // chart5
                0xFF94A3B8, // chart6
                0xFF0A0A0A, // codeBg
                0xFFF5F5F5, // codeFg
                0xFF93C5FD, // codeKey
                0xFFC4B5FD, // codeLiteral
                0xFFA3A3A3, // codeMuted
                0xFFFCD34D, // codeNumber
                0xFF6EE7B7, // codeString
                0x66F87171, // dangerBd
                0x26EF4444, // dangerBg
                0xFFF87171, // dangerFg
                0xFF111111, // deviceFrame
                0xFFB6C8E6, // emailHover
                0xFF111111, // emailInk
                0xFF666666, // emailMuted
                0xFFFFFFFF, // emailPaper
                0xFFE5E5E5, // emailRule
                0xFF2563EB, // emailSelected
                0xFF333333, // emailText
                0xFF737373, // fieldBd
                0xFF171717, // fieldBg
                0xFF60A5FA, // focus
                0x6660A5FA, // infoBd
                0x263B82F6, // infoBg
                0xFF60A5FA, // infoFg
                0xFFFFFFFF, // lockFg
                0xFF1E3A8A, // lockFrom
                0xFF0E1A30, // lockTo
                0xFF2B2B2B, // mapLand
                0xFF0A0A0A, // mapLine
                0xFF2D4066, // mapScope
                0xFF141414, // mapWater
                0xEBFFFFFF, // mediaControlBg
                0xFF111111, // mediaControlFg
                0x8C000000, // mediaOverlayBg
                0xFFFFFFFF, // mediaOverlayFg
                0xFFF5F5F5, // neutral100
                0xFFE5E5E5, // neutral200
                0xFFD4D4D4, // neutral300
                0xFFA3A3A3, // neutral400
                0xFF8E8E8E, // neutral450
                0xFFFAFAFA, // neutral50
                0xFF737373, // neutral500
                0xFF666666, // neutral550
                0xFF525252, // neutral600
                0xFF404040, // neutral700
                0xFF262626, // neutral800
                0xFF171717, // neutral900
                0xFF0A0A0A, // neutral950
                0xFF525252, // neutralBd
                0xFF262626, // neutralBg
                0xFFD4D4D4, // neutralFg
                0xFF0B1626, // onBrandAccent
                0xFF003B1B, // onBrandWhatsapp
                0xFF111111, // onPayPagoefectivo
                0xFF0B1626, // onPayPlin
                0xFFFFFFFF, // onPayPuntos
                0xFFFFFFFF, // onPayYape
                0xFF0B1626, // onPrimary
                0xFF0B1220, // onSecondary
                0x99000000, // overlay
                0xFFFFCC00, // payPagoefectivo
                0xFF00B5E2, // payPlin
                0xFFC41230, // payPuntos
                0xFF742284, // payYape
                0xFF4CC3F0, // primary
                0xD1FFFFFF, // pushBg
                0xFF111111, // pushFg
                0xFF555555, // pushMuted
                0xFFFFFFFF, // qrBg
                0xFF000000, // qrFg
                0xFFF4F9FF, // rowSelectedBg
                0x9E0A0E16, // scrimStrong
                0xFFBAE7FF, // secondary
                0xFF262626, // sidebarActiveBg
                0xFF171717, // sidebarBg
                0xFF262626, // sidebarBorder
                0x24FFFFFF, // sidebarBrandActiveBg
                0xFF172948, // sidebarBrandBg
                0x1AFFFFFF, // sidebarBrandBorder
                0xFFC7D4EC, // sidebarBrandFg
                0xFFFFFFFF, // sidebarBrandFgActive
                0x14FFFFFF, // sidebarBrandHoverBg
                0xFFA3A3A3, // sidebarFg
                0xFFFAFAFA, // sidebarFgActive
                0xFF262626, // sidebarHoverBg
                0xFFECEDEF, // sidebarTintBg
                0xFF000000, // ssoAppleBlack
                0xFFFFFFFF, // ssoAppleWhite
                0xFF8E918F, // ssoGoogleDarkBd
                0xFF131314, // ssoGoogleDarkBg
                0xFFE3E3E3, // ssoGoogleDarkFg
                0xFF747775, // ssoGoogleLightBd
                0xFFFFFFFF, // ssoGoogleLightBg
                0xFF1F1F1F, // ssoGoogleLightFg
                0xFFF8FAFF, // ssoGoogleLightHover
                0xFFF2F2F2, // ssoGoogleNeutralBg
                0xFF1F1F1F, // ssoGoogleNeutralFg
                0xFF2F2F2F, // ssoMsDarkBg
                0xFF8C8C8C, // ssoMsLightBd
                0xFF5E5E5E, // ssoMsLightFg
                0x664ADE80, // successBd
                0x2622C55E, // successBg
                0xFF4ADE80, // successFg
                0xFF171717, // surface
                0xFF262626, // surface2
                0xFF404040, // surface3
                0xFFFAFAFA, // text
                0xFFA3A3A3, // textMuted
                0xFF959595, // textSubtle
                0xFFFFFFFF, // thumb
                0x66FBBF24, // warningBd
                0x26F59E0B, // warningBg
                0xFFFBBF24, // warningFg
            )),
            ZcShadows(
                hairline = listOf(ZcShadowLayer(Color(0x14000000), 0f, 0f, 0f, 1f)),
                v1 = listOf(),
                v2 = listOf(ZcShadowLayer(Color(0x80000000), 0f, 24f, 48f, 0f)),
                xs = listOf(ZcShadowLayer(Color(0x1A000000), 0f, 1f, 2f, 0f)),
            ),
            ZcShape(8.dp, 16.dp, 24.dp, 9999.dp, 56.dp))

        val enjoyLight = ZcTheme(ZcBrand.ENJOY, false, "Outfit",
            ZcColors(longArrayOf(
                0xFFD8B4FE, // accentBd
                0xFFFAF5FF, // accentBg
                0xFF7E22CE, // accentFg
                0xFFFAFAFA, // bg
                0xFFE5E5E5, // border
                0xFF8E8E8E, // borderStrong
                0xFFF8AE23, // brandAccent
                0xFF000000, // brandPrimary
                0xFF172948, // brandSecondary
                0xFF25D366, // brandWhatsapp
                0xFF0B0F17, // cameraBg
                0x14FFFFFF, // cameraBtn
                0xFFFFFFFF, // cameraFg
                0x8C000000, // cameraMask
                0xFF172948, // chart1
                0xFFF59E0B, // chart2
                0xFF0D9488, // chart3
                0xFF7C3AED, // chart4
                0xFFE11D48, // chart5
                0xFF64748B, // chart6
                0xFFF5F5F5, // codeBg
                0xFF000000, // codeFg
                0xFF1D4ED8, // codeKey
                0xFF7C3AED, // codeLiteral
                0xFF525252, // codeMuted
                0xFFA16207, // codeNumber
                0xFF047857, // codeString
                0xFFFCA5A5, // dangerBd
                0xFFFEF2F2, // dangerBg
                0xFFB91C1C, // dangerFg
                0xFF111111, // deviceFrame
                0xFFB6C8E6, // emailHover
                0xFF111111, // emailInk
                0xFF666666, // emailMuted
                0xFFFFFFFF, // emailPaper
                0xFFE5E5E5, // emailRule
                0xFF2563EB, // emailSelected
                0xFF333333, // emailText
                0xFFD4D4D4, // fieldBd
                0xFFF5F5F5, // fieldBg
                0xFF2563EB, // focus
                0xFF93C5FD, // infoBd
                0xFFEFF6FF, // infoBg
                0xFF1D4ED8, // infoFg
                0xFFFFFFFF, // lockFg
                0xFF1E3A8A, // lockFrom
                0xFF0E1A30, // lockTo
                0xFFE7E5E4, // mapLand
                0xFFFFFFFF, // mapLine
                0xFFC3D2EC, // mapScope
                0xFFF8FAFC, // mapWater
                0xEBFFFFFF, // mediaControlBg
                0xFF111111, // mediaControlFg
                0x8C000000, // mediaOverlayBg
                0xFFFFFFFF, // mediaOverlayFg
                0xFFF5F5F5, // neutral100
                0xFFE5E5E5, // neutral200
                0xFFD4D4D4, // neutral300
                0xFFA3A3A3, // neutral400
                0xFF8E8E8E, // neutral450
                0xFFFAFAFA, // neutral50
                0xFF737373, // neutral500
                0xFF666666, // neutral550
                0xFF525252, // neutral600
                0xFF404040, // neutral700
                0xFF262626, // neutral800
                0xFF171717, // neutral900
                0xFF0A0A0A, // neutral950
                0xFFD4D4D4, // neutralBd
                0xFFF5F5F5, // neutralBg
                0xFF404040, // neutralFg
                0xFF000000, // onBrandAccent
                0xFF003B1B, // onBrandWhatsapp
                0xFF111111, // onPayPagoefectivo
                0xFF0B1626, // onPayPlin
                0xFFFFFFFF, // onPayPuntos
                0xFFFFFFFF, // onPayYape
                0xFFFFFFFF, // onPrimary
                0xFFFFFFFF, // onSecondary
                0x73000000, // overlay
                0xFFFFCC00, // payPagoefectivo
                0xFF00B5E2, // payPlin
                0xFFC41230, // payPuntos
                0xFF742284, // payYape
                0xFF000000, // primary
                0xD1FFFFFF, // pushBg
                0xFF111111, // pushFg
                0xFF555555, // pushMuted
                0xFFFFFFFF, // qrBg
                0xFF000000, // qrFg
                0xFFF4F9FF, // rowSelectedBg
                0x9E0A0E16, // scrimStrong
                0xFF172948, // secondary
                0xFFF5F5F5, // sidebarActiveBg
                0xFFFFFFFF, // sidebarBg
                0xFFE5E5E5, // sidebarBorder
                0x24FFFFFF, // sidebarBrandActiveBg
                0xFF172948, // sidebarBrandBg
                0x1AFFFFFF, // sidebarBrandBorder
                0xFFC7D4EC, // sidebarBrandFg
                0xFFFFFFFF, // sidebarBrandFgActive
                0x14FFFFFF, // sidebarBrandHoverBg
                0xFF525252, // sidebarFg
                0xFF000000, // sidebarFgActive
                0xFFF5F5F5, // sidebarHoverBg
                0xFFECEDEF, // sidebarTintBg
                0xFF000000, // ssoAppleBlack
                0xFFFFFFFF, // ssoAppleWhite
                0xFF8E918F, // ssoGoogleDarkBd
                0xFF131314, // ssoGoogleDarkBg
                0xFFE3E3E3, // ssoGoogleDarkFg
                0xFF747775, // ssoGoogleLightBd
                0xFFFFFFFF, // ssoGoogleLightBg
                0xFF1F1F1F, // ssoGoogleLightFg
                0xFFF8FAFF, // ssoGoogleLightHover
                0xFFF2F2F2, // ssoGoogleNeutralBg
                0xFF1F1F1F, // ssoGoogleNeutralFg
                0xFF2F2F2F, // ssoMsDarkBg
                0xFF8C8C8C, // ssoMsLightBd
                0xFF5E5E5E, // ssoMsLightFg
                0xFF86EFAC, // successBd
                0xFFF0FDF4, // successBg
                0xFF15803D, // successFg
                0xFFFFFFFF, // surface
                0xFFF5F5F5, // surface2
                0xFFE5E5E5, // surface3
                0xFF000000, // text
                0xFF525252, // textMuted
                0xFF666666, // textSubtle
                0xFFFFFFFF, // thumb
                0xFFFCD34D, // warningBd
                0xFFFFFBEB, // warningBg
                0xFFB45309, // warningFg
            )),
            ZcShadows(
                hairline = listOf(ZcShadowLayer(Color(0x14000000), 0f, 0f, 0f, 1f)),
                v1 = listOf(ZcShadowLayer(Color(0x0A101828), 0f, 1f, 2f, 0f), ZcShadowLayer(Color(0x0F696C80), 0f, 8f, 24f, 0f)),
                v2 = listOf(ZcShadowLayer(Color(0x290F172A), 0f, 24f, 48f, 0f)),
                xs = listOf(ZcShadowLayer(Color(0x1A000000), 0f, 1f, 2f, 0f)),
            ),
            ZcShape(24.dp, 28.dp, 28.dp, 9999.dp, 56.dp))

        val enjoyDark = ZcTheme(ZcBrand.ENJOY, true, "Outfit",
            ZcColors(longArrayOf(
                0x66C084FC, // accentBd
                0x26A855F7, // accentBg
                0xFFC084FC, // accentFg
                0xFF0A0A0A, // bg
                0xFF404040, // border
                0xFF737373, // borderStrong
                0xFFF8AE23, // brandAccent
                0xFF000000, // brandPrimary
                0xFF172948, // brandSecondary
                0xFF25D366, // brandWhatsapp
                0xFF0B0F17, // cameraBg
                0x14FFFFFF, // cameraBtn
                0xFFFFFFFF, // cameraFg
                0x8C000000, // cameraMask
                0xFF93B4EC, // chart1
                0xFFFBBF24, // chart2
                0xFF2DD4BF, // chart3
                0xFFA78BFA, // chart4
                0xFFFB7185, // chart5
                0xFF94A3B8, // chart6
                0xFF0A0A0A, // codeBg
                0xFFF5F5F5, // codeFg
                0xFF93C5FD, // codeKey
                0xFFC4B5FD, // codeLiteral
                0xFFA3A3A3, // codeMuted
                0xFFFCD34D, // codeNumber
                0xFF6EE7B7, // codeString
                0x66F87171, // dangerBd
                0x26EF4444, // dangerBg
                0xFFF87171, // dangerFg
                0xFF111111, // deviceFrame
                0xFFB6C8E6, // emailHover
                0xFF111111, // emailInk
                0xFF666666, // emailMuted
                0xFFFFFFFF, // emailPaper
                0xFFE5E5E5, // emailRule
                0xFF2563EB, // emailSelected
                0xFF333333, // emailText
                0xFF737373, // fieldBd
                0xFF171717, // fieldBg
                0xFF60A5FA, // focus
                0x6660A5FA, // infoBd
                0x263B82F6, // infoBg
                0xFF60A5FA, // infoFg
                0xFFFFFFFF, // lockFg
                0xFF1E3A8A, // lockFrom
                0xFF0E1A30, // lockTo
                0xFF2B2B2B, // mapLand
                0xFF0A0A0A, // mapLine
                0xFF2D4066, // mapScope
                0xFF141414, // mapWater
                0xEBFFFFFF, // mediaControlBg
                0xFF111111, // mediaControlFg
                0x8C000000, // mediaOverlayBg
                0xFFFFFFFF, // mediaOverlayFg
                0xFFF5F5F5, // neutral100
                0xFFE5E5E5, // neutral200
                0xFFD4D4D4, // neutral300
                0xFFA3A3A3, // neutral400
                0xFF8E8E8E, // neutral450
                0xFFFAFAFA, // neutral50
                0xFF737373, // neutral500
                0xFF666666, // neutral550
                0xFF525252, // neutral600
                0xFF404040, // neutral700
                0xFF262626, // neutral800
                0xFF171717, // neutral900
                0xFF0A0A0A, // neutral950
                0xFF525252, // neutralBd
                0xFF262626, // neutralBg
                0xFFD4D4D4, // neutralFg
                0xFF000000, // onBrandAccent
                0xFF003B1B, // onBrandWhatsapp
                0xFF111111, // onPayPagoefectivo
                0xFF0B1626, // onPayPlin
                0xFFFFFFFF, // onPayPuntos
                0xFFFFFFFF, // onPayYape
                0xFF000000, // onPrimary
                0xFF0B1220, // onSecondary
                0x99000000, // overlay
                0xFFFFCC00, // payPagoefectivo
                0xFF00B5E2, // payPlin
                0xFFC41230, // payPuntos
                0xFF742284, // payYape
                0xFFFFFFFF, // primary
                0xD1FFFFFF, // pushBg
                0xFF111111, // pushFg
                0xFF555555, // pushMuted
                0xFFFFFFFF, // qrBg
                0xFF000000, // qrFg
                0xFFF4F9FF, // rowSelectedBg
                0x9E0A0E16, // scrimStrong
                0xFFC7D4EC, // secondary
                0xFF262626, // sidebarActiveBg
                0xFF171717, // sidebarBg
                0xFF262626, // sidebarBorder
                0x24FFFFFF, // sidebarBrandActiveBg
                0xFF172948, // sidebarBrandBg
                0x1AFFFFFF, // sidebarBrandBorder
                0xFFC7D4EC, // sidebarBrandFg
                0xFFFFFFFF, // sidebarBrandFgActive
                0x14FFFFFF, // sidebarBrandHoverBg
                0xFFA3A3A3, // sidebarFg
                0xFFFAFAFA, // sidebarFgActive
                0xFF262626, // sidebarHoverBg
                0xFFECEDEF, // sidebarTintBg
                0xFF000000, // ssoAppleBlack
                0xFFFFFFFF, // ssoAppleWhite
                0xFF8E918F, // ssoGoogleDarkBd
                0xFF131314, // ssoGoogleDarkBg
                0xFFE3E3E3, // ssoGoogleDarkFg
                0xFF747775, // ssoGoogleLightBd
                0xFFFFFFFF, // ssoGoogleLightBg
                0xFF1F1F1F, // ssoGoogleLightFg
                0xFFF8FAFF, // ssoGoogleLightHover
                0xFFF2F2F2, // ssoGoogleNeutralBg
                0xFF1F1F1F, // ssoGoogleNeutralFg
                0xFF2F2F2F, // ssoMsDarkBg
                0xFF8C8C8C, // ssoMsLightBd
                0xFF5E5E5E, // ssoMsLightFg
                0x664ADE80, // successBd
                0x2622C55E, // successBg
                0xFF4ADE80, // successFg
                0xFF171717, // surface
                0xFF262626, // surface2
                0xFF404040, // surface3
                0xFFFAFAFA, // text
                0xFFA3A3A3, // textMuted
                0xFF959595, // textSubtle
                0xFFFFFFFF, // thumb
                0x66FBBF24, // warningBd
                0x26F59E0B, // warningBg
                0xFFFBBF24, // warningFg
            )),
            ZcShadows(
                hairline = listOf(ZcShadowLayer(Color(0x14000000), 0f, 0f, 0f, 1f)),
                v1 = listOf(),
                v2 = listOf(ZcShadowLayer(Color(0x80000000), 0f, 24f, 48f, 0f)),
                xs = listOf(ZcShadowLayer(Color(0x1A000000), 0f, 1f, 2f, 0f)),
            ),
            ZcShape(24.dp, 28.dp, 28.dp, 9999.dp, 56.dp))

        val motivaLight = ZcTheme(ZcBrand.MOTIVA, false, "Geist",
            ZcColors(longArrayOf(
                0xFFD8B4FE, // accentBd
                0xFFFAF5FF, // accentBg
                0xFF7E22CE, // accentFg
                0xFFFAFAFA, // bg
                0xFFE5E5E5, // border
                0xFF8E8E8E, // borderStrong
                0xFF14B8A6, // brandAccent
                0xFF000000, // brandPrimary
                0xFF172948, // brandSecondary
                0xFF25D366, // brandWhatsapp
                0xFF0B0F17, // cameraBg
                0x14FFFFFF, // cameraBtn
                0xFFFFFFFF, // cameraFg
                0x8C000000, // cameraMask
                0xFF0F766E, // chart1
                0xFFF59E0B, // chart2
                0xFF0D9488, // chart3
                0xFF7C3AED, // chart4
                0xFFE11D48, // chart5
                0xFF64748B, // chart6
                0xFFF5F5F5, // codeBg
                0xFF000000, // codeFg
                0xFF1D4ED8, // codeKey
                0xFF7C3AED, // codeLiteral
                0xFF525252, // codeMuted
                0xFFA16207, // codeNumber
                0xFF047857, // codeString
                0xFFFCA5A5, // dangerBd
                0xFFFEF2F2, // dangerBg
                0xFFB91C1C, // dangerFg
                0xFF111111, // deviceFrame
                0xFFB6C8E6, // emailHover
                0xFF111111, // emailInk
                0xFF666666, // emailMuted
                0xFFFFFFFF, // emailPaper
                0xFFE5E5E5, // emailRule
                0xFF2563EB, // emailSelected
                0xFF333333, // emailText
                0xFF8E8E8E, // fieldBd
                0xFFFFFFFF, // fieldBg
                0xFF2563EB, // focus
                0xFF93C5FD, // infoBd
                0xFFEFF6FF, // infoBg
                0xFF1D4ED8, // infoFg
                0xFFFFFFFF, // lockFg
                0xFF1E3A8A, // lockFrom
                0xFF0E1A30, // lockTo
                0xFFE7E5E4, // mapLand
                0xFFFFFFFF, // mapLine
                0xFFC3D2EC, // mapScope
                0xFFF8FAFC, // mapWater
                0xEBFFFFFF, // mediaControlBg
                0xFF111111, // mediaControlFg
                0x8C000000, // mediaOverlayBg
                0xFFFFFFFF, // mediaOverlayFg
                0xFFF5F5F5, // neutral100
                0xFFE5E5E5, // neutral200
                0xFFD4D4D4, // neutral300
                0xFFA3A3A3, // neutral400
                0xFF8E8E8E, // neutral450
                0xFFFAFAFA, // neutral50
                0xFF737373, // neutral500
                0xFF666666, // neutral550
                0xFF525252, // neutral600
                0xFF404040, // neutral700
                0xFF262626, // neutral800
                0xFF171717, // neutral900
                0xFF0A0A0A, // neutral950
                0xFFD4D4D4, // neutralBd
                0xFFF5F5F5, // neutralBg
                0xFF404040, // neutralFg
                0xFF000000, // onBrandAccent
                0xFF003B1B, // onBrandWhatsapp
                0xFF111111, // onPayPagoefectivo
                0xFF0B1626, // onPayPlin
                0xFFFFFFFF, // onPayPuntos
                0xFFFFFFFF, // onPayYape
                0xFFFFFFFF, // onPrimary
                0xFFFFFFFF, // onSecondary
                0x73000000, // overlay
                0xFFFFCC00, // payPagoefectivo
                0xFF00B5E2, // payPlin
                0xFFC41230, // payPuntos
                0xFF742284, // payYape
                0xFF171717, // primary
                0xD1FFFFFF, // pushBg
                0xFF111111, // pushFg
                0xFF555555, // pushMuted
                0xFFFFFFFF, // qrBg
                0xFF000000, // qrFg
                0xFFF4F9FF, // rowSelectedBg
                0x9E0A0E16, // scrimStrong
                0xFF0F3D3A, // secondary
                0xFFF5F5F5, // sidebarActiveBg
                0xFFFFFFFF, // sidebarBg
                0xFFE5E5E5, // sidebarBorder
                0x24FFFFFF, // sidebarBrandActiveBg
                0xFF172948, // sidebarBrandBg
                0x1AFFFFFF, // sidebarBrandBorder
                0xFFC7D4EC, // sidebarBrandFg
                0xFFFFFFFF, // sidebarBrandFgActive
                0x14FFFFFF, // sidebarBrandHoverBg
                0xFF525252, // sidebarFg
                0xFF000000, // sidebarFgActive
                0xFFF5F5F5, // sidebarHoverBg
                0xFFECEDEF, // sidebarTintBg
                0xFF000000, // ssoAppleBlack
                0xFFFFFFFF, // ssoAppleWhite
                0xFF8E918F, // ssoGoogleDarkBd
                0xFF131314, // ssoGoogleDarkBg
                0xFFE3E3E3, // ssoGoogleDarkFg
                0xFF747775, // ssoGoogleLightBd
                0xFFFFFFFF, // ssoGoogleLightBg
                0xFF1F1F1F, // ssoGoogleLightFg
                0xFFF8FAFF, // ssoGoogleLightHover
                0xFFF2F2F2, // ssoGoogleNeutralBg
                0xFF1F1F1F, // ssoGoogleNeutralFg
                0xFF2F2F2F, // ssoMsDarkBg
                0xFF8C8C8C, // ssoMsLightBd
                0xFF5E5E5E, // ssoMsLightFg
                0xFF86EFAC, // successBd
                0xFFF0FDF4, // successBg
                0xFF15803D, // successFg
                0xFFFFFFFF, // surface
                0xFFF5F5F5, // surface2
                0xFFE5E5E5, // surface3
                0xFF000000, // text
                0xFF525252, // textMuted
                0xFF666666, // textSubtle
                0xFFFFFFFF, // thumb
                0xFFFCD34D, // warningBd
                0xFFFFFBEB, // warningBg
                0xFFB45309, // warningFg
            )),
            ZcShadows(
                hairline = listOf(ZcShadowLayer(Color(0x14000000), 0f, 0f, 0f, 1f)),
                v1 = listOf(ZcShadowLayer(Color(0x0A101828), 0f, 1f, 2f, 0f), ZcShadowLayer(Color(0x0F696C80), 0f, 8f, 24f, 0f)),
                v2 = listOf(ZcShadowLayer(Color(0x290F172A), 0f, 24f, 48f, 0f)),
                xs = listOf(ZcShadowLayer(Color(0x1A000000), 0f, 1f, 2f, 0f)),
            ),
            ZcShape(8.dp, 16.dp, 24.dp, 9999.dp, 56.dp))

        val motivaDark = ZcTheme(ZcBrand.MOTIVA, true, "Geist",
            ZcColors(longArrayOf(
                0x66C084FC, // accentBd
                0x26A855F7, // accentBg
                0xFFC084FC, // accentFg
                0xFF0A0A0A, // bg
                0xFF404040, // border
                0xFF737373, // borderStrong
                0xFF14B8A6, // brandAccent
                0xFF000000, // brandPrimary
                0xFF172948, // brandSecondary
                0xFF25D366, // brandWhatsapp
                0xFF0B0F17, // cameraBg
                0x14FFFFFF, // cameraBtn
                0xFFFFFFFF, // cameraFg
                0x8C000000, // cameraMask
                0xFF93B4EC, // chart1
                0xFFFBBF24, // chart2
                0xFF2DD4BF, // chart3
                0xFFA78BFA, // chart4
                0xFFFB7185, // chart5
                0xFF94A3B8, // chart6
                0xFF0A0A0A, // codeBg
                0xFFF5F5F5, // codeFg
                0xFF93C5FD, // codeKey
                0xFFC4B5FD, // codeLiteral
                0xFFA3A3A3, // codeMuted
                0xFFFCD34D, // codeNumber
                0xFF6EE7B7, // codeString
                0x66F87171, // dangerBd
                0x26EF4444, // dangerBg
                0xFFF87171, // dangerFg
                0xFF111111, // deviceFrame
                0xFFB6C8E6, // emailHover
                0xFF111111, // emailInk
                0xFF666666, // emailMuted
                0xFFFFFFFF, // emailPaper
                0xFFE5E5E5, // emailRule
                0xFF2563EB, // emailSelected
                0xFF333333, // emailText
                0xFF737373, // fieldBd
                0xFF171717, // fieldBg
                0xFF60A5FA, // focus
                0x6660A5FA, // infoBd
                0x263B82F6, // infoBg
                0xFF60A5FA, // infoFg
                0xFFFFFFFF, // lockFg
                0xFF1E3A8A, // lockFrom
                0xFF0E1A30, // lockTo
                0xFF2B2B2B, // mapLand
                0xFF0A0A0A, // mapLine
                0xFF2D4066, // mapScope
                0xFF141414, // mapWater
                0xEBFFFFFF, // mediaControlBg
                0xFF111111, // mediaControlFg
                0x8C000000, // mediaOverlayBg
                0xFFFFFFFF, // mediaOverlayFg
                0xFFF5F5F5, // neutral100
                0xFFE5E5E5, // neutral200
                0xFFD4D4D4, // neutral300
                0xFFA3A3A3, // neutral400
                0xFF8E8E8E, // neutral450
                0xFFFAFAFA, // neutral50
                0xFF737373, // neutral500
                0xFF666666, // neutral550
                0xFF525252, // neutral600
                0xFF404040, // neutral700
                0xFF262626, // neutral800
                0xFF171717, // neutral900
                0xFF0A0A0A, // neutral950
                0xFF525252, // neutralBd
                0xFF262626, // neutralBg
                0xFFD4D4D4, // neutralFg
                0xFF000000, // onBrandAccent
                0xFF003B1B, // onBrandWhatsapp
                0xFF111111, // onPayPagoefectivo
                0xFF0B1626, // onPayPlin
                0xFFFFFFFF, // onPayPuntos
                0xFFFFFFFF, // onPayYape
                0xFF000000, // onPrimary
                0xFF0B1220, // onSecondary
                0x99000000, // overlay
                0xFFFFCC00, // payPagoefectivo
                0xFF00B5E2, // payPlin
                0xFFC41230, // payPuntos
                0xFF742284, // payYape
                0xFFFFFFFF, // primary
                0xD1FFFFFF, // pushBg
                0xFF111111, // pushFg
                0xFF555555, // pushMuted
                0xFFFFFFFF, // qrBg
                0xFF000000, // qrFg
                0xFFF4F9FF, // rowSelectedBg
                0x9E0A0E16, // scrimStrong
                0xFFC7D4EC, // secondary
                0xFF262626, // sidebarActiveBg
                0xFF171717, // sidebarBg
                0xFF262626, // sidebarBorder
                0x24FFFFFF, // sidebarBrandActiveBg
                0xFF172948, // sidebarBrandBg
                0x1AFFFFFF, // sidebarBrandBorder
                0xFFC7D4EC, // sidebarBrandFg
                0xFFFFFFFF, // sidebarBrandFgActive
                0x14FFFFFF, // sidebarBrandHoverBg
                0xFFA3A3A3, // sidebarFg
                0xFFFAFAFA, // sidebarFgActive
                0xFF262626, // sidebarHoverBg
                0xFFECEDEF, // sidebarTintBg
                0xFF000000, // ssoAppleBlack
                0xFFFFFFFF, // ssoAppleWhite
                0xFF8E918F, // ssoGoogleDarkBd
                0xFF131314, // ssoGoogleDarkBg
                0xFFE3E3E3, // ssoGoogleDarkFg
                0xFF747775, // ssoGoogleLightBd
                0xFFFFFFFF, // ssoGoogleLightBg
                0xFF1F1F1F, // ssoGoogleLightFg
                0xFFF8FAFF, // ssoGoogleLightHover
                0xFFF2F2F2, // ssoGoogleNeutralBg
                0xFF1F1F1F, // ssoGoogleNeutralFg
                0xFF2F2F2F, // ssoMsDarkBg
                0xFF8C8C8C, // ssoMsLightBd
                0xFF5E5E5E, // ssoMsLightFg
                0x664ADE80, // successBd
                0x2622C55E, // successBg
                0xFF4ADE80, // successFg
                0xFF171717, // surface
                0xFF262626, // surface2
                0xFF404040, // surface3
                0xFFFAFAFA, // text
                0xFFA3A3A3, // textMuted
                0xFF959595, // textSubtle
                0xFFFFFFFF, // thumb
                0x66FBBF24, // warningBd
                0x26F59E0B, // warningBg
                0xFFFBBF24, // warningFg
            )),
            ZcShadows(
                hairline = listOf(ZcShadowLayer(Color(0x14000000), 0f, 0f, 0f, 1f)),
                v1 = listOf(),
                v2 = listOf(ZcShadowLayer(Color(0x80000000), 0f, 24f, 48f, 0f)),
                xs = listOf(ZcShadowLayer(Color(0x1A000000), 0f, 1f, 2f, 0f)),
            ),
            ZcShape(8.dp, 16.dp, 24.dp, 9999.dp, 56.dp))

    }
}

val LocalZcTheme = staticCompositionLocalOf { ZcTheme.zonacardsLight }

/** Espaciado en dp (1 px CSS = 1 dp). */
object ZcSpace {
    val v1 = 4.dp
    val v2 = 8.dp
    val v3 = 12.dp
    val v4 = 16.dp
    val v5 = 20.dp
    val v6 = 24.dp
    val v8 = 32.dp
    val v10 = 40.dp
    val v12 = 48.dp
}

/** Radios de esquina en dp. */
object ZcRadius {
    val xs = 6.dp
    val ms = 12.dp
    val sm = 8.dp
    val md = 16.dp
    val lg = 24.dp
    val full = 9999.dp
}

/** Espaciado semántico en dp: qué separación va entre qué elementos (campos, bloques, secciones, tarjetas) y los márgenes de página. Valores de teléfono. */
object ZcSpacing {
    val inline = 8.dp
    val group = 12.dp
    val field = 16.dp
    val fieldX = 20.dp
    val block = 16.dp
    val pageBlock = 16.dp
    val card = 16.dp
    val cardInset = 16.dp
    val section = 40.dp
    val marginPage = 16.dp
    val marginPageY = 24.dp
    val contentMax = 1200.dp
    val contentNarrow = 880.dp
}

/** Medidas de componentes en dp. Toque mínimo en Android: 48 dp. */
object ZcSize {
    val target = 56.dp
    val targetSm = 44.dp
    val iconBtn = 48.dp
    val line = 20.dp
    val topbarH = 68.dp
    val drawerW = 460.dp
    val modalW = 520.dp
    val modalWLg = 760.dp
    val sheetW = 560.dp
    val tableRow = 56.dp
    val tableRowCompact = 44.dp
    val cardWSm = 192.dp
    val cardW = 288.dp
    val cardWLg = 320.dp
}

/** Escala tipográfica en sp: sigue la escala de fuente del sistema. */
object ZcType {
    val xxs = TextStyle(fontSize = 10.sp, lineHeight = 14.sp)
    val tiny = TextStyle(fontSize = 11.sp, lineHeight = 16.sp)
    val caption = TextStyle(fontSize = 13.sp, lineHeight = 18.sp)
    val bodySm = TextStyle(fontSize = 14.5.sp, lineHeight = 21.sp)
    val body = TextStyle(fontSize = 15.sp, lineHeight = 22.sp)
    val titleSm = TextStyle(fontSize = 17.sp, lineHeight = 24.sp)
    val title = TextStyle(fontSize = 19.sp, lineHeight = 26.sp)
    val heading = TextStyle(fontSize = 22.sp, lineHeight = 28.sp)
    val displaySm = TextStyle(fontSize = 26.sp, lineHeight = 34.sp)
    val display = TextStyle(fontSize = 30.sp, lineHeight = 36.sp)
    val displayLg = TextStyle(fontSize = 34.sp, lineHeight = 40.sp)
}

/** Movimiento: duraciones en ms y curvas. Respeta "Quitar animaciones" (ANIMATOR_DURATION_SCALE = 0). */
object ZcMotion {
    const val default = 160
    const val fast = 120
    const val base = 200
    const val slow = 280
    const val exit = 160
    val easeEasing = CubicBezierEasing(0.2f, 0.7f, 0.2f, 1f)
    val standardEasing = CubicBezierEasing(0.2f, 0f, 0f, 1f)
    val enterEasing = CubicBezierEasing(0.32f, 0.72f, 0f, 1f)
    val exitEasing = CubicBezierEasing(0.3f, 0f, 0.8f, 0.15f)
}
