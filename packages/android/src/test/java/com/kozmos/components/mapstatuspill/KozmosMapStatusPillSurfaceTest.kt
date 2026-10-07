package com.kozmos.components.mapstatuspill

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 39 (Olcay, 2026-09-28), drawn: one status pill for the map —
 * PositionStatus, Downloading Content and Turn Back, and GAP-102's step-free
 * route being calculated — in five tones, on the map controls' surface
 * (decision 40): at least 48 tall, the page's own surface with no edge, a 24
 * mark 12 in and the words 8 beyond it, as React's owned rules and SwiftUI
 * draw it.
 *
 * Paparazzi keeps the frame and the composition's semantics are read in the
 * same pass, so where the pill lies is known in the frame. Paparazzi scales
 * its frames down, so a point is found through the frame's own scale, never
 * from dp and density alone. Each pill sits on the map's grey, which is drawn
 * rather than left to Paparazzi's window, and colours are read against the
 * tokens as they are drawn, never against a copy of their hex.
 */
class KozmosMapStatusPillSurfaceTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    /** What was drawn, where the pill lay in it, and how dp and the frame relate. */
    private class Board(val pixels: DrawnPixels, val pill: Rect, val scale: Float, val density: Float) {
        fun at(x: Float, y: Float): Int = pixels.argb(
            (x * scale).toInt().coerceIn(0, pixels.width - 1),
            (y * scale).toInt().coerceIn(0, pixels.height - 1)
        )

        /** The pill's box in dp, from its left edge. */
        fun dp(px: Float) = px / density

        /** Every frame pixel in a region of root pixels. */
        fun each(region: Rect, visit: (Int) -> Unit) {
            for (y in (region.top * scale).toInt() until (region.bottom * scale).toInt()) {
                for (x in (region.left * scale).toInt() until (region.right * scale).toInt()) {
                    visit(pixels.argb(x.coerceIn(0, pixels.width - 1), y.coerceIn(0, pixels.height - 1)))
                }
            }
        }

        /** The bounding box, in root pixels, of the frame pixels in `region` that match. */
        fun box(region: Rect, matches: (Int) -> Boolean): Rect? {
            var minX = Int.MAX_VALUE; var minY = Int.MAX_VALUE; var maxX = -1; var maxY = -1
            for (y in (region.top * scale).toInt() until (region.bottom * scale).toInt()) {
                for (x in (region.left * scale).toInt() until (region.right * scale).toInt()) {
                    if (matches(pixels.argb(x.coerceIn(0, pixels.width - 1), y.coerceIn(0, pixels.height - 1)))) {
                        minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
                    }
                }
            }
            if (maxX < 0) return null
            return Rect(minX / scale, minY / scale, (maxX + 1) / scale, (maxY + 1) / scale)
        }
    }

    private fun SemanticsNode.all(): List<SemanticsNode> = listOf(this) + children.flatMap { it.all() }

    /** The pill on the map's grey, found by its words where TalkBack is told they are. */
    private fun onTheMap(words: String, dark: Boolean = false, content: @Composable () -> Unit): Board {
        var pill = Rect.Zero
        var root = Rect.Zero
        var density = 1f
        val pixels = paparazzi.drawn(frames) {
            val view = LocalView.current
            density = LocalDensity.current.density
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(KozmosThemeTokens.primitivesColorsBackground100)
                        .padding(48.dp)
                        .onGloballyPositioned {
                            val owner = (view as ViewRootForTest).semanticsOwner
                            root = owner.rootSemanticsNode.boundsInRoot
                            pill = owner.rootSemanticsNode.all()
                                .first { node ->
                                    node.config.getOrNull(SemanticsProperties.Text)?.any { it.text == words } == true
                                }
                                .boundsInRoot
                        }
                ) { KozmosMaterialTheme { content() } }
            }
        }
        return Board(pixels, pill, pixels.width / root.width, density)
    }

    /** A token as it is drawn, read back from a swatch. */
    private fun swatch(dark: Boolean = false, color: @Composable () -> Color): Int {
        val drawn = paparazzi.drawn(frames) {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                Box(Modifier.fillMaxSize().background(color()))
            }
        }
        return drawn.argb(drawn.width / 2, drawn.height / 2)
    }

    private fun luminance(argb: Int): Double {
        fun channel(v: Int): Double {
            val c = v / 255.0
            return if (c <= 0.04045) c / 12.92 else ((c + 0.055) / 1.055).pow(2.4)
        }
        return 0.2126 * channel(argb shr 16 and 0xFF) + 0.7152 * channel(argb shr 8 and 0xFF) + 0.0722 * channel(argb and 0xFF)
    }

    private fun contrast(a: Int, b: Int): Double {
        val (la, lb) = luminance(a) to luminance(b)
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }

    /** The pixel in `region` furthest in contrast from the surface: a glyph's or a word's core. */
    private fun core(board: Board, region: Rect, surface: Int): Int? {
        var best: Int? = null
        var bestRatio = 1.0
        board.each(region) { argb ->
            val ratio = contrast(argb, surface)
            if (ratio > bestRatio) { bestRatio = ratio; best = argb }
        }
        return best
    }

    @Test
    fun itIsTheMapControls48TallSurfaceWithNoEdgeAndHugsItsWords() {
        val surface = swatch { KozmosThemeTokens.primitivesColorsBackground0 }
        val board = onTheMap("Established") { KozmosMapStatusPill(text = "Established", tone = KozmosMapStatusPillTone.Success) }
        val pill = board.pill
        assertEquals("the pill is ${board.dp(pill.height)}dp tall", 48f, board.dp(pill.height), 0.5f)
        assertTrue("the pill is ${board.dp(pill.width)}dp wide for one word", board.dp(pill.width) < 140f)

        // Opaque, the page's own surface, and no edge: one frame pixel inside
        // the side, still the surface.
        val inside = board.at(pill.left + 4 * board.density, pill.center.y)
        assertTrue("the surface drew ${DrawnPixels.hex(inside)}, not ${DrawnPixels.hex(surface)}", DrawnPixels.matches(inside, surface, tolerance = 1))
        val edge = board.at(pill.left + 1f / board.scale, pill.center.y)
        assertTrue("an edge is drawn: ${DrawnPixels.hex(edge)}", DrawnPixels.matches(edge, surface, tolerance = 2))

        // It casts the map controls' elevation: below it the map is darker
        // than the bare map.
        val bare = board.at(2f, 2f)
        val below = board.at(pill.center.x, pill.bottom + 4 * board.density)
        assertTrue("no shadow below the pill: ${DrawnPixels.hex(below)} on ${DrawnPixels.hex(bare)}",
            DrawnPixels.lightness(bare) - DrawnPixels.lightness(below) >= 3)
    }

    @Test
    fun theMarkSits12InAndTheWords8BeyondIt() {
        val ink = swatch { KozmosThemeTokens.semanticsEmotionSuccessText }
        val board = onTheMap("Established") { KozmosMapStatusPill(text = "Established", tone = KozmosMapStatusPillTone.Success) }
        val pill = board.pill
        val d = board.density
        val isInk = { argb: Int -> DrawnPixels.matches(argb, ink, tolerance = 70) }
        val mark = board.box(Rect(pill.left, pill.top, pill.left + 40 * d, pill.bottom), isInk)
        checkNotNull(mark) { "no mark was drawn" }
        assertTrue("the mark is ${board.dp(mark.left - pill.left)}dp from the side", board.dp(mark.left - pill.left) >= 12f - 0.5f)
        assertTrue("the mark reaches ${board.dp(mark.right - pill.left)}dp, past its 24", board.dp(mark.right - pill.left) <= 36f + 0.5f)
        val words = board.box(Rect(pill.left + 40 * d, pill.top, pill.right, pill.bottom), isInk)
        checkNotNull(words) { "no words were drawn" }
        assertTrue("the words start ${board.dp(words.left - pill.left)}dp in, not 12 + 24 + 8", board.dp(words.left - pill.left) >= 44f - 1f)
        assertEquals("the words end ${board.dp(pill.right - words.right)}dp from the side", 12f, board.dp(pill.right - words.right), 2f)
    }

    /**
     * Every tone draws its words and its mark in its own colour, in both
     * themes, and each reads on its surface: the words at 4.5:1 or more, the
     * mark at 3:1 or more.
     */
    @Test
    fun eachToneDrawsItsWordsAndMarkInItsColourAndTheyReadInBothThemes() {
        val measured = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            // Turn Back reads the named pair, Emotion/alert/fill under onFill,
            // and its ratio is pinned: 10.56 in the light, 13.14 in the dark.
            val turnBackInk: @Composable () -> Color = { KozmosThemeTokens.semanticsEmotionAlertOnfill }
            val turnBackPinned = if (dark) 13.14 else 10.56
            val words: Map<KozmosMapStatusPillTone, @Composable () -> Color> = mapOf(
                KozmosMapStatusPillTone.Neutral to { KozmosThemeTokens.primitivesColorsForeground300 },
                KozmosMapStatusPillTone.Progress to { KozmosThemeTokens.primitivesColorsForeground300 },
                KozmosMapStatusPillTone.Success to { KozmosThemeTokens.semanticsEmotionSuccessText },
                KozmosMapStatusPillTone.Danger to { KozmosThemeTokens.primitivesColorsForeground300 },
                KozmosMapStatusPillTone.Warning to turnBackInk
            )
            val marks: Map<KozmosMapStatusPillTone, @Composable () -> Color> = mapOf(
                KozmosMapStatusPillTone.Progress to { KozmosThemeTokens.semanticsEmotionThemedText },
                KozmosMapStatusPillTone.Success to { KozmosThemeTokens.semanticsEmotionSuccessText },
                KozmosMapStatusPillTone.Danger to { KozmosThemeTokens.semanticsEmotionDangerText },
                KozmosMapStatusPillTone.Warning to turnBackInk
            )
            for (tone in KozmosMapStatusPillTone.entries) {
                val scheme = if (dark) "dark" else "light"
                val surface = swatch(dark) {
                    if (tone == KozmosMapStatusPillTone.Warning) KozmosThemeTokens.semanticsEmotionAlertFill
                    else KozmosThemeTokens.primitivesColorsBackground0
                }
                val board = onTheMap("Wayfinding", dark) { KozmosMapStatusPill(text = "Wayfinding", tone = tone) }
                val pill = board.pill
                val d = board.density
                assertEquals("$scheme $tone: the pill is ${board.dp(pill.height)}dp tall", 48f, board.dp(pill.height), 0.5f)
                // Beside the mark, clear of the 16 corner's curve.
                val inside = board.at(pill.left + 4 * d, pill.center.y)
                assertTrue("$scheme $tone: the surface drew ${DrawnPixels.hex(inside)}, not ${DrawnPixels.hex(surface)}",
                    DrawnPixels.matches(inside, surface, tolerance = 2))

                val wordsStart = pill.left + (if (tone == KozmosMapStatusPillTone.Neutral) 12 else 44) * d
                val inWords = core(board, Rect(wordsStart, pill.top + 8 * d, pill.right - 12 * d, pill.bottom - 8 * d), surface)
                checkNotNull(inWords) { "$scheme $tone: no words were drawn" }
                val wordsColour = swatch(dark, words.getValue(tone))
                assertTrue("$scheme $tone: the words drew ${DrawnPixels.hex(inWords)}, not ${DrawnPixels.hex(wordsColour)}",
                    DrawnPixels.matches(inWords, wordsColour, tolerance = 40))
                val wordsRatio = contrast(inWords, surface)
                assertTrue("$scheme $tone: the words read at $wordsRatio:1", wordsRatio >= 4.5)
                if (tone == KozmosMapStatusPillTone.Warning) {
                    assertEquals("$scheme Turn Back reads at $wordsRatio:1, not its pinned $turnBackPinned:1", turnBackPinned, wordsRatio, 0.005)
                }
                var line = "$scheme $tone: words ${"%.2f".format(wordsRatio)}"

                val mark = marks[tone]
                if (mark != null) {
                    val inMark = core(board, Rect(pill.left + 12 * d, pill.center.y - 12 * d, pill.left + 36 * d, pill.center.y + 12 * d), surface)
                    checkNotNull(inMark) { "$scheme $tone: no mark was drawn" }
                    val markColour = swatch(dark, mark)
                    assertTrue("$scheme $tone: the mark drew ${DrawnPixels.hex(inMark)}, not ${DrawnPixels.hex(markColour)}",
                        DrawnPixels.matches(inMark, markColour, tolerance = 40))
                    val markRatio = contrast(inMark, surface)
                    assertTrue("$scheme $tone: the mark reads at $markRatio:1", markRatio >= 3.0)
                    line += ", mark ${"%.2f".format(markRatio)}"
                } else {
                    // No mark: the words start where the mark would, 12 in.
                    val drawnWords = board.box(pill) { DrawnPixels.matches(it, wordsColour, tolerance = 70) }
                    checkNotNull(drawnWords) { "$scheme $tone: no words" }
                    assertEquals("$scheme $tone: the words start ${board.dp(drawnWords.left - pill.left)}dp in",
                        12f, board.dp(drawnWords.left - pill.left), 2f)
                }
                measured += line
            }
        }
        println("map-status-pill contrast:\n" + measured.joinToString("\n"))
        assertEquals(10, measured.size)
    }

    /**
     * As wide as its words up to a map control's longest, 256dp, then it
     * wraps and grows taller: the product's words are never cut. Two lines fit
     * the 48, as the SDK's two-line states do; a third grows the pill.
     */
    @Test
    fun aLongerStatusWrapsAtTheMapControlsLongestAndGrowsTaller() {
        val words = "Failed to Calculate Precise Position. Walk to an open area, away from walls and pillars, and try again."
        val board = onTheMap(words) { KozmosMapStatusPill(text = words, tone = KozmosMapStatusPillTone.Danger) }
        val width = board.dp(board.pill.width)
        assertTrue("the pill is ${width}dp wide, past a map control's longest", width <= 256f + 0.5f)
        assertTrue("the pill wrapped at ${width}dp, short of its 256", width > 200f)
        assertTrue("the pill is ${board.dp(board.pill.height)}dp tall: its words did not wrap onto a third line",
            board.dp(board.pill.height) > 48f + 4f)
    }

    /**
     * Turn Back is the named pair (Olcay, 2026-09-28), Emotion/alert/fill
     * under onFill, not a black picked per theme: the pill draws the pair, and
     * the pair reads at its pinned 10.56:1 in the light and 13.14:1 in the dark.
     */
    @Test
    fun turnBackDrawsTheNamedAlertFillPairAtItsPinnedContrast() {
        for ((dark, pinned) in listOf(false to 10.56, true to 13.14)) {
            val scheme = if (dark) "dark" else "light"
            val fill = swatch(dark) { KozmosThemeTokens.semanticsEmotionAlertFill }
            val ink = swatch(dark) { KozmosThemeTokens.semanticsEmotionAlertOnfill }
            assertEquals("$scheme: Emotion/alert/onFill on fill", pinned, contrast(ink, fill), 0.005)
            assertTrue("$scheme: the fill ${DrawnPixels.hex(fill)} is not a bright amber", luminance(fill) > 0.4)

            val board = onTheMap("Turn Back", dark) {
                KozmosMapStatusPill(text = "Turn Back", tone = KozmosMapStatusPillTone.Warning, icon = null)
            }
            val pill = board.pill
            assertEquals("$scheme: Turn Back is ${board.dp(pill.height)}dp tall", 48f, board.dp(pill.height), 0.5f)
            val inside = board.at(pill.left + 4 * board.density, pill.center.y)
            assertTrue("$scheme: Turn Back filled ${DrawnPixels.hex(inside)}, not Emotion/alert/fill ${DrawnPixels.hex(fill)}",
                DrawnPixels.matches(inside, fill, tolerance = 2))
            val words = board.box(pill) { DrawnPixels.matches(it, ink, tolerance = 6) }
            checkNotNull(words) { "$scheme: Turn Back's words are not drawn in Emotion/alert/onFill" }
            assertEquals("$scheme: the words start ${board.dp(words.left - pill.left)}dp in", 12f, board.dp(words.left - pill.left), 2f)
        }
    }

    /** The product's mark takes the tone's place, at 24 and in the tone's colour. */
    @Test
    fun theProductsMarkTakesTheTonesPlaceAndNoneCanBeShown() {
        val danger = swatch { KozmosThemeTokens.semanticsEmotionDangerText }
        val board = onTheMap("No Bluetooth") {
            KozmosMapStatusPill(
                text = "No Bluetooth",
                tone = KozmosMapStatusPillTone.Danger,
                // A solid square stands for the product's own icon, so its box
                // is the mark's box.
                icon = { Box(Modifier.fillMaxSize().background(LocalContentColor.current)) }
            )
        }
        val pill = board.pill
        val mark = board.box(pill) { DrawnPixels.matches(it, danger, tolerance = 6) }
        checkNotNull(mark) { "the product's mark is not drawn in the danger colour" }
        assertEquals("the product's mark is ${board.dp(mark.width)}dp wide", 24f, board.dp(mark.width), 1f)
        assertEquals("the product's mark is ${board.dp(mark.height)}dp tall", 24f, board.dp(mark.height), 1f)
        assertEquals("the product's mark is ${board.dp(mark.left - pill.left)}dp from the side", 12f, board.dp(mark.left - pill.left), 1f)

        val ink = swatch { KozmosThemeTokens.semanticsEmotionSuccessText }
        val bare = onTheMap("Up-to-date") {
            KozmosMapStatusPill(text = "Up-to-date", tone = KozmosMapStatusPillTone.Success, icon = null)
        }
        val words = bare.box(bare.pill) { DrawnPixels.matches(it, ink, tolerance = 70) }
        checkNotNull(words) { "no words were drawn" }
        assertEquals("with no mark the words start ${bare.dp(words.left - bare.pill.left)}dp in", 12f, bare.dp(words.left - bare.pill.left), 2f)
    }
}
