package com.zonacards.ui.compose

import android.content.Context
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcWeight
import com.zonacards.ui.tokens.ZcRadius
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcType
import org.json.JSONObject

internal class LogoEntry(val title: String, val hex: String, val path: Path)
internal class SsoEntry(val w: Float, val h: Float, val parts: List<Pair<Color?, Path>>)
internal class LogoRegistry(val logos: Map<String, LogoEntry>, val sso: Map<String, SsoEntry>)

@Volatile private var logoCache: LogoRegistry? = null

/**
 * Logos de la web (Simple Icons y los de acceso) leídos de `res/raw/zc_logos.json`. Se dibujan con el analizador de trazados de
 * Compose: varios usan banderas de arco comprimidas que el VectorDrawable de Android lee mal.
 */
internal fun zcLogoRegistry(ctx: Context): LogoRegistry = logoCache ?: run {
    val root = JSONObject(ctx.resources.openRawResource(R.raw.zc_logos).bufferedReader().use { it.readText() })
    fun path(d: String) = PathParser().parsePathString(d).toPath()
    val logos = root.getJSONObject("logos").let { o -> o.keys().asSequence().associateWith { k -> o.getJSONObject(k).let { LogoEntry(it.getString("t"), it.getString("h"), path(it.getString("d"))) } } }
    val sso = root.getJSONObject("sso").let { o ->
        o.keys().asSequence().associateWith { k ->
            val e = o.getJSONObject(k); val ps = e.getJSONArray("paths")
            SsoEntry(e.getDouble("w").toFloat(), e.getDouble("h").toFloat(), List(ps.length()) { i ->
                val p = ps.getJSONObject(i)
                (if (p.isNull("fill")) null else Color(android.graphics.Color.parseColor(p.getString("fill")))) to path(p.getString("d"))
            })
        }
    }
    LogoRegistry(logos, sso).also { logoCache = it }
}

/**
 * Logo de un medio de pago, red o marca (zc-logo): color de marca por defecto; `mono` usa el color del texto. Los negros pasan
 * al color del texto para verse en oscuro. Con `label` es una imagen con nombre ("Visa"); sin él es decorativo y el texto va
 * al lado. Un nombre desconocido muestra sus dos primeras letras. Úsalos solo para identificar medios de pago, redes y comercios.
 */
@Composable
fun ZcLogo(name: String, modifier: Modifier = Modifier, size: Dp = 24.dp, mono: Boolean = false, label: Boolean = false) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    val entry = remember(name) { zcLogoRegistry(ctx).logos[name] }
    if (entry == null) {
        Box(modifier.size(size).clip(RoundedCornerShape(ZcRadius.xs)).background(c.surface3).clearAndSetSemantics { }, contentAlignment = Alignment.Center) {
            ZcText(name.take(2).uppercase(), style = ZcType.xxs, weight = ZcWeight.bold)
        }
        return
    }
    val color = when {
        mono -> LocalZcContentColor.current
        entry.hex.equals("000000", ignoreCase = true) -> c.text
        else -> Color((0xFF000000L or entry.hex.toLong(16)).toInt())
    }
    Canvas(modifier.size(size).then(if (label) Modifier.semantics { role = Role.Image; contentDescription = entry.title } else Modifier.clearAndSetSemantics { })) {
        val s = this.size.minDimension / 24f
        withTransform({ scale(s, s, Offset.Zero) }) { drawPath(entry.path, color) }
    }
}

// ---------- Acceso con proveedor (zc-sso-button) ----------

enum class ZcSsoProvider { GOOGLE, APPLE, MICROSOFT }
enum class ZcSsoTheme { LIGHT, DARK, NEUTRAL, BLACK, WHITE, OUTLINE }
enum class ZcSsoText { CONTINUE, SIGNIN, SIGNUP }

private class SsoLook(val bg: Color, val fg: Color, val border: Color)

/**
 * Acceso con Google, Apple o Microsoft (Entra ID) según la guía de cada marca: logo sin modificar, texto aprobado y colores
 * propios (tokens `sso-*`). Pastilla para Google y Apple, rectángulo para Microsoft. `text = null` deja solo el logo, con su
 * nombre para TalkBack. `loading` muestra "Redirigiendo…" mientras se abre el proveedor. Apple pide el logo negro o blanco según
 * el fondo, y las guías de Google y Apple piden su propia tipografía, que aquí se aproxima con la del sistema.
 */
@Composable
fun ZcSsoButton(
    provider: ZcSsoProvider,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    theme: ZcSsoTheme = when (provider) { ZcSsoProvider.GOOGLE -> ZcSsoTheme.LIGHT; ZcSsoProvider.APPLE -> ZcSsoTheme.BLACK; ZcSsoProvider.MICROSOFT -> ZcSsoTheme.LIGHT },
    text: ZcSsoText? = ZcSsoText.CONTINUE,
    block: Boolean = false,
    loading: Boolean = false,
) {
    val c = ZonacardsTheme.colors
    val ctx = LocalContext.current
    val look = when (provider to theme) {
        ZcSsoProvider.GOOGLE to ZcSsoTheme.DARK -> SsoLook(c.ssoGoogleDarkBg, c.ssoGoogleDarkFg, c.ssoGoogleDarkBd)
        ZcSsoProvider.GOOGLE to ZcSsoTheme.NEUTRAL -> SsoLook(c.ssoGoogleNeutralBg, c.ssoGoogleNeutralFg, Color.Transparent)
        ZcSsoProvider.APPLE to ZcSsoTheme.WHITE -> SsoLook(c.ssoAppleWhite, c.ssoAppleBlack, c.border)
        ZcSsoProvider.APPLE to ZcSsoTheme.OUTLINE -> SsoLook(c.ssoAppleWhite, c.ssoAppleBlack, c.ssoAppleBlack)
        ZcSsoProvider.APPLE to ZcSsoTheme.BLACK -> SsoLook(c.ssoAppleBlack, c.ssoAppleWhite, c.ssoAppleBlack)
        ZcSsoProvider.MICROSOFT to ZcSsoTheme.DARK -> SsoLook(c.ssoMsDarkBg, c.ssoAppleWhite, c.ssoMsDarkBg)
        else -> when (provider) {
            ZcSsoProvider.GOOGLE -> SsoLook(c.ssoGoogleLightBg, c.ssoGoogleLightFg, c.ssoGoogleLightBd)
            ZcSsoProvider.APPLE -> SsoLook(c.ssoAppleBlack, c.ssoAppleWhite, c.ssoAppleBlack)
            ZcSsoProvider.MICROSOFT -> SsoLook(c.ssoAppleWhite, c.ssoMsLightFg, c.ssoMsLightBd)
        }
    }
    val (key, logoWidth) = when (provider) { ZcSsoProvider.GOOGLE -> "google-icon" to 18.dp; ZcSsoProvider.APPLE -> "apple" to 16.dp; ZcSsoProvider.MICROSOFT -> "microsoft-icon" to 20.dp }
    val entry = remember(key) { zcLogoRegistry(ctx).sso.getValue(key) }
    val name = ctx.getString(when (provider) { ZcSsoProvider.GOOGLE -> R.string.zc_mol_sso_google; ZcSsoProvider.APPLE -> R.string.zc_mol_sso_apple; ZcSsoProvider.MICROSOFT -> R.string.zc_mol_sso_microsoft })
    val label = ctx.getString(when (text) { ZcSsoText.CONTINUE -> R.string.zc_mol_sso_continue; ZcSsoText.SIGNUP -> R.string.zc_mol_sso_signup; else -> R.string.zc_mol_sso_signin }, name)
    val shape = RoundedCornerShape(if (provider == ZcSsoProvider.MICROSOFT) 2.dp else ZcRadius.full)
    val width = when { text == null -> Modifier.width(ZcSize.target); block -> Modifier.fillMaxWidth(); else -> Modifier.fillMaxWidth().widthIn(max = 400.dp) }
    Row(
        modifier.then(width).heightIn(min = ZcSize.target).clip(shape).background(look.bg).border(1.dp, look.border, shape)
            .alpha(if (loading) 0.6f else 1f)
            .clickable(enabled = !loading, role = Role.Button, onClick = onClick)
            .semantics { contentDescription = label; if (loading) stateDescription = ctx.getString(R.string.zc_mol_sso_redirigiendo) }
            .padding(horizontal = if (text == null) 0.dp else 16.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterHorizontally), verticalAlignment = Alignment.CenterVertically,
    ) {
        Canvas(Modifier.size(logoWidth, logoWidth * entry.h / entry.w)) {
            val s = size.width / entry.w
            withTransform({ scale(s, s, Offset.Zero) }) { entry.parts.forEach { (fill, path) -> drawPath(path, fill ?: look.fg) } }
        }
        if (text != null) ZcText(
            if (loading) ctx.getString(R.string.zc_mol_sso_redirigiendo) else label, Modifier.clearAndSetSemantics { },
            style = ZcType.body.copy(letterSpacing = if (provider == ZcSsoProvider.GOOGLE) 0.25.sp else 0.sp),
            weight = if (provider == ZcSsoProvider.MICROSOFT) ZcWeight.semibold else ZcWeight.medium, color = look.fg, maxLines = 1,
        )
    }
}

/**
 * Logo circular de la marca sobre la imagen del producto (zc-brand-logo): 64 dp, centrado en el `Box` que lo contiene, con
 * `media-control` de fondo. Sin [painter] muestra el nombre en mayúsculas (máx. 8 letras). Decorativo: el nombre ya está en
 * el título de la tarjeta. La app trae la imagen con su propio cargador y la pasa como `Painter`.
 */
@Composable
fun androidx.compose.foundation.layout.BoxScope.ZcBrandLogo(
    name: String,
    modifier: Modifier = Modifier,
    painter: androidx.compose.ui.graphics.painter.Painter? = null,
) {
    val c = ZonacardsTheme.colors
    Box(
        modifier.align(Alignment.Center).size(64.dp).shadow(2.dp, androidx.compose.foundation.shape.CircleShape).clip(androidx.compose.foundation.shape.CircleShape)
            .background(c.mediaControlBg).clearAndSetSemantics { },
        contentAlignment = Alignment.Center,
    ) {
        if (painter != null) androidx.compose.foundation.Image(painter, null, Modifier.fillMaxSize(), contentScale = androidx.compose.ui.layout.ContentScale.Fit)
        else ZcText(name.uppercase().take(8), Modifier.padding(horizontal = 6.dp), style = ZcType.caption.copy(fontSize = 11.sp), weight = ZcWeight.extrabold, color = c.mediaControlFg, maxLines = 1)
    }
}
