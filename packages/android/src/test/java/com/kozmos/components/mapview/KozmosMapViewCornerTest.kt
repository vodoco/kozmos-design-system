package com.kozmos.components.mapview

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.roundToInt
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's framed MapView is `overflow-hidden` with a rounded border, and its
 * fill is the box's own background, so nothing of it shows past the curve;
 * SwiftUI clips its fill to the corner radius. Compose drew its fill before
 * its clip, so the fill kept square corners outside the rounded border.
 */
class KozmosMapViewCornerTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFFFF00FF.toInt()

    @Test fun theFillStaysInsideTheRoundedCornersInBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            var density = 1f
            var canvas = IntSize(1, 1)
            var map = Rect.Zero
            val drawn = paparazzi.drawn(frames) {
                density = LocalDensity.current.density
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                    KozmosMaterialTheme {
                        Box(Modifier.fillMaxSize().background(Color(host)).onGloballyPositioned { canvas = it.size }) {
                            KozmosMapView(
                                Modifier.padding(16.dp).size(240.dp, 400.dp).onGloballyPositioned { map = it.boundsInRoot() }
                            )
                        }
                    }
                }
            }
            // Paparazzi's image may be scaled down from the layout's pixels.
            fun at(x: Float, y: Float) = drawn.argb(
                (x * drawn.width / canvas.width).roundToInt(),
                (y * drawn.height / canvas.height).roundToInt()
            )
            val inset = 3 * density // 3dp in from both edges: past a 16dp curve, clear of the 1dp border
            val corners = mapOf(
                "top start" to at(map.left + inset, map.top + inset),
                "top end" to at(map.right - inset, map.top + inset),
                "bottom start" to at(map.left + inset, map.bottom - inset),
                "bottom end" to at(map.right - inset, map.bottom - inset)
            )
            val mode = if (dark) "dark" else "light"
            for ((corner, colour) in corners) {
                if (!DrawnPixels.matches(colour, host, 8)) {
                    wrong += "$mode $corner: ${DrawnPixels.hex(colour)} drawn outside the rounded corner, not the host's ${DrawnPixels.hex(host)}"
                }
            }
            // The fill is drawn inside: a stand-in for the map, not the host.
            val middle = at(map.center.x, map.center.y)
            if (DrawnPixels.matches(middle, host, 8)) wrong += "$mode: no fill drawn inside the map"
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
