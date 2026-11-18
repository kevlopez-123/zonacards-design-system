// Archivo generado por scripts/build-native.mjs. No editar a mano.
@file:OptIn(ExperimentalTextApi::class)
package com.zonacards.ui.tokens

import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight

/** Tipografía de cada marca (Google Fonts, OFL). */
object ZcFonts {
    val zonacards = FontFamily(
        Font(R.font.figtree, FontWeight.W300, variationSettings = FontVariation.Settings(FontVariation.weight(300))),
        Font(R.font.figtree, FontWeight.W400, variationSettings = FontVariation.Settings(FontVariation.weight(400))),
        Font(R.font.figtree, FontWeight.W500, variationSettings = FontVariation.Settings(FontVariation.weight(500))),
        Font(R.font.figtree, FontWeight.W600, variationSettings = FontVariation.Settings(FontVariation.weight(600))),
        Font(R.font.figtree, FontWeight.W700, variationSettings = FontVariation.Settings(FontVariation.weight(700))),
        Font(R.font.figtree, FontWeight.W800, variationSettings = FontVariation.Settings(FontVariation.weight(800))),
        Font(R.font.figtree, FontWeight.W900, variationSettings = FontVariation.Settings(FontVariation.weight(900))),
    )
    val giftealo = FontFamily(
        Font(R.font.lato_light, FontWeight.W300),
        Font(R.font.lato_regular, FontWeight.W400),
        Font(R.font.lato_bold, FontWeight.W700),
        Font(R.font.lato_black, FontWeight.W900),
    )
    val enjoy = FontFamily(
        Font(R.font.outfit, FontWeight.W300, variationSettings = FontVariation.Settings(FontVariation.weight(300))),
        Font(R.font.outfit, FontWeight.W400, variationSettings = FontVariation.Settings(FontVariation.weight(400))),
        Font(R.font.outfit, FontWeight.W500, variationSettings = FontVariation.Settings(FontVariation.weight(500))),
        Font(R.font.outfit, FontWeight.W600, variationSettings = FontVariation.Settings(FontVariation.weight(600))),
        Font(R.font.outfit, FontWeight.W700, variationSettings = FontVariation.Settings(FontVariation.weight(700))),
        Font(R.font.outfit, FontWeight.W800, variationSettings = FontVariation.Settings(FontVariation.weight(800))),
        Font(R.font.outfit, FontWeight.W900, variationSettings = FontVariation.Settings(FontVariation.weight(900))),
    )
    val motiva = FontFamily(
        Font(R.font.geist, FontWeight.W300, variationSettings = FontVariation.Settings(FontVariation.weight(300))),
        Font(R.font.geist, FontWeight.W400, variationSettings = FontVariation.Settings(FontVariation.weight(400))),
        Font(R.font.geist, FontWeight.W500, variationSettings = FontVariation.Settings(FontVariation.weight(500))),
        Font(R.font.geist, FontWeight.W600, variationSettings = FontVariation.Settings(FontVariation.weight(600))),
        Font(R.font.geist, FontWeight.W700, variationSettings = FontVariation.Settings(FontVariation.weight(700))),
        Font(R.font.geist, FontWeight.W800, variationSettings = FontVariation.Settings(FontVariation.weight(800))),
        Font(R.font.geist, FontWeight.W900, variationSettings = FontVariation.Settings(FontVariation.weight(900))),
    )

    fun forBrand(brand: ZcBrand): FontFamily = when (brand) {
        ZcBrand.ZONACARDS -> zonacards
        ZcBrand.GIFTEALO -> giftealo
        ZcBrand.ENJOY -> enjoy
        ZcBrand.MOTIVA -> motiva
    }
}
