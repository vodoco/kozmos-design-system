package com.kozmos.components.userlocationmarker

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.motion.LocalKozmosAnimatorScale
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The full marker as drawn, on white: its pulse with system animations on and
 * off.
 */
class KozmosUserLocationMarkerPixelsTest {
    private val frames = KeptFrames()
    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    /** What was drawn, and the marker's centre and one dp, in its pixels. */
    private class Marker(val pixels: DrawnPixels, val x: Float, val y: Float, val dp: Float) {
        fun at(dx: Float, dy: Float): Int =
            pixels.argb((x + dx * dp).toInt(), (y + dy * dp).toInt())
    }

    private fun drawn(animationsOn: Boolean): Marker {
        var bounds = Rect.Zero
        var rootWidth = 0
        val pixels = paparazzi.drawn(frames) {
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides false,
                LocalKozmosAnimatorScale provides if (animationsOn) 1f else 0f
            ) {
                MaterialTheme {
                    val view = LocalView.current
                    Box(Modifier.fillMaxSize().background(Color.White), contentAlignment = Alignment.Center) {
                        KozmosUserLocationMarker(
                            showHeading = false,
                            modifier = Modifier.onGloballyPositioned {
                                bounds = it.boundsInRoot()
                                rootWidth = view.width
                            }
                        )
                    }
                }
            }
        }
        val scale = pixels.width.toFloat() / rootWidth
        return Marker(pixels, bounds.center.x * scale, bounds.center.y * scale, bounds.width * scale / 64f)
    }

    private fun red(argb: Int) = argb shr 16 and 255

    /**
     * With system animations off the pulse holds still at 48 and 30 %, as
     * React's does (`motion-reduce:animate-none`) and as Figma draws it.
     * Until 2026-10-06 it ran on whatever the setting, while Spinner,
     * Skeleton and Progress stopped.
     */
    @Test fun thePulseHoldsStillAtFortyEightWhenAnimationsAreOff() {
        // The halo alone is the blue at 14 % on white (red about 224); the
        // pulse over it, at 30 %, takes red to about 168.
        fun pulseRadius(marker: Marker) =
            (10..31).lastOrNull { radius -> red(marker.at(radius.toFloat(), 0f)) < 200 }
        val still = drawn(animationsOn = false)
        assertEquals("the still pulse's radius", 24f, (pulseRadius(still) ?: 0).toFloat(), 1.5f)
        assertTrue("the halo reaches 31", red(still.at(31f, 0f)) < 250)
        // With animations on, the first frame is the pulse's start: 0.6 of 48.
        val moving = drawn(animationsOn = true)
        assertEquals("the pulse's first frame", 14.4f, (pulseRadius(moving) ?: 0).toFloat(), 1.5f)
    }
}
