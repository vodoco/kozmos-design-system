package com.kozmos.components.chip

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.KozmosEmotion
import com.kozmos.components.ReadSemantics
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.roundToInt
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Chip in Tag's six emotions (decision 200, GAP-170), read off what is drawn
 * at twice the density, in light and dark: at rest the emotion's surface,
 * its words in the emotion's onSurface and its edge the emotion's text
 * colour; selected the emotion's text colour as the fill and the edge, its
 * words the page's background (background/0). Each pair clears 4.5:1 in both
 * themes. A chip with no emotion draws its variant as it always has.
 */
class KozmosChipEmotionPixelsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private data class Expected(val fill: Int, val ink: Int, val edge: Int)

    private class Drawn(val pixels: DrawnPixels, val tree: ReadSemantics, val scale: Float, val density: Float)

    private fun draw(dark: Boolean, content: @Composable () -> Unit): Drawn {
        var canvas = IntSize(1, 1)
        var density = 1f
        val tree = paparazzi.readSemantics {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(base.density * 2f, base.fontScale)
            ) {
                density = LocalDensity.current.density
                KozmosMaterialTheme {
                    Box(
                        Modifier.fillMaxSize()
                            .background(KozmosThemeTokens.primitivesColorsBackground0)
                            .onGloballyPositioned { canvas = it.size }
                    ) { Box(Modifier.padding(16.dp)) { content() } }
                }
            }
        }
        val pixels = DrawnPixels(checkNotNull(frames.last))
        return Drawn(pixels, tree, pixels.width.toFloat() / canvas.width, density)
    }

    /** The commonest colour in the node saying [words] that is not [fill]. */
    private fun Drawn.inkOf(words: String, fill: Int): Int {
        val box = tree.unmerged.single { it.texts == listOf(words) }.frame
        val counts = HashMap<Int, Int>()
        for (y in (box.top * scale).roundToInt() until (box.bottom * scale).roundToInt()) {
            for (x in (box.left * scale).roundToInt() until (box.right * scale).roundToInt()) {
                val argb = pixels.argb(x, y)
                if (!DrawnPixels.matches(argb, fill, 40)) counts[argb] = (counts[argb] ?: 0) + 1
            }
        }
        return counts.maxByOrNull { it.value }?.key ?: fill
    }

    private fun luminance(argb: Int): Double {
        fun channel(c: Int): Double = (c / 255.0).let { if (it <= 0.03928) it / 12.92 else Math.pow((it + 0.055) / 1.055, 2.4) }
        return 0.2126 * channel((argb shr 16) and 0xff) + 0.7152 * channel((argb shr 8) and 0xff) + 0.0722 * channel(argb and 0xff)
    }

    private fun contrast(a: Int, b: Int): Double {
        val (hi, lo) = listOf(luminance(a), luminance(b)).sortedDescending()
        return (hi + 0.05) / (lo + 0.05)
    }

    private fun check(selected: Boolean) {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val expected = HashMap<KozmosEmotion, Expected>()
            val drawn = draw(dark) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    for (emotion in KozmosEmotion.values()) {
                        expected[emotion] = if (selected) {
                            Expected(emotion.text.toArgb(), KozmosThemeTokens.primitivesColorsBackground0.toArgb(), emotion.text.toArgb())
                        } else {
                            Expected(emotion.surface.toArgb(), emotion.onSurface.toArgb(), emotion.text.toArgb())
                        }
                        KozmosChip(
                            text = "Chip $emotion",
                            emotion = emotion,
                            selected = selected,
                            modifier = Modifier.testTag("$emotion"),
                            onClick = {}
                        )
                    }
                }
            }
            for (emotion in KozmosEmotion.values()) {
                val want = expected.getValue(emotion)
                val case = "${if (dark) "dark" else "light"} ${if (selected) "selected" else "at rest"} $emotion"
                val box = drawn.tree.unmerged.single { it.tag == "$emotion" }.frame
                val cy = ((box.top + box.bottom) / 2 * drawn.scale).roundToInt()
                val fill = drawn.pixels.argb(((box.left + 8 * drawn.density) * drawn.scale).roundToInt(), cy)
                if (!DrawnPixels.matches(fill, want.fill, 6)) wrong += "$case: the fill is ${DrawnPixels.hex(fill)}, not ${DrawnPixels.hex(want.fill)}"
                val edge = drawn.pixels.argb(((box.left + 0.5f * drawn.density) * drawn.scale).roundToInt(), cy)
                if (!DrawnPixels.matches(edge, want.edge, 12)) wrong += "$case: the edge is ${DrawnPixels.hex(edge)}, not ${DrawnPixels.hex(want.edge)}"
                val ratio = contrast(want.fill, want.ink)
                if (ratio < 4.5) wrong += "$case: the words read ${"%.2f".format(ratio)}:1 on the fill, under 4.5:1"
                val ink = drawn.inkOf("Chip $emotion", want.fill)
                if (!DrawnPixels.matches(ink, want.ink, 6)) wrong += "$case: the words are ${DrawnPixels.hex(ink)}, not ${DrawnPixels.hex(want.ink)}"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test fun atRestEachEmotionIsItsSurfaceWithItsOnSurfaceWordsAndItsTextEdgeInBothThemes() = check(selected = false)

    @Test fun selectedEachEmotionIsFilledWithItsTextColourUnderThePagesBackgroundInBothThemes() = check(selected = true)

    @Test fun withNoEmotionTheNeutralVariantIsUnchanged() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            var fill = 0
            var ink = 0
            val drawn = draw(dark) {
                fill = KozmosThemeTokens.primitivesColorsBackground0.toArgb()
                ink = KozmosThemeTokens.primitivesColorsForeground100.toArgb()
                KozmosChip(text = "Plain", modifier = Modifier.testTag("plain"), emotion = null)
            }
            val box = drawn.tree.unmerged.single { it.tag == "plain" }.frame
            val at = drawn.pixels.argb(((box.left + 8 * drawn.density) * drawn.scale).roundToInt(), ((box.top + box.bottom) / 2 * drawn.scale).roundToInt())
            if (!DrawnPixels.matches(at, fill, 6)) wrong += "${if (dark) "dark" else "light"}: the fill is ${DrawnPixels.hex(at)}, not background/0"
            val words = drawn.inkOf("Plain", fill)
            if (!DrawnPixels.matches(words, ink, 6)) wrong += "${if (dark) "dark" else "light"}: the words are ${DrawnPixels.hex(words)}, not foreground/100"
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
