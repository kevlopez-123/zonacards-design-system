package com.zonacards.ui.compose

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import com.zonacards.ui.tokens.LocalZcTheme
import com.zonacards.ui.tokens.ZcBrand
import com.zonacards.ui.tokens.ZcColors
import com.zonacards.ui.tokens.ZcFonts
import com.zonacards.ui.tokens.ZcTheme
import com.zonacards.ui.tokens.ZcType

/** Color del texto e íconos dentro de un componente (como `currentColor` en la web). */
val LocalZcContentColor = compositionLocalOf { Color.Unspecified }
/** Tipografía de la marca activa. */
val LocalZcFontFamily = staticCompositionLocalOf<FontFamily> { FontFamily.Default }
/** Sobre una superficie de color primario (barra de acciones masivas): los botones se invierten, como `zc-on-primary`. */
val LocalZcOnPrimary = compositionLocalOf { false }

/**
 * Tema Zonacards: marca, modo claro u oscuro y tipografía. Envuelve toda la app (o cada pantalla de prueba).
 * Los componentes leen los colores de `ZonacardsTheme.colors`; nunca usan colores fijos.
 */
@Composable
fun ZonacardsTheme(brand: ZcBrand = ZcBrand.ZONACARDS, dark: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val theme = ZcTheme.resolve(brand, dark)
    CompositionLocalProvider(
        LocalZcTheme provides theme,
        LocalZcFontFamily provides ZcFonts.forBrand(brand),
        LocalZcContentColor provides theme.colors.text,
        content = content,
    )
}

object ZonacardsTheme {
    val colors: ZcColors @Composable @ReadOnlyComposable get() = LocalZcTheme.current.colors
    val isDark: Boolean @Composable @ReadOnlyComposable get() = LocalZcTheme.current.isDark
}

/** Texto con la tipografía de la marca y el color del contenido. Prefiere saltos de línea antes que truncar. */
@Composable
fun ZcText(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = ZcType.body,
    color: Color = LocalZcContentColor.current,
    weight: FontWeight? = null,
    maxLines: Int = Int.MAX_VALUE,
    textAlign: androidx.compose.ui.text.style.TextAlign? = null,
) {
    BasicText(
        text = text,
        modifier = modifier,
        style = style.copy(color = color, fontFamily = LocalZcFontFamily.current, fontWeight = weight ?: style.fontWeight, textAlign = textAlign ?: style.textAlign),
        maxLines = maxLines,
        overflow = if (maxLines == Int.MAX_VALUE) TextOverflow.Clip else TextOverflow.Ellipsis,
    )
}
