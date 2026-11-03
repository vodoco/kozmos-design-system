package com.kozmos.components.card

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.TitledCard
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-205: a card's title is a heading. React's `CardTitle` is an `h3` (or
 * the level `as` gives it), so a screen reader moves from card to card by its
 * title. Compose's `KozmosCardTitle` was plain text, and TalkBack's headings
 * navigation passed every card by. It now says it is a heading, with no level
 * and no new API. Mirrors KozmosCardTitleHeadingTests on SwiftUI.
 */
class KozmosCardTitleHeadingTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun theTitleIsAHeadingAndNothingElseIs() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column(Modifier.width(360.dp)) {
                    KozmosCard {
                        KozmosCardHeader {
                            KozmosCardTitle(title = "Client details")
                            KozmosCardDescription(description = "The client this site belongs to.")
                        }
                        KozmosCardContent { Text("Pointr") }
                    }
                    KozmosCard(padding = KozmosCardPadding.Compact) {
                        KozmosCardHeader { KozmosCardTitle(title = "Search") }
                        KozmosCardFooter { Text("How visitors search") }
                    }
                }
            }
        }

        assertTrue("Client details is not a heading", tree.saying("Client details").heading)
        assertTrue("Search is not a heading", tree.saying("Search").heading)
        for (words in listOf("The client this site belongs to.", "Pointr", "How visitors search")) {
            assertFalse("$words is a heading", tree.saying(words).heading)
        }
        assertEquals(
            "the headings, in TalkBack's order",
            listOf("Client details", "Search"),
            tree.merged.filter { it.heading }.mapNotNull { it.words }
        )
    }

    /** Card.mdx's Compose snippet (docsnippets/TitledCard.kt), as a reader copies it. */
    @Test
    fun theDocSnippetsTitleIsAHeading() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { TitledCard() } }
        assertTrue(tree.saying("Card Title").heading)
    }
}
