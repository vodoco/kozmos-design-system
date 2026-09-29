package com.kozmos.components.mapcontrolbutton

import androidx.compose.runtime.snapshots.Snapshot
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * When a map control that reveals on change shows its label, on a clock the
 * test moves by hand.
 *
 * A port of useRevealOnChange.test.ts, case for case, as the SwiftUI tests
 * are, so the platforms agree on how long "a while" is: open 2500ms by
 * default, an optional wait before it opens, nothing on the first render, and
 * a change mid-reveal restarting the window rather than stacking a second one
 * on it.
 */
class KozmosRevealOnChangeTest {
    private val clock = ManualClock()
    private val reveal = KozmosRevealOnChange(clock::schedule)

    /**
     * A case, run inside a Compose snapshot of its own, applied when it ends.
     * KozmosRevealOnChange keeps `revealed` in Compose state, and this class
     * has no composition and no frames. Written to the global snapshot, once
     * an earlier test in the JVM has composed, it woke Compose's snapshot
     * manager, which posted its work to a main looper no frame runs again,
     * and every composition after it in the JVM got no frames:
     * KozmosMapControlsGroupPressesTest read an empty group on CI (#169), and
     * the panel header's drag tests did not move the sheet. Written in a
     * snapshot of its own, the state reaches no global observer.
     */
    private fun case(body: () -> Unit) = Snapshot.withMutableSnapshot(body)

    @Test
    fun staysClosedOnTheFirstRender() = case {
        reveal.observe("off", enabled = true)
        assertFalse(reveal.revealed)

        clock.advanceBy(5000)
        assertFalse(reveal.revealed)
    }

    @Test
    fun opensWhenTheValueChangesAndClosesAfterTheDuration() = case {
        reveal.observe("off", enabled = true, durationMillis = 2500)
        reveal.observe("on", enabled = true, durationMillis = 2500)
        clock.advanceBy(0)
        assertTrue(reveal.revealed)

        clock.advanceBy(2499)
        assertTrue(reveal.revealed)

        clock.advanceBy(1)
        assertFalse(reveal.revealed)
    }

    @Test
    fun staysOpenTwoAndAHalfSecondsUnlessToldOtherwise() = case {
        // React's default, which the SDK's control reads by.
        reveal.observe("off", enabled = true)
        reveal.observe("on", enabled = true)

        clock.advanceBy(2499)
        assertTrue(reveal.revealed)
        clock.advanceBy(1)
        assertFalse(reveal.revealed)
    }

    @Test
    fun waitsOutTheDelayBeforeOpening() = case {
        reveal.observe("off", enabled = true, durationMillis = 3000, delayMillis = 1400)
        reveal.observe("on", enabled = true, durationMillis = 3000, delayMillis = 1400)

        clock.advanceBy(1399)
        assertFalse(reveal.revealed)

        clock.advanceBy(1)
        assertTrue(reveal.revealed)

        clock.advanceBy(3000)
        assertFalse(reveal.revealed)
    }

    @Test
    fun restartsRatherThanStackingWhenTheValueChangesAgainMidReveal() = case {
        reveal.observe("off", enabled = true, durationMillis = 2000)
        reveal.observe("on", enabled = true, durationMillis = 2000)
        clock.advanceBy(1500)
        assertTrue(reveal.revealed)

        reveal.observe("off", enabled = true, durationMillis = 2000)
        clock.advanceBy(1500)
        // The first reveal's close fell due at 2000ms and would have shut this
        // one early if the timers stacked; the second reveal owns the window.
        assertTrue(reveal.revealed)

        clock.advanceBy(500)
        assertFalse(reveal.revealed)
    }

    @Test
    fun staysClosedWhileDisabled() = case {
        reveal.observe("off", enabled = false)
        reveal.observe("on", enabled = false)

        clock.advanceBy(5000)
        assertFalse(reveal.revealed)
    }

    @Test
    fun closesWhenTurnedOffAndDoesNotReplayWhenTurnedBackOn() = case {
        // Turning it off mid-reveal closes the label rather than freezing it,
        // and turning it back on does not replay a change it was not watching.
        reveal.observe("off", enabled = true)
        reveal.observe("on", enabled = true)
        clock.advanceBy(500)
        assertTrue(reveal.revealed)

        reveal.observe("on", enabled = false)
        assertFalse(reveal.revealed)

        reveal.observe("on", enabled = true)
        clock.advanceBy(5000)
        assertFalse(reveal.revealed)
    }

    @Test
    fun closesEvenWhenItsTimingChangesWhileItIsOpen() = case {
        // A caller may compute the timing, so it can change while the label is
        // open. The window already open keeps the timing it opened with, and
        // the new timing applies from the next change.
        reveal.observe("off", enabled = true, durationMillis = 2000, delayMillis = 0)
        reveal.observe("on", enabled = true, durationMillis = 2000, delayMillis = 0)
        clock.advanceBy(500)
        assertTrue(reveal.revealed)

        reveal.observe("on", enabled = true, durationMillis = 5000, delayMillis = 300)
        clock.advanceBy(1500)
        assertFalse(reveal.revealed)

        reveal.observe("off", enabled = true, durationMillis = 5000, delayMillis = 300)
        clock.advanceBy(299)
        assertFalse(reveal.revealed)
        clock.advanceBy(1)
        assertTrue(reveal.revealed)
        clock.advanceBy(5000)
        assertFalse(reveal.revealed)
    }
}

/**
 * `setTimeout` and `clearTimeout` on a clock that moves only when told to —
 * what vitest's fake timers are to the React tests.
 */
private class ManualClock {
    private class Timer(val id: Int, val due: Long, val fire: () -> Unit)

    private val timers = mutableListOf<Timer>()
    private var lastId = 0
    private var now = 0L

    fun schedule(delayMillis: Long, fire: () -> Unit): () -> Unit {
        val timer = Timer(++lastId, now + delayMillis, fire)
        timers += timer
        return { timers.remove(timer) }
    }

    /** Moves the clock on, firing each timer that falls due on the way, in the order it falls due. */
    fun advanceBy(millis: Long) {
        val end = now + millis
        while (true) {
            val next = timers.filter { it.due <= end }
                .minWithOrNull(compareBy<Timer>({ it.due }, { it.id })) ?: break
            timers.remove(next)
            now = next.due
            next.fire()
        }
        now = end
    }
}
