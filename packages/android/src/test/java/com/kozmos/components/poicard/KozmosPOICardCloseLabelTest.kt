package com.kozmos.components.poicard

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * GAP-182: the card's close button was named "Close" in fixed English. It is
 * named by `closeLabel`, and keeps "Close" when that is left out.
 */
class KozmosPOICardCloseLabelTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theCloseButtonSaysAProductsOwnWord() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosPOICard(title = "Atrium Café", onClose = {}, closeLabel = "Schließen")
            }
        }
        assertEquals(listOf("Schließen"), tree.merged.filter { it.click != null }.map { it.words })
    }

    @Test fun theCloseButtonKeepsTheEnglishWhenLeftOut() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosPOICard(title = "Atrium Café", onClose = {})
            }
        }
        assertEquals(listOf("Close"), tree.merged.filter { it.click != null }.map { it.words })
    }
}
