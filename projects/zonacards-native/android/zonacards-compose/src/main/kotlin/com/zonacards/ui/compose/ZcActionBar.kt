package com.zonacards.ui.compose

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcMotion
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcType

/**
 * Barra de acciones sobre una selección múltiple (equivale a ActionBar de HeroUI y a `zc-action-bar`): «N seleccionados», las acciones
 * y una X para quitar la selección. Aparece (sube y se funde) solo con `count` > 0 y TalkBack anuncia el conteo. La pone quien la usa,
 * normalmente abajo y al centro de la pantalla (`Modifier.align(Alignment.BottomCenter).navigationBarsPadding()`).
 * Es un teléfono: una acción con ícono se muestra solo con el ícono (su texto es el nombre accesible) y una sin ícono, con su texto.
 * Una acción deshabilitada con `disabledReason` lo dice como estado para TalkBack; `danger` usa el botón suave de peligro.
 * Usa [ZcAction] como el menú de acciones (`id`, `label`, `icon`, `danger`, `disabledReason`).
 */
@Composable
fun ZcActionBar(
    count: Int,
    actions: List<ZcAction>,
    onAction: (String) -> Unit,
    onClear: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val shape = RoundedCornerShape(ZonacardsTheme.shape.card)
    AnimatedVisibility(
        count > 0, modifier,
        enter = slideInVertically(tween(ZcMotion.base)) { it / 2 } + fadeIn(tween(ZcMotion.base)),
        exit = slideOutVertically(tween(ZcMotion.exit)) { it / 2 } + fadeOut(tween(ZcMotion.exit)),
    ) {
        CompositionLocalProvider(LocalZcOnPrimary provides true) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp).shadow(8.dp, shape).clip(shape).background(c.primary)
                    .heightIn(min = 56.dp).padding(start = 16.dp, end = 4.dp)
                    .semantics { contentDescription = ctx.getString(R.string.zc_ui_acciones_seleccion) },
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                ZcText(
                    ctx.getString(R.string.zc_ui_n_seleccionados, count.toString()), Modifier.weight(1f).semantics { liveRegion = LiveRegionMode.Polite },
                    style = ZcType.body, color = c.onPrimary, weight = androidx.compose.ui.text.font.FontWeight.Medium,
                )
                actions.forEach { a ->
                    val variant = if (a.danger) ZcButtonVariant.DANGER_SOFT else ZcButtonVariant.GHOST
                    val enabled = a.disabledReason == null
                    val reason: Modifier = if (a.disabledReason != null) Modifier.semantics { stateDescription = a.disabledReason } else Modifier
                    Box(reason) {
                        if (a.icon != null) ZcIconButton(a.icon, a.label, { onAction(a.id) }, variant = variant, enabled = enabled, small = true)
                        else ZcButton(a.label, { onAction(a.id) }, variant = variant, size = ZcButtonSize.SM, enabled = enabled)
                    }
                }
                ZcIconButton(ZcIcons.lX, ctx.getString(R.string.zc_ui_quitar_seleccion), onClear, small = true)
            }
        }
    }
}
