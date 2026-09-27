package com.kozmos.contracts

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The result's actions and badge, asserted on the contract rather than only
 * through a composable: these are the pieces that drift silently between React,
 * SwiftUI and Compose, and the web is where they were defined first.
 */
class POIResultActionsTest {
    private fun result(
        selected: Boolean = false,
        featured: Boolean = false,
        badge: KozmosPOIResultBadgePresentation? = null,
        actions: List<KozmosPOIResultActionPresentation> = emptyList()
    ) = KozmosPOIResultPresentation(
        poiId = "p",
        resultIndex = 0,
        floorId = "b:2",
        selected = selected,
        featured = featured,
        badge = badge,
        actions = actions
    )

    @Test
    fun `a result carries no badge or actions unless given them`() {
        // Every existing caller omits both, so both must stay optional or the
        // package breaks for anyone who has not changed a line.
        val plain = result()
        assertNull(plain.badge)
        assertTrue(plain.actions.isEmpty())
    }

    @Test
    fun `a result action carries everything the web contract does`() {
        val go = KozmosPOIResultActionPresentation(
            action = KozmosPOIResultAction.Navigate,
            label = "Go",
            primary = true
        )
        assertEquals("navigate", go.action.value)
        assertEquals("Go", go.label)
        assertTrue(go.primary)
        assertFalse(go.disabled)
    }

    @Test
    fun `details is a result action and not a POI action`() {
        // A detail panel cannot offer to open itself, which is why the two
        // enumerations are kept apart rather than one widened.
        assertEquals("details", KozmosPOIResultAction.Details.value)
        assertFalse(KozmosPOIAction.entries.any { it.value == "details" })
    }

    @Test
    fun `every POI action has a matching result action`() {
        // The result's list is the POI's plus details. If one gains a case and
        // the other does not, a product can offer something the card cannot draw.
        for (action in KozmosPOIAction.entries) {
            assertTrue(
                "KozmosPOIResultAction is missing ${action.value}",
                KozmosPOIResultAction.entries.any { it.value == action.value }
            )
        }
        assertEquals(
            KozmosPOIAction.entries.size + 1,
            KozmosPOIResultAction.entries.size
        )
    }

    @Test
    fun `selecting carries the new fields`() {
        // Kotlin's copy() carries them for free where Swift's hand-built
        // initialiser did not -- asserted on both so the two cannot diverge.
        val withExtras = result(
            badge = KozmosPOIResultBadgePresentation(label = "Close by"),
            actions = listOf(
                KozmosPOIResultActionPresentation(
                    action = KozmosPOIResultAction.Navigate,
                    label = "Go"
                )
            )
        )
        val selected = withExtras.selecting("p")
        assertTrue(selected.selected)
        assertEquals("Close by", selected.badge?.label)
        assertEquals(1, selected.actions.size)
    }
}
