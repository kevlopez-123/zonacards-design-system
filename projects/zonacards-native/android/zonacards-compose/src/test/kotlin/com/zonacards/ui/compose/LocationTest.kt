package com.zonacards.ui.compose

import android.graphics.Bitmap
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextClearance
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.click
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

/** Punto exacto en el mapa: proyección, coordenadas escritas y toque en el mapa. */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "es-w320dp-h1600dp")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class LocationTest {
    @get:Rule val rule = createComposeRule()
    private val tile = Bitmap.createBitmap(256, 256, Bitmap.Config.ARGB_8888).asImageBitmap()

    @Test fun mercatorRoundTripsAndPutsLimaInTheRightTile() {
        for (z in listOf(3, 10, 16)) {
            val x = ZcGeo.worldX(-77.0428, z); val y = ZcGeo.worldY(-12.0464, z)
            assertEquals(-77.0428, ZcGeo.lng(x, z), 1e-6)
            assertEquals(-12.0464, ZcGeo.lat(y, z), 1e-6)
        }
        // Lima a zoom 10 cae en la tesela 292/546.
        assertEquals(292, (ZcGeo.worldX(-77.0428, 10) / ZcGeo.TILE).toInt())
        assertEquals(546, (ZcGeo.worldY(-12.0464, 10) / ZcGeo.TILE).toInt())
        assertEquals(1, ZcGeo.tileCount(0)); assertEquals(1024, ZcGeo.tileCount(10))
        assertTrue(ZcGeo.metersPerPixel(0.0, 0) > 150_000)
    }

    @Test fun latLngValidatesRoundsAndFormats() {
        assertTrue(ZcLatLng(-12.04, -77.04).isValid); assertTrue(ZcLatLng(90.0, 180.0).isValid)
        assertFalse(ZcLatLng(91.0, 0.0).isValid); assertFalse(ZcLatLng(0.0, -181.0).isValid); assertFalse(ZcLatLng(Double.NaN, 0.0).isValid)
        assertEquals(ZcLatLng(-12.046372, -77.042999), ZcLatLng(-12.04637249, -77.04299949).rounded())
        assertEquals("-12.04640, -77.04280", ZcLatLng(-12.0464, -77.0428).format())
    }

    @Test fun typingValidCoordinatesMovesThePointAndInvalidOnesShowTheError() {
        var got: ZcLatLng? = ZcLatLng(-12.0, -77.0)
        rule.setContent { ZonacardsTheme(dark = false) { ZcLocationPicker(got, { got = it }, "Ubica el punto", fetchTile = { tile }) } }
        val boxes = rule.onAllNodes(hasSetTextAction())
        boxes[0].performTextClearance(); boxes[0].performTextInput("-13,5")
        rule.waitForIdle()
        assertEquals(-13.5, got!!.lat, 1e-9)
        boxes[0].performTextClearance(); boxes[0].performTextInput("95")
        rule.waitForIdle()
        rule.onNodeWithText("La latitud va de", substring = true).assertExists()
        assertEquals(-13.5, got!!.lat, 1e-9)
    }

    @Test fun touchingTheMapPlacesThePointNearTheCenter() {
        var got by mutableStateOf<ZcLatLng?>(null)
        rule.setContent { ZonacardsTheme(dark = false) { ZcLocationPicker(got, { got = it }, "Ubica el punto", center = ZcLatLng(-12.0464, -77.0428), fetchTile = { tile }) } }
        rule.onNodeWithText("Aún no hay un punto elegido.").assertExists()
        rule.onNode(hasContentDescription("Ubica el punto")).performTouchInput { click(center) }
        rule.waitForIdle()
        assertNotNull(got)
        assertEquals(-12.0464, got!!.lat, 0.01)
        assertEquals(-77.0428, got!!.lng, 0.01)
        rule.onNodeWithText("Coordenadas:", substring = true).assertExists()
    }

    @Test fun theUseMyLocationButtonOnlyAppearsWhenTheAppAsksForIt() {
        var asked = 0
        rule.setContent { ZonacardsTheme(dark = false) { ZcLocationPicker(null, {}, "Ubica el punto", fetchTile = { tile }, onUseMyLocation = { asked++ }) } }
        rule.onNodeWithText("Usar mi ubicación").performClick()
        assertEquals(1, asked)
    }
}
