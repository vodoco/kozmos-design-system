package com.kozmos.components.splitbutton

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * GAP-168, GAP-182: the menu half shows only an arrow, and TalkBack named it
 * "More actions" in fixed English, where React's is "More options". It is
 * named by `menuLabel`, as React's and SwiftUI's are, "More options" when
 * that is left out.
 */
class KozmosSplitButtonMenuLabelTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theMenuHalfSaysAProductsOwnWords() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosSplitButton(
                    label = "Veröffentlichen",
                    onMainClick = {},
                    menuItems = listOf(SplitContextMenuItem("Entwurf speichern") {}),
                    menuLabel = "Weitere Optionen"
                )
            }
        }
        assertEquals(listOf("Veröffentlichen", "Weitere Optionen"), tree.merged.filter { it.click != null }.map { it.words })
    }

    @Test fun theMenuHalfIsMoreOptionsWhenLeftOut() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosSplitButton(
                    label = "Publish",
                    onMainClick = {},
                    menuItems = listOf(SplitContextMenuItem("Save draft") {})
                )
            }
        }
        assertEquals(listOf("Publish", "More options"), tree.merged.filter { it.click != null }.map { it.words })
    }
}
