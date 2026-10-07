package com.kozmos.components.clientappbanner

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.ColorPainter
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The banner's icon, read off the drawing (GAP-127). The app's initial on the
 * muted fill stands in for the icon only until it has loaded: under a loaded
 * icon nothing is drawn, so a transparent one shows the banner's surface, as
 * on the web, where the fallback goes once the image loads. Before, the fill
 * and the initial were drawn under every icon. Coil loads nothing under
 * Paparazzi, so the image here is a transparent painter, as a loaded icon
 * with no ink of its own draws. Paparazzi scales its frames down, so a point
 * is found from the frame's own width over the screen's width in dp.
 */
class KozmosClientAppBannerIconTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private class Frame(val pixels: DrawnPixels, val screenWidthDp: Int) {
        private fun px(dp: Float, limit: Int) = (dp * pixels.width / screenWidthDp).toInt().coerceIn(0, limit - 1)

        /** Every pixel from [fromDp] to [toDp] across and down. */
        fun square(fromDp: Float, toDp: Float): List<Int> =
            (px(fromDp, pixels.height)..px(toDp, pixels.height)).flatMap { y ->
                (px(fromDp, pixels.width)..px(toDp, pixels.width)).map { x -> pixels.argb(x, y) }
            }
    }

    private fun Color.argb(): Int {
        fun channel(value: Float) = (value * 255 + 0.5f).toInt()
        return (0xFF shl 24) or (channel(red) shl 16) or (channel(green) shl 8) or channel(blue)
    }

    /** The icon at (20, 20) on magenta, a colour nothing in it is. */
    private fun draw(loaded: Boolean, fill: (Int) -> Unit = {}): Frame {
        var width = 0
        val pixels = paparazzi.drawn(frames) {
            width = LocalConfiguration.current.screenWidthDp
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                fill(KozmosThemeTokens.primitivesColorsBackground100.argb())
                MaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color.Magenta)) {
                        Box(Modifier.offset(20.dp, 20.dp)) {
                            ClientAppBannerIconFace(initial = "N", loaded = loaded) {
                                Image(ColorPainter(Color.Transparent), contentDescription = null, modifier = Modifier.matchParentSize())
                            }
                        }
                    }
                }
            }
        }
        return Frame(pixels, width)
    }

    /** Inside the square, at (20, 20) and 48 across, clear of its edge and corners. */
    private fun Frame.inside() = square(26f, 62f)

    @Test
    fun untilTheIconLoadsItsInitialStandsInOnTheMutedFill() {
        var fill = 0
        val frame = draw(loaded = false) { fill = it }
        val drawn = frame.inside()
        assertTrue(
            "the muted fill is missing: ${drawn.distinct().map(DrawnPixels::hex)}",
            drawn.count { DrawnPixels.matches(it, fill, 3) } > drawn.size / 2
        )
        assertTrue(
            "no initial is drawn on the fill",
            drawn.any { DrawnPixels.lightness(it) < DrawnPixels.lightness(fill) - 300 }
        )
    }

    @Test
    fun onceTheIconHasLoadedNothingIsDrawnUnderIt() {
        val frame = draw(loaded = true)
        val magenta = Color.Magenta.argb()
        val showing = frame.inside().filterNot { DrawnPixels.matches(it, magenta, 3) }
        assertEquals(
            "under a loaded, transparent icon the initial or its fill shows through",
            emptyList<String>(),
            showing.distinct().map(DrawnPixels::hex)
        )
    }
}
