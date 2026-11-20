package com.zonacards.ui.compose

import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Ubigeo del Perú (INEI): datos y selector en cascada. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class UbigeoTest {
    @get:Rule val rule = createComposeRule()

    private fun tree(): ZcUbigeo {
        var t: ZcUbigeo? = null
        rule.setContent { val ctx = LocalContext.current; t = runBlocking { ZcUbigeo.load(ctx) } }
        rule.waitForIdle()
        return t!!
    }

    @Test fun theTreeMatchesTheWebFile() {
        val u = tree()
        assertEquals(25, u.departments.size)
        assertEquals(196, u.provinceCount)
        assertEquals(1891, u.districtCount)
        assertEquals("07", u.departments.first { it.name == "Callao" }.code)
        assertEquals("1501", u.provinces("15").first { it.name == "Lima" }.code)
        assertTrue(u.districts("1501").any { it.code == "150122" && it.name == "Miraflores" })
        assertEquals("Miraflores, Lima, Lima", u.label("150122"))
        assertTrue(u.label("061306").contains("Santa Cruz"))
        assertEquals(-12.12, u.district("150122")!!.lat!!, 0.01)
        assertEquals("", u.label(null))
        assertTrue(u.provinces("99").isEmpty())
    }

    @Test fun theSelectorShowsTheChosenDistrictAndItsParents() {
        var u: ZcUbigeo? = null
        rule.setContent { val ctx = LocalContext.current; u = runBlocking { ZcUbigeo.load(ctx) }; ZonacardsTheme(dark = false) { ZcUbigeoSelect("150122", {}, data = u) } }
        rule.waitForIdle()
        // Lima es a la vez el departamento y la provincia de Miraflores.
        assertEquals(2, rule.onAllNodesWithText("Lima", useUnmergedTree = true).fetchSemanticsNodes().size)
        rule.onNodeWithText("Miraflores", useUnmergedTree = true).assertExists()
    }

    @Test fun changingTheDepartmentClearsTheDistrictAndDisablesTheLowerLevels() {
        var u: ZcUbigeo? = null
        var emitted: String? = "x"
        var calls = 0
        rule.setContent {
            val ctx = LocalContext.current; u = runBlocking { ZcUbigeo.load(ctx) }
            ZonacardsTheme(dark = false) { ZcUbigeoSelect("150122", { emitted = it; calls++ }, data = u) }
        }
        rule.onNode(hasContentDescription("Departamento", substring = true)).performClick()
        rule.onNodeWithText("Arequipa").performClick()
        rule.waitForIdle()
        assertNull(emitted)
        assertEquals(1, calls)
        // Con departamento elegido la provincia se habilita; el distrito espera a la provincia.
        rule.onNode(hasContentDescription("Provincia", substring = true)).assertIsEnabled()
        rule.onNode(hasContentDescription("Distrito", substring = true)).assertIsNotEnabled()
    }

    @Test fun withoutAValueTheLowerLevelsStartDisabled() {
        var u: ZcUbigeo? = null
        rule.setContent { val ctx = LocalContext.current; u = runBlocking { ZcUbigeo.load(ctx) }; ZonacardsTheme(dark = false) { ZcUbigeoSelect(null, {}, data = u) } }
        rule.onNode(hasContentDescription("Provincia", substring = true)).assertIsNotEnabled()
        rule.onNode(hasContentDescription("Distrito", substring = true)).assertIsNotEnabled()
    }
}
