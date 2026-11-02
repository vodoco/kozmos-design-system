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
import androidx.compose.ui.text.TextLayoutResult
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
import com.kozmos.tokens.KozmosThemeTokens
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
        /** Frame pixels to a dp. */
        val perDp get() = scale * density
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
        placement: KozmosProgressLabelPlacement = KozmosProgressLabelPlacement.End,
        page: Color = Color.White,
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
                    Box(Modifier.fillMaxSize().background(page).padding(24.dp)) {
                        val placed = Modifier.onGloballyPositioned { bounds = it.boundsInRoot(); rootWidth = view.width }
                        if (tone == null) {
                            KozmosProgress(
                                progress,
                                placed,
                                shape = KozmosProgressShape.Circular,
                                size = size,
                                labelPlacement = placement,
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
     * A value over the total is all of it, as React's ring and SwiftUI's have
     * it; a progress that is not a number is none done, as theirs is.
     */
    @Test fun aValueOverTheTotalIsAFullRingAndOneThatIsNotANumberIsNone() {
        val r = (128f - 12f) / 2f
        val over = draw(16f / 15f, KozmosProgressSize.Lg)
        val wrong = mutableListOf<String>()
        for (degrees in listOf(5.0, 180.0, 355.0)) {
            val pixel = over.at(degrees, r * over.perDp)
            if (!isArc(pixel)) wrong += "16 of 15: no arc at $degrees° (${DrawnPixels.hex(pixel)})"
        }
        for (progress in listOf(Float.NaN, Float.POSITIVE_INFINITY)) {
            val none = draw(progress, KozmosProgressSize.Lg)
            val pixel = none.at(90.0, r * none.perDp)
            if (isArc(pixel)) wrong += "$progress: an arc is drawn (${DrawnPixels.hex(pixel)})"
        }
        assertEquals(emptyList<String>(), wrong)
    }

    /** What a ring paints in its hole: the ink's box from the centre, in dp, and how much of it is [ink]. */
    private class Hole(val box: Rect?, val inked: Int, val matching: Int)

    private fun hole(ring: Drawn, size: KozmosProgressSize, ink: Int, page: Color = Color.White): Hole {
        val reach = (size.diameter.value / 2 - size.stroke.value - 1) * ring.perDp
        // From the dial's own start: a label beside it widens the bounds.
        val centreX = ring.bounds.left * ring.scale + size.diameter.value / 2 * ring.perDp
        var box: Rect? = null
        var inked = 0
        var matching = 0
        for (y in (ring.centreY - reach).toInt()..(ring.centreY + reach).toInt()) {
            for (x in (centreX - reach).toInt()..(centreX + reach).toInt()) {
                val dx = x + 0.5f - centreX
                val dy = y + 0.5f - ring.centreY
                if (kotlin.math.hypot(dx, dy) > reach) continue
                val pixel = ring.pixels.argb(x, y)
                if (DrawnPixels.matches(pixel, page.toArgb(), tolerance = 40)) continue
                inked++
                if (DrawnPixels.matches(pixel, ink, tolerance = 12)) matching++
                val spot = Rect(dx / ring.perDp, dy / ring.perDp, dx / ring.perDp, dy / ring.perDp)
                box = box?.let { Rect(minOf(it.left, spot.left), minOf(it.top, spot.top), maxOf(it.right, spot.right), maxOf(it.bottom, spot.bottom)) } ?: spot
            }
        }
        return Hole(box, inked, matching)
    }

    /** The arc's own colour, read from the same drawing at 45°, where its middle is. */
    private fun arcOf(ring: Drawn, size: KozmosProgressSize) =
        ring.at(45.0, (size.diameter.value - size.stroke.value) / 2 * ring.perDp)

    /**
     * Owner, 2 Nov: "100%" is 31.8 wide at 12, in the 28.28 square a small
     * hole holds, so a whole Sm ring with no label of the product's draws a
     * check. It stays inside that square, centred, and it is the arc's own
     * colour for every tone in both themes, as `tone` makes it. A value over
     * the total is complete too.
     */
    @Test fun aSmallRingAtCompleteDrawsACheckInItsTone() {
        val wrong = mutableListOf<String>()
        val size = KozmosProgressSize.Sm
        for (dark in listOf(false, true)) for (tone in listOf<KozmosEmotion?>(null) + KozmosEmotion.values()) {
            for (progress in if (tone == null) listOf(1f, 16f / 15f) else listOf(1f)) {
                // On the theme's page: dark, success's and alert's text are almost white.
                val page = if (dark) KozmosColorsDark.semanticsSurface0 else KozmosColors.semanticsSurface0
                val ring = draw(progress, size, tone = tone, dark = dark, page = page)
                val arc = arcOf(ring, size)
                val read = hole(ring, size, arc, page)
                val name = "${if (dark) "dark" else "light"} ${tone ?: "unset"} $progress"
                val box = read.box
                if (box == null) { wrong += "$name: the hole paints nothing"; continue }
                if (box.width < 12f || box.height < 9f) wrong += "$name: ${box.width} by ${box.height} is no check"
                val square = 28.28f / 2
                if (maxOf(-box.left, box.right, -box.top, box.bottom) > square) wrong += "$name: the check leaves the 28.28 square: $box"
                if (kotlin.math.abs(box.center.x) > 1.5f || kotlin.math.abs(box.center.y) > 1.5f) wrong += "$name: off centre: $box"
                if (read.matching < 0.5f * read.inked) wrong += "$name: ${read.matching} of ${read.inked} pixels are the arc's ${DrawnPixels.hex(arc)}"
            }
        }
        assertEquals(emptyList<String>(), wrong)
    }

    /**
     * A label of the product's always wins, in the hole or beside the ring,
     * and nothing short of complete, or at another size, draws a check.
     */
    @Test fun theCheckDrawsOnlyAtASmallCompleteRingWithNoLabel() {
        val wrong = mutableListOf<String>()
        val small = KozmosProgressSize.Sm
        for ((size, progress) in listOf(small to 0.99f, small to 0f, KozmosProgressSize.Md to 1f, KozmosProgressSize.Lg to 1f)) {
            val ring = draw(progress, size)
            val read = hole(ring, size, arcOf(ring, size))
            if (read.inked > 0) wrong += "$size at $progress: the hole paints ${read.inked} pixels"
        }
        val own = draw(1f, small, placement = KozmosProgressLabelPlacement.Center) { Text("OK", color = Color.Black) }
        val inTheHole = hole(own, small, arcOf(own, small))
        if (inTheHole.inked == 0) wrong += "the product's label is not drawn"
        if (inTheHole.matching > 0) wrong += "a label in the hole: ${inTheHole.matching} pixels of a check"
        val by = draw(1f, small, placement = KozmosProgressLabelPlacement.End) { Text("OK", color = Color.Black) }
        val beside = hole(by, small, theme)
        if (beside.inked > 0) wrong += "a label beside: the hole paints ${beside.inked} pixels"
        assertEquals(emptyList<String>(), wrong)
    }

    /**
     * The check is decoration: the ring still says 100%, by a name of its own
     * when it has no other, with its progress. A name or a value of the
     * caller's replaces Kozmos's, as it does on a ring with a label, and no
     * other ring takes a name.
     */
    @Test fun aSmallRingAtCompleteSays100Percent() {
        val read = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column {
                    val small = KozmosProgressSize.Sm
                    val shape = KozmosProgressShape.Circular
                    KozmosProgress(1f, shape = shape, size = small)
                    KozmosProgress(16f / 15f, shape = shape, size = small)
                    KozmosProgress(1f, Modifier.semantics { contentDescription = "Upload" }, shape = shape, size = small)
                    KozmosProgress(
                        1f,
                        Modifier.semantics {
                            contentDescription = "Levels"
                            stateDescription = "15 of 15"
                        },
                        shape = shape,
                        size = small
                    )
                    KozmosProgress(0.99f, shape = shape, size = small)
                    KozmosProgress(1f, shape = shape, size = KozmosProgressSize.Md)
                }
            }
        }
        val rings = read.merged.filter { it.progressRange != null }
        assertEquals("six rings, one node each", 6, rings.size)
        val (whole, over, upload, levels, short) = rings
        val medium = rings[5]
        assertEquals("100%", whole.description)
        assertEquals("100%", over.description)
        assertEquals("Upload", upload.description)
        assertEquals("Levels", levels.description)
        assertEquals("15 of 15", levels.stateDescription)
        for (ring in listOf(whole, over, upload, levels)) assertEquals(1f, ring.progressRange!!.current, 0.0001f)
        assertEquals(null, short.description)
        assertEquals(null, medium.description)
    }

    /** The label's words, laid out in a ring of [size] with nothing else around them. */
    private fun layOut(
        size: KozmosProgressSize,
        placement: KozmosProgressLabelPlacement,
        label: @Composable () -> Unit
    ): Float {
        var density = 0f
        paparazzi.drawn(frames) {
            CompositionLocalProvider(LocalKozmosAnimatorScale provides 0f) {
                KozmosMaterialTheme {
                    density = LocalDensity.current.density
                    KozmosProgress(
                        0.5f,
                        shape = KozmosProgressShape.Circular,
                        size = size,
                        labelPlacement = placement,
                        label = label
                    )
                }
            }
        }
        return density
    }

    /**
     * React's `.kozmos-progress-ring`: 12 on 16 wherever the label is drawn,
     * until its content says otherwise. A size of the label's own keeps its
     * lines apart: a line height fixed at 16 would have laid a 20sp line's
     * words over the next.
     */
    @Test fun theLabelIs12On16UnlessItsContentSaysOtherwise() {
        val wrong = mutableListOf<String>()
        for (placement in KozmosProgressLabelPlacement.values()) {
            var plain: TextLayoutResult? = null
            var large: TextLayoutResult? = null
            val density = layOut(KozmosProgressSize.Lg, placement) {
                Column {
                    Text("one\ntwo", onTextLayout = { plain = it })
                    Text("one\ntwo", fontSize = 20.sp, onTextLayout = { large = it })
                }
            }
            val words = checkNotNull(plain)
            val apart = (words.getLineBottom(1) - words.getLineBottom(0)) / density
            if (words.layoutInput.style.fontSize != 12.sp) wrong += "$placement: ${words.layoutInput.style.fontSize}, not 12sp"
            if (kotlin.math.abs(apart - 16f) > 0.5f) wrong += "$placement: its lines are $apart apart, not 16"
            val heading = checkNotNull(large)
            val headingApart = (heading.getLineBottom(1) - heading.getLineBottom(0)) / density
            if (headingApart < 24f) wrong += "$placement: a 20sp line's lines are only $headingApart apart"
        }
        assertEquals(emptyList<String>(), wrong)
    }

    /** 12sp is what lets a percentage fit: "75%" stays on one line in the hole's square. */
    @Test fun aPercentageFitsOnOneLineInASmallRing() {
        var words: TextLayoutResult? = null
        val density = layOut(KozmosProgressSize.Sm, KozmosProgressLabelPlacement.Center) {
            Text("75%", onTextLayout = { words = it })
        }
        val laidOut = checkNotNull(words)
        val hole = (48f - 2 * 4f) * 0.7071f
        assertEquals("75% is ${laidOut.size.width / density} wide in a hole of $hole", 1, laidOut.lineCount)
        assertTrue(laidOut.size.width / density <= hole)
    }

    /**
     * React's ring sets its own colour, foreground 0, so the label reads on
     * whatever is behind it, on both paths and in both themes. Nothing here
     * draws a Material Surface, so nothing else provides one: dark, Material's
     * black was drawn on the dark page.
     */
    @Test fun theLabelIsForeground0OnEitherPathWithNoSurfaceAboveIt() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) for (placement in KozmosProgressLabelPlacement.values()) {
            val pixels = paparazzi.drawn(frames) {
                CompositionLocalProvider(
                    LocalKozmosUseDarkTokens provides dark,
                    LocalKozmosAnimatorScale provides 0f
                ) {
                    KozmosMaterialTheme {
                        Box(Modifier.fillMaxSize().background(KozmosThemeTokens.semanticsSurface0).padding(24.dp)) {
                            KozmosProgress(
                                0f,
                                shape = KozmosProgressShape.Circular,
                                size = KozmosProgressSize.Lg,
                                labelPlacement = placement
                            ) { Text("50%") }
                        }
                    }
                }
            }
            val ink = if (dark) KozmosColorsDark.primitivesColorsForeground0 else KozmosColors.primitivesColorsForeground0
            var inked = 0
            for (y in 0 until pixels.height) for (x in 0 until pixels.width) {
                if (DrawnPixels.matches(pixels.argb(x, y), ink.toArgb(), tolerance = 24)) inked++
            }
            if (inked < 8) wrong += "${if (dark) "dark" else "light"} $placement: $inked pixels of the label's ${DrawnPixels.hex(ink.toArgb())}"
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
