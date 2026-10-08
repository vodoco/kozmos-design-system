package com.kozmos.components.navigationitem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.sidebar.KozmosSidebar
import com.kozmos.components.sidebar.KozmosSidebarVariant
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosTypography
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 42, read off the drawing: a selected rail item is on theme/0 with a
 * 2dp theme/600 bar down its end edge, the right and, right to left, the left;
 * an item at rest has neither. KozmosSidebar's rail draws its 1dp edge in the
 * border role at its end, and its selected item's bar ends where the edge
 * begins. Paparazzi scales its frames down, so a point is found from the
 * frame's own width over the screen's width in dp, never from dp and density.
 */
class KozmosNavigationItemRailBarTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private class Frame(val pixels: DrawnPixels, val screenWidthDp: Int, val colors: Map<String, Int>) {
        /** The frame's pixel column at [dp] from its left edge. */
        fun x(dp: Float): Int = (dp * pixels.width / screenWidthDp).toInt().coerceIn(0, pixels.width - 1)
        fun y(dp: Float): Int = (dp * pixels.width / screenWidthDp).toInt().coerceIn(0, pixels.height - 1)
        fun at(xDp: Float, yDp: Float): Int = pixels.argb(x(xDp), y(yDp))
    }

    private fun Color.argb(): Int {
        fun channel(value: Float) = (value * 255 + 0.5f).toInt()
        return (0xFF shl 24) or (channel(red) shl 16) or (channel(green) shl 8) or channel(blue)
    }

    private fun draw(direction: LayoutDirection, content: @Composable () -> Unit): Frame {
        var width = 0
        val colors = mutableMapOf<String, Int>()
        val pixels = paparazzi.drawn(frames) {
            width = LocalConfiguration.current.screenWidthDp
            CompositionLocalProvider(
                LocalLayoutDirection provides direction,
                LocalKozmosUseDarkTokens provides false
            ) {
                colors["tint"] = KozmosThemeTokens.primitivesColorsTheme0.argb()
                colors["primary"] = KozmosThemeTokens.primitivesColorsTheme600.argb()
                colors["edge"] = KozmosThemeTokens.semanticsBorderSubtle.argb()
                KozmosMaterialTheme(typography = KozmosTypography.typography()) {
                    Box(Modifier.fillMaxSize().background(Color.White)) { content() }
                }
            }
        }
        return Frame(pixels, width, colors)
    }

    private fun assertColour(what: String, expected: Int, actual: Int) =
        assertTrue("$what: drew ${DrawnPixels.hex(actual)}, not ${DrawnPixels.hex(expected)}", DrawnPixels.matches(actual, expected, 3))

    @Test
    fun aSelectedItemIsOnTheTintWithABarDownItsEnd() {
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            val frame = draw(direction) {
                KozmosNavigationItem(
                    label = "Search",
                    modifier = Modifier.fillMaxSize(),
                    placement = KozmosNavigationItemPlacement.Rail,
                    content = KozmosNavigationItemContent.IconLabel,
                    selected = true,
                    icon = { Box(Modifier.size(24.dp)) }
                )
            }
            val width = frame.screenWidthDp.toFloat()
            // Near the top, clear of the centred icon and label.
            val y = 8f
            val (bar, beside) = if (direction == LayoutDirection.Ltr) width - 0.5f to width - 3.5f else 0.5f to 3.5f
            assertColour("$direction: the bar", frame.colors.getValue("primary"), frame.at(bar, y))
            assertColour("$direction: beside the bar", frame.colors.getValue("tint"), frame.at(beside, y))
            assertColour("$direction: the fill", frame.colors.getValue("tint"), frame.at(width / 2, y))
        }
    }

    @Test
    fun anItemAtRestHasNoFillAndNoBar() {
        val frame = draw(LayoutDirection.Ltr) {
            KozmosNavigationItem(
                label = "Home",
                modifier = Modifier.fillMaxSize(),
                placement = KozmosNavigationItemPlacement.Rail,
                content = KozmosNavigationItemContent.IconLabel,
                icon = { Box(Modifier.size(24.dp)) }
            )
        }
        val width = frame.screenWidthDp.toFloat()
        assertColour("its end", 0xFFFFFFFF.toInt(), frame.at(width - 0.5f, 8f))
        assertColour("its middle", 0xFFFFFFFF.toInt(), frame.at(width / 2, 8f))
    }

    @Test
    fun theSidebarRailsEdgeIsAtItsEndAndTheBarEndsWhereItBegins() {
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            val frame = draw(direction) {
                KozmosSidebar(
                    variant = KozmosSidebarVariant.Rail,
                    navigation = {
                        KozmosNavigationItem(
                            label = "Search",
                            placement = KozmosNavigationItemPlacement.Rail,
                            content = KozmosNavigationItemContent.IconLabel,
                            selected = true,
                            icon = { Box(Modifier.size(24.dp)) }
                        )
                    }
                )
            }
            val width = frame.screenWidthDp.toFloat()
            // The item is under the rail's 24dp of padding; 8dp into it is
            // clear of its content. Right to left, the rail is at the right.
            val y = 24f + 8f
            fun inRail(dp: Float) = if (direction == LayoutDirection.Ltr) dp else width - dp
            assertColour("$direction: the rail's edge", frame.colors.getValue("edge"), frame.at(inRail(95.5f), y))
            assertColour("$direction: the bar", frame.colors.getValue("primary"), frame.at(inRail(94f), y))
            assertColour("$direction: the tint", frame.colors.getValue("tint"), frame.at(inRail(91.5f), y))
            assertColour("$direction: beyond the rail", 0xFFFFFFFF.toInt(), frame.at(inRail(100f), y))
        }
    }
}
