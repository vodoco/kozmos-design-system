package com.kozmos.components.emptystate

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
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
import com.kozmos.components.icon.KozmosIcon
import com.kozmos.components.icon.KozmosIconSize
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
 * EmptyState's tone (decision 194, GAP-213), read off what is drawn at twice
 * the density, in light and dark: the emotion's surface as a card, edged 1 in
 * the emotion's text colour; the title, description and list in the
 * emotion's onSurface; the icon's circle the page's background (background/0)
 * and the icon the emotion's text colour. Words reach 4.5:1 on the surface and
 * the icon 3:1 on its circle. With no tone it stands on the page as before.
 */
class KozmosEmptyStateToneTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private class Drawn(val pixels: DrawnPixels, val tree: ReadSemantics, val scale: Float, val density: Float, val page: Int) {
        fun at(x: Float, y: Float) = pixels.argb((x * scale).roundToInt(), (y * scale).roundToInt())
    }

    private fun draw(dark: Boolean, content: @Composable () -> Unit): Drawn {
        var canvas = IntSize(1, 1)
        var density = 1f
        var page = 0
        val tree = paparazzi.readSemantics {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(base.density * 2f, base.fontScale)
            ) {
                density = LocalDensity.current.density
                KozmosMaterialTheme {
                    page = KozmosThemeTokens.primitivesColorsBackground0.toArgb()
                    Box(Modifier.fillMaxSize().background(Color(page)).onGloballyPositioned { canvas = it.size }) {
                        Box(Modifier.padding(16.dp).width(320.dp)) { content() }
                    }
                }
            }
        }
        val pixels = DrawnPixels(checkNotNull(frames.last))
        return Drawn(pixels, tree, pixels.width.toFloat() / canvas.width, density, page)
    }

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

    @Test fun eachToneIsItsSurfaceEdgedInItsTextColourWithItsOnSurfaceWordsInBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            for (tone in KozmosEmotion.values()) {
                var surface = 0
                var onSurface = 0
                var edge = 0
                val drawn = draw(dark) {
                    surface = tone.surface.toArgb()
                    onSurface = tone.onSurface.toArgb()
                    edge = tone.text.toArgb()
                    KozmosEmptyState(
                        title = "Keine Treffer",
                        description = "Nichts passt.",
                        modifier = Modifier.testTag("card"),
                        list = listOf("Filter löschen"),
                        tone = tone
                    )
                }
                val case = "${if (dark) "dark" else "light"} $tone"
                val card = drawn.tree.unmerged.single { it.tag == "card" }.frame
                val cy = (card.top + card.bottom) / 2
                val inside = drawn.at(card.left + 8 * drawn.density, cy)
                if (!DrawnPixels.matches(inside, surface, 6)) wrong += "$case: the card is ${DrawnPixels.hex(inside)}, not the surface ${DrawnPixels.hex(surface)}"
                val rim = drawn.at(card.left + 0.5f * drawn.density, cy)
                if (!DrawnPixels.matches(rim, edge, 12)) wrong += "$case: the edge is ${DrawnPixels.hex(rim)}, not the text colour ${DrawnPixels.hex(edge)}"
                for (words in listOf("Keine Treffer", "Nichts passt.", "Filter löschen")) {
                    val ink = drawn.inkOf(words, surface)
                    if (!DrawnPixels.matches(ink, onSurface, 6)) wrong += "$case: \"$words\" is ${DrawnPixels.hex(ink)}, not onSurface ${DrawnPixels.hex(onSurface)}"
                }
                val ratio = contrast(surface, onSurface)
                if (ratio < 4.5) wrong += "$case: the words read ${"%.2f".format(ratio)}:1 on the surface"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test fun inAToneTheIconsCircleIsThePageAndTheIconTheTonesTextColour() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            for (tone in KozmosEmotion.values()) {
                var disc = 0
                var glyph = 0
                val drawn = draw(dark) {
                    disc = KozmosThemeTokens.primitivesColorsBackground0.toArgb()
                    glyph = tone.text.toArgb()
                    KozmosEmptyState(
                        title = "Keine Treffer",
                        tone = tone,
                        icon = { KozmosIcon(name = "search", size = KozmosIconSize.Lg, modifier = Modifier.testTag("icon")) }
                    )
                }
                val case = "${if (dark) "dark" else "light"} $tone"
                val icon = drawn.tree.unmerged.single { it.tag == "icon" }.frame
                val inside = drawn.at(icon.center.x + 28 * drawn.density, icon.center.y)
                if (!DrawnPixels.matches(inside, disc, 6)) wrong += "$case: the circle is ${DrawnPixels.hex(inside)}, not background/0 ${DrawnPixels.hex(disc)}"
                val counts = HashMap<Int, Int>()
                for (y in (icon.top * drawn.scale).roundToInt() until (icon.bottom * drawn.scale).roundToInt()) {
                    for (x in (icon.left * drawn.scale).roundToInt() until (icon.right * drawn.scale).roundToInt()) {
                        val argb = drawn.pixels.argb(x, y)
                        if (!DrawnPixels.matches(argb, disc, 40)) counts[argb] = (counts[argb] ?: 0) + 1
                    }
                }
                val ink = counts.maxByOrNull { it.value }?.key ?: disc
                if (!DrawnPixels.matches(ink, glyph, 6)) wrong += "$case: the icon is ${DrawnPixels.hex(ink)}, not the text colour ${DrawnPixels.hex(glyph)}"
                val ratio = contrast(disc, glyph)
                if (ratio < 3.0) wrong += "$case: the icon reads ${"%.2f".format(ratio)}:1 on its circle"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test fun withNoToneItStandsOnThePage() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val drawn = draw(dark) {
                KozmosEmptyState(title = "Keine Treffer", description = "Nichts passt.", modifier = Modifier.testTag("card"))
            }
            val card = drawn.tree.unmerged.single { it.tag == "card" }.frame
            for ((x, name) in listOf(card.left + 0.5f * drawn.density to "edge", card.left + 8 * drawn.density to "inside")) {
                val at = drawn.at(x, (card.top + card.bottom) / 2)
                if (!DrawnPixels.matches(at, drawn.page, 6)) wrong += "${if (dark) "dark" else "light"}: its $name is ${DrawnPixels.hex(at)}, not the page"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
