package com.zonacards.ui.compose

import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.ZcBreakpoint
import com.zonacards.ui.tokens.ZcOpacity
import com.zonacards.ui.tokens.ZcScale
import com.zonacards.ui.tokens.ZcSize
import com.zonacards.ui.tokens.ZcSpacing
import com.zonacards.ui.tokens.ZcWeight
import org.junit.Assert.assertEquals
import org.junit.Test

/** Los valores de los tokens semánticos generados (iguales a los de tokens.css): si cambian en un lado y no en el otro, esta prueba avisa. */
class TokenValuesTest {
    @Test fun breakpointsAreTheWebOnesPlusTheNativeThresholds() {
        assertEquals(listOf(640.dp, 768.dp, 1024.dp, 1280.dp), listOf(ZcBreakpoint.sm, ZcBreakpoint.md, ZcBreakpoint.lg, ZcBreakpoint.xl))
        assertEquals(listOf(600.dp, 900.dp), listOf(ZcBreakpoint.phone, ZcBreakpoint.wide))
    }

    @Test fun iconSizesAre16To32() {
        assertEquals(listOf(16.dp, 20.dp, 24.dp, 32.dp), listOf(ZcSize.iconSm, ZcSize.iconMd, ZcSize.iconLg, ZcSize.iconXl))
    }

    @Test fun stateAndSpacingTokensMatchTheDocs() {
        assertEquals(0.45f, ZcOpacity.disabled, 0f)
        assertEquals(0.97f, ZcScale.pressed, 0f)
        assertEquals(listOf(8.dp, 12.dp, 16.dp, 20.dp, 40.dp), listOf(ZcSpacing.inline, ZcSpacing.group, ZcSpacing.field, ZcSpacing.fieldX, ZcSpacing.section))
        assertEquals(listOf(400, 500, 600, 700), listOf(ZcWeight.regular, ZcWeight.medium, ZcWeight.semibold, ZcWeight.bold).map { it.weight })
    }
}
