// Archivo generado por scripts/build-native.mjs. No editar a mano.
package com.zonacards.ui.tokens

import androidx.annotation.DrawableRes

/** Banderas 4:3 por código ISO en minúsculas. */
object ZcFlags {
    @DrawableRes
    fun of(code: String): Int? = when (code.lowercase()) {
        "pe" -> R.drawable.zc_flag_pe
        "ec" -> R.drawable.zc_flag_ec
        "bo" -> R.drawable.zc_flag_bo
        "co" -> R.drawable.zc_flag_co
        "cl" -> R.drawable.zc_flag_cl
        "mx" -> R.drawable.zc_flag_mx
        "us" -> R.drawable.zc_flag_us
        "ar" -> R.drawable.zc_flag_ar
        "br" -> R.drawable.zc_flag_br
        "es" -> R.drawable.zc_flag_es
        else -> null
    }
}
