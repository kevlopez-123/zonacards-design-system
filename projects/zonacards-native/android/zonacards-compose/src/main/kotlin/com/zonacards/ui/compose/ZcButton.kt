package com.zonacards.ui.compose

import androidx.annotation.DrawableRes
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.indication
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.LocalIndication
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcMotion
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType

enum class ZcButtonVariant { PRIMARY, SECONDARY, OUTLINE, GHOST, DANGER, DANGER_SOFT, LINK }
enum class ZcButtonSize { MD, SM }

private data class ButtonColors(val bg: Color, val fg: Color, val border: Color)

@Composable
private fun buttonColors(variant: ZcButtonVariant): ButtonColors {
    val c = ZonacardsTheme.colors
    val onPrimary = LocalZcOnPrimary.current
    if (onPrimary) return when (variant) {
        // Sobre color primario: primary pasa a claro con texto de marca; los demás, a texto claro.
        ZcButtonVariant.PRIMARY -> ButtonColors(c.onPrimary, c.primary, Color.Transparent)
        ZcButtonVariant.OUTLINE -> ButtonColors(Color.Transparent, c.onPrimary, c.onPrimary.copy(alpha = 0.5f))
        ZcButtonVariant.SECONDARY, ZcButtonVariant.GHOST, ZcButtonVariant.LINK -> ButtonColors(Color.Transparent, c.onPrimary, Color.Transparent)
        ZcButtonVariant.DANGER -> ButtonColors(c.dangerFg, if (ZonacardsTheme.isDark) Color.Black else Color.White, Color.Transparent)
        ZcButtonVariant.DANGER_SOFT -> ButtonColors(c.dangerBg, c.dangerFg, c.dangerBd)
    }
    return when (variant) {
        ZcButtonVariant.PRIMARY -> ButtonColors(c.primary, c.onPrimary, Color.Transparent)
        ZcButtonVariant.SECONDARY -> ButtonColors(c.secondary, c.onSecondary, Color.Transparent)
        ZcButtonVariant.OUTLINE -> ButtonColors(c.surface, c.text, c.borderStrong)
        ZcButtonVariant.GHOST -> ButtonColors(Color.Transparent, c.text, Color.Transparent)
        ZcButtonVariant.DANGER -> ButtonColors(c.dangerFg, if (ZonacardsTheme.isDark) Color.Black else Color.White, Color.Transparent)
        ZcButtonVariant.DANGER_SOFT -> ButtonColors(c.dangerBg, c.dangerFg, c.dangerBd)
        ZcButtonVariant.LINK -> ButtonColors(Color.Transparent, c.text, Color.Transparent)
    }
}

/**
 * Botón · Etiqueta con verbo + objeto ("Crear lote"). Una sola acción principal por vista.
 * Toque mínimo de 48 dp aunque el tamaño visual sea SM (36 dp). `loading` deja el botón ocupado y lo anuncia.
 */
@Composable
fun ZcButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ZcButtonVariant = ZcButtonVariant.PRIMARY,
    size: ZcButtonSize = ZcButtonSize.MD,
    enabled: Boolean = true,
    loading: Boolean = false,
    block: Boolean = false,
    @DrawableRes leadingIcon: Int? = null,
    @DrawableRes trailingIcon: Int? = null,
) {
    val colors = buttonColors(variant)
    val loadingLabel = LocalContext.current.getString(R.string.zc_ui_cargando)
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed && enabled && !loading) 0.98f else 1f, tween(ZcMotion.fast), label = "press")
    val visualHeight = if (size == ZcButtonSize.MD) ZcSize.target else ZcSize.targetSm
    val shape = if (variant == ZcButtonVariant.LINK) RoundedCornerShape(0.dp) else RoundedCornerShape(50)
    val padding = when {
        variant == ZcButtonVariant.LINK -> PaddingValues(0.dp)
        size == ZcButtonSize.MD -> PaddingValues(horizontal = 20.dp)
        else -> PaddingValues(horizontal = 16.dp)
    }
    Box(
        modifier = modifier
            .then(if (block) Modifier.fillMaxWidth() else Modifier)
            .defaultMinSize(minWidth = 48.dp, minHeight = 48.dp)
            .clickable(
                interactionSource = source,
                indication = null,
                enabled = enabled && !loading,
                role = Role.Button,
                onClick = onClick,
            )
            .semantics { if (loading) stateDescription = loadingLabel },
        contentAlignment = Alignment.Center,
    ) {
        Row(
            modifier = Modifier
                .then(if (block) Modifier.fillMaxWidth() else Modifier)
                .height(visualHeight)
                .graphicsLayer { scaleX = scale; scaleY = scale }
                .alpha(if (enabled) 1f else 0.45f)
                .clip(shape)
                .background(colors.bg)
                .then(if (colors.border != Color.Transparent) Modifier.border(BorderStroke(1.dp, colors.border), shape) else Modifier)
                .indication(source, LocalIndication.current)
                .padding(padding),
            horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CompositionLocalProvider(LocalZcContentColor provides colors.fg) {
                if (loading) ZcSpinner(size = 18.dp, color = colors.fg, decorative = true)
                else if (leadingIcon != null) ZcIcon(leadingIcon, contentDescription = null, size = 20.dp)
                val style = if (size == ZcButtonSize.MD) ZcType.body else ZcType.bodySm
                ZcText(
                    text,
                    style = if (variant == ZcButtonVariant.LINK) style.copy(textDecoration = TextDecoration.Underline) else style,
                    weight = FontWeight.Medium,
                    maxLines = 1,
                )
                if (trailingIcon != null && !loading) ZcIcon(trailingIcon, contentDescription = null, size = 20.dp)
            }
        }
    }
}

/** Botón de solo ícono: `contentDescription` es obligatorio (lo lee TalkBack). */
@Composable
fun ZcIconButton(
    @DrawableRes icon: Int,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ZcButtonVariant = ZcButtonVariant.GHOST,
    enabled: Boolean = true,
) {
    val colors = buttonColors(variant)
    val source = remember { MutableInteractionSource() }
    Box(
        modifier = modifier
            .size(ZcSize.target)
            .clip(RoundedCornerShape(50))
            .background(colors.bg)
            .then(if (colors.border != Color.Transparent) Modifier.border(1.dp, colors.border, RoundedCornerShape(50)) else Modifier)
            .alpha(if (enabled) 1f else 0.45f)
            .clickable(source, LocalIndication.current, enabled = enabled, role = Role.Button, onClick = onClick)
            .semantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) {
        ZcIcon(icon, contentDescription = null, size = 22.dp, tint = colors.fg)
    }
}
