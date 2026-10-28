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

    private fun draw(progress: Float, size: KozmosProgressSize, direction: LayoutDirection = LayoutDirection.Ltr): Drawn {
        var bounds = Rect.Zero
        var rootWidth = 0
        var density = 0f
        val pixels = paparazzi.drawn(frames) {
            CompositionLocalProvider(
                LocalLayoutDirection provides direction,
                LocalKozmosUseDarkTokens provides false,
                LocalKozmosAnimatorScale provides 0f
            ) {
                KozmosMaterialTheme {
                    val view = LocalView.current
                    density = LocalDensity.current.density
                    // A margin round the ring, so a ray read past its edge
                    // reads the page, not the frame's edge pixel again.
                    Box(Modifier.fillMaxSize().background(Color.White).padding(24.dp)) {
                        KozmosProgress(
                            progress,
                            Modifier.onGloballyPositioned { bounds = it.boundsInRoot(); rootWidth = view.width },
                            shape = KozmosProgressShape.Circular,
                            size = size
                        )
                    }
                }
            }
        }
        return Drawn(pixels, bounds, pixels.width.toFloat() / rootWidth, density)
    }

    private val theme = KozmosColors.primitivesColorsTheme500.toArgb()
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

    /** The arc is the theme fill and the track background 100: the colours React's tokens draw. */
    @Test fun theArcIsTheThemeFillOnBackground100() {
        val ring = draw(0.25f, KozmosProgressSize.Lg)
        val radius = ring.bounds.width * ring.scale * (128f - 12f) / 2f / 128f
        val onArc = ring.at(45.0, radius)
        val onTrack = ring.at(225.0, radius)
        assertTrue("the arc is ${DrawnPixels.hex(onArc)}", DrawnPixels.matches(onArc, theme, tolerance = 6))
        assertTrue("the track is ${DrawnPixels.hex(onTrack)}", DrawnPixels.matches(onTrack, track, tolerance = 6))
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
                }
            }
        }
        val rings = read.merged.filter { it.progressRange != null }
        assertEquals("two rings, one node each", 2, rings.size)
        val (levels, named) = rings
        assertEquals(listOf("11", "Levels Added in total"), levels.texts)
        assertEquals(11f / 15f, levels.progressRange!!.current, 0.0001f)
        assertEquals(0f..1f, levels.progressRange!!.range)
        val elsewhere = read.merged.filter { it.progressRange == null }.flatMap { it.texts }
        assertTrue("the label's words are said once: $elsewhere", elsewhere.none { it == "11" || it.startsWith("Levels") })
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
