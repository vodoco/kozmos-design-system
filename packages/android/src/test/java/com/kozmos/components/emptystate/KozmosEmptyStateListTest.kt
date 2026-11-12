package com.kozmos.components.emptystate

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-165: "No Map Content Found" lists what to try under its description,
 * read in order, as React's list is.
 */
class KozmosEmptyStateListTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val tries = listOf("Check the level", "Clear the filters", "Try another name")

    @Test fun theListIsReadInOrderUnderTheDescription() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosEmptyState(
                    title = "No Map Content Found",
                    description = "Nothing on this level matches.",
                    list = tries,
                    listLabel = "What to try"
                )
            }
        }
        val words = tree.merged.flatMap { it.texts }.filter { it != "•" }
        assertEquals(listOf("No Map Content Found", "Nothing on this level matches.") + tries, words)
        assertTrue("the bullets are not said", tree.merged.none { "•" in it.texts })
        val list = tree.merged.single { it.collectionRows != null }
        assertEquals(3, list.collectionRows)
        assertEquals("What to try", list.description)
    }

    @Test fun anEmptyListDrawsNothing() {
        for ((items, drawn) in listOf(tries to true, emptyList<String>() to false)) {
            val tree = paparazzi.readSemantics {
                KozmosMaterialTheme { KozmosEmptyState(title = "No Map Content Found", list = items) }
            }
            assertEquals("$items", drawn, tree.merged.any { it.collectionRows != null })
        }
    }
}
