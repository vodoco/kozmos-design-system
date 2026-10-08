package com.kozmos.components.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
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

/**
 * Decision 65 (Olcay, 2026-10-08): tabs draw React's raised segment on every
 * platform. The list is a muted track, background/100; the selected tab is a
 * segment of background/0 inside it, raised, with foreground/0 words, and the
 * other tabs' words are foreground/400. Nothing on tabs is the theme's
 * colour. Until the decision Compose drew a background/0 list with a 2dp
 * theme-500 bar under the selected tab.
 *
 * Read off what is drawn, in the light and in the dark, left to right and
 * right to left. The colours are written out, not read from the tokens: they
 * are what the decision names, so a token or a component that drifted from
 * them fails here. The tabs sit on a mid grey that is none of them, so a
 * background/0 pixel can only be the segment. Paparazzi scales its frames
 * down (paparazzi-frames-are-scaled), so the parts are drawn at twice the
 * density and found by their colour, never by dp; and CI's Linux
 * anti-aliases edges differently (paparazzi-linux-edge-pixels), so a colour
 * that must be absent may still show on up to 1% of the expected colour's
 * pixels.
 */
class KozmosTabsSegmentPixelsTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFF808080.toInt()
    private val theme500 = 0xFF135BEC.toInt()
    private fun background0(dark: Boolean) = if (dark) 0xFF000000.toInt() else 0xFFFFFFFF.toInt()
    private fun background100(dark: Boolean) = if (dark) 0xFF17191C.toInt() else 0xFFE3E4E8.toInt()
    private fun foreground0(dark: Boolean) = if (dark) 0xFFFFFFFF.toInt() else 0xFF000000.toInt()
    private fun foreground400(dark: Boolean) = if (dark) 0xFFA29D90.toInt() else 0xFF5D626F.toInt()

    /**
     * Two tabs, the first selected, at twice the density on the mid grey.
     * Short words, so each fits its half of the 164dp row on one line.
     */
    private fun draw(dark: Boolean, rtl: Boolean): DrawnPixels =
        paparazzi.drawn(frames) {
            val density = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
                LocalDensity provides Density(density.density * 2f, density.fontScale)
            ) {
                KozmosMaterialTheme {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .background(Color(host))
                            .padding(8.dp)
                    ) {
                        KozmosTabs {
                            KozmosTabsList {
                                KozmosTabsTrigger(value = "hours", title = "Hours", selectedValue = "hours", onValueChange = {})
                                KozmosTabsTrigger(value = "access", title = "Access", selectedValue = "hours", onValueChange = {})
                            }
                        }
                    }
                }
            }
        }

    private fun mode(dark: Boolean) = if (dark) "dark" else "light"
    private fun direction(rtl: Boolean) = if (rtl) "right to left" else "left to right"

    /** How many pixels in the box are [colour], give or take [tolerance] on each channel. */
    private fun DrawnPixels.count(
        colour: Int,
        tolerance: Int = 2,
        xs: IntRange = 0 until width,
        ys: IntRange = 0 until height
    ): Int {
        var found = 0
        for (y in ys) for (x in xs) if (DrawnPixels.matches(argb(x, y), colour, tolerance)) found++
        return found
    }

    /** The box round every pixel drawn in [colour] in the region, as x and y ranges; null if there is none. */
    private fun DrawnPixels.boundsOf(
        colour: Int,
        xs: IntRange = 0 until width,
        ys: IntRange = 0 until height,
        tolerance: Int = 2
    ): Pair<IntRange, IntRange>? {
        var left = Int.MAX_VALUE
        var top = Int.MAX_VALUE
        var right = -1
        var bottom = -1
        for (y in ys) for (x in xs) {
            if (DrawnPixels.matches(argb(x, y), colour, tolerance)) {
                left = minOf(left, x); right = maxOf(right, x)
                top = minOf(top, y); bottom = maxOf(bottom, y)
            }
        }
        return if (right < 0) null else (left..right) to (top..bottom)
    }

    private val IntRange.size: Int get() = last - first + 1
    private val IntRange.middle: Int get() = (first + last) / 2

    /**
     * The box round [colour] in the region, if the colour fills at least
     * [share] of it: a fill, not the scattered pixels of an anti-aliased
     * edge that happen to land on the colour, which cover under 1% of
     * theirs.
     */
    private fun DrawnPixels.fillOf(
        colour: Int,
        xs: IntRange = 0 until width,
        ys: IntRange = 0 until height,
        share: Double = 0.5,
        tolerance: Int = 2
    ): Pair<IntRange, IntRange>? {
        val box = boundsOf(colour, xs, ys, tolerance) ?: return null
        val filled = count(colour, tolerance, xs = box.first, ys = box.second)
        return if (filled >= share * box.first.size * box.second.size) box else null
    }

    /**
     * The track: background/100 over at least a quarter of its box, since
     * the segment and the words cover much of it, give or take 12 a channel,
     * so the track the segment's shadow falls on still counts.
     */
    private fun DrawnPixels.trackOf(dark: Boolean) = fillOf(background100(dark), share = 0.25, tolerance = 12)

    /**
     * The track, the segment inside it at the first tab's end, and no theme
     * 500, as a list of what is wrong, so a failure names all of it.
     */
    private fun segmentProblems(dark: Boolean, rtl: Boolean): List<String> {
        val drawn = draw(dark, rtl)
        val where = "${mode(dark)}, ${direction(rtl)}"
        val problems = mutableListOf<String>()

        val track = drawn.trackOf(dark)
        val segment = track?.let { (xs, ys) -> drawn.fillOf(background0(dark), xs, ys) }
        val segmentPixels = segment?.let { (xs, ys) -> drawn.count(background0(dark), xs = xs, ys = ys) } ?: 0
        val blue = drawn.count(theme500, tolerance = 6)

        if (track == null) {
            problems += "$where: no background/100 ${DrawnPixels.hex(background100(dark))} track is drawn"
        } else if (segment == null || segmentPixels < 400) {
            problems += "$where: the track holds $segmentPixels background/0 ${DrawnPixels.hex(background0(dark))} pixels, not a segment"
        }
        if (track != null && segment != null) {
            val (tx, ty) = track
            val (sx, sy) = segment
            // background/100 shows above, below and at the outer end of the
            // segment: it is inside the track, not the track itself.
            val above = sy.first - ty.first
            val below = ty.last - sy.last
            val outer = if (rtl) tx.last - sx.last else sx.first - tx.first
            if (above < 4 || below < 4 || outer < 4) {
                problems += "$where: background/100 does not surround the segment " +
                    "(track x $tx y $ty, segment x $sx y $sy: $above above, $below below, $outer at its outer end)"
            }
            // The first tab is selected: its segment is at the track's start.
            val atStart = if (rtl) sx.middle > tx.middle else sx.middle < tx.middle
            if (!atStart) {
                problems += "$where: the first tab's segment is not at the track's start (track x $tx, segment x $sx)"
            }
            // About half the track: one of two tabs, not the whole list.
            if (sx.size * 10 > tx.size * 6) {
                problems += "$where: the segment spans ${sx.size} of the track's ${tx.size} pixels, more than one of two tabs"
            }
        }
        if (blue * 100 > maxOf(segmentPixels, 1)) {
            problems += "$where: $blue pixels are theme 500 #135BEC; tabs draw no theme colour"
        }
        return problems
    }

    @Test
    fun theSelectedTabIsARaisedBackground0SegmentInABackground100TrackWithNoThemeColourInLightAndDark() {
        val problems = listOf(false, true).flatMap { dark -> segmentProblems(dark, rtl = false) }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }

    @Test
    fun rightToLeftTheFirstTabsSegmentIsAtTheTracksRightInLightAndDark() {
        val problems = listOf(false, true).flatMap { dark -> segmentProblems(dark, rtl = true) }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }

    /**
     * The selected tab's words are foreground/0 on the segment, the other's
     * foreground/400 on the track, as React's `text-foreground` and
     * `text-muted-foreground`. Text is anti-aliased, so this counts the
     * pixels a stem covers whole.
     */
    @Test
    fun theSelectedWordsAreForeground0AndTheOthersForeground400InLightAndDark() {
        val problems = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val drawn = draw(dark, rtl = false)
            val where = mode(dark)
            val track = drawn.trackOf(dark)
            if (track == null) {
                problems += "$where: no background/100 track is drawn"
                continue
            }
            val (tx, ty) = track
            val startHalf = tx.first..tx.middle
            val endHalf = (tx.middle + 1)..tx.last
            val selectedWords = drawn.count(foreground0(dark), tolerance = 8, xs = startHalf, ys = ty)
            val otherWords = drawn.count(foreground400(dark), tolerance = 8, xs = endHalf, ys = ty)
            if (selectedWords < 20) {
                problems += "$where: the selected tab draws $selectedWords foreground/0 ${DrawnPixels.hex(foreground0(dark))} word pixels"
            }
            if (otherWords < 20) {
                problems += "$where: the other tab draws $otherWords foreground/400 ${DrawnPixels.hex(foreground400(dark))} word pixels"
            }
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }

    /**
     * The segment is raised: below it, inside the track, the track is
     * darker than it is beside the segment, where no shadow falls.
     */
    @Test
    fun theSegmentCastsAShadowOnTheTrackInLightAndDark() {
        val problems = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val drawn = draw(dark, rtl = false)
            val where = mode(dark)
            val track = drawn.trackOf(dark)
            val segment = track?.let { (xs, ys) -> drawn.fillOf(background0(dark), xs, ys) }
            if (track == null || segment == null) {
                problems += "$where: no segment in a track to cast a shadow"
                continue
            }
            val (tx, ty) = track
            val (sx, sy) = segment
            // Just below the segment's middle, against the same row at the
            // other tab's middle, where the track lies flat.
            val y = sy.last + 2
            val under = DrawnPixels.lightness(drawn.argb(sx.middle, y))
            val beside = DrawnPixels.lightness(drawn.argb((sx.last + tx.last) / 2, y))
            if (y > ty.last || under >= beside - 3) {
                problems += "$where: under the segment the track is ${DrawnPixels.hex(drawn.argb(sx.middle, y))}, " +
                    "beside it ${DrawnPixels.hex(drawn.argb((sx.last + tx.last) / 2, y))}: no shadow"
            }
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }
}
