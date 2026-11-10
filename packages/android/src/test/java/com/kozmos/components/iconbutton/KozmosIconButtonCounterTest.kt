package com.kozmos.components.iconbutton

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosTypography
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-197, decision 134: IconButton's `counter`, as React's. The count is
 * Counter's small brand pill over the icon's top-end corner: its bottom edge on
 * the button's centre line and its start edge 2 past it, at every size,
 * mirrored right to left. TalkBack reads it with the button's name, "Help, 3",
 * in `counterLabel`'s words and after `counterSeparator` when given; the drawn
 * number is no node of its own.
 *
 * The counter is found as what a button with one draws and the same button
 * without one does not, so nothing here depends on the icon's own ink.
 */
class KozmosIconButtonCounterTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private class Drawn(val pixels: DrawnPixels, val button: Rect, val dpPerPixel: Float)

    private fun draw(
        counter: Int?,
        size: KozmosIconButtonSize = KozmosIconButtonSize.Default,
        direction: LayoutDirection = LayoutDirection.Ltr,
        enabled: Boolean = true
    ): Drawn {
        var button = Rect.Zero
        var rootWidth = 0f
        var density = 1f
        val pixels = paparazzi.drawn(frames) {
            density = LocalDensity.current.density
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides false,
                LocalLayoutDirection provides direction
            ) {
                KozmosMaterialTheme(typography = KozmosTypography.typography()) {
                    Box(Modifier.fillMaxSize().background(Color.White).onGloballyPositioned { rootWidth = it.size.width.toFloat() }) {
                        KozmosIconButton(
                            icon = Icons.Default.Info,
                            onClick = {},
                            contentDescription = "Help",
                            modifier = Modifier.padding(40.dp).onGloballyPositioned { button = it.boundsInRoot() },
                            size = size,
                            enabled = enabled,
                            counter = counter
                        )
                    }
                }
            }
        }
        val scale = pixels.width / rootWidth
        return Drawn(pixels, Rect(button.left / density, button.top / density, button.right / density, button.bottom / density), 1f / (scale * density))
    }

    /** What [with] draws that [without] does not, in dp; null when nothing. */
    private fun added(with: Drawn, without: Drawn): Rect? {
        var minX = Int.MAX_VALUE
        var minY = Int.MAX_VALUE
        var maxX = -1
        var maxY = -1
        for (y in 0 until with.pixels.height) {
            for (x in 0 until with.pixels.width) {
                val a = with.pixels.argb(x, y)
                val b = without.pixels.argb(x, y)
                val difference = listOf(24, 16, 8, 0).maxOf { shift -> kotlin.math.abs((a shr shift and 0xFF) - (b shr shift and 0xFF)) }
                if (difference > 64) {
                    minX = minOf(minX, x); maxX = maxOf(maxX, x); minY = minOf(minY, y); maxY = maxOf(maxY, y)
                }
            }
        }
        if (maxX < 0) return null
        val d = with.dpPerPixel
        return Rect(minX * d, minY * d, (maxX + 1) * d, (maxY + 1) * d)
    }

    // A frame pixel is about two dp here (Paparazzi scales its frame down), so
    // positions hold to that.
    private val pixel = 2.5f

    @Test
    fun theCountSitsOverTheIconsTopEndCorner() {
        for (size in listOf(KozmosIconButtonSize.Default, KozmosIconButtonSize.Lg)) {
            val with = draw(3, size)
            val box = checkNotNull(added(with, draw(null, size))) { "$size: no counter drawn" }
            val centre = with.button.center
            assertEquals("$size: its bottom on the centre line", centre.y, box.bottom, pixel)
            assertEquals("$size: its start edge 2 past the centre", centre.x + 2f, box.left, pixel)
            assertEquals("$size: Counter's small pill", 18f, box.height, pixel)
            assertEquals("$size: one digit in its 18 minimum", 18f, box.width, pixel)
        }
    }

    @Test
    fun rightToLeftItIsOverTheTopLeftCorner() {
        val with = draw(3, direction = LayoutDirection.Rtl)
        val box = checkNotNull(added(with, draw(null, direction = LayoutDirection.Rtl))) { "no counter drawn" }
        assertEquals("its start edge 2 before the centre", with.button.center.x - 2f, box.right, pixel)
        assertEquals(with.button.center.y, box.bottom, pixel)
    }

    @Test
    fun itIsDrawnInTheThemeFill() {
        var fill = 0
        paparazzi.drawn(frames) {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                fill = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle.toArgb()
            }
        }
        val with = draw(3)
        val box = checkNotNull(added(with, draw(null)))
        val scale = 1f / with.dpPerPixel
        // The pill's fill beside its digit, 3 in from its start, half way down.
        val x = ((box.left + 3f) * scale).toInt()
        val y = (box.center.y * scale).toInt()
        val drawn = with.pixels.argb(x, y)
        assertTrue("the pill is ${DrawnPixels.hex(drawn)}, not ${DrawnPixels.hex(fill)}", DrawnPixels.matches(drawn, fill, 12))
    }

    @Test
    fun withoutACountNothingIsAdded() {
        assertNull(added(draw(null), draw(null)))
    }

    // What TalkBack hears.

    @Test
    fun talkBackReadsTheNameThenTheCount() {
        val read = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosIconButton(icon = Icons.Default.Info, onClick = {}, contentDescription = "Help", counter = 3)
            }
        }
        val button = read.named("Help, 3")
        assertTrue("one node says the count: ${read.names()}", read.names().count { it.contains("3") } == 1)
        assertTrue(button.click != null)
    }

    @Test
    fun theCountIsReadInTheProductsWords() {
        val read = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosIconButton(
                    icon = Icons.Default.Info,
                    onClick = {},
                    contentDescription = "ヘルプ",
                    counter = 3,
                    counterLabel = { "残り${it}件" },
                    counterSeparator = "、"
                )
            }
        }
        read.named("ヘルプ、残り3件")
    }

    @Test
    fun withoutACountTheNameIsAsItWas() {
        val read = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosIconButton(icon = Icons.Default.Info, onClick = {}, contentDescription = "Help")
            }
        }
        read.named("Help")
    }
}
