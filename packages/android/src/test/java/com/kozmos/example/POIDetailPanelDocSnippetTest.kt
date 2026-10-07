package com.kozmos.example

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosTravelEstimatePresentation
import com.kozmos.docsnippets.PlaceDetails
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * POIDetailPanel.mdx's Compose example (docsnippets/PlaceDetails.kt), drawn
 * as well as compiled: Go says the walk, the summary and Read more are
 * there, and Book reaches the product's booking.
 */
class POIDetailPanelDocSnippetTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun theDocsExampleShowsTheWalkAndBooks() {
        val booked = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                Box(Modifier.width(360.dp)) {
                    PlaceDetails(
                        poi = KozmosPOIPresentation(
                            id = "il-forno",
                            name = "Il Forno",
                            floorLabel = "Level 1",
                            actions = listOf(KozmosPOIAction.Navigate)
                        ),
                        actionLabels = mapOf(KozmosPOIAction.Navigate to "Go"),
                        walk = KozmosTravelEstimatePresentation(durationSeconds = 120.0, durationLabel = "2 min", distanceLabel = "120 m"),
                        onAction = { _, _ -> },
                        onBook = { booked += it }
                    )
                }
            }
        }
        val go = tree.merged.single { "Go" in it.texts }
        assertEquals("2 min, 120 m", go.stateDescription)
        assertTrue(tree.names().contains("Rating, 4.7 / 5, 32 reviews"))
        assertTrue(tree.merged.any { "Read more" in it.texts })
        val book = tree.merged.single { "Book" in it.texts }
        assertTrue("Book is disabled with a callback", book.enabled)
        book.click!!.invoke()
        assertEquals(listOf("il-forno"), booked)
        assertFalse(tree.merged.any { "Call" in it.texts })
    }
}
