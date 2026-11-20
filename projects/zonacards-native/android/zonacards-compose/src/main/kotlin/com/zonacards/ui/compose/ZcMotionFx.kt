package com.zonacards.ui.compose

import android.provider.Settings
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.ZcMotion
import kotlinx.coroutines.delay

/** Verdadero si la persona apagó las animaciones del sistema (Opciones de desarrollador o Accesibilidad > Quitar animaciones). */
@Composable
fun zcReducedMotion(): Boolean {
    val ctx = LocalContext.current
    return remember { Settings.Global.getFloat(ctx.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f }
}

private val SoftExit = CubicBezierEasing(0.2f, 0f, 0f, 1f)

/**
 * Entrada escalonada de los elementos de una lista (microinteracción de Enjoy Beneficios): cada uno aparece con fundido y sube
 * 12 dp, `índice × 60 ms` después del anterior (hasta 6 escalones para no hacer esperar). Solo la primera vez que se compone el
 * elemento y sin movimiento si las animaciones del sistema están apagadas.
 */
fun Modifier.zcStaggeredEntry(index: Int): Modifier = composed {
    val still = zcReducedMotion()
    val progress = remember { Animatable(if (still) 1f else 0f) }
    LaunchedEffect(Unit) {
        if (still) return@LaunchedEffect
        delay(60L * index.coerceIn(0, 6))
        progress.animateTo(1f, tween(ZcMotion.slow, easing = SoftExit))
    }
    graphicsLayer {
        alpha = progress.value
        translationY = (1f - progress.value) * 12.dp.toPx()
    }
}
