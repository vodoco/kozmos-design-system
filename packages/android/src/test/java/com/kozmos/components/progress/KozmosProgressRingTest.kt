package com.kozmos.components.progress

import androidx.compose.animation.core.SnapSpec
import androidx.compose.animation.core.TweenSpec
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.luminance
import com.kozmos.tokens.KozmosColorsDark
import com.kozmos.components.KozmosEmotion
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.live
import com.kozmos.components.motion.LocalKozmosAnimatorScale
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosColors
import com.kozmos.tokens.KozmosMotion
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlinx.coroutines.yield
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * Decision 131 (GAP-038): Progress's ring, a count out of a total, as React's
 * `shape="circular"` draws it. Read back from what Paparazzi draws, and from
 * what TalkBack is told; nothing is recorded or compared, so these need no
 * golden (KozmosProgressRingPaparazziTest holds the pictures).
 */
class KozmosProgressRingTest {
    private val frames = KeptFrames()
    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    @Test fun theSizesAreTheSpacingTokens() {
        assertEquals(listOf(48f, 96f, 128f), KozmosProgressSize.values().map { it.diameter.value })
        assertEquals(listOf(4f, 8f, 12f), KozmosProgressSize.values().map { it.stroke.value })
        assertEquals(listOf("Linear", "Circular"), KozmosProgressShape.values().map { it.name })
        assertEquals(listOf("Center", "End"), KozmosProgressLabelPlacement.values().map { it.name })
    }

    @Test fun withAnimationsOffANewValueIsDrawnAtOnce() {
        assertTrue(kozmosProgressSweep(animationsOn = false) is SnapSpec)
        val sweep = kozmosProgressSweep(animationsOn = true) as TweenSpec
        assertEquals(KozmosMotion.semanticsMotionDurationStandard, sweep.durationMillis)
    }

    /** A ring drawn on white, and where it was laid out in the frame's pixels. */
    private class Drawn(val pixels: DrawnPixels, val bounds: Rect, val scale: Float, val density: Float) {
        val centreX get() = (bounds.left + bounds.width / 2) * scale
        val centreY get() = (bounds.top + bounds.height / 2) * scale
        /** The pixel at [degrees] clockwise from 12 o'clock, [radius] frame pixels out. */
        fun at(degrees: Double, radius: Float): Int {
            val a = degrees * PI / 180
            return pixels.argb(
                (centreX + radius * sin(a)).toInt().coerceIn(0, pixels.width - 1),
                (centreY - radius * cos(a)).toInt().coerceIn(0, pixels.height - 1)
            )
        }
    }

    private fun draw(
        progress: Float,
        size: KozmosProgressSize,
        direction: LayoutDirection = LayoutDirection.Ltr,
        tone: KozmosEmotion? = null,
        dark: Boolean = false,
        label: (@Composable () -> Unit)? = null
    ): Drawn {
        var bounds = Rect.Zero
        var rootWidth = 0
        var density = 0f
        val pixels = paparazzi.drawn(frames) {
            CompositionLocalProvider(
                LocalLayoutDirection provides direction,
                LocalKozmosUseDarkTokens provides dark,
                LocalKozmosAnimatorScale provides 0f
            ) {
                KozmosMaterialTheme {
                    val view = LocalView.current
                    density = LocalDensity.current.density
                    // A margin round the ring, so a ray read past its edge
                    // reads the page, not the frame's edge pixel again.
                    Box(Modifier.fillMaxSize().background(Color.White).padding(24.dp)) {
                        val placed = Modifier.onGloballyPositioned { bounds = it.boundsInRoot(); rootWidth = view.width }
                        if (tone == null) {
                            KozmosProgress(
                                progress,
                                placed,
                                shape = KozmosProgressShape.Circular,
                                size = size,
                                labelPlacement = KozmosProgressLabelPlacement.End,
                                label = label
                            )
                        } else {
                            KozmosProgress(
                                progress,
                                placed,
                                shape = KozmosProgressShape.Circular,
                                size = size,
                                tone = tone
                            )
                        }
                    }
                }
            }
        }
        return Drawn(pixels, bounds, pixels.width.toFloat() / rootWidth, density)
    }

    // Unset, the arc is the bar's own fill, theme 600 (owner, 28 Oct).
    private val theme = KozmosColors.primitivesColorsTheme600.toArgb()
    private val track = KozmosColors.primitivesColorsBackground100.toArgb()
    private fun isArc(argb: Int) = DrawnPixels.matches(argb, theme, tolerance = 24)

    /**
     * Walking the ring's middle clockwise from 12 o'clock, half a degree at a
     * time, the arc is one run from 12, as long as the value's share of the
     * turn, left to right and right to left: a progress ring does not mirror.
     */
    @Test fun theArcRunsClockwiseFromTwelveInBothDirections() {
        val wrong = mutableListOf<String>()
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            for (progress in listOf(0f, 0.25f, 11f / 15f, 0.5f, 0.75f, 1f)) {
                val ring = draw(progress, KozmosProgressSize.Lg, direction)
                assertEquals("the ring is 128 across", 128f, ring.bounds.width / ring.density, 0.01f)
                val radius = ring.bounds.width * ring.scale * (128f - 12f) / 2f / 128f
                val arc = (0 until 720).map { isArc(ring.at(it / 2.0, radius)) }
                val drawn = arc.count { it } / 2.0
                // The run that starts at 12 o'clock: the pixel on the line
                // itself may be shared with the page, so it may begin a
                // step or two after.
                val start = arc.indexOf(true).takeIf { it in 0..4 }
                val run = if (start == null) 0.0 else (arc.subList(start, 720).indexOf(false).takeIf { it >= 0 }?.plus(start) ?: 720) / 2.0
                val expected = progress * 360.0
                // A frame pixel is about 1.4° of this ring's middle.
                if (kotlin.math.abs(drawn - expected) > 3) wrong += "$direction $progress: $drawn° of arc, not $expected°"
                if (kotlin.math.abs(run - expected) > 3) wrong += "$direction $progress: a run of $run° clockwise from 12, not $expected°"
            }
        }
        assertEquals(emptyList<String>(), wrong)
    }

    /**
     * Owner, 28 Oct: a status ring. Unset, the arc is the bar's theme 600;
     * each tone's is its emotion's text colour, Tag's; the track is
     * background 100; and every arc is 3:1 or more on it, light and dark.
     */
    @Test fun theArcIsTheBarsFillAndEachToneItsEmotionsTextOnBackground100() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val palette = if (dark) listOf(
                null to KozmosColorsDark.primitivesColorsTheme600,
                KozmosEmotion.Themed to KozmosColorsDark.semanticsEmotionThemedText,
                KozmosEmotion.Neutral to KozmosColorsDark.semanticsEmotionNeutralText,
                KozmosEmotion.Success to KozmosColorsDark.semanticsEmotionSuccessText,
                KozmosEmotion.Danger to KozmosColorsDark.semanticsEmotionDangerText,
                KozmosEmotion.Informative to KozmosColorsDark.semanticsEmotionInformativeText,
                KozmosEmotion.Alert to KozmosColorsDark.semanticsEmotionAlertText
            ) else listOf(
                null to KozmosColors.primitivesColorsTheme600,
                KozmosEmotion.Themed to KozmosColors.semanticsEmotionThemedText,
                KozmosEmotion.Neutral to KozmosColors.semanticsEmotionNeutralText,
                KozmosEmotion.Success to KozmosColors.semanticsEmotionSuccessText,
                KozmosEmotion.Danger to KozmosColors.semanticsEmotionDangerText,
                KozmosEmotion.Informative to KozmosColors.semanticsEmotionInformativeText,
                KozmosEmotion.Alert to KozmosColors.semanticsEmotionAlertText
            )
            val trackColour = (if (dark) KozmosColorsDark.primitivesColorsBackground100 else KozmosColors.primitivesColorsBackground100)
            for ((tone, want) in palette) {
                val ring = draw(0.25f, KozmosProgressSize.Lg, tone = tone, dark = dark)
                val radius = ring.bounds.width * ring.scale * (128f - 12f) / 2f / 128f
                val onArc = ring.at(45.0, radius)
                val onTrack = ring.at(225.0, radius)
                val name = "${if (dark) "dark" else "light"} ${tone ?: "unset"}"
                if (!DrawnPixels.matches(onArc, want.toArgb(), tolerance = 6)) wrong += "$name: the arc is ${DrawnPixels.hex(onArc)}, not ${DrawnPixels.hex(want.toArgb())}"
                if (!DrawnPixels.matches(onTrack, trackColour.toArgb(), tolerance = 6)) wrong += "$name: the track is ${DrawnPixels.hex(onTrack)}"
                val ratio = (maxOf(want.luminance(), trackColour.luminance()) + 0.05f) / (minOf(want.luminance(), trackColour.luminance()) + 0.05f)
                if (ratio < 3f) wrong += "$name: $ratio:1 on the track"
            }
        }
        assertEquals(emptyList<String>(), wrong)
    }

    /**
     * Beside the ring at the inline end, 12 from it, centred on it: right of
     * it left to right and left of it right to left, the ring still filling
     * clockwise.
     */
    @Test fun aLabelAtTheEndSitsBesideTheRingAtTheInlineEnd() {
        val wrong = mutableListOf<String>()
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            val drawn = draw(0.25f, KozmosProgressSize.Lg, direction) {
                Text("2 Levels", color = Color.Black, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }
            val pixels = drawn.pixels
            var ring = Rect.Zero
            var words = Rect.Zero
            fun grow(r: Rect, x: Int, y: Int) =
                if (r == Rect.Zero) Rect(x.toFloat(), y.toFloat(), x + 1f, y + 1f)
                else Rect(minOf(r.left, x.toFloat()), minOf(r.top, y.toFloat()), maxOf(r.right, x + 1f), maxOf(r.bottom, y + 1f))
            for (y in 0 until pixels.height) for (x in 0 until pixels.width) {
                val c = pixels.argb(x, y)
                // The arc's blue, or the track's grey, which is a little blue:
                // the label's antialiased edges are greys with none.
                val blueish = (c and 0xFF) - (c shr 16 and 0xFF) >= 4
                if (DrawnPixels.matches(c, theme, tolerance = 24) || (blueish && DrawnPixels.matches(c, track, tolerance = 3))) ring = grow(ring, x, y)
                else if (DrawnPixels.lightness(c) < 150) words = grow(words, x, y)
            }
            val perDp = drawn.scale * drawn.density
            val gap = (if (direction == LayoutDirection.Ltr) words.left - ring.right else ring.left - words.right) / perDp
            if (gap < 11f || gap > 15f) wrong += "$direction: the label is $gap dp from the ring, not at its inline end"
            if (kotlin.math.abs(words.center.y - ring.center.y) / perDp > 3f) wrong += "$direction: the label is not centred on the ring"
            if (kotlin.math.abs(ring.width / perDp - 128f) > 2f) wrong += "$direction: the ring is ${ring.width / perDp} dp wide"
            // A quarter: the arc at the ring's top right in both directions.
            val r = ring.width * (128f - 12f) / 2f / 128f
            val topRight = pixels.argb(
                (ring.center.x + r * 0.7071f).toInt(),
                (ring.center.y - r * 0.7071f).toInt()
            )
            if (!isArc(topRight)) wrong += "$direction: the arc is not at the top right (${DrawnPixels.hex(topRight)})"
        }
        assertEquals(emptyList<String>(), wrong)
    }

    /** At a full ring, along a ray every 10°, the painted band is the size's stroke, inside the box. */
    @Test fun theBandIsTheStrokeAllTheWayRound() {
        val wrong = mutableListOf<String>()
        for (size in KozmosProgressSize.values()) {
            val ring = draw(1f, size)
            val perDp = ring.bounds.width * ring.scale / size.diameter.value
            val outer = size.diameter.value / 2 * perDp
            val bands = (0 until 36).map { step ->
                var covered = 0
                var r = outer - (size.stroke.value + 3) * perDp
                while (r < outer + 3 * perDp) {
                    if (isArc(ring.at(step * 10.0, r))) covered++
                    r += 0.25f
                }
                covered * 0.25f / perDp
            }
            val low = bands.min()
            val high = bands.max()
            if (low < size.stroke.value - 1 || high > size.stroke.value + 1) {
                wrong += "$size: the band is $low–$high dp, not ${size.stroke.value}"
            }
        }
        assertEquals(emptyList<String>(), wrong)
    }

    /**
     * One node: the label's words with the ring's progress, said once; a
     * name or a value of the caller's replaces Kozmos's.
     */
    @Test fun theRingIsOneNodeNamedByItsLabelWithItsProgress() {
        val read = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column {
                    KozmosProgress(11f / 15f, shape = KozmosProgressShape.Circular, size = KozmosProgressSize.Lg) {
                        Column {
                            Text("11")
                            Text("Levels Added in total")
                        }
                    }
                    KozmosProgress(
                        11f / 15f,
                        Modifier.semantics {
                            contentDescription = "Levels"
                            stateDescription = "11 of 15"
                        },
                        shape = KozmosProgressShape.Circular
                    ) { Text("11") }
                    KozmosProgress(
                        2f / 6f,
                        shape = KozmosProgressShape.Circular,
                        labelPlacement = KozmosProgressLabelPlacement.End
                    ) {
                        Column {
                            Text("2 Levels")
                            Text("Added in total")
                        }
                    }
                }
            }
        }
        val rings = read.merged.filter { it.progressRange != null }
        assertEquals("three rings, one node each", 3, rings.size)
        val (levels, named, beside) = rings
        assertEquals(listOf("11", "Levels Added in total"), levels.texts)
        assertEquals(11f / 15f, levels.progressRange!!.current, 0.0001f)
        assertEquals(0f..1f, levels.progressRange!!.range)
        val elsewhere = read.merged.filter { it.progressRange == null }.flatMap { it.texts }
        assertTrue(
            "the label's words are said once: $elsewhere",
            elsewhere.none { it == "11" || it.startsWith("Levels") || it == "2 Levels" || it == "Added in total" }
        )
        // Beside the ring, its words are still the ring's own.
        assertEquals(listOf("2 Levels", "Added in total"), beside.texts)
        assertEquals(2f / 6f, beside.progressRange!!.current, 0.0001f)
        assertEquals("Levels", named.description)
        assertEquals("11 of 15", named.stateDescription)
    }

    /** A new value sweeps over frames; with animations off it is drawn there at once. */
    @Test fun aNewValueSweepsUnlessAnimationsAreOff() {
        for (scale in listOf(1f, 0f)) {
            var value by mutableFloatStateOf(0.25f)
            paparazzi.live(content = {
                CompositionLocalProvider(LocalKozmosAnimatorScale provides scale) {
                    KozmosMaterialTheme {
                        KozmosProgress(value, shape = KozmosProgressShape.Circular)
                    }
                }
            }) {
                frames(3)
                value = 0.75f
                // The frames that still had work waiting: a sweep of 280 ms
                // is several; drawn at once, a frame at most.
                var busy = 0
                repeat(8) {
                    frames(1)
                    // Let every coroutine the frame resumed run before looking.
                    repeat(3) { yield() }
                    if (hasPendingWork) busy++
                }
                println("animator scale $scale: $busy of 8 frames had work waiting")
                if (scale > 0f) assertTrue("a sweep at animator scale $scale waits on $busy of 8 frames", busy >= 4)
                else assertTrue("drawn at once at animator scale $scale, yet $busy of 8 frames waited", busy <= 1)
            }
        }
    }
}
