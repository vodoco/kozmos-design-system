package com.kozmos.components.wayfindingcard

import androidx.compose.material3.Text
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * GAP-182: the card's close button was named "Close" in fixed English. It is
 * named by `closeLabel`, as SwiftUI's and React's are, and keeps "Close"
 * when that is left out.
 */
class KozmosWayfindingCardCloseLabelTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theCloseButtonSaysAProductsOwnWord() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosWayfindingCard(title = "Route", onClose = {}, closeLabel = "Navigation schließen") {
                    Text("Select a destination to begin.")
                }
            }
        }
        assertEquals(listOf("Navigation schließen"), tree.merged.filter { it.click != null }.map { it.words })
    }

    @Test fun theCloseButtonKeepsTheEnglishWhenLeftOut() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosWayfindingCard(title = "Route", onClose = {}) {
                    Text("Select a destination to begin.")
                }
            }
        }
        assertEquals(listOf("Close"), tree.merged.filter { it.click != null }.map { it.words })
    }
}
