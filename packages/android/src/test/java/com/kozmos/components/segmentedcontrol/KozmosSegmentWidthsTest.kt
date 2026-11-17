package com.kozmos.components.segmentedcontrol

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * GAP-267, decision 201: the widths Compose gives SegmentedControl's options
 * follow the rule React's flexbox lays them out by, in whole pixels.
 */
class KozmosSegmentWidthsTest {
    @Test fun withRoomEachIsItsMinimumOrItsWords() {
        assertEquals(listOf(97, 97, 130), kozmosSegmentWidths(listOf(50, 60, 130), 97, 400, share = false))
        assertEquals(listOf(97, 97, 130), kozmosSegmentWidths(listOf(50, 60, 130), 97, null, share = false))
    }

    @Test fun shortOfRoomTheyGiveUpWidthEquallyFromEqualWidthsNeverPastTheirWords() {
        // 27 short: the two at 97 give up 13.5 each; the third is at its words.
        assertEquals(listOf(83, 84, 130), kozmosSegmentWidths(listOf(50, 60, 130), 97, 297, share = false))
        // 64 short: the second stops at its words, 70, and the first gives up the rest.
        assertEquals(listOf(60, 70, 130), kozmosSegmentWidths(listOf(50, 70, 130), 97, 260, share = false))
    }

    @Test fun pastTheirWordsEachKeepsItsWords() {
        assertEquals(listOf(50, 70, 130), kozmosSegmentWidths(listOf(50, 70, 130), 97, 100, share = false))
    }

    @Test fun fullWidthSharesTheSpaceNoneUnderItsWords() {
        assertEquals(listOf(100, 100, 100), kozmosSegmentWidths(listOf(50, 60, 70), 0, 300, share = true))
        assertEquals(listOf(85, 85, 130), kozmosSegmentWidths(listOf(50, 60, 130), 0, 300, share = true))
        assertEquals(listOf(50, 60, 130), kozmosSegmentWidths(listOf(50, 60, 130), 0, 200, share = true))
    }
}
