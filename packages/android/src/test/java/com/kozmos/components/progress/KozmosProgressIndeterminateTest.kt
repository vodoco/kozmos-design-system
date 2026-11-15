package com.kozmos.components.progress

import android.view.View
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import com.kozmos.components.live
import com.kozmos.components.motion.LocalKozmosAnimatorScale
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosDimensions
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.unit.dp
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

/**
 * GAP-159: the bar with no value moves, stands still with animations off,
 * is said once, and can be the screen's top loading bar, as React's
 * `<Progress />` and `placement="top"` are.
 */
class KozmosProgressIndeterminateTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** The waits' clock, in milliseconds, which each test moves itself. */
    private var now = 0L

    @Before fun ownTheWaitClock() {
        KozmosProgressWaitGroups.reset()
        KozmosProgressWaitGroups.clock = { now }
    }

    @After fun giveTheWaitClockBack() {
        KozmosProgressWaitGroups.reset()
        KozmosProgressWaitGroups.clock = { android.os.SystemClock.uptimeMillis() }
    }

    private fun close(expected: Float, actual: Float) =
        assertEquals(expected.toDouble(), actual.toDouble(), 1e-5)

    // The segment takes the track's corners, as React's does: a pill on
    // the rounded bar, square at the top. Until #522's goldens it was a
    // rectangle, square-ended in the middle of a pill track.
    @Test
    fun theSegmentTakesTheTracksCorners() {
        assertEquals(4f, kozmosProgressSegmentCorner(KozmosProgressPlacement.Inline, 8f))
        assertEquals(0f, kozmosProgressSegmentCorner(KozmosProgressPlacement.Top, 4f))
    }

    @Test fun theSegmentIsAQuarterOfTheTrackSweepingFromTheInlineStart() {
        assertEquals(0.25f, KozmosProgressSegment)
        assertEquals(2000, KozmosProgressSweepMillis)
        // Left to right: wholly before the start, through the middle, wholly past the end.
        close(-0.25f, kozmosProgressSegment(0f, animationsOn = true, rtl = false).start)
        close(0.375f, kozmosProgressSegment(0.5f, animationsOn = true, rtl = false).start)
        close(1f, kozmosProgressSegment(1f, animationsOn = true, rtl = false).start)
        // Right to left it enters from the right and leaves past the left.
        close(1f, kozmosProgressSegment(0f, animationsOn = true, rtl = true).start)
        close(-0.25f, kozmosProgressSegment(1f, animationsOn = true, rtl = true).start)
        val s = kozmosProgressSegment(0.3f, animationsOn = true, rtl = false)
        close(0.25f, s.endInclusive - s.start)
    }

    @Test fun withAnimationsOffTheSegmentStandsStillInTheMiddle() {
        for (phase in listOf(0f, 0.4f, 1f)) for (rtl in listOf(false, true)) {
            val s = kozmosProgressSegment(phase, animationsOn = false, rtl = rtl)
            close(0.375f, s.start)
            close(0.625f, s.endInclusive)
        }
    }

    @Test fun theTopBarIsHalfTheInlineBarsHeight() {
        assertEquals(KozmosDimensions.primitivesLayoutSpacing100, kozmosProgressBarHeight(KozmosProgressPlacement.Inline))
        assertEquals(KozmosDimensions.primitivesLayoutSpacing50, kozmosProgressBarHeight(KozmosProgressPlacement.Top))
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column {
                    KozmosProgress(label = "Inline")
                    KozmosProgress(placement = KozmosProgressPlacement.Top, label = "Top")
                    KozmosProgress(progress = 0.4f, placement = KozmosProgressPlacement.Top)
                }
            }
        }
        val bars = tree.merged.filter { it.progressRange != null }
        assertEquals(3, bars.size)
        val (inline, top, determinate) = bars
        assertEquals(inline.bounds.height / 2f, top.bounds.height, 0.5f)
        assertEquals(top.bounds.height, determinate.bounds.height, 0.5f)
        assertEquals(0.4f, determinate.progressRange!!.current, 1e-4f)
    }

    @Test fun itIsOneIndeterminateBarNamedLoadingAndSaidOnce() {
        paparazzi.live(content = { KozmosMaterialTheme { KozmosProgress() } }) {
            // What TalkBack is told, frame by frame: the region is there,
            // empty, for a frame before its words arrive (GAP-226).
            val seen = mutableListOf<Pair<LiveRegionMode?, String?>>()
            repeat(8) {
                frames(1)
                read().merged.singleOrNull { it.progressRange != null }?.let { seen += it.liveRegion to it.description }
            }
            val firstLive = seen.indexOfFirst { it.first == LiveRegionMode.Polite }
            assertTrue("never a live region: $seen", firstLive >= 0)
            assertEquals("the region arrived with its words: $seen", "", seen[firstLive].second)
            val bar = read().merged.single { it.progressRange != null }
            assertEquals(ProgressBarRangeInfo.Indeterminate, bar.progressRange)
            assertEquals("Loading", bar.description)
            assertEquals(LiveRegionMode.Polite, bar.liveRegion)
            // The sweep changes nothing TalkBack reads: the words stay put.
            frames(30)
            assertEquals("Loading", read().merged.single { it.progressRange != null }.description)
        }
    }

    @Test fun itTakesTheProductsWords() {
        paparazzi.live(content = { KozmosMaterialTheme { KozmosProgress(label = "Loading the map") } }) {
            frames(6)
            assertEquals("Loading the map", read().merged.single { it.progressRange != null }.description)
        }
    }

    /** Whether the bar still waits on a frame after 5, at animator [scale]. */
    private fun waitsOnFrames(scale: Float): Boolean {
        var waiting = false
        paparazzi.live(content = {
            KozmosMaterialTheme {
                CompositionLocalProvider(LocalKozmosAnimatorScale provides scale) { KozmosProgress() }
            }
        }) {
            frames(5)
            waiting = hasPendingWork
        }
        return waiting
    }

    @Test fun theSweepRunsWithAnimationsOnAndHoldsStillWithThemOff() {
        assertTrue("with animations on the sweep asks for no frames", waitsOnFrames(1f))
        assertTrue("with animations off the sweep still asks for frames", !waitsOnFrames(0f))
    }

    // Review of #522: once per wait. Five uploads starting together are one
    // announcement: only the first bar is a live region; the others are
    // named by their words and silent.
    @Test fun onlyTheFirstOfSeveralWaitingBarsSpeaks() {
        paparazzi.live(content = {
            KozmosMaterialTheme {
                Column { for (n in 1..5) KozmosProgress(label = "Upload $n") }
            }
        }) {
            frames(6)
            val bars = read().merged.filter { it.progressRange != null }
            assertEquals(5, bars.size)
            assertEquals(listOf("Upload 1", "Upload 2", "Upload 3", "Upload 4", "Upload 5"), bars.map { it.description })
            assertEquals(
                listOf(LiveRegionMode.Polite, null, null, null, null),
                bars.map { it.liveRegion }
            )
        }
        // All five gone, then one new wait, later: it speaks.
        now += 2_000
        paparazzi.live(content = { KozmosMaterialTheme { KozmosProgress(label = "Upload 6") } }) {
            frames(6)
            val bar = read().merged.single { it.progressRange != null }
            assertEquals("Upload 6", bar.description)
            assertEquals(LiveRegionMode.Polite, bar.liveRegion)
        }
    }

    // Review of #522: a label that changes while the bar waits is not said
    // again: the live region keeps the words read when the wait started.
    @Test fun aLabelThatChangesWhileItWaitsIsNotSaidAgain() {
        var label by mutableStateOf("Loading the map")
        paparazzi.live(content = { KozmosMaterialTheme { KozmosProgress(label = label) } }) {
            frames(6)
            assertEquals("Loading the map", read().merged.single { it.progressRange != null }.description)
            label = "Loading the map, 50 tiles"
            frames(6)
            val bar = read().merged.single { it.progressRange != null }
            assertEquals(LiveRegionMode.Polite, bar.liveRegion)
            assertEquals("Loading the map", bar.description)
        }
    }

    // Second review of #522: only bars that START TOGETHER share one
    // announcement. A later, unrelated wait speaks while an earlier, long
    // one still runs.
    @Test fun aLaterWaitSpeaksWhileAnEarlierOneStillRuns() {
        var uploading by mutableStateOf(false)
        paparazzi.live(content = {
            KozmosMaterialTheme {
                Column {
                    KozmosProgress(label = "Sync")
                    if (uploading) KozmosProgress(label = "Uploading plan")
                }
            }
        }) {
            frames(6)
            now += 2_000
            uploading = true
            frames(6)
            val bars = read().merged.filter { it.progressRange != null }
            assertEquals(listOf("Sync", "Uploading plan"), bars.map { it.description })
            assertEquals(listOf(LiveRegionMode.Polite, LiveRegionMode.Polite), bars.map { it.liveRegion })
        }
    }

    // A and B start together (B silent); A ends while B waits; C starts
    // later and speaks.
    @Test fun whenOneEndsAndAnotherWaitsANewWaitStillSpeaks() {
        var a by mutableStateOf(true)
        var c by mutableStateOf(false)
        paparazzi.live(content = {
            KozmosMaterialTheme {
                Column {
                    if (a) KozmosProgress(label = "A")
                    KozmosProgress(label = "B")
                    if (c) KozmosProgress(label = "C")
                }
            }
        }) {
            frames(6)
            assertEquals(
                listOf(LiveRegionMode.Polite, null),
                read().merged.filter { it.progressRange != null }.map { it.liveRegion }
            )
            a = false
            frames(2)
            now += 2_000
            c = true
            frames(6)
            val bars = read().merged.filter { it.progressRange != null }
            assertEquals(listOf("B", "C"), bars.map { it.description })
            assertEquals(listOf(null, LiveRegionMode.Polite), bars.map { it.liveRegion })
        }
    }

    // A lazy list composes and measures a row it prefetches off screen, and
    // does not place it. Such a bar must not take the turn of the one the
    // visitor sees: a wait starts when its bar is placed. Modelled here by a
    // layout that composes and measures both and places only the second, as
    // a prefetch does (Compose 1.6 has no public way to drive a LazyColumn's
    // prefetch in a test).
    @Test fun aBarComposedButNotPlacedDoesNotTakeTheTurn() {
        paparazzi.live(content = {
            KozmosMaterialTheme {
                Layout(content = {
                    Box(Modifier.width(200.dp)) { KozmosProgress(label = "Prefetched") }
                    Box(Modifier.width(200.dp)) { KozmosProgress(label = "On screen") }
                }) { measurables, constraints ->
                    val placeables = measurables.map { it.measure(constraints) }
                    layout(constraints.maxWidth, placeables[1].height) { placeables[1].place(0, 0) }
                }
            }
        }) {
            frames(6)
            val bar = read().merged.single { it.progressRange != null && it.description == "On screen" }
            assertEquals(LiveRegionMode.Polite, bar.liveRegion)
        }
    }

    // Second review of #522: the determinate Top bar is named, "Progress"
    // unless the product says otherwise, as SwiftUI's is.
    @Test fun theDeterminateTopBarIsNamed() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column {
                    KozmosProgress(progress = 0.4f, placement = KozmosProgressPlacement.Top)
                    KozmosProgress(progress = 0.7f, placement = KozmosProgressPlacement.Top, accessibilityName = "Uploading plan")
                }
            }
        }
        val bars = tree.merged.filter { it.progressRange != null }
        assertEquals(listOf("Progress", "Uploading plan"), bars.map { it.description })
        assertEquals(listOf(0.4f, 0.7f), bars.map { it.progressRange!!.current })
    }
}
