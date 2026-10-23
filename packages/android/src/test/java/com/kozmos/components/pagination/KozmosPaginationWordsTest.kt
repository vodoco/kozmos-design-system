package com.kozmos.components.pagination

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React's Previous and Next draw a chevron hidden from assistive tech beside
 * their word. Compose's described each arrow by the word it stands beside, so
 * each control reached TalkBack with its word twice: once as the arrow's
 * description and once as its text, read one after the other.
 */
class KozmosPaginationWordsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun previousAndNextSayTheirWordOnce() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosPagination {
                    KozmosPaginationPrevious(onClick = {})
                    KozmosPaginationLink(text = "2", isActive = true, onClick = {})
                    KozmosPaginationNext(onClick = {})
                }
            }
        }
        // Every word each control gives TalkBack, its descriptions then its texts.
        assertEquals(
            listOf(listOf("Previous"), listOf("2"), listOf("Next")),
            tree.merged.filter { it.click != null }.map { listOfNotNull(it.description) + it.texts }
        )
    }
}
