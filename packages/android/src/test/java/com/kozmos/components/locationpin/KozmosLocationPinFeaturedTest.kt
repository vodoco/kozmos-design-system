package com.kozmos.components.locationpin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * Decisions 67 and 68 (Olcay, 2026-10-08), read off what is drawn and what
 * TalkBack is told, in the light and in the dark:
 *
 * - a featured pin shows the place's logo, `markerContent`, where the number
 *   would be, and a star only when there is no logo; `markerContent` takes
 *   the number's place on any pin, as React's does, and is clipped to the
 *   disc inside the ring;
 * - off the floor, a featured pin is outlined with the accent's dashed ring,
 *   and its star is drawn as an off-floor number is, in the foreground;
 * - `featuredLabel` is what TalkBack hears for Featured, and a featured pin's
 *   number, which it no longer shows, is not said.
 *
 * The colours are written out: they are what the decisions say. Paparazzi
 * scales its frames down (paparazzi-frames-are-scaled), so the parts are
 * drawn at twice the density and found by their colour, never by dp. Before
 * these decisions `markerContent` and `featuredLabel` did not exist, so this
 * class did not compile; with both parameters added and ignored, every test
 * here but the off-floor ring fails (recorded in the change that added it).
 */
class KozmosLocationPinFeaturedTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val accent = 0xFFFAB735.toInt()
    private val black = 0xFF000000.toInt()
    private val white = 0xFFFFFFFF.toInt()
    private val themeFill = 0xFF135BEC.toInt()
    private val host = 0xFF808080.toInt()

    /** Nothing in Kozmos is this green: what `markerContent` draws. */
    private val logo = Color(0xFF00FF00)
    private val logoArgb = 0xFF00FF00.toInt()

    private fun mode(dark: Boolean) = if (dark) "dark" else "light"

    private fun draw(dark: Boolean, pin: @Composable () -> Unit): DrawnPixels =
        paparazzi.drawn(frames) {
            val density = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(density.density * 2f, density.fontScale)
            ) {
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color(host)).padding(8.dp)) { pin() }
                }
            }
        }

    private fun DrawnPixels.count(colour: Int, tolerance: Int, xs: IntRange = 0 until width, ys: IntRange = 0 until height): Int {
        var found = 0
        for (y in ys) for (x in xs) if (DrawnPixels.matches(argb(x, y), colour, tolerance)) found++
        return found
    }

    private fun DrawnPixels.boundsWhere(
        xs: IntRange = 0 until width,
        ys: IntRange = 0 until height,
        matches: (Int) -> Boolean
    ): Pair<IntRange, IntRange>? {
        var left = Int.MAX_VALUE
        var top = Int.MAX_VALUE
        var right = -1
        var bottom = -1
        for (y in ys) for (x in xs) if (matches(argb(x, y))) {
            left = minOf(left, x); right = maxOf(right, x)
            top = minOf(top, y); bottom = maxOf(bottom, y)
        }
        return if (right < 0) null else (left..right) to (top..bottom)
    }

    private fun DrawnPixels.boundsOf(colour: Int, tolerance: Int = 2, xs: IntRange = 0 until width, ys: IntRange = 0 until height) =
        boundsWhere(xs, ys) { DrawnPixels.matches(it, colour, tolerance) }

    private fun IntRange.middleHalf(): IntRange {
        val quarter = (last - first + 1) / 4
        return (first + quarter)..(last - quarter)
    }

    /** How many separate runs of [matches] lie on a circle of [radius] pixels round [cx], [cy]. */
    private fun DrawnPixels.runsAround(cx: Float, cy: Float, radius: Float, matches: (Int) -> Boolean): Int {
        val samples = (0 until 720).map { step ->
            val angle = step * PI / 360
            val x = (cx + radius * cos(angle)).toInt().coerceIn(0, width - 1)
            val y = (cy + radius * sin(angle)).toInt().coerceIn(0, height - 1)
            matches(argb(x, y))
        }
        return samples.indices.count { i -> samples[i] && !samples[(i + samples.size - 1) % samples.size] }
            .let { if (it == 0 && samples.all { s -> s }) 1 else it }
    }

    /**
     * A featured pin with a logo shows the logo, in the accent, and no star;
     * a logo that fills its box is clipped to the disc inside the ring, which
     * still shows round it. A pin that is not featured shows `markerContent`
     * in place of its number, and keeps its fill rather than going quiet.
     */
    @Test
    fun markerContentTakesTheNumbersPlaceAndAFeaturedPinShowsItNotTheStar() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val m = mode(dark)
            val featured = draw(dark) {
                KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 8, featured = true) {
                    Box(Modifier.size(12.dp).background(logo))
                }
            }
            val disc = featured.boundsOf(accent)
            val logoPixels = featured.count(logoArgb, 8)
            val star = if (disc == null) 0 else featured.count(black, 24, disc.first.middleHalf(), disc.second.middleHalf())
            println("Decision 68 Android, $m: a featured pin with a logo draws $logoPixels logo pixels and $star black in its middle")
            if (disc == null) wrong += "$m: a featured pin with a logo draws no #FAB735"
            if (logoPixels < 50) wrong += "$m: a featured pin does not draw its logo ($logoPixels pixels)"
            if (star * 100 > logoPixels) wrong += "$m: a featured pin with a logo still draws the star ($star black pixels)"

            // A logo that fills its box is clipped to the disc inside the 2dp
            // ring: round, so the corners of its box are not drawn, and the
            // ring (white in light, black in dark) still shows round it.
            val ringColour = if (dark) black else white
            val filling = draw(dark) {
                KozmosLocationPin(size = KozmosLocationPinSize.Lg, featured = true) {
                    Box(Modifier.fillMaxSize().background(logo))
                }
            }
            val filled = filling.boundsOf(logoArgb, 8)
            val ring = filling.count(ringColour, 8)
            if (filled == null) {
                wrong += "$m: a filling logo draws nothing"
            } else {
                val (xs, ys) = filled
                val inset = xs.count() / 20
                val corners = listOf(
                    filling.argb(xs.first + inset, ys.first + inset), filling.argb(xs.last - inset, ys.first + inset),
                    filling.argb(xs.first + inset, ys.last - inset), filling.argb(xs.last - inset, ys.last - inset)
                ).count { DrawnPixels.matches(it, logoArgb, 8) }
                val centre = filling.argb((xs.first + xs.last) / 2, (ys.first + ys.last) / 2)
                println("Decision 68 Android, $m: a filling logo is ${xs.count()} x ${ys.count()}, $corners of its corners drawn; $ring ring pixels")
                if (!DrawnPixels.matches(centre, logoArgb, 8)) wrong += "$m: a filling logo is not drawn at the pin's centre"
                if (corners > 0) wrong += "$m: a filling logo is not clipped round ($corners of its box's corners drawn)"
                if (ring < 50) wrong += "$m: the ring does not show round a filling logo ($ring pixels)"
            }

            // Not featured: the content stands in for the number, and the
            // pin keeps its fill (the theme fill, not the quiet surface).
            val plain = draw(dark) {
                KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 8) {
                    Box(Modifier.size(12.dp).background(logo))
                }
            }
            val fill = plain.boundsOf(themeFill)
            val plainLogo = plain.count(logoArgb, 8)
            val number = if (fill == null) 0 else plain.count(white, 24, fill.first.middleHalf(), fill.second.middleHalf())
            println("Decision 68 Android, $m: a numbered pin with markerContent draws $plainLogo logo pixels and $number white in its middle")
            if (fill == null || plain.count(themeFill, 2) < 400) wrong += "$m: a pin showing markerContent is not filled"
            if (plainLogo < 50) wrong += "$m: a pin that is not featured does not draw its markerContent ($plainLogo pixels)"
            if (number * 100 > plainLogo) wrong += "$m: markerContent does not take the number's place ($number white pixels)"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * Off the floor a featured pin is the outlined marker: the background
     * inside the accent's dashed ring, eight dashes, and its star drawn as an
     * off-floor number is, in the foreground (black in light, white in dark),
     * never in the accent, which reads 1.9:1 on white.
     */
    @Test
    fun offTheFloorAFeaturedPinsRingIsTheDashedAccentAndItsStarTheForeground() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val m = mode(dark)
            val foreground = if (dark) white else black
            val surface = if (dark) black else white
            val drawn = draw(dark) { KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 8, featured = true, offFloor = true) }
            val ring = drawn.boundsOf(accent, 24)
            if (ring == null) {
                wrong += "$m: an off-floor featured pin draws no #FAB735 ring"
                continue
            }
            val cx = (ring.first.first + ring.first.last) / 2f
            val cy = (ring.second.first + ring.second.last) / 2f
            // The 3dp ring's middle: 18.5 of the pin's 20 radius.
            val dashes = drawn.runsAround(cx, cy, ring.first.count() / 2f * 0.925f) { DrawnPixels.matches(it, accent, 24) }
            val (mx, my) = ring.first.middleHalf() to ring.second.middleHalf()
            val inked = drawn.count(foreground, 24, mx, my)
            val hollow = drawn.count(surface, 4, mx, my)
            val inAccent = drawn.count(accent, 24, mx, my)
            val mark = drawn.boundsOf(foreground, 2, mx, my)
            val (wide, tall) = (mark?.first?.count() ?: 0) to (mark?.second?.count() ?: 0)
            println("Decision 68 Android, $m: off the floor, $dashes accent dashes; a $wide x $tall foreground mark ($inked pixels), $hollow surface and $inAccent accent pixels in the middle")
            if (dashes != 8) wrong += "$m: the off-floor featured ring is not eight accent dashes ($dashes)"
            if (hollow < 50) wrong += "$m: the off-floor featured pin is filled ($hollow surface pixels in its middle)"
            if (inked < 6) wrong += "$m: the off-floor star is not the foreground ($inked pixels)"
            else if (wide < tall * 0.85f) wrong += "$m: the off-floor mark is $wide x $tall, a number's shape, not a star's"
            if (inAccent * 100 > inked) wrong += "$m: the off-floor star is drawn in the accent ($inAccent pixels)"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * A disabled featured pin is dimmed once, to half: its star reads half the
     * disc it sits on (black at half over it), not a quarter (dimmed by the
     * pin and again by the star), and a logo is half its own colour over the
     * disc: the logo is faded as a layer, its ink given whole.
     */
    @Test
    fun aDisabledFeaturedPinDimsItsStarAndLogoOnce() {
        val wrong = mutableListOf<String>()
        fun green(argb: Int) = argb shr 8 and 0xFF
        for (dark in listOf(false, true)) {
            val m = mode(dark)
            val star = draw(dark) { KozmosLocationPin(size = KozmosLocationPinSize.Lg, featured = true, enabled = false) }
            val logoPin = draw(dark) {
                KozmosLocationPin(size = KozmosLocationPinSize.Lg, featured = true, enabled = false) {
                    Box(Modifier.size(12.dp).background(logo))
                }
            }
            // The pin: everything that is not the grey host.
            val pin = star.boundsWhere { !DrawnPixels.matches(it, host, 3) }
            if (pin == null) {
                wrong += "$m: a disabled featured pin draws nothing"
                continue
            }
            val cx = (pin.first.first + pin.first.last) / 2
            val cy = (pin.second.first + pin.second.last) / 2
            val span = pin.first.count()
            // Beside the mark, inside the ring: the dimmed disc.
            val disc = green(star.argb(cx - span * 3 / 8, cy))
            var mark = 255
            for (y in cy - span / 8..cy + span / 8) for (x in cx - span / 8..cx + span / 8) mark = minOf(mark, green(star.argb(x, y)))
            val drawnLogo = green(logoPin.argb(cx, cy))
            val once = 0.5f * 255 + 0.5f * disc
            println("Decision 68 Android, $m: disabled, the disc reads g $disc, the star $mark, the logo $drawnLogo (once ${once.toInt()})")
            if (kotlin.math.abs(mark - disc / 2f) > disc * 0.1f) wrong += "$m: the star is not dimmed once: g $mark on a disc of $disc"
            if (kotlin.math.abs(drawnLogo - once) > 12) wrong += "$m: the logo is not dimmed once: g $drawnLogo, not ${once.toInt()}"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * The star stands where the number would, as tall as the number's
     * digits: within a quarter of the height of an 8 drawn in a pin of the
     * same size (off the floor, where the number is the foreground on the
     * background), as on iOS.
     */
    @Test
    fun theStarIsAsTallAsTheNumbersDigits() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val m = mode(dark)
            val ink = if (dark) white else black
            val digit = draw(dark) { KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 8, offFloor = true) }.boundsOf(ink, 4)
            // Inside the accent disc: in dark the filled pin's ring is black too.
            val featured = draw(dark) { KozmosLocationPin(size = KozmosLocationPinSize.Lg, featured = true) }
            val disc = featured.boundsOf(accent)
            val star = disc?.let { featured.boundsOf(black, 4, it.first.middleHalf(), it.second.middleHalf()) }
            val digitTall = digit?.second?.count() ?: 0
            val starTall = star?.second?.count() ?: 0
            println("Decision 68 Android, $m: the star is ${star?.first?.count()} x $starTall, an 8 is $digitTall tall")
            if (digitTall < 8) wrong += "$m: no 8 drawn to measure against"
            else if (kotlin.math.abs(starTall - digitTall) > digitTall / 4f) wrong += "$m: the star is $starTall tall, not the digits' $digitTall"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * Decision 67: TalkBack hears `featuredLabel` for Featured, so a product
     * says it in the visitor's language, and a featured pin's number, which
     * it no longer shows, is not said. Before it, a featured pin said
     * "Burger King, 3, Featured" in English whatever the product passed.
     */
    @Test
    fun featuredLabelReplacesFeaturedInWhatTalkBackHears() {
        val wrong = mutableListOf<String>()
        val cases: List<Triple<String, @Composable () -> Unit, String>> = listOf(
            Triple("translated", { KozmosLocationPin(label = "Burger King", number = 3, featured = true, featuredLabel = "Destacado") }, "Burger King, Destacado"),
            Triple("default", { KozmosLocationPin(label = "Burger King", number = 3, featured = true) }, "Burger King, Featured"),
            Triple("off the floor", {
                KozmosLocationPin(label = "Burger King", number = 3, featured = true, offFloor = true, featuredLabel = "Destacado")
            }, "Burger King, Destacado, On another floor"),
            Triple("not featured", { KozmosLocationPin(label = "Burger King", number = 3, featuredLabel = "Destacado") }, "Burger King, 3"),
        )
        for ((case, pin, expected) in cases) {
            val names = paparazzi.readSemantics { KozmosMaterialTheme { pin() } }.names()
            println("Decision 67 Android, $case: TalkBack hears $names")
            if (expected !in names) wrong += "$case: TalkBack hears $names, not \"$expected\""
        }
        // A logo is not read over the label: the pin is named once. The
        // merged tree is what TalkBack walks; the pin does not merge its
        // children, so a logo left readable would be a node of its own there.
        val logoNames = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosLocationPin(label = "Burger King", featured = true) {
                    Icon(Icons.Default.Place, contentDescription = "Burger King logo")
                }
            }
        }.names()
        println("Decision 68 Android: a featured pin with a logo is heard as $logoNames")
        if (logoNames.any { "logo" in it }) wrong += "the logo's description is read: $logoNames"
        if ("Burger King, Featured" !in logoNames) wrong += "a featured pin with a logo is heard as $logoNames"
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }
}
