package com.kozmos.components.tooltip

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
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
 * Decision 192 (GAP-210): a tooltip takes an inverse tone, Pointr Cloud's
 * dark info and guidance tooltips. Inverse, the bubble and its tip are the
 * inverse surface (foreground/200: #2E3138 light, #D1CEC7 dark) and the words
 * the inverse on-surface (background/0: white light, black dark), with no
 * edge of another colour; the default tone is drawn as before: the page's
 * surface, background/0, with a background/200 edge and foreground/0 words.
 *
 * Read off the bubble as the popup draws it (Paparazzi draws only the root
 * window, never a Popup's), at twice the density, on a magenta page, above
 * its trigger, so its tip hangs from its bottom edge.
 */
class KozmosTooltipToneTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val page = 0xFFFF00FF.toInt()
    private fun mode(dark: Boolean) = if (dark) "dark" else "light"

    private class Look(val surface: Int, val words: Int, val edge: Int)

    private fun inverse(dark: Boolean) =
        if (dark) Look(0xFFD1CEC7.toInt(), 0xFF000000.toInt(), 0xFFD1CEC7.toInt())
        else Look(0xFF2E3138.toInt(), 0xFFFFFFFF.toInt(), 0xFF2E3138.toInt())

    private fun default(dark: Boolean) =
        if (dark) Look(0xFF000000.toInt(), 0xFFFFFFFF.toInt(), 0xFF2E3138.toInt())
        else Look(0xFFFFFFFF.toInt(), 0xFF000000.toInt(), 0xFFC7CAD1.toInt())

    /** What a bubble drew where: the frame, and the bubble's row in the frame's pixels. */
    private class Bubble(val drawn: DrawnPixels, val row: Rect, val dp: Float)

    private fun bubble(dark: Boolean, bubble: @Composable (Modifier) -> Unit): Bubble {
        var canvas = IntSize(1, 1)
        var density = 1f
        var row = Rect.Zero
        val drawn = paparazzi.drawn(frames) {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(base.density * 2f, base.fontScale)
            ) {
                density = LocalDensity.current.density
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color(page)).onGloballyPositioned { canvas = it.size }) {
                        Box(Modifier.padding(24.dp)) {
                            bubble(Modifier.onGloballyPositioned { row = it.boundsInRoot() })
                        }
                    }
                }
            }
        }
        val scale = drawn.width.toFloat() / canvas.width
        return Bubble(
            drawn,
            Rect(row.left * scale, row.top * scale, row.right * scale, row.bottom * scale),
            density * scale
        )
    }

    private fun Bubble.at(x: Float, y: Float) = drawn.argb(x.roundToInt(), y.roundToInt())

    private fun Bubble.count(colour: Int, tolerance: Int = 3): Int {
        var found = 0
        for (y in row.top.toInt() until row.bottom.toInt()) for (x in row.left.toInt() until row.right.toInt()) {
            if (DrawnPixels.matches(drawn.argb(x, y), colour, tolerance)) found++
        }
        return found
    }

    /**
     * Whether [bubble] wears [look]: its surface a dp in from its left end and
     * at its middle, its tip's middle 1dp above the point, its edge at its left
     * end, and its words.
     */
    private fun Bubble.wrongs(name: String, look: Look): List<String> {
        val wrong = mutableListOf<String>()
        val tipHeight = 4 * dp
        val bubbleBottom = row.bottom - tipHeight
        val middle = (row.top + bubbleBottom) / 2
        val surface = at(row.left + 3 * dp, middle)
        if (!DrawnPixels.matches(surface, look.surface, 3)) wrong += "$name: the bubble is ${DrawnPixels.hex(surface)}, not ${DrawnPixels.hex(look.surface)}"
        val tip = at(row.center.x, row.bottom - 1.5f * dp)
        if (!DrawnPixels.matches(tip, look.surface, 4)) wrong += "$name: the tip is ${DrawnPixels.hex(tip)}, not ${DrawnPixels.hex(look.surface)}"
        val edge = at(row.left + 0.25f * dp, middle)
        if (!DrawnPixels.matches(edge, look.edge, 4)) wrong += "$name: the edge is ${DrawnPixels.hex(edge)}, not ${DrawnPixels.hex(look.edge)}"
        val words = count(look.words)
        if (words < 30) wrong += "$name: the words draw $words pixels of ${DrawnPixels.hex(look.words)}"
        println("Decision 192 Android: $name: bubble ${DrawnPixels.hex(surface)}, tip ${DrawnPixels.hex(tip)}, edge ${DrawnPixels.hex(edge)}, $words pixels of the words' ${DrawnPixels.hex(look.words)}")
        return wrong
    }

    @Test
    fun anInverseTooltipDrawsTheInverseSurfaceAndWordsInLightAndDark() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            wrong += bubble(dark) { m -> TooltipBubble(text = "Aufzug", side = KozmosTooltipSide.Top, modifier = m, tone = KozmosTooltipTone.Inverse) }
                .wrongs("${mode(dark)} inverse", inverse(dark))
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    @Test
    fun theDefaultToneIsDrawnAsBeforeInLightAndDark() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            wrong += bubble(dark) { m -> TooltipBubble(text = "Aufzug", side = KozmosTooltipSide.Top, modifier = m) }
                .wrongs("${mode(dark)} default, unset", default(dark))
            wrong += bubble(dark) { m -> TooltipBubble(text = "Aufzug", side = KozmosTooltipSide.Top, modifier = m, tone = KozmosTooltipTone.Default) }
                .wrongs("${mode(dark)} default, given", default(dark))
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    @Test
    fun anInverseTooltipIsTheDefaultsSize() {
        var plain = Rect.Zero
        var inverse = Rect.Zero
        plain = bubble(false) { m -> TooltipBubble(text = "Aufzug", side = KozmosTooltipSide.Top, modifier = m) }.row
        inverse = bubble(false) { m -> TooltipBubble(text = "Aufzug", side = KozmosTooltipSide.Top, modifier = m, tone = KozmosTooltipTone.Inverse) }.row
        println("Decision 192 Android: default ${plain.width}x${plain.height}, inverse ${inverse.width}x${inverse.height}")
        assertTrue("inverse is ${inverse.width}x${inverse.height}, default ${plain.width}x${plain.height}", plain.size == inverse.size)
    }
}
