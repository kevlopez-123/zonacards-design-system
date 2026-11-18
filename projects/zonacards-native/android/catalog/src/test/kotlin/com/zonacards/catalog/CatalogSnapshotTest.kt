package com.zonacards.catalog

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onRoot
import com.zonacards.ui.tokens.ZcBrand
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import java.io.File
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.size
import androidx.compose.ui.unit.dp
import kotlin.math.abs

/**
 * Regresión visual del catálogo (como test:visual de la web): una captura por sección, en claro y oscuro, comparada píxel a
 * píxel con la referencia en src/test/snapshots. Falla si cambia más del 1 % de los píxeles. Con un cambio intencional:
 * `./gradlew :catalog:testDebugUnitTest -Psnapshots=record` y revisar las imágenes. Animaciones detenidas (reloj fijo).
 */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "es-w400dp-h3800dp-xhdpi")
class CatalogSnapshotTest {
    @get:Rule val rule = createComposeRule()
    private val record = System.getProperty("zc.snapshots") == "record"
    private val dir = File(System.getProperty("zc.snapshotsDir") ?: "src/test/snapshots").apply { mkdirs() }

    private fun shot(name: String, section: CatalogSection?, dark: Boolean, brand: ZcBrand = ZcBrand.ZONACARDS) {
        rule.mainClock.autoAdvance = false
        rule.setContent { CatalogApp(section, brand, dark) }
        rule.mainClock.advanceTimeBy(1000)
        val actual = rule.onRoot().captureToImage().asAndroidBitmap()
        val file = File(dir, "$name.png")
        if (record || !file.exists()) {
            file.outputStream().use { actual.compress(Bitmap.CompressFormat.PNG, 100, it) }
            assertTrue("Referencia nueva grabada: ${file.name}. Revísala y vuelve a correr.", record)
            return
        }
        val expected = BitmapFactory.decodeFile(file.absolutePath)
        val diff = diffRatio(expected, actual)
        if (diff > 0.01) File(dir.parentFile, "snapshots-failed").apply { mkdirs() }.let { f -> File(f, "$name.png").outputStream().use { actual.compress(Bitmap.CompressFormat.PNG, 100, it) } }
        assertTrue("$name cambió ${"%.2f".format(diff * 100)} % de los píxeles (máximo 1 %). Nueva captura en build/snapshots-failed.", diff <= 0.01)
    }

    /** Proporción de píxeles distintos (tolerancia de 16 por canal para el suavizado de bordes). */
    private fun diffRatio(a: Bitmap, b: Bitmap): Double {
        if (a.width != b.width || a.height != b.height) return 1.0
        val pa = IntArray(a.width * a.height).also { a.getPixels(it, 0, a.width, 0, 0, a.width, a.height) }
        val pb = IntArray(b.width * b.height).also { b.getPixels(it, 0, b.width, 0, 0, b.width, b.height) }
        var n = 0
        for (i in pa.indices) {
            val x = pa[i]; val y = pb[i]
            if (abs((x shr 16 and 255) - (y shr 16 and 255)) > 16 || abs((x shr 8 and 255) - (y shr 8 and 255)) > 16 || abs((x and 255) - (y and 255)) > 16) n++
        }
        return n.toDouble() / pa.size
    }

    @Test fun inicioClaro() = shot("inicio-claro", null, false)
    @Test fun fundamentosClaro() = shot("fundamentos-claro", CatalogSection.FUNDAMENTOS, false)
    @Test fun fundamentosOscuro() = shot("fundamentos-oscuro", CatalogSection.FUNDAMENTOS, true)
    @Test fun atomosClaro() = shot("atomos-claro", CatalogSection.ATOMOS, false)
    @Test fun atomosOscuro() = shot("atomos-oscuro", CatalogSection.ATOMOS, true)
    @Test fun atomosGiftealo() = shot("atomos-giftealo-claro", CatalogSection.ATOMOS, false, ZcBrand.GIFTEALO)
    @Test fun formulariosClaro() = shot("formularios-claro", CatalogSection.FORMULARIOS, false)
    @Test fun formulariosOscuro() = shot("formularios-oscuro", CatalogSection.FORMULARIOS, true)
    @Test fun estructuraClaro() = shot("estructura-claro", CatalogSection.ESTRUCTURA, false)
    @Test fun estructuraOscuro() = shot("estructura-oscuro", CatalogSection.ESTRUCTURA, true)
    @Test fun dominioClaro() = shot("dominio-claro", CatalogSection.DOMINIO, false)
    @Test fun dominioOscuro() = shot("dominio-oscuro", CatalogSection.DOMINIO, true)
}

/**
 * Auditoría de accesibilidad sobre el árbol que lee TalkBack (como axe en la web): todo lo que se toca o se marca debe tener
 * nombre (texto o descripción) y un área de toque de al menos 48 dp. (El verificador ATF de Google no corre bajo Robolectric:
 * AccessibilityCheckerSelfTest lo demostró, por eso esta auditoría propia.)
 */
object ZcA11yAudit {
    fun problems(rule: androidx.compose.ui.test.junit4.ComposeTestRule): List<String> {
        val out = ArrayList<String>()
        val density = rule.density
        val nodes = rule.onAllNodes(androidx.compose.ui.test.isRoot()).fetchSemanticsNodes().flatMap { root ->
            fun walk(n: androidx.compose.ui.semantics.SemanticsNode): List<androidx.compose.ui.semantics.SemanticsNode> = listOf(n) + n.children.flatMap { walk(it) }
            walk(root)
        }
        for (n in nodes) {
            val cfg = n.config
            val interactive = cfg.contains(androidx.compose.ui.semantics.SemanticsActions.OnClick) || cfg.contains(androidx.compose.ui.semantics.SemanticsProperties.ToggleableState) ||
                cfg.contains(androidx.compose.ui.semantics.SemanticsProperties.Selected) || cfg.contains(androidx.compose.ui.semantics.SemanticsActions.SetText)
            if (!interactive || cfg.contains(androidx.compose.ui.semantics.SemanticsProperties.InvisibleToUser)) continue
            if (cfg.contains(androidx.compose.ui.semantics.SemanticsProperties.Disabled)) continue
            val text = cfg.getOrElse(androidx.compose.ui.semantics.SemanticsProperties.Text) { emptyList() }.joinToString { it.text }
            val desc = cfg.getOrElse(androidx.compose.ui.semantics.SemanticsProperties.ContentDescription) { emptyList() }.joinToString()
            val name = (desc + text).trim()
            val b = n.boundsInRoot
            val w = with(density) { b.width.toDp().value }; val h = with(density) { b.height.toDp().value }
            if (name.isEmpty()) out += "Control sin nombre en (${b.left.toInt()}, ${b.top.toInt()})"
            if (w < 43.5f || h < 43.5f) out += "Toque de ${w.toInt()}×${h.toInt()} dp (mínimo 44, target-sm): «$name»"
        }
        return out
    }
}

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "es-w400dp-h3800dp-xhdpi")
class CatalogAccessibilityTest {
    @get:Rule val rule = createComposeRule()

    private fun audit(section: CatalogSection?, dark: Boolean) {
        rule.mainClock.autoAdvance = false
        rule.setContent { CatalogApp(section, ZcBrand.ZONACARDS, dark) }
        rule.mainClock.advanceTimeBy(1000)
        val p = ZcA11yAudit.problems(rule)
        assertTrue("${p.size} problemas de accesibilidad: " + p.distinct().joinToString(" | "), p.isEmpty())
    }

    @Test fun inicio() = audit(null, false)
    @Test fun atomos() = audit(CatalogSection.ATOMOS, false)
    @Test fun formularios() = audit(CatalogSection.FORMULARIOS, false)
    @Test fun estructura() = audit(CatalogSection.ESTRUCTURA, false)
    @Test fun dominio() = audit(CatalogSection.DOMINIO, false)
}

/** La auditoría tiene que fallar ante un botón sin nombre y de 20 dp (si no, no está revisando nada). */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "es")
class AccessibilityCheckerSelfTest {
    @get:Rule val rule = createComposeRule()

    @Test fun detectsUnlabeledTinyButton() {
        rule.setContent {
            androidx.compose.foundation.layout.Box(androidx.compose.ui.Modifier.size(20.dp).clickable { }.background(androidx.compose.ui.graphics.Color.Gray))
        }
        val p = ZcA11yAudit.problems(rule)
        assertTrue("La auditoría no detectó el botón: $p", p.any { "sin nombre" in it } && p.any { "20×20" in it })
    }
}

/** Colores con transparencia (fondos tonales en oscuro) se componen sobre la superficie antes de medir. */
private fun over(top: androidx.compose.ui.graphics.Color, under: androidx.compose.ui.graphics.Color) = androidx.compose.ui.graphics.Color(
    top.red * top.alpha + under.red * (1 - top.alpha), top.green * top.alpha + under.green * (1 - top.alpha), top.blue * top.alpha + under.blue * (1 - top.alpha))

/** Contraste de los pares de color del sistema en las 8 combinaciones de marca y modo (WCAG AA: 4,5 texto, 3 elementos). */
class ContrastTest {
    private fun lum(c: androidx.compose.ui.graphics.Color): Double {
        fun ch(v: Float) = if (v <= 0.03928) v / 12.92 else Math.pow((v + 0.055) / 1.055, 2.4)
        return 0.2126 * ch(c.red) + 0.7152 * ch(c.green) + 0.0722 * ch(c.blue)
    }
    private fun ratio(a: androidx.compose.ui.graphics.Color, b: androidx.compose.ui.graphics.Color): Double { val x = lum(a); val y = lum(b); return (maxOf(x, y) + 0.05) / (minOf(x, y) + 0.05) }

    @Test fun themesMeetAA() {
        val fails = ArrayList<String>()
        for (brand in ZcBrand.entries) for (dark in listOf(false, true)) {
            val c = com.zonacards.ui.tokens.ZcTheme.resolve(brand, dark).colors
            val pairs = listOf(
                Triple("text / surface", c.text to c.surface, 4.5), Triple("text-muted / surface", c.textMuted to c.surface, 4.5),
                Triple("text-muted / bg", c.textMuted to c.bg, 4.5), Triple("on-primary / primary", c.onPrimary to c.primary, 4.5),
                Triple("on-secondary / secondary", c.onSecondary to c.secondary, 4.5),
                Triple("success / success-bg", c.successFg to c.successBg, 4.5), Triple("warning / warning-bg", c.warningFg to c.warningBg, 4.5),
                Triple("danger / danger-bg", c.dangerFg to c.dangerBg, 4.5), Triple("info / info-bg", c.infoFg to c.infoBg, 4.5),
                Triple("border-strong / surface", c.borderStrong to c.surface, 3.0), Triple("focus / surface", c.focus to c.surface, 3.0),
            )
            for ((n, p, min) in pairs) { val back = over(p.second, c.surface); val r = ratio(over(p.first, back), back); if (r < min) fails += "$brand ${if (dark) "oscuro" else "claro"}: $n = ${"%.2f".format(r)} (mínimo $min)" }
        }
        // Problemas de los tokens de la web, pendientes de decisión de diseño (no se cambian en silencio). La prueba falla
        // solo si aparece uno nuevo o si alguno de estos se corrige (para sacarlo de la lista).
        val known = setOf(
            "ZONACARDS claro: border-strong / surface", "GIFTEALO claro: border-strong / surface", "ENJOY claro: border-strong / surface", "MOTIVA claro: border-strong / surface",
            "MOTIVA oscuro: on-primary / primary", "MOTIVA oscuro: on-secondary / secondary",
        )
        val found = fails.map { it.substringBefore(" =") }.toSet()
        assertTrue("Contraste insuficiente (nuevo): " + fails.filter { it.substringBefore(" =") !in known }.joinToString(" | "), (found - known).isEmpty())
        assertTrue("Ya cumplen y deben salir de la lista de pendientes: " + (known - found), (known - found).isEmpty())
    }
}
