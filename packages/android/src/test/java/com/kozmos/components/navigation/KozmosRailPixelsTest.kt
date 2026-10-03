package com.kozmos.components.navigation

import androidx.compose.foundation.layout.width
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.routeprogressrail.KozmosRouteProgressRail
import com.kozmos.components.routeprogressrail.KozmosRouteProgressWaypoint
import com.kozmos.tokens.KozmosColors
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class KozmosRailPixelsTest {
    private val frames = KeptFrames()
    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    @Test fun waypointsAndCompletedTrackAreActuallyDrawn() {
        fun count(progress: Float?, completed: Boolean, points: List<KozmosRouteProgressWaypoint>, color: Int): Int {
            val pixels = paparazzi.drawn(frames) {
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) { MaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color.White)) {
                        KozmosRouteProgressRail(progress, DirectionType.Left, "Journey", Modifier.width(300.dp),
                            waypoints = points, showCompletedTrack = completed)
                    }
                } }
            }
            var found = 0
            for (y in 0 until pixels.height) for (x in 0 until pixels.width) {
                if (DrawnPixels.matches(pixels.argb(x, y), color)) found++
            }
            return found
        }
        val ink = KozmosColors.primitivesColorsForeground100.toArgb()
        val theme = KozmosColors.primitivesColorsTheme500.toArgb()
        assertEquals(0, count(null, false, emptyList(), ink))
        assertTrue(count(null, false, listOf(KozmosRouteProgressWaypoint("gallery", 0.5f, DirectionType.Left, "Gallery")), ink) > 20)
        val plain = count(0.5f, false, emptyList(), theme)
        assertTrue(count(0.5f, true, emptyList(), theme) > plain + 100)
        assertEquals(0, count(null, true, emptyList(), theme))
    }

    @Test fun currentDiscUsesLogicalDirectionAndUnknownHasNoCurrentDisc() {
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            for (progress in listOf(0.25f, null)) {
                var bounds = Rect.Zero
                var rootWidth = 0
                val pixels = paparazzi.drawn(frames) {
                    CompositionLocalProvider(LocalLayoutDirection provides direction, LocalKozmosUseDarkTokens provides false) {
                        MaterialTheme {
                            val view = LocalView.current
                            Box(Modifier.fillMaxSize()) {
                              KozmosRouteProgressRail(progress, DirectionType.Left, "Journey",
                                Modifier.width(300.dp).onGloballyPositioned {
                                    bounds = it.boundsInRoot(); rootWidth = view.width
                                }, valueText = null)
                            }
                        }
                    }
                }
                // Paparazzi scales the final snapshot to its camera bounds.
                // Layout coordinates are physical display pixels; map them to
                // the kept frame before sampling, rather than assuming 1:1.
                assertTrue(rootWidth > 0)
                val cameraScale = pixels.width.toFloat() / rootWidth
                bounds = Rect(bounds.left * cameraScale, bounds.top * cameraScale,
                    bounds.right * cameraScale, bounds.bottom * cameraScale)
                val scale = bounds.width / 300f
                val theme = KozmosColors.primitivesColorsTheme500.toArgb()
                var left = Int.MAX_VALUE
                var right = -1
                // Scan the complete camera height: its system-bar/crop origin
                // differs from the Compose root. Only this isolated rail is
                // rendered, and the horizontal inset excludes its endpoint dots.
                for (y in 0 until pixels.height) {
                    for (x in (bounds.left + 12 * scale).toInt() until (bounds.right - 12 * scale).toInt()) {
                        if (DrawnPixels.matches(pixels.argb(x, y), theme)) {
                            left = minOf(left, x); right = maxOf(right, x)
                        }
                    }
                }
                if (progress == null) assertEquals(-1, right) else {
                    assertTrue("current disc absent for $direction", right >= 0)
                    val leading = 10 + (300 - 54) * 0.25f
                    val expected = if (direction == LayoutDirection.Ltr) leading else 300 - 34 - leading
                    assertEquals(expected, (left - bounds.left) / scale, 1.5f)
                    assertEquals(34f, (right - left + 1) / scale, 1.5f)
                }
            }
        }
    }
}
