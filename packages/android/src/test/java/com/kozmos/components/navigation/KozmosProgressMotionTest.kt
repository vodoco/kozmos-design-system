package com.kozmos.components.navigation

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.platform.InfiniteAnimationPolicy
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import com.kozmos.components.live
import com.kozmos.components.motion.LocalKozmosAnimatorScale
import com.kozmos.components.progress.KozmosProgressMotion
import com.kozmos.components.progress.KozmosProgressRange
import com.kozmos.components.progress.KozmosProgressTrack
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.yield
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/** The directional cue's clock, as a host's Compose UI test and a frame see it. */
class KozmosProgressMotionTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** What a Compose UI test installs: it cancels an infinite animation, so the test can go idle. */
    private class TestPolicy : InfiniteAnimationPolicy {
        var asked = 0
        override suspend fun <R> onInfiniteOperation(block: suspend () -> R): R {
            asked++
            throw CancellationException("infinite animations are skipped under test")
        }
    }

    @Composable private fun Track(modifier: Modifier = Modifier) = KozmosProgressTrack(KozmosProgressRange(0f, 0.8f), 0.2f,
        modifier.width(300.dp), motion = KozmosProgressMotion.Directional)

    @Test fun directionalMotionLetsAComposeUiTestGoIdle() {
        val policy = TestPolicy()
        paparazzi.live(effectContext = policy, content = { KozmosMaterialTheme { Track() } }) {
            frames(5)
            // Let every coroutine resumed by the last frame run before looking.
            repeat(3) { yield() }
            assertTrue("the cue's clock is an infinite animation", policy.asked > 0)
            assertFalse("nothing still waits on a frame", hasPendingWork)
        }
    }

    /**
     * With the system's animations off the cue holds still: no clock waits on
     * a frame. Said through LocalKozmosAnimatorScale, because Paparazzi keeps
     * no Settings.Global write; at scale 1 the same reading sees the clock.
     */
    @Test fun withAnimationsOffTheCueRunsNoClock() {
        for (scale in listOf(1f, 0f)) {
            paparazzi.live(content = { KozmosMaterialTheme {
                CompositionLocalProvider(LocalKozmosAnimatorScale provides scale) { Track() }
            } }) {
                frames(5)
                repeat(3) { yield() }
                assertEquals("a clock waits on frames at animator scale $scale", scale > 0f, hasPendingWork)
            }
        }
    }

    /** The clock stops while the host is not resumed, too. */
    @Test fun aHostThatIsNotResumedRunsNoClock() {
        for (state in listOf(Lifecycle.State.RESUMED, Lifecycle.State.STARTED)) {
            val owner = object : LifecycleOwner {
                val registry = LifecycleRegistry.createUnsafe(this).apply { currentState = state }
                override val lifecycle: Lifecycle get() = registry
            }
            paparazzi.live(content = { KozmosMaterialTheme {
                CompositionLocalProvider(LocalLifecycleOwner provides owner) { Track() }
            } }) {
                frames(5)
                repeat(3) { yield() }
                assertEquals("a clock waits on frames while $state", state == Lifecycle.State.RESUMED, hasPendingWork)
            }
        }
    }

    @Test fun directionalMotionRedrawsWithoutRecomposing() {
        var draws = 0
        paparazzi.live(content = { KozmosMaterialTheme { Track(Modifier.drawWithContent { draws++; drawContent() }) } }) {
            frames(5)
            val composed = recompositions
            val drawn = draws
            frames(20)
            assertTrue("the cue still moves: ${draws - drawn} draws in 20 frames", draws - drawn >= 10)
            assertEquals("the clock recomposed the track", composed, recompositions)
        }
    }
}
