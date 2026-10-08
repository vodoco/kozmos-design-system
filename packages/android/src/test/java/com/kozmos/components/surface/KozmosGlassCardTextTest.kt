package com.kozmos.components.surface

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.drawn
import com.kozmos.components.feedbackcard.KozmosFeedbackCard
import com.kozmos.components.itinerary.KozmosItinerary
import com.kozmos.components.itinerary.KozmosItineraryStep
import com.kozmos.components.manoeuvrecard.KozmosManoeuvreCard
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.routesummary.KozmosRouteSummary
import com.kozmos.components.savelocationcard.KozmosSaveLocationCard
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 48 on every glass surface (2026-09-28): the cards that float over
 * the map with a surface of their own — the manoeuvre, its itinerary, the
 * route summary, the feedback card and the save-location card — draw text
 * that is muted elsewhere in the foreground colour on glass, so it reads at
 * 4.5:1 over any map. The manoeuvre card provides its surface to what it
 * holds ([LocalKozmosSurfaceStyle]), and the itinerary reads it.
 *
 * Each card sits over the glass stories' two saturated rooms, the theme's
 * blue and the warning amber, in both orders. Each text is found where
 * TalkBack is told it is, and read against the card drawn again with that
 * text as spaces, which lay out as it does and draw nothing: the text's
 * colour is its glyphs' core, the pixel in its box furthest in luminance
 * from what lies behind it, and its contrast the WCAG ratio of that core
 * with the least contrasting pixel behind it.
 */
class KozmosGlassCardTextTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    /** The root's size, and every text laid out and where, in root pixels. */
    private var root = IntSize.Zero
    private var texts: Map<String, Rect> = emptyMap()

    private enum class Card { Manoeuvre, ManoeuvreOpen, RouteSummary, Feedback, SaveLocation }

    /** Each card's text that is muted elsewhere: as TalkBack is told it, and as it is made. */
    private fun lines(card: Card): List<Pair<String, String>> = when (card) {
        Card.Manoeuvre -> listOf("58 m · Level 2" to "58 m · Level 2")
        Card.ManoeuvreOpen -> listOf("FROM" to "From", "Harbour Coffee Co." to "Harbour Coffee Co.", "TO" to "To")
        Card.RouteSummary -> listOf("201 m" to "201 m")
        Card.Feedback -> listOf("Tell us how it went." to "Tell us how it went.")
        Card.SaveLocation -> listOf("Terminal 2, Level 1" to "Terminal 2, Level 1")
    }

    /** `text`, or as many spaces when it is `blank`: laid out as it is, drawn as nothing. */
    private fun blanked(text: String, blank: String?) = if (text == blank) " ".repeat(text.length) else text

    @Composable
    private fun FloatingCard(card: Card, surface: KozmosSurfaceStyle, blank: String?) {
        when (card) {
            Card.Manoeuvre, Card.ManoeuvreOpen -> KozmosManoeuvreCard(
                type = DirectionType.Straight,
                instruction = "Take the lift down to Level 1",
                expanded = card == Card.ManoeuvreOpen,
                onToggle = {},
                detail = blanked("58 m · Level 2", blank),
                surface = surface
            ) {
                KozmosItinerary(
                    origin = blanked("Harbour Coffee Co.", blank),
                    steps = listOf(KozmosItineraryStep(id = "lift", instruction = "Take the lift down", type = DirectionType.Straight, isCurrent = true)),
                    destination = "Gate 12",
                    originLabel = blanked("From", blank),
                    destinationLabel = blanked("To", blank)
                )
            }
            Card.RouteSummary -> KozmosRouteSummary(
                etaText = "4 min",
                distanceText = blanked("201 m", blank),
                onEndRoute = {},
                surface = surface
            )
            Card.Feedback -> KozmosFeedbackCard(
                surface = surface,
                title = "How was your route?",
                description = blanked("Tell us how it went.", blank)
            )
            Card.SaveLocation -> KozmosSaveLocationCard(
                surface = surface,
                title = "Gate 12",
                description = blanked("Terminal 2, Level 1", blank)
            )
        }
    }

    private fun SemanticsNode.textNodes(into: MutableMap<String, Rect> = mutableMapOf()): Map<String, Rect> {
        config.getOrNull(SemanticsProperties.Text)?.let { text -> into[text.joinToString { it.text }] = boundsInRoot }
        children.forEach { it.textNodes(into) }
        return into
    }

    /** Draws the card over the rooms, 16dp in, reading where every text is as it goes. */
    private fun scene(dark: Boolean, amberFirst: Boolean, content: @Composable () -> Unit): DrawnPixels =
        paparazzi.drawn(frames) {
            val view = LocalView.current
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                Box(
                    Modifier.fillMaxSize().onGloballyPositioned {
                        root = it.size
                        texts = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.textNodes()
                    }
                ) {
                    val blue = KozmosThemeTokens.primitivesColorsTheme600
                    val amber = KozmosThemeTokens.primitivesColorsEmotionalAlert800
                    Row(Modifier.fillMaxSize()) {
                        Box(Modifier.weight(1f).fillMaxHeight().background(if (amberFirst) amber else blue))
                        Box(Modifier.weight(1f).fillMaxHeight().background(if (amberFirst) blue else amber))
                    }
                    Box(Modifier.padding(16.dp)) {
                        KozmosMaterialTheme { content() }
                    }
                }
            }
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

    private class Read(val ratio: Double, val core: Int, val behind: Int)

    /** The text in `box` (root pixels) read against `without`, the same scene with it blanked. */
    private fun read(drawn: DrawnPixels, without: DrawnPixels, box: Rect): Read {
        val scale = drawn.width.toFloat() / root.width
        val xs = (box.left * scale).toInt().coerceAtLeast(0)..(box.right * scale).toInt().coerceAtMost(drawn.width - 1)
        val ys = (box.top * scale).toInt().coerceAtLeast(0)..(box.bottom * scale).toInt().coerceAtMost(drawn.height - 1)
        var core = 0
        var furthest = -1.0
        for (y in ys) for (x in xs) {
            val distance = abs(luminance(drawn.argb(x, y)) - luminance(without.argb(x, y)))
            if (distance > furthest) { furthest = distance; core = drawn.argb(x, y) }
        }
        var lowest = Double.MAX_VALUE
        var behind = 0
        for (y in ys) for (x in xs) {
            val ratio = contrast(core, without.argb(x, y))
            if (ratio < lowest) { lowest = ratio; behind = without.argb(x, y) }
        }
        return Read(lowest, core, behind)
    }

    /** Each of the card's muted lines, read one at a time; a missing line reads null. */
    private fun reads(card: Card, surface: KozmosSurfaceStyle, dark: Boolean, amberFirst: Boolean): List<Pair<String, Read?>> {
        val drawn = scene(dark, amberFirst) { FloatingCard(card, surface, blank = null) }
        val found = texts
        return lines(card).map { (line, source) ->
            val box = found[line]
            if (box == null) {
                line to null
            } else {
                val without = scene(dark, amberFirst) { FloatingCard(card, surface, blank = source) }
                line to read(drawn, without, box)
            }
        }
    }

    /** On glass, each card's muted text reads at 4.5:1 or more over either room, light and dark. */
    @Test
    fun onGlassAFloatingCardsMutedTextReadsAtFourAndAHalfToOne() {
        val low = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            for (amberFirst in listOf(false, true)) {
                val theme = if (dark) "dark" else "light"
                val room = if (amberFirst) "amber" else "blue"
                for (card in Card.values()) {
                    for ((line, at) in reads(card, KozmosSurfaceStyle.Glass, dark, amberFirst)) {
                        if (at == null) {
                            low += "$card \"$line\", $theme, $room: not laid out"
                            continue
                        }
                        val said = "$card \"$line\", $theme, $room: ${"%.2f".format(at.ratio)}:1, text ${DrawnPixels.hex(at.core)} over ${DrawnPixels.hex(at.behind)}"
                        println("Decision 48 Android, on a glass card: $said")
                        if (at.ratio < 4.5) low += said
                    }
                }
            }
        }
        assertTrue("below 4.5:1 on glass: ${low.joinToString("; ")}", low.isEmpty())
    }

    /**
     * The guard: on a solid card each text keeps the theme's muted colour:
     * its glyphs' core is nearer a swatch of the muted token than one of the
     * foreground, light and dark.
     */
    @Test
    fun onASolidCardTheMutedTextKeepsItsMutedColour() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            fun swatch(colour: @Composable () -> androidx.compose.ui.graphics.Color): Int {
                val drawn = paparazzi.drawn(frames) {
                    CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                        Box(Modifier.fillMaxSize().background(colour()))
                    }
                }
                return drawn.argb(drawn.width / 2, drawn.height / 2)
            }
            val muted = swatch { KozmosThemeTokens.primitivesColorsForeground500 }
            val ink = swatch { KozmosThemeTokens.primitivesColorsForeground100 }
            val theme = if (dark) "dark" else "light"
            for (card in Card.values()) {
                for ((line, at) in reads(card, KozmosSurfaceStyle.Solid, dark, amberFirst = false)) {
                    if (at == null) {
                        wrong += "$card \"$line\", $theme: not laid out"
                        continue
                    }
                    println("Decision 48 Android, $card \"$line\" on a solid card, $theme: ${DrawnPixels.hex(at.core)}, muted ${DrawnPixels.hex(muted)}, ink ${DrawnPixels.hex(ink)}")
                    if (abs(luminance(at.core) - luminance(muted)) >= abs(luminance(at.core) - luminance(ink))) {
                        wrong += "$card \"$line\", $theme: drew ${DrawnPixels.hex(at.core)}, nearer the ink ${DrawnPixels.hex(ink)} than the muted ${DrawnPixels.hex(muted)}"
                    }
                }
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
