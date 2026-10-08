package com.kozmos.components.locationpin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.categorytile.KozmosCategoryTint
import com.kozmos.components.counter.KozmosInkedFill
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * Decision 55 (Olcay, 2026-09-29), read off the drawing: a numbered pin pairs
 * with its result card's number tab. At rest it is quiet — the surface, a
 * ring and the number in its colour, as the SDK's map draws its unselected
 * results — and only the selected one is filled. Off the floor the outlined
 * marker's ring is dashed, so a quiet pin is never taken for one on another
 * floor. Paparazzi scales its frames down, so a point is found from the
 * frame's own width over the screen's width in dp, never from dp and density.
 */
class KozmosLocationPinQuietTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private class Frame(val pixels: DrawnPixels, val screenWidthDp: Int, val colors: Map<String, Int>) {
        fun px(dp: Float): Int = (dp * pixels.width / screenWidthDp).toInt()
        fun at(xDp: Float, yDp: Float): Int =
            pixels.argb(px(xDp).coerceIn(0, pixels.width - 1), px(yDp).coerceIn(0, pixels.height - 1))
    }

    private fun Color.argb(): Int {
        fun channel(value: Float) = (value * 255 + 0.5f).toInt()
        return (0xFF shl 24) or (channel(red) shl 16) or (channel(green) shl 8) or channel(blue)
    }

    /** The pin at 16dp from the top start, on the surface of its theme. */
    private fun draw(dark: Boolean = false, pin: @Composable () -> Unit): Frame {
        var width = 0
        val colors = mutableMapOf<String, Int>()
        val pixels = paparazzi.drawn(frames) {
            width = LocalConfiguration.current.screenWidthDp
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                colors["surface"] = KozmosThemeTokens.primitivesColorsBackground0.argb()
                colors["themeText"] = KozmosThemeTokens.semanticsEmotionThemedText.argb()
                // The theme fill, theme 500 in both themes (decision 59).
                colors["themeFill"] = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle.argb()
                MaterialTheme {
                    Box(Modifier.fillMaxSize().background(KozmosThemeTokens.primitivesColorsBackground0).padding(16.dp)) {
                        pin()
                    }
                }
            }
        }
        return Frame(pixels, width, colors)
    }

    private fun assertColour(what: String, expected: Int, actual: Int, tolerance: Int = 3) =
        assertTrue("$what: drew ${DrawnPixels.hex(actual)}, not ${DrawnPixels.hex(expected)}", DrawnPixels.matches(actual, expected, tolerance))

    private fun isBlue(argb: Int): Boolean {
        val r = argb shr 16 and 0xFF
        val g = argb shr 8 and 0xFF
        val b = argb and 0xFF
        return b > 150 && b > r + 60 && b > g + 40
    }

    /** How many separate runs of the ring's colour lie on a circle of [radius] dp around the centre. */
    private fun Frame.runsAround(centre: Float, radius: Float, matches: (Int) -> Boolean): Int {
        val samples = (0 until 720).map { step ->
            val angle = step * PI / 360
            matches(at(centre + radius * cos(angle).toFloat(), centre + radius * sin(angle).toFloat()))
        }
        // Runs on a closed circle: count starts of a run, wrapping round.
        return samples.indices.count { i -> samples[i] && !samples[(i + samples.size - 1) % samples.size] }
            .let { if (it == 0 && samples.all { s -> s }) 1 else it }
    }

    @Test
    fun aNumberedPinAtRestIsQuietAndFillsOnlyWhenSelected() {
        // Large: 40dp, from 16 to 56, its centre at 36.
        val rest = draw { KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 2) }
        assertColour("inside the ring at rest", rest.colors.getValue("surface"), rest.at(36f - 12f, 36f))
        assertColour("the ring at rest", rest.colors.getValue("themeText"), rest.at(16f + 1.5f, 36f), 6)
        // The number is in the ring's colour: blue inside the ring, where the fill is not.
        val glyph = (-6..6).sumOf { dx -> (-7..7).count { dy -> isBlue(rest.at(36f + dx, 36f + dy)) } }
        assertTrue("the number at rest is not in the primary colour", glyph > 4)

        // Selected: 48dp, from 16 to 64, its centre at 40; filled in the theme.
        val selected = draw { KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 2, selected = true) }
        assertColour("inside the selected pin", selected.colors.getValue("themeFill"), selected.at(40f - 12f, 40f))
    }

    @Test
    fun anOffFloorPinsRingIsDashedAndAQuietPinsIsSolid() {
        val quiet = draw { KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 4) }
        assertEquals("a quiet pin's ring is not one solid ring", 1, quiet.runsAround(36f, 18.5f, ::isBlue))

        val offFloor = draw { KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 4, offFloor = true) }
        assertEquals("an off-floor pin's ring is not eight dashes", 8, offFloor.runsAround(36f, 18.5f, ::isBlue))
        // Inside, the surface: outlined, not filled.
        assertColour("inside the off-floor pin", offFloor.colors.getValue("surface"), offFloor.at(36f - 12f, 36f))

        // Selected off the floor: 48dp, still dashed, never filled.
        val selected = draw { KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 4, selected = true, offFloor = true) }
        assertEquals("a selected off-floor pin is not dashed", 8, selected.runsAround(40f, 22.5f, ::isBlue))
        assertColour("inside the selected off-floor pin", selected.colors.getValue("surface"), selected.at(40f - 14f, 40f))
    }

    /**
     * Theme/500 is one blue in both themes, 3.74:1 on the dark surface: a
     * quiet pin's ring and number take the theme's text role, #5887F3 in the
     * dark (6.18:1 on it).
     */
    @Test
    fun aQuietPinReadsOnTheDarkSurface() {
        val dark = draw(dark = true) { KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 2) }
        assertColour("inside the dark pin at rest", dark.colors.getValue("surface"), dark.at(36f - 12f, 36f))
        assertColour("the dark ring", 0xFF5887F3.toInt(), dark.at(16f + 1.5f, 36f), 6)
    }

    /**
     * A tint rings the quiet marker in its fill; its number takes the
     * foreground, since the fill fails 4.5:1 as text for six of the eight
     * (yellow reads 1.92:1 on white).
     */
    @Test
    fun aTintedPinAtRestIsRingedInItsFillWithTheNumberInTheForeground() {
        var yellow = 0
        val frame = draw {
            val tint = KozmosCategoryTint(
                KozmosThemeTokens.semanticsCategoryAccentYellow,
                KozmosInkedFill(KozmosThemeTokens.semanticsCategoryFillYellow, KozmosThemeTokens.semanticsCategoryOnfillYellow)
            )
            yellow = KozmosThemeTokens.semanticsCategoryFillYellow.argb()
            KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 3, tint = tint)
        }
        assertColour("inside the tinted pin at rest", frame.colors.getValue("surface"), frame.at(36f - 12f, 36f))
        assertColour("the tinted ring", yellow, frame.at(16f + 1.5f, 36f), 6)
        val dark = (-6..6).sumOf { dx ->
            (-7..7).count { dy -> DrawnPixels.lightness(frame.at(36f + dx, 36f + dy)) < 150 }
        }
        assertTrue("the tinted number is not in the foreground", dark > 4)
    }
}
