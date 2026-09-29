package com.kozmos.components.mapstatuspill

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.semantics.LiveRegionMode
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * What TalkBack is told about the map's status pill (decision 39). These
 * mirror MapStatusPill.test.tsx and the SwiftUI tests: the pill is a live
 * region whose words are its own, polite unless the product asks otherwise,
 * and its mark — the turning arc included — says nothing of its own.
 */
class KozmosMapStatusPillSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private fun read(content: @Composable () -> Unit): ReadSemantics =
        paparazzi.readSemantics { MaterialTheme { content() } }

    /** The one merged node that carries a live region. */
    private fun ReadSemantics.region(): ReadNode {
        val regions = merged.filter { it.liveRegion != null }
        check(regions.size == 1) { "expected one live region, found ${regions.size}: ${merged.map { it.texts }}" }
        return regions.single()
    }

    @Test
    fun itIsAPoliteLiveRegionWhoseWordsAreTheProducts() {
        val tree = read { KozmosMapStatusPill(text = "Walking improves accuracy") }
        val region = tree.region()
        assertEquals(LiveRegionMode.Polite, region.liveRegion)
        assertEquals(listOf("Walking improves accuracy"), region.texts)
    }

    @Test
    fun theTurningArcSaysNothingOverTheWords() {
        // KozmosSpinner describes itself "Loading": beside words that say what
        // is happening, that is a second thing heard for one wait.
        val tree = read { KozmosMapStatusPill(text = "Calculating step-free route", tone = KozmosMapStatusPillTone.Progress) }
        val region = tree.region()
        assertEquals(listOf("Calculating step-free route"), region.texts)
        assertNull("the pill's region is described as ${region.description}", region.description)
        // The merged tree is what TalkBack walks; the arc's own node stays in
        // the unmerged one, cleared from what is read.
        assertTrue(
            "the arc is still described: ${tree.merged.mapNotNull { it.description }}",
            tree.merged.none { it.description == "Loading" || "Loading" in it.texts }
        )
    }

    @Test
    fun itIsAsLoudAsTheProductAsks() {
        val assertive = read {
            KozmosMapStatusPill(text = "Turn Back", tone = KozmosMapStatusPillTone.Warning, live = KozmosMapStatusPillLive.Assertive)
        }
        assertEquals(LiveRegionMode.Assertive, assertive.region().liveRegion)

        val off = read { KozmosMapStatusPill(text = "Up-to-date", live = KozmosMapStatusPillLive.Off) }
        assertTrue("an off pill is a live region", off.merged.none { it.liveRegion != null })
        assertTrue("an off pill's words are not there to read", off.merged.any { it.texts == listOf("Up-to-date") })
    }

    @Test
    fun itKeepsItsRegionWhileItHasNothingToSay() {
        // So a product that keeps it composed where it shows has its first
        // words announced as a change, as React's region is kept.
        val tree = read { KozmosMapStatusPill(text = "", tone = KozmosMapStatusPillTone.Progress) }
        val region = tree.unmerged.singleOrNull { it.liveRegion != null }
        assertNotNull("an empty pill keeps no live region: ${tree.unmerged.map { it.liveRegion }}", region)
        region!!
        assertEquals(LiveRegionMode.Polite, region.liveRegion)
        assertTrue("an empty pill has words: ${region.texts}", tree.unmerged.all { it.texts.isEmpty() })
        assertEquals("an empty pill takes room", 0f, region.bounds.height, 0.5f)
    }
}
