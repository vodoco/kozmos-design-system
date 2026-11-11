package com.kozmos.components.progress

import android.view.View
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
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
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-159: the bar with no value moves, stands still with animations off,
 * is said once, and can be the screen's top loading bar, as React's
 * `<Progress />` and `placement="top"` are.
 */
class KozmosProgressIndeterminateTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun close(expected: Float, actual: Float) =
        assertEquals(expected.toDouble(), actual.toDouble(), 1e-5)

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
        var firstName: String? = "unread"
        var firstLive: LiveRegionMode? = null
        paparazzi.live(content = {
            KozmosMaterialTheme {
                val view: View = LocalView.current
                KozmosProgress()
                // Read as the composition is first applied, before any effect
                // has run: the region is there, without its words.
                SideEffect {
                    if (firstName == "unread") {
                        val node = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode
                        val bar = generateSequence(listOf(node)) { level -> level.flatMap { it.children }.ifEmpty { null } }
                            .flatten()
                            .first { it.config.getOrNull(SemanticsProperties.ProgressBarRangeInfo) != null }
                        firstName = bar.config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString()
                        firstLive = bar.config.getOrNull(SemanticsProperties.LiveRegion)
                    }
                }
            }
        }) {
            assertEquals("the bar was composed with its words", "", firstName)
            assertEquals(LiveRegionMode.Polite, firstLive)
            val bars = read().merged.filter { it.progressRange != null }
            assertEquals(1, bars.size)
            val bar = bars.single()
            assertEquals(ProgressBarRangeInfo.Indeterminate, bar.progressRange)
            assertEquals("Loading", bar.description)
            assertEquals(LiveRegionMode.Polite, bar.liveRegion)
            // The sweep changes nothing TalkBack reads: the words stay put.
            frames(30)
            val later = read().merged.single { it.progressRange != null }
            assertEquals("Loading", later.description)
        }
    }

    @Test fun itTakesTheProductsWords() {
        paparazzi.live(content = { KozmosMaterialTheme { KozmosProgress(label = "Loading the map") } }) {
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
}
