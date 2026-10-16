package com.kozmos.components.locationpin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * Decision 71 and rulings 79–81 (Olcay, 2026-10-15), read off what is drawn:
 * LocationPin draws the SDK's three map result markers, measured against the
 * SVGs in `.notes/track2/`.
 *
 * - **Result:** a pill 32 tall, at least 32 wide and 8 wider than its number
 *   on each side, with a 2 border, and a 12 by 7 pointer whose tip is 6 below
 *   the pill. At rest the background with theme 600 for the border, pointer
 *   and number; selected, theme 600 filled, with the number in
 *   foreground/1000. No number: an 8 dot.
 * - **Featured:** a tile 44 (52 selected), a 3 rim in foreground/0 on
 *   background/0, and a 6 dot whose top is 4 below the tile.
 * - **Place:** a green teardrop (emotional success 800) on a circle of 40,
 *   a 20 disc of background/0, and a 6 dot whose top is 6 below the circle.
 *   It wins over `featured` and `number`.
 *
 * The anchor is the pointer's tip, or the dot's centre. The colours are
 * written out, as the spec gives them, in light and dark. Paparazzi scales
 * its frames down (paparazzi-frames-are-scaled), so each pin is drawn at
 * twice the density and a dp is found from the frame's own width over the
 * screen's width in dp, never from dp and density.
 */
class KozmosLocationPinMarkersTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFF808080.toInt()
    private val white = 0xFFFFFFFF.toInt()
    private val black = 0xFF000000.toInt()

    private fun mode(dark: Boolean) = if (dark) "dark" else "light"
    private fun theme600(dark: Boolean) = if (dark) 0xFF5887F3.toInt() else 0xFF1051E8.toInt()
    private fun background0(dark: Boolean) = if (dark) black else white
    private fun foreground0(dark: Boolean) = if (dark) white else black
    private fun foreground1000(dark: Boolean) = if (dark) black else white
    private fun success800(dark: Boolean) = if (dark) 0xFFA0ECC6.toInt() else 0xFF197F4C.toInt()

    private fun near(colour: Int, tolerance: Int): (Int) -> Boolean = { DrawnPixels.matches(it, colour, tolerance) }

    private class Box4(val left: Float, val top: Float, val right: Float, val bottom: Float) {
        val width get() = right - left
        val height get() = bottom - top
        val centreX get() = (left + right) / 2
        override fun toString() = "(%.1f, %.1f)–(%.1f, %.1f)".format(left, top, right, bottom)
    }

    /** A drawn frame, read in the composition's dp. */
    private class Frame(val pixels: DrawnPixels, val perDp: Float) {
        private fun px(dp: Float): Int = (dp * perDp).toInt()
        fun at(xDp: Float, yDp: Float): Int =
            pixels.argb(px(xDp).coerceIn(0, pixels.width - 1), px(yDp).coerceIn(0, pixels.height - 1))

        /** The edges, in dp, of the pixels [matches] finds, within [area] when given. */
        fun bounds(area: Box4? = null, matches: (Int) -> Boolean): Box4? {
            val xs = if (area == null) 0 until pixels.width else px(area.left).coerceAtLeast(0)..px(area.right).coerceAtMost(pixels.width - 1)
            val ys = if (area == null) 0 until pixels.height else px(area.top).coerceAtLeast(0)..px(area.bottom).coerceAtMost(pixels.height - 1)
            var left = Int.MAX_VALUE
            var top = Int.MAX_VALUE
            var right = -1
            var bottom = -1
            for (y in ys) for (x in xs) if (matches(pixels.argb(x, y))) {
                left = minOf(left, x); right = maxOf(right, x)
                top = minOf(top, y); bottom = maxOf(bottom, y)
            }
            return if (right < 0) null else Box4(left / perDp, top / perDp, (right + 1) / perDp, (bottom + 1) / perDp)
        }

        /** The runs [matches] finds down the column at [xDp], as their edges in dp. */
        fun columnRuns(xDp: Float, matches: (Int) -> Boolean): List<Pair<Float, Float>> =
            runs(pixels.height) { matches(pixels.argb(px(xDp).coerceIn(0, pixels.width - 1), it)) }

        /** The runs [matches] finds along the row at [yDp], as their edges in dp. */
        fun rowRuns(yDp: Float, matches: (Int) -> Boolean): List<Pair<Float, Float>> =
            runs(pixels.width) { matches(pixels.argb(it, px(yDp).coerceIn(0, pixels.height - 1))) }

        private fun runs(length: Int, hit: (Int) -> Boolean): List<Pair<Float, Float>> {
            val found = mutableListOf<Pair<Float, Float>>()
            var start = -1
            for (i in 0..length) {
                val on = i < length && hit(i)
                if (on && start < 0) start = i
                if (!on && start >= 0) {
                    found += (start / perDp) to (i / perDp)
                    start = -1
                }
            }
            return found
        }

        fun count(area: Box4, matches: (Int) -> Boolean): Int {
            var found = 0
            for (y in px(area.top)..px(area.bottom)) for (x in px(area.left)..px(area.right)) {
                if (matches(pixels.argb(x.coerceIn(0, pixels.width - 1), y.coerceIn(0, pixels.height - 1)))) found++
            }
            return found
        }
    }

    /** [pin] at twice the density on a grey host, 16 in from the top start. */
    private fun draw(dark: Boolean, pin: @Composable () -> Unit): Frame = drawOnHost(dark) {
        Box(Modifier.padding(16.dp)) { pin() }
    }

    private fun drawOnHost(dark: Boolean, content: @Composable () -> Unit): Frame {
        var screenWidthDp = 0
        val pixels = paparazzi.drawn(frames) {
            screenWidthDp = LocalConfiguration.current.screenWidthDp
            val density = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(density.density * 2f, density.fontScale)
            ) {
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color(host))) { content() }
                }
            }
        }
        return Frame(pixels, 2f * pixels.width / screenWidthDp)
    }

    private fun MutableList<String>.colour(what: String, expected: Int, actual: Int, tolerance: Int = 3) {
        if (!DrawnPixels.matches(actual, expected, tolerance)) add("$what: drew ${DrawnPixels.hex(actual)}, not ${DrawnPixels.hex(expected)}")
    }

    private fun MutableList<String>.within(what: String, actual: Float, expected: Float, tolerance: Float) {
        if (abs(actual - expected) > tolerance) add("$what: %.2f, not %.2f".format(actual, expected))
    }

    /**
     * The Result: the pill is 32 tall and at least 32 wide, 8 wider than its
     * number on each side; the pointer's tip is 6 below it, at 38. Selected,
     * so the pill and its pointer are one theme 600 shape with the number in
     * foreground/1000 on it.
     */
    @Test
    fun aResultIsAPill32TallAtLeast32WideThatGrowsWithItsNumberAndPointsSixBelowIt() {
        val wrong = mutableListOf<String>()
        val blue = near(theme600(false), 6)
        val widths = mutableMapOf<String, Float>()
        for ((name, number) in listOf("no number" to null, "1" to 1, "12" to 12, "12888" to 12888)) {
            val frame = draw(dark = false) { KozmosLocationPin(number = number, selected = true) }
            val shape = frame.bounds(matches = blue)
            if (shape == null) {
                wrong += "$name: draws no theme 600"
                continue
            }
            widths[name] = shape.width
            println("Track 2 Android, $name: the selected Result is $shape, ${"%.1f".format(shape.width)} x ${"%.1f".format(shape.height)}")
            // The tip is a point: its last pixel rows blend with the host.
            wrong.within("$name: the pill and its pointer's tip (32 + 6) are tall", shape.height, 38f, 1.2f)
            if (number == null || number < 10) wrong.within("$name: the pill is wide", shape.width, 32f, 1f)
            if (number == 12888) {
                // Where its edges are straight: 18 in, past the 16 cap and
                // clear of the pointer, centre ± 6. The number splits the
                // column: the pill runs from the first run's top to the
                // last's bottom.
                val column = frame.columnRuns(shape.left + 18f, blue)
                if (column.isEmpty()) {
                    wrong += "$name: nothing of the pill 18 in from its start"
                } else {
                    wrong.within("$name: the pill's top is the shape's top", column.first().first, shape.top, 1f)
                    wrong.within("$name: the pill is tall", column.last().second - column.first().first, 32f, 1f)
                }
                val ink = frame.bounds(shape, near(foreground1000(false), 40))
                if (ink == null) {
                    wrong += "$name: no number drawn in foreground/1000"
                } else {
                    // 8 to each outer edge, plus the digits' side bearings.
                    val start = ink.left - shape.left
                    val end = shape.right - ink.right
                    println("Track 2 Android, $name: the number's ink is ${"%.1f".format(start)} from the start, ${"%.1f".format(end)} from the end")
                    if (start !in 7f..11f) wrong += "$name: the number is ${"%.1f".format(start)} from the pill's start, not 8"
                    if (end !in 7f..11f) wrong += "$name: the number is ${"%.1f".format(end)} from the pill's end, not 8"
                }
            }
        }
        val short = widths["12"]
        val long = widths["12888"]
        if (short != null && long != null && long < short + 16f) wrong += "the pill does not grow with its number: 12 is $short wide, 12888 $long"
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * The Featured tile: 44, or 52 when selected (it grows; the Result does
     * not), a 3 rim, and a 6 dot whose top is 4 below the tile.
     */
    @Test
    fun aFeaturedTileIs44Or52SelectedWithA6DotFourBelowIt() {
        val wrong = mutableListOf<String>()
        val ink = near(black, 30)
        for ((selected, size) in listOf(false to 44f, true to 52f)) {
            val m = if (selected) "selected" else "at rest"
            val frame = draw(dark = false) { KozmosLocationPin(label = "Burger King", featured = true, selected = selected) }
            val drawn = frame.bounds(matches = ink)
            if (drawn == null) {
                wrong += "$m: no foreground/0 rim or dot"
                continue
            }
            val runs = frame.columnRuns(drawn.centreX, ink)
            println("Track 2 Android, featured $m: the rim and dot are $drawn; down the middle ${runs.map { "%.1f–%.1f".format(it.first, it.second) }}")
            wrong.within("$m: the tile is wide", drawn.width, size, 1f)
            if (runs.size != 3) {
                wrong += "$m: down the middle, ${runs.size} runs of foreground/0, not the rim's top, its bottom and the dot"
                continue
            }
            val (top, bottom, dot) = runs
            wrong.within("$m: the tile is tall", bottom.second - top.first, size, 1f)
            wrong.within("$m: the rim is", top.second - top.first, 3f, 0.8f)
            wrong.within("$m: the dot's top is below the tile by", dot.first - bottom.second, 4f, 0.8f)
            wrong.within("$m: the dot is", dot.second - dot.first, 6f, 0.8f)
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * The Place: a teardrop on a circle of 40, its 20 disc in the centre, and
     * a 6 dot 6 below the circle (centre 49), the only thing at that height:
     * the tip, at 48.28, ends above it.
     */
    @Test
    fun aPlaceIsAGreenTeardropOn40WithA6DotSixBelowTheCircle() {
        val wrong = mutableListOf<String>()
        val green = near(success800(false), 6)
        val frame = draw(dark = false) { KozmosLocationPin(label = "Harbour Coffee", place = true) }
        val drawn = frame.bounds(matches = green)
        if (drawn == null) {
            assertTrue("a place draws no emotional success 800", false)
            return
        }
        val disc = frame.columnRuns(drawn.centreX, near(white, 6)).filter { it.first > drawn.top && it.second < drawn.bottom }
        val circle = frame.rowRuns(drawn.top + 20f, green)
        val dot = frame.rowRuns(drawn.top + 49f, green)
        println(
            "Track 2 Android, place: $drawn; the disc ${disc.map { "%.1f–%.1f".format(it.first - drawn.top, it.second - drawn.top) }}, " +
                "at 20 ${circle.size} runs, at 49 ${dot.map { "%.1f".format(it.second - it.first) }} wide"
        )
        wrong.within("the teardrop's circle is wide", drawn.width, 40f, 1f)
        wrong.within("from the circle's top to the dot's bottom (40 + 6 + 6) is", drawn.height, 52f, 1.2f)
        if (disc.size != 1) {
            wrong += "${disc.size} runs of background/0 down the middle, not the disc"
        } else {
            wrong.within("the disc's top is below the circle's by", disc[0].first - drawn.top, 10f, 0.8f)
            wrong.within("the disc is", disc[0].second - disc[0].first, 20f, 1f)
        }
        if (circle.size != 2) wrong += "across the circle's middle, ${circle.size} runs of green, not two either side of the disc"
        else wrong.within("across the circle's middle, the green spans", circle[1].second - circle[0].first, 40f, 1f)
        if (dot.size != 1) {
            wrong += "at 49, ${dot.size} runs of green, not the dot alone"
        } else {
            wrong.within("the dot is", dot[0].second - dot[0].first, 6f, 1.2f)
            wrong.within("the dot's centre is the pin's", (dot[0].first + dot[0].second) / 2, drawn.centreX, 0.8f)
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * Each marker's colours, at rest and selected, in light and dark, as the
     * spec's table writes them. The md shadow falls under the body.
     */
    @Test
    fun eachMarkerDrawsItsColoursAtRestAndSelectedInLightAndDark() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val m = mode(dark)
            val blue = near(theme600(dark), 6)
            for (selected in listOf(false, true)) {
                val s = if (selected) "selected" else "at rest"
                for (number in listOf(7, null)) {
                    val n = if (number == null) "a dot" else "a number"
                    val frame = draw(dark) { KozmosLocationPin(number = number, selected = selected) }
                    val pin = frame.bounds(matches = blue)
                    if (pin == null) {
                        wrong += "$m: a Result $s with $n draws no theme 600"
                        continue
                    }
                    val (cx, top) = pin.centreX to pin.top
                    val mark = if (selected) foreground1000(dark) else theme600(dark)
                    wrong.colour("$m: the fill of a Result $s with $n", if (selected) theme600(dark) else background0(dark), frame.at(pin.left + 6f, top + 16f))
                    wrong.colour("$m: the border of a Result $s with $n", theme600(dark), frame.at(pin.left + 1f, top + 16f))
                    wrong.colour("$m: the pointer of a Result $s with $n", theme600(dark), frame.at(cx, top + 34f))
                    if (number == null) {
                        wrong.colour("$m: the dot of a Result $s", mark, frame.at(cx, top + 16f))
                        wrong.colour("$m: round the dot of a Result $s", if (selected) theme600(dark) else background0(dark), frame.at(cx, top + 16f + 5.5f))
                    } else {
                        val inked = frame.count(Box4(cx - 4f, top + 10f, cx + 4f, top + 22f), near(mark, 24))
                        if (inked < 12) wrong += "$m: the number of a Result $s is not ${DrawnPixels.hex(mark)} ($inked pixels)"
                    }
                    if (!selected && number != null) {
                        // Under the pill, beside the pointer: the shadow.
                        val under = frame.at(cx + 9f, top + 35f)
                        if (DrawnPixels.lightness(under) > DrawnPixels.lightness(host) - 6) {
                            wrong += "$m: no shadow under the Result (${DrawnPixels.hex(under)} beside its pointer)"
                        }
                    }
                }

                val rim = near(foreground0(dark), 30)
                val featured = draw(dark) { KozmosLocationPin(label = "Burger King", featured = true, selected = selected) }
                val tile = featured.bounds(matches = rim)
                if (tile == null) {
                    wrong += "$m: a featured tile $s draws no foreground/0"
                } else {
                    val size = tile.width
                    wrong.colour("$m: the featured tile's fill $s", background0(dark), featured.at(tile.left + 8f, tile.top + size / 2))
                    wrong.colour("$m: the featured tile's rim $s", foreground0(dark), featured.at(tile.left + 1.5f, tile.top + size / 2))
                    wrong.colour("$m: the featured tile's dot $s", foreground0(dark), featured.at(tile.centreX, tile.top + size + 7f))
                    val under = featured.at(tile.centreX - 12f, tile.top + size + 2f)
                    if (DrawnPixels.lightness(under) > DrawnPixels.lightness(host) - 6) {
                        wrong += "$m: no shadow under the featured tile $s (${DrawnPixels.hex(under)})"
                    }
                }

                // selected changes nothing on a place.
                val place = draw(dark) { KozmosLocationPin(label = "Harbour Coffee", place = true, selected = selected) }
                val drop = place.bounds(matches = near(success800(dark), 6))
                if (drop == null) {
                    wrong += "$m: a place $s draws no emotional success 800"
                } else {
                    wrong.colour("$m: the place's teardrop $s", success800(dark), place.at(drop.centreX, drop.top + 4f))
                    wrong.colour("$m: the place's teardrop under its disc $s", success800(dark), place.at(drop.centreX, drop.top + 36f))
                    wrong.colour("$m: the place's disc $s", background0(dark), place.at(drop.centreX, drop.top + 20f))
                    wrong.colour("$m: the place's dot $s", success800(dark), place.at(drop.centreX, drop.top + 49f))
                }
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * `Modifier.kozmosLocationPinAt` puts the anchor on the point it is
     * given: the pointer's tip on a Result, the dot's centre on a featured
     * tile and a place, at rest or selected, wherever the label sits.
     */
    @Test
    fun theAnchorIsThePointersTipOrTheDotsCentreWhereverTheLabelSits() {
        val wrong = mutableListOf<String>()
        val ax = 100f
        val ay = 150f
        val at = Modifier.kozmosLocationPinAt { IntOffset(ax.dp.roundToPx(), ay.dp.roundToPx()) }
        fun drawAt(pin: @Composable (Modifier) -> Unit): Frame = drawOnHost(dark = false) { pin(at) }

        val results: List<Pair<String, @Composable (Modifier) -> Unit>> = listOf(
            "a Result" to { modifier -> KozmosLocationPin(modifier = modifier, number = 3) },
            "a selected Result with 128" to { modifier -> KozmosLocationPin(modifier = modifier, number = 128, selected = true) },
            "a Result labelled at its start" to { modifier ->
                KozmosLocationPin(modifier = modifier, number = 3, externalLabel = "Gate 12", labelPlacement = KozmosLocationPinLabelPlacement.Left)
            },
            "a Result labelled at its start, right to left" to { modifier ->
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                    KozmosLocationPin(modifier = modifier, number = 3, externalLabel = "Gate 12", labelPlacement = KozmosLocationPinLabelPlacement.Left)
                }
            },
            "a Result labelled above" to { modifier ->
                KozmosLocationPin(modifier = modifier, number = 3, externalLabel = "Gate 12", labelPlacement = KozmosLocationPinLabelPlacement.Top)
            },
        )
        for ((name, pin) in results) {
            val shape = drawAt(pin).bounds(matches = near(theme600(false), 6))
            if (shape == null) {
                wrong += "$name: draws no theme 600"
                continue
            }
            println("Track 2 Android, $name anchored at ($ax, $ay): drawn at $shape")
            wrong.within("$name: the tip's y", shape.bottom, ay, 1f)
            wrong.within("$name: the tip's x", shape.centreX, ax, 0.75f)
        }

        val dots: List<Triple<String, Int, @Composable (Modifier) -> Unit>> = listOf(
            Triple("a featured tile", black, { modifier -> KozmosLocationPin(modifier = modifier, label = "Burger King", featured = true) }),
            Triple("a selected featured tile labelled at its end", black, { modifier ->
                KozmosLocationPin(
                    modifier = modifier, label = "Burger King", featured = true, selected = true,
                    externalLabel = "Burger King", labelPlacement = KozmosLocationPinLabelPlacement.Right
                )
            }),
            Triple("a place", success800(false), { modifier -> KozmosLocationPin(modifier = modifier, label = "Harbour Coffee", place = true) }),
        )
        for ((name, colour, pin) in dots) {
            val frame = drawAt(pin)
            val matches = near(colour, if (colour == black) 30 else 6)
            val across = frame.rowRuns(ay, matches)
            val down = frame.columnRuns(ax, matches).lastOrNull()
            println("Track 2 Android, $name anchored at ($ax, $ay): across ${across.map { "%.1f–%.1f".format(it.first, it.second) }}, down to ${down?.let { "%.1f–%.1f".format(it.first, it.second) }}")
            if (across.size != 1 || down == null) {
                wrong += "$name: no dot alone at the anchor's height (${across.size} runs)"
                continue
            }
            wrong.within("$name: the dot's centre x", (across[0].first + across[0].second) / 2, ax, 0.75f)
            // The dot is the column's last run: its centre is 3 above its end.
            wrong.within("$name: the dot's centre y", down.second - 3f, ay, 0.75f)
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * Left and Right are the map's, in every language (Olcay, 16 Oct): a map
     * doesn't mirror in right to left, and MapLibre places a symbol's text
     * physically, so a label on a pin's left stays on its left.
     */
    @Test
    fun aSideLabelIsTheMapsLeftOrRightInRightToLeft() {
        val wrong = mutableListOf<String>()
        val ink = near(0xFF17191C.toInt(), 60)
        for (placement in listOf(KozmosLocationPinLabelPlacement.Left, KozmosLocationPinLabelPlacement.Right)) {
            val frame = draw(dark = false) {
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                    KozmosLocationPin(number = 3, externalLabel = "Gate 12", labelPlacement = placement)
                }
            }
            val pill = frame.bounds(matches = near(theme600(false), 6))
            val label = frame.bounds(matches = ink)
            println("Olcay 16 Oct Android, right to left, $placement: the pill $pill, the label's ink $label")
            if (pill == null || label == null) {
                wrong += "$placement: drew no pill ($pill) or no label ($label)"
                continue
            }
            if (placement == KozmosLocationPinLabelPlacement.Left && label.right > pill.left - 3.5f) {
                wrong += "in right to left, the Left label is not on the map's left (label ends at ${label.right}, the pill starts at ${pill.left})"
            }
            if (placement == KozmosLocationPinLabelPlacement.Right && label.left < pill.right + 3.5f) {
                wrong += "in right to left, the Right label is not on the map's right (label starts at ${label.left}, the pill ends at ${pill.right})"
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * A label at the start or end is centred on the marker's shape, as React
     * and SwiftUI centre it: the pill's middle, 16 below its top, not the pill
     * with its pointer; the place's circle, 20 below its top, not the
     * teardrop. Review, 16 Oct: Compose centred it on the whole body, 19 and
     * 24.1. Read from the label's ink, whose middle sits a fixed distance
     * above its box's for a line without descenders.
     */
    @Test
    fun aLabelBesideTheMarkerIsCentredOnItsShape() {
        val wrong = mutableListOf<String>()
        val ink = near(0xFF17191C.toInt(), 60)
        fun labelMiddle(frame: Frame, shape: Box4): Float? =
            frame.bounds(Box4(shape.right + 2f, shape.top - 20f, shape.right + 120f, shape.top + 60f), ink)
                ?.let { (it.top + it.bottom) / 2 }

        val result = draw(dark = false) {
            KozmosLocationPin(number = 3, externalLabel = "Gate 12", labelPlacement = KozmosLocationPinLabelPlacement.Right)
        }
        val pill = result.bounds(matches = near(theme600(false), 6))
        val place = draw(dark = false) {
            KozmosLocationPin(label = "Harbour", place = true, externalLabel = "Gate 12", labelPlacement = KozmosLocationPinLabelPlacement.Right)
        }
        val teardrop = place.bounds(matches = near(success800(false), 6))
        if (pill == null || teardrop == null) {
            wrong += "a marker drew no shape (pill $pill, teardrop $teardrop)"
        } else {
            val resultLabel = labelMiddle(result, pill)
            val placeLabel = labelMiddle(place, teardrop)
            println("Track 2 Android, side labels: the Result's ink middle %.2f below the pill's top, the place's %.2f below the circle's".format(
                resultLabel?.minus(pill.top), placeLabel?.minus(teardrop.top)))
            if (resultLabel == null || placeLabel == null) wrong += "a label drew no ink beside its marker"
            else {
                // The ink's middle is the same distance from its box's middle
                // in both: the label centres on 16 and on 20 when the two
                // differ by 4, and on the body (19 and 24.1) when by 5.1.
                wrong.within("the place's label below the Result's", placeLabel - teardrop.top - (resultLabel - pill.top), 4f, 0.5f)
                wrong.within("the Result's label centre", resultLabel - pill.top, 16f, 1.5f)
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * The featured tile's logo, `markerContent`, has the area inside the rim
     * (38, or 46 selected), clipped to the inner radius 13: a logo that fills
     * it shows to the rim along the edges but not in the corners, and the rim
     * still shows round it. It is the only thing `markerContent` is for: a
     * Result or a place ignores it.
     */
    @Test
    fun aFeaturedLogoFillsTheTileInsideItsRimClippedToTheInnerRadius() {
        val wrong = mutableListOf<String>()
        val logo = 0xFF00FF00.toInt()
        val isLogo = near(logo, 8)
        for (dark in listOf(false, true)) {
            for ((selected, inside) in listOf(false to 38f, true to 46f)) {
                val m = "${mode(dark)}, ${if (selected) "selected" else "at rest"}"
                val frame = draw(dark) {
                    KozmosLocationPin(label = "Burger King", featured = true, selected = selected) {
                        Box(Modifier.fillMaxSize().background(Color(logo)))
                    }
                }
                val drawn = frame.bounds(matches = isLogo)
                val tile = frame.bounds(matches = near(foreground0(dark), 30))
                if (drawn == null || tile == null) {
                    wrong += "$m: draws no logo, or no rim, round a filling logo"
                    continue
                }
                println("Track 2 Android, $m: a filling logo is $drawn in a tile $tile")
                wrong.within("$m: the logo is wide", drawn.width, inside, 1f)
                wrong.within("$m: the logo is tall", drawn.height, inside, 1f)
                wrong.within("$m: the logo starts inside the rim by", drawn.left - tile.left, 3f, 0.8f)
                // The inner corner, radius 13: 2 in from the logo's corner on
                // the diagonal is outside it (13 − 13/√2 = 3.8).
                val corners = listOf(
                    frame.at(drawn.left + 1.5f, drawn.top + 1.5f), frame.at(drawn.right - 1.5f, drawn.top + 1.5f),
                    frame.at(drawn.left + 1.5f, drawn.bottom - 1.5f), frame.at(drawn.right - 1.5f, drawn.bottom - 1.5f)
                ).count(isLogo)
                if (corners > 0) wrong += "$m: the logo is not clipped to the inner radius ($corners corners drawn)"
                wrong.colour("$m: the rim beside the logo", foreground0(dark), frame.at(tile.left + 1.5f, (tile.top + tile.bottom) / 2))
            }
            for ((name, pin) in listOf<Pair<String, @Composable () -> Unit>>(
                "a Result" to { KozmosLocationPin(number = 4) { Box(Modifier.fillMaxSize().background(Color(logo))) } },
                "a place" to { KozmosLocationPin(place = true) { Box(Modifier.fillMaxSize().background(Color(logo))) } },
            )) {
                val shown = draw(dark, pin).count(Box4(0f, 0f, 120f, 120f), isLogo)
                if (shown > 0) wrong += "${mode(dark)}: $name draws markerContent ($shown pixels)"
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /** `place` wins over `featured` and `number`: it draws exactly what a place alone does. */
    @Test
    fun placeWinsOverFeaturedAndNumber() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val alone = draw(dark) { KozmosLocationPin(label = "Harbour Coffee", place = true) }
            val over = draw(dark) { KozmosLocationPin(label = "Harbour Coffee", place = true, featured = true, number = 7, selected = true) }
            val green = alone.count(Box4(0f, 0f, 120f, 120f), near(success800(dark), 6))
            var differ = 0
            for (y in 0 until minOf(alone.pixels.height, over.pixels.height)) for (x in 0 until minOf(alone.pixels.width, over.pixels.width)) {
                if (!DrawnPixels.matches(alone.pixels.argb(x, y), over.pixels.argb(x, y), 8)) differ++
            }
            println("Track 2 Android, ${mode(dark)}: a place that is featured, numbered and selected differs from a place in $differ pixels; $green green")
            if (green < 400) wrong += "${mode(dark)}: a place draws only $green pixels of its green"
            if (differ > 6) wrong += "${mode(dark)}: featured, number or selected change a place ($differ pixels differ)"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }
}
