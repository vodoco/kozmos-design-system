package com.kozmos.providers

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * The engine under Compose's KozmosAnalyticsProvider, on a clock the test
 * moves by hand, held to what React's AnalyticsProvider and SwiftUI's
 * `.kozmosAnalytics(batchDelayMs:onDispatch:)` do (KozmosAnalyticsBatchingTests):
 * a batch opens with an event and is delivered batchDelayMs after it, with
 * every event tracked meanwhile, in order, and a later event does not move
 * the delivery.
 */
class KozmosAnalyticsBatcherTest {
    /** A clock moved by hand: what is due runs as [advanceTo] passes its time. */
    internal class ManualClock : KozmosAnalyticsSchedule {
        var now = 0L
            private set
        private class Due(val at: Long, val fire: () -> Unit)
        private val due = mutableListOf<Due>()

        override fun after(delayMs: Long, fire: () -> Unit): () -> Unit {
            val entry = Due(now + delayMs, fire)
            due += entry
            return { due.remove(entry) }
        }

        fun advanceTo(time: Long) {
            while (true) {
                val next = due.filter { it.at <= time }.minByOrNull { it.at } ?: break
                due.remove(next)
                now = next.at
                next.fire()
            }
            now = time
        }
    }

    private fun event(name: String) = KozmosAnalyticsEvent(component = "Test", eventName = name)

    /** Each batch as "<time>ms: <names>". */
    private fun recorder(clock: ManualClock, into: MutableList<String>): (List<KozmosAnalyticsEvent>) -> Unit =
        { batch -> into += "${clock.now}ms: ${batch.joinToString { it.eventName }}" }

    @Test fun aBatchIsDeliveredBatchDelayAfterItsFirstEventAndALaterEventDoesNotMoveIt() {
        val clock = ManualClock()
        val batches = mutableListOf<String>()
        val engine = KozmosAnalyticsBatcher(2000, recorder(clock, batches), clock)
        engine.track(event("a"))
        clock.advanceTo(1500)
        engine.track(event("b"))
        clock.advanceTo(1999)
        assertEquals("a batch was delivered before 2 seconds", emptyList<String>(), batches)
        clock.advanceTo(2500)
        engine.track(event("c"))
        engine.track(event("d"))
        clock.advanceTo(3000)
        engine.track(event("e"))
        clock.advanceTo(10000)
        assertEquals(listOf("2000ms: a, b", "4500ms: c, d, e"), batches)
    }

    @Test fun flushDeliversAtOnceAndTheNextEventOpensANewBatch() {
        val clock = ManualClock()
        val batches = mutableListOf<String>()
        val engine = KozmosAnalyticsBatcher(2000, recorder(clock, batches), clock)
        engine.track(event("a"))
        engine.track(event("b"))
        clock.advanceTo(500)
        engine.flush()
        assertEquals(listOf("500ms: a, b"), batches)
        // The flushed batch's delivery is called off: nothing more at 2000.
        clock.advanceTo(2400)
        assertEquals(listOf("500ms: a, b"), batches)
        clock.advanceTo(2500)
        engine.track(event("c"))
        clock.advanceTo(10000)
        assertEquals(listOf("500ms: a, b", "4500ms: c"), batches)
    }

    @Test fun aFlushWithNothingQueuedDeliversNothing() {
        val clock = ManualClock()
        val batches = mutableListOf<String>()
        val engine = KozmosAnalyticsBatcher(2000, recorder(clock, batches), clock)
        engine.flush()
        clock.advanceTo(10000)
        assertEquals(emptyList<String>(), batches)
    }

    @Test fun aChangedDelayAppliesFromTheNextBatch() {
        val clock = ManualClock()
        val batches = mutableListOf<String>()
        val engine = KozmosAnalyticsBatcher(2000, recorder(clock, batches), clock)
        engine.track(event("a"))
        engine.batchDelayMs = 500
        clock.advanceTo(2000)
        engine.track(event("b"))
        clock.advanceTo(10000)
        assertEquals(listOf("2000ms: a", "2500ms: b"), batches)
    }

    @Test fun theNewestOnDispatchGetsTheBatch() {
        val clock = ManualClock()
        val first = mutableListOf<String>()
        val newest = mutableListOf<String>()
        val engine = KozmosAnalyticsBatcher(2000, recorder(clock, first), clock)
        engine.track(event("a"))
        engine.onDispatch = recorder(clock, newest)
        clock.advanceTo(2000)
        assertEquals(emptyList<String>() to listOf("2000ms: a"), first to newest)
    }
}
