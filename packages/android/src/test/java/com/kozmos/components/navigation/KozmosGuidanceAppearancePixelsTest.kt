package com.kozmos.components.navigation

import androidx.compose.foundation.layout.width
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.manoeuvrecard.KozmosManoeuvreCard
import com.kozmos.components.manoeuvrecard.KozmosManoeuvreAppearance
import com.kozmos.components.surface.LocalKozmosSurfaceStyle
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosColors
import com.kozmos.tokens.KozmosColorsDark
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Rule
import org.junit.Test

class KozmosGuidanceAppearancePixelsTest {
    private val frames = KeptFrames()
    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    /**
     * The theme appearance is the theme fill with the theme foreground on it,
     * white in both themes (decision 59): foreground/1000 turned black on it
     * in the dark. What the product puts in the card inherits it.
     */
    @Test fun customContentInheritsContrastingForegroundAndBackgroundRetainsGlass() {
        for (dark in listOf(false, true)) for (appearance in KozmosManoeuvreAppearance.values()) {
            var contentColor: Int? = null
            var effectiveSurface: KozmosSurfaceStyle? = null
            paparazzi.drawn(frames) {
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                    KozmosMaterialTheme {
                        KozmosManoeuvreCard(DirectionType.Left, "Left", true, {}, appearance,
                            modifier = Modifier.width(320.dp), surface = KozmosSurfaceStyle.Glass) {
                            contentColor = LocalContentColor.current.toArgb()
                            effectiveSurface = LocalKozmosSurfaceStyle.current
                            Text("Custom itinerary")
                        }
                    }
                }
            }
            if (appearance == KozmosManoeuvreAppearance.Theme) {
                val foreground = (if (dark) KozmosColorsDark.componentsPrimaryButtonsThemedButtonForegroundContentIdle
                    else KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle).toArgb()
                assertEquals("dark=$dark: the theme card's content is not the theme foreground", foreground, contentColor)
                assertEquals(KozmosSurfaceStyle.Solid, effectiveSurface)
            } else assertEquals(KozmosSurfaceStyle.Glass, effectiveSurface)
        }
    }

    /**
     * How many of [pixels] are the theme fill, in the theme drawn: theme 500,
     * one colour in both themes, as every prominent fill is (decision 59). It
     * was theme 600.
     */
    private fun themeFill(pixels: DrawnPixels, dark: Boolean): Int {
        val theme = (if (dark) KozmosColorsDark.componentsPrimaryButtonsThemedButtonBackgroundIdle
            else KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle).toArgb()
        var filled = 0
        for (y in 0 until pixels.height) for (x in 0 until pixels.width) {
            if (DrawnPixels.matches(pixels.argb(x, y), theme, tolerance = 3)) filled++
        }
        return filled
    }

    @Test fun defaultGuidanceHasAnOpaqueThemeFill() {
        for (dark in listOf(false, true)) {
            val pixels = paparazzi.drawn(frames) {
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                    KozmosMaterialTheme {
                        KozmosManoeuvreCard(DirectionType.Straight, "Continue", false, {},
                            modifier = Modifier.width(320.dp)) {}
                    }
                }
            }
            val filled = themeFill(pixels, dark)
            assertTrue("Expected an opaque theme surface, found only $filled theme pixels", filled > 10000)
        }
    }

    /**
     * D6 (2026-10-04): a surface named with no appearance is the background
     * appearance on that surface, as a 0.5.0 call that passed glass got: no
     * theme fill, and the itinerary told the surface it is on.
     */
    @Test fun anExplicitSurfaceWithoutAnAppearanceIsTheBackgroundAppearance() {
        for (surface in KozmosSurfaceStyle.values()) {
            var effectiveSurface: KozmosSurfaceStyle? = null
            var contentColor: Int? = null
            val pixels = paparazzi.drawn(frames) {
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                    KozmosMaterialTheme {
                        KozmosManoeuvreCard(DirectionType.Straight, "Continue", true, {},
                            modifier = Modifier.width(320.dp), surface = surface) {
                            effectiveSurface = LocalKozmosSurfaceStyle.current
                            contentColor = LocalContentColor.current.toArgb()
                            Text("Custom itinerary")
                        }
                    }
                }
            }
            assertEquals("$surface: the itinerary is not told its surface", surface, effectiveSurface)
            assertNotEquals("$surface: the itinerary takes the theme guidance colour",
                KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle.toArgb(), contentColor)
            assertEquals("$surface: the card is theme-filled", 0, themeFill(pixels, dark = false))
        }
    }

    /** An appearance named wins over a surface named. */
    @Test fun anExplicitAppearanceWinsOverTheSurface() {
        val pixels = paparazzi.drawn(frames) {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                KozmosMaterialTheme {
                    KozmosManoeuvreCard(DirectionType.Straight, "Continue", false, {}, KozmosManoeuvreAppearance.Theme,
                        modifier = Modifier.width(320.dp), surface = KozmosSurfaceStyle.Glass) {}
                }
            }
        }
        val filled = themeFill(pixels, dark = false)
        assertTrue("Theme named with glass is not theme-filled: $filled theme pixels", filled > 10000)
    }
}
