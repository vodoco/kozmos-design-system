package com.kozmos.components.link

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.roundToInt
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * `KozmosLink`'s `external` (GAP-202, decision 122): a link that leaves the
 * app draws Pointr's new-tab icon, `link-external-01`, after its last word,
 * in its colour and the text's size, and labels its click "open in your
 * browser", which TalkBack reads as "Double-tap to open in your browser". A
 * link without `external` is drawn and read as before.
 *
 * Paparazzi as a host: it lays text out with the platform's own line
 * breaker, so where the icon falls is as on a device. Nothing is recorded.
 */
class KozmosLinkExternalTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun ReadSemantics.link(words: String): ReadNode {
        val found = merged.filter { node -> node.texts.any { it.startsWith(words) } }
        check(found.size == 1) { "expected one node showing \"$words\", found ${found.size} among ${merged.map { it.texts }}" }
        return found.single()
    }

    /** What TalkBack says of a text: a no-break space is a space, a word joiner nothing. */
    private fun spoken(text: String) = text.replace(' ', ' ').replace("⁠", "").trim()

    @Test fun anExternalLinkSaysItsWordsAndLabelsItsClick() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosLink(text = "Privacy Policy", onClick = {}, external = true) }
        }
        val link = tree.link("Privacy Policy")
        assertEquals("what TalkBack reads", listOf("Privacy Policy"), link.texts.map(::spoken))
        assertNull("the icon has no name of its own", link.description)
        assertEquals("the click's label", "open in your browser", link.clickLabel)
        assertEquals("one control", 1, tree.merged.count { it.click != null })
    }

    @Test fun theLabelIsTheProductsOwnWords() {
        var opened = 0
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosLink(text = "Datenschutz", onClick = { opened++ }, external = true, externalLabel = "im Browser öffnen")
            }
        }
        val link = tree.link("Datenschutz")
        assertEquals("im Browser öffnen", link.clickLabel)
        link.click!!.invoke()
        assertEquals("the press is still the product's", 1, opened)
    }

    /** The guard: a link that stays in the app says its words alone, its click unlabelled. */
    @Test fun aLinkThatStaysIsAsBefore() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosLink(text = "Browse venues", onClick = {}) }
        }
        val link = tree.link("Browse venues")
        assertEquals(listOf("Browse venues"), link.texts)
        assertNull(link.clickLabel)
        assertNull("no icon", tree.unmerged.firstNotNullOfOrNull { it.textLayout }?.placeholderRects?.firstOrNull())
    }

    /**
     * Narrowed 4dp at a time from 48 to 320, the icon is on the line of the
     * link's last character wherever the last word, the no-break space and
     * the icon fit a line together, left to right and right to left. Where
     * even they do not, the platform's line breaker must break the run
     * somewhere, and it may take the icon to a line of its own; the browser
     * lets the run overflow instead.
     */
    @Test fun theIconNeverStartsALineAlone() {
        val words = "Privacy Policy and Terms of Service"
        val alone = mutableListOf<String>()
        val desperate = mutableListOf<String>()
        var widths = 0
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            // The run's width, laid out on one line: from the last word's
            // first character to the icon's far edge.
            var density = 1f
            val wide = paparazzi.readSemantics {
                density = LocalDensity.current.density
                CompositionLocalProvider(LocalLayoutDirection provides direction) {
                    KozmosMaterialTheme {
                        Box(Modifier.width(600.dp)) { KozmosLink(text = words, onClick = {}, external = true) }
                    }
                }
            }
            val line = checkNotNull(wide.unmerged.firstNotNullOfOrNull { it.textLayout })
            val icon = checkNotNull(line.placeholderRects.singleOrNull())
            val wordStart = line.getBoundingBox(words.lastIndexOf(' ') + 1)
            val run = if (direction == LayoutDirection.Ltr) icon.right - wordStart.left else wordStart.right - icon.left
            for (width in 48..320 step 4) {
                val tree = paparazzi.readSemantics {
                    CompositionLocalProvider(LocalLayoutDirection provides direction) {
                        KozmosMaterialTheme {
                            Box(Modifier.width(width.dp)) {
                                KozmosLink(text = words, onClick = {}, external = true)
                            }
                        }
                    }
                }
                val layout = checkNotNull(tree.unmerged.firstNotNullOfOrNull { it.textLayout }) { "no text layout" }
                val placed = checkNotNull(layout.placeholderRects.singleOrNull()) { "no icon at $width" }
                widths++
                val lastLine = layout.getLineForOffset(words.length - 1)
                val iconMiddle = (placed.top + placed.bottom) / 2
                if (iconMiddle < layout.getLineTop(lastLine) || iconMiddle > layout.getLineBottom(lastLine)) {
                    if (width * density >= run) alone += "$direction at ${width}dp" else desperate += "$direction at ${width}dp"
                }
            }
            println("GAP-202 Compose, $direction: the last word and the icon take ${run / density}dp")
        }
        println("GAP-202 Compose: the icon took a line alone only where the run cannot fit one: $desperate")
        assertTrue("read $widths widths", widths > 100)
        assertEquals("widths where the icon starts a line alone though the run fits", emptyList<String>(), alone)
    }

    /** The icon is the text's size: its placeholder is the font's 1em. */
    @Test fun theIconIsTheTextsSize() {
        var fontPx = 0f
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                val density = LocalDensity.current
                fontPx = with(density) { androidx.compose.material3.LocalTextStyle.current.fontSize.toPx() }
                KozmosLink(text = "Privacy Policy", onClick = {}, external = true)
            }
        }
        val icon = checkNotNull(tree.unmerged.firstNotNullOfOrNull { it.textLayout }?.placeholderRects?.singleOrNull())
        assertEquals("width, against the text's ${fontPx}px", fontPx, icon.width, 0.5f)
        assertEquals("height", fontPx, icon.height, 0.5f)
    }
}

/**
 * What the icon draws: the theme colour, after the words, pointing to the
 * link's end. Read off what is drawn, at twice the density.
 */
class KozmosLinkExternalPixelsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    /**
     * Draws the link on white and returns the frame and the icon's box, in
     * the frame's pixels: Paparazzi hands over the frame scaled, so a box
     * laid out in the canvas's pixels is scaled by the frame's width over
     * the canvas's.
     */
    private fun draw(direction: LayoutDirection): Triple<DrawnPixels, Rect?, Int> {
        var text = Rect.Zero
        var canvas = IntSize(1, 1)
        var theme = 0
        val drawn = paparazzi.drawn(frames) {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides false,
                LocalLayoutDirection provides direction,
                LocalDensity provides Density(base.density * 2f, base.fontScale)
            ) {
                KozmosMaterialTheme {
                    theme = KozmosThemeTokens.primitivesColorsTheme600.toArgb()
                    Box(
                        Modifier.fillMaxSize().background(Color.White).onGloballyPositioned { canvas = it.size }
                            .padding(16.dp)
                    ) {
                        KozmosLink(
                            text = "Privacy Policy",
                            onClick = {},
                            external = true,
                            modifier = Modifier.onGloballyPositioned { text = it.boundsInRoot() }
                        )
                    }
                }
            }
        }
        val frame = drawn.width.toFloat() / canvas.width
        val isTheme = { x: Int, y: Int -> DrawnPixels.matches(drawn.argb(x, y), theme, 60) }
        val top = (text.top * frame).roundToInt()
        val bottom = (text.bottom * frame).roundToInt()
        val columns = ((text.left * frame).roundToInt() until (text.right * frame).roundToInt())
            .filter { x -> (top until bottom).any { y -> isTheme(x, y) } }
        if (columns.isEmpty()) return Triple(drawn, null, theme)
        // The icon's columns: from the text's end, the run of ink up to the
        // first empty column, the no-break space before it.
        val ordered = if (direction == LayoutDirection.Ltr) columns.reversed() else columns
        val run = mutableListOf(ordered.first())
        for (x in ordered.drop(1)) {
            if (kotlin.math.abs(x - run.last()) > 1) break
            run += x
        }
        val rows = (top until bottom).filter { y -> run.any { x -> isTheme(x, y) } }
        return Triple(drawn, Rect(run.min().toFloat(), rows.first().toFloat(), run.max().toFloat() + 1, rows.last().toFloat() + 1), theme)
    }

    @Test fun theIconIsTheThemeColourAndPointsToTheLinksEnd() {
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            val (drawn, found, theme) = draw(direction)
            val icon = checkNotNull(found) { "no icon, $direction" }
            // The arrow's head is the icon's topmost ink: its top bar, at the
            // end the arrow points to.
            val headRow = icon.top.roundToInt()
            val head = (icon.left.roundToInt() until icon.right.roundToInt())
                .filter { x -> DrawnPixels.matches(drawn.argb(x, headRow), theme, 60) }
            val headMiddle = head.average().toFloat()
            println("GAP-202 Compose, $direction: icon $icon, head at ${headMiddle}px")
            if (direction == LayoutDirection.Ltr) {
                assertTrue("left to right the arrow points right: head $headMiddle in $icon", headMiddle > icon.center.x)
            } else {
                assertTrue("right to left the arrow points left: head $headMiddle in $icon", headMiddle < icon.center.x)
            }
        }
    }
}
