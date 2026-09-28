package com.kozmos.contracts

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Decision 50 (Olcay, 2026-09-28): the product passes the walking time it
 * already has, and Kozmos owns the rule that turns it into a band. The rule is
 * written three times, once per platform, so the cases are written once:
 * packages/product-contracts/tests/travel-time-bands.txt, which the web and
 * SwiftUI suites read too.
 */
class KozmosTravelTimeBandTest {
    private data class Case(val line: Int, val text: String, val seconds: Double, val band: KozmosTravelTimeBand?)

    /** The shared table, found by walking up from the directory Gradle runs the tests in. */
    private fun table(): File {
        var directory: File? = File(System.getProperty("user.dir")).absoluteFile
        while (directory != null) {
            val candidate = File(directory, "packages/product-contracts/tests/travel-time-bands.txt")
            if (candidate.isFile) return candidate
            directory = directory.parentFile
        }
        error("no packages/product-contracts/tests/travel-time-bands.txt above ${System.getProperty("user.dir")}")
    }

    private fun cases(): List<Case> = table().readLines().mapIndexedNotNull { index, raw ->
        val line = raw.substringBefore('#').trim()
        if (line.isEmpty()) return@mapIndexedNotNull null
        val fields = line.split(Regex("\\s+"))
        val seconds = fields[0].toDoubleOrNull()
        check(fields.size == 2 && seconds != null) { "travel-time-bands.txt:${index + 1} reads \"$raw\"" }
        val band = if (fields[1] == "none") {
            null
        } else {
            checkNotNull(KozmosTravelTimeBand.values().firstOrNull { it.value == fields[1] }) {
                "travel-time-bands.txt:${index + 1} names no band: \"$raw\""
            }
        }
        Case(index + 1, fields[0], seconds!!, band)
    }

    @Test
    fun theTableNamesEveryBandAndAWalkWithNone() {
        val named = cases().map { it.band?.value ?: "none" }.toSet()
        assertEquals(
            emptyList<String>(),
            (KozmosTravelTimeBand.values().map { it.value } + "none").filterNot { it in named }
        )
    }

    @Test
    fun everyWalkInTheTableFallsInTheTablesBand() {
        val wrong = cases().mapNotNull { entry ->
            val got = KozmosTravelTimeBand.forDuration(entry.seconds)
            if (got == entry.band) {
                null
            } else {
                "line ${entry.line}: ${entry.text} s read ${got?.value ?: "none"}, not ${entry.band?.value ?: "none"}"
            }
        }
        assertEquals(emptyList<String>(), wrong)
    }

    @Test
    fun eachBandKeepsItsUpperEdgeAndGivesTheNextSecondToTheNextBand() {
        // The question for Olcay, as behaviour: a place 2 minutes away reads
        // "1–2 min"; 2 min 1 s reads "2–5 min".
        assertEquals(KozmosTravelTimeBand.Nearby, KozmosTravelTimeBand.forDuration(59.0))
        assertEquals(KozmosTravelTimeBand.OneToTwoMinutes, KozmosTravelTimeBand.forDuration(60.0))
        assertEquals(KozmosTravelTimeBand.OneToTwoMinutes, KozmosTravelTimeBand.forDuration(120.0))
        assertEquals(KozmosTravelTimeBand.TwoToFiveMinutes, KozmosTravelTimeBand.forDuration(121.0))
        assertEquals(KozmosTravelTimeBand.TwoToFiveMinutes, KozmosTravelTimeBand.forDuration(300.0))
        assertEquals(KozmosTravelTimeBand.FiveToTenMinutes, KozmosTravelTimeBand.forDuration(301.0))
        assertEquals(KozmosTravelTimeBand.FiveToTenMinutes, KozmosTravelTimeBand.forDuration(600.0))
        assertEquals(KozmosTravelTimeBand.MoreThanTenMinutes, KozmosTravelTimeBand.forDuration(601.0))
    }

    @Test
    fun everyWalkUpToTwentyMinutesFallsInExactlyOneBandNearestFirst() {
        // A quarter of a second at a time: no walk falls in none, and the
        // bands never come back, so each is one unbroken stretch in order.
        val order = KozmosTravelTimeBand.values().toList()
        val gaps = mutableListOf<Double>()
        val backwards = mutableListOf<String>()
        var previous = 0
        for (quarter in 0..(20 * 60 * 4)) {
            val seconds = quarter / 4.0
            val band = KozmosTravelTimeBand.forDuration(seconds)
            if (band == null) {
                gaps += seconds
                continue
            }
            val at = order.indexOf(band)
            if (at < previous) backwards += "$seconds s reads $band after ${order[previous]}"
            previous = maxOf(previous, at)
        }
        assertEquals(emptyList<Double>(), gaps.take(5))
        assertEquals(emptyList<String>(), backwards.take(5))
        assertEquals(order.size - 1, previous)
    }

    @Test
    fun nearbyIsDrawnInTheSuccessToneAndEveryOtherBandNeutral() {
        assertEquals(
            mapOf(
                "nearby" to KozmosTravelTimeTone.Success,
                "oneToTwoMinutes" to KozmosTravelTimeTone.Neutral,
                "twoToFiveMinutes" to KozmosTravelTimeTone.Neutral,
                "fiveToTenMinutes" to KozmosTravelTimeTone.Neutral,
                "moreThanTenMinutes" to KozmosTravelTimeTone.Neutral
            ),
            KozmosTravelTimeBand.values().associate { it.value to it.tone }
        )
    }

    @Test
    fun theBandsAndTonesCarryTheWebsWireValues() {
        // Compared against the web by `pnpm contracts:parity:check`; asserted
        // here, in order, so a value cannot be renamed on this platform alone.
        assertEquals(
            listOf("nearby", "oneToTwoMinutes", "twoToFiveMinutes", "fiveToTenMinutes", "moreThanTenMinutes"),
            KozmosTravelTimeBand.values().map { it.value }
        )
        assertEquals(listOf("success", "neutral"), KozmosTravelTimeTone.values().map { it.value })
    }

    @Test
    fun anEstimateCarriesItsBandAndSelectingKeepsIt() {
        assertNull(KozmosTravelEstimatePresentation(durationSeconds = 45.0, durationLabel = "1 min").band)
        val result = KozmosPOIResultPresentation(
            poiId = "p",
            resultIndex = 0,
            travelEstimate = KozmosTravelEstimatePresentation(
                durationSeconds = 45.0,
                durationLabel = "1 min",
                band = KozmosTravelTimeBand.forDuration(45.0)
            )
        )
        assertEquals(KozmosTravelTimeBand.Nearby, result.selecting("p").travelEstimate?.band)
        assertEquals("1 min", result.selecting("p").travelEstimate?.durationLabel)
    }
}
