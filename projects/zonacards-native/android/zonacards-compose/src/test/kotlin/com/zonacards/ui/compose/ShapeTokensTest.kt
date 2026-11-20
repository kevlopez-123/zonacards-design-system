package com.zonacards.ui.compose

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.ZcBrand
import com.zonacards.ui.tokens.ZcTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

/** Forma y estilo por marca: los valores por defecto no cambian y una marca los puede sobrescribir. */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class ShapeTokensTest {
    @get:Rule val rule = createComposeRule()

    @Test fun defaultBrandsKeepTheOriginalShape() {
        for (b in listOf(ZcBrand.ZONACARDS, ZcBrand.GIFTEALO, ZcBrand.MOTIVA)) for (dark in listOf(false, true)) {
            val s = ZcTheme.resolve(b, dark).shape
            assertEquals("$b control", 8.dp, s.control); assertEquals("$b card", 16.dp, s.card); assertEquals("$b sheet", 24.dp, s.sheet)
            assertEquals("$b button", 9999.dp, s.button); assertEquals("$b field", 56.dp, s.fieldH)
        }
    }

    @Test fun enjoyOverridesTheShapeAndTheFieldFill() {
        val light = ZcTheme.resolve(ZcBrand.ENJOY, false)
        assertEquals(24.dp, light.shape.control); assertEquals(28.dp, light.shape.card); assertEquals(28.dp, light.shape.sheet)
        // En claro el campo se rellena con un gris suave; en oscuro conserva el relleno del sistema.
        assertEquals(ZcTheme.resolve(ZcBrand.ENJOY, false).colors.fieldBg != ZcTheme.resolve(ZcBrand.ZONACARDS, false).colors.fieldBg, true)
        assertEquals(ZcTheme.resolve(ZcBrand.ENJOY, true).colors.fieldBg, ZcTheme.resolve(ZcBrand.ENJOY, true).colors.surface)
    }

    @Test fun componentsReadTheShapeFromTheCurrentBrand() {
        var control = 0.dp
        rule.setContent { ZonacardsTheme(brand = ZcBrand.ENJOY, dark = false) { control = ZonacardsTheme.shape.control } }
        rule.waitForIdle()
        assertEquals(24.dp, control)
    }
}
