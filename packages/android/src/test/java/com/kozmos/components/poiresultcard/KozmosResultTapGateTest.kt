package com.kozmos.components.poiresultcard

import com.kozmos.components.poiresultcard.KozmosResultTapGate.Tap
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Decision 72 (GAP-143), timed by a clock the test moves: the first tap on a
 * result selects at once, a second on the same result within the double-tap
 * time opens it once, and a third that quick does nothing. 300 ms is
 * Android's `ViewConfiguration` double-tap timeout, the web's too.
 */
class KozmosResultTapGateTest {
    private var clock = 1_000L
    private val gate = KozmosResultTapGate { clock }

    private fun tapAt(time: Long, key: String = "cafe"): Tap {
        clock = time
        return gate.tap(key, timeoutMillis = 300)
    }

    @Test
    fun theFirstTapSelectsAndASecondWithinTheTimeoutOpensOnce() {
        assertEquals(Tap.Select, tapAt(1_000))
        assertEquals(Tap.Open, tapAt(1_299))
    }

    @Test
    fun aThirdQuickTapDoesNothingAndNorDoThoseAfterIt() {
        assertEquals(Tap.Select, tapAt(1_000))
        assertEquals(Tap.Open, tapAt(1_150))
        assertEquals(Tap.Ignore, tapAt(1_300))
        assertEquals(Tap.Ignore, tapAt(1_450))
        // A pause ends the run: the next tap is a first tap again.
        assertEquals(Tap.Select, tapAt(1_750))
    }

    @Test
    fun afterTheTimeoutATapSelectsAgainAndCanBeTheFirstOfAPair() {
        assertEquals(Tap.Select, tapAt(1_000))
        assertEquals(Tap.Select, tapAt(1_300))
        assertEquals(Tap.Select, tapAt(2_000))
        assertEquals(Tap.Open, tapAt(2_100))
    }

    @Test
    fun tapsOnDifferentResultsNeverPair() {
        assertEquals(Tap.Select, tapAt(1_000, "cafe"))
        assertEquals(Tap.Select, tapAt(1_100, "gate"))
        assertEquals(Tap.Select, tapAt(1_200, "cafe"))
        assertEquals(Tap.Open, tapAt(1_250, "cafe"))
    }
}
