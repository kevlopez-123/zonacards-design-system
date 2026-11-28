package com.zonacards.ui.compose

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcIcons

/** Una diapositiva de la introducción: título, texto y, opcional, una imagen de fondo o un ícono. */
data class ZcIntroSlide(val title: String, val text: String, val image: Painter? = null, @DrawableRes val icon: Int? = null)

/**
 * Puntos de avance (introducción, pasos): el actual es una píldora; el resto, puntos. Anuncia "Paso 2 de 3". Solo informa: no se toca
 * (la navegación la hacen los botones).
 */
@Composable
fun ZcStepDots(total: Int, current: Int, modifier: Modifier = Modifier, color: androidx.compose.ui.graphics.Color = LocalZcContentColor.current) {
    val ctx = LocalContext.current
    Row(
        modifier.semantics(mergeDescendants = true) { contentDescription = ctx.getString(R.string.zc_mol_intro_paso, (current + 1).toString(), total.toString()) },
        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally), verticalAlignment = Alignment.CenterVertically,
    ) {
        repeat(total) { i ->
            Box(Modifier.size(if (i == current) 24.dp else 6.dp, 6.dp).alpha(if (i == current) 1f else 0.4f).background(color, RoundedCornerShape(50)).clearAndSetSemantics { })
        }
    }
}

/**
 * Introducción a pantalla completa de la primera vez: una diapositiva a la vez sobre fondo `primary`, puntos de avance, "Saltar" (salvo en
 * la última) y "Continuar", que en la última dice "Empezar". El título anuncia el cambio de diapositiva. La app guarda que ya la vio.
 */
@Composable
fun ZcIntroSlides(
    slides: List<ZcIntroSlide>,
    onFinished: () -> Unit,
    onSkipped: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (slides.isEmpty()) return
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    var index by rememberSaveable { mutableIntStateOf(0) }
    val i = index.coerceIn(0, slides.lastIndex)
    val last = i == slides.lastIndex
    val s = slides[i]
    Box(modifier.fillMaxSize().background(c.primary)) {
        s.image?.let { Image(it, null, Modifier.fillMaxSize().alpha(0.45f), contentScale = ContentScale.Crop) }
        Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Bottom) {
            Column(Modifier.weight(1f).fillMaxWidth(), verticalArrangement = Arrangement.Bottom) {
                s.icon?.let { ZcIcon(it, null, size = ZcSize.iconXl, tint = c.onPrimary) }
                ZcText(s.title, Modifier.padding(top = 12.dp).semantics { heading(); liveRegion = LiveRegionMode.Polite }, style = com.zonacards.ui.tokens.ZcType.displaySm, weight = ZcWeight.extrabold, color = c.onPrimary)
                ZcText(s.text, Modifier.padding(top = 12.dp), color = c.onPrimary.copy(alpha = 0.9f))
            }
            ZcStepDots(slides.size, i, Modifier.fillMaxWidth().padding(vertical = 24.dp), color = c.onPrimary)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                if (!last) OnPrimaryButton(ctx.getString(R.string.zc_mol_intro_saltar), onSkipped, filled = false) else Box(Modifier.width(1.dp))
                OnPrimaryButton(
                    ctx.getString(if (last) R.string.zc_mol_intro_empezar else R.string.zc_mol_intro_continuar),
                    { if (last) onFinished() else index = i + 1 }, filled = true,
                )
            }
        }
    }
}

/** Botón sobre el color primario: el principal se invierte (blanco con texto de marca), el otro es texto claro. */
@Composable
private fun OnPrimaryButton(text: String, onClick: () -> Unit, filled: Boolean) {
    val c = ZonacardsTheme.colors
    val shape = RoundedCornerShape(ZonacardsTheme.shape.button)
    Row(
        Modifier.heightIn(min = 48.dp).clip(shape).then(if (filled) Modifier.background(c.onPrimary) else Modifier)
            .clickable(role = Role.Button, onClick = onClick).padding(horizontal = 24.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically,
    ) {
        ZcText(text, weight = ZcWeight.medium, color = if (filled) c.primary else c.onPrimary, maxLines = 1)
        if (filled) ZcIcon(ZcIcons.sArrowRight, null, size = ZcSize.iconSm, tint = c.primary)
    }
}
