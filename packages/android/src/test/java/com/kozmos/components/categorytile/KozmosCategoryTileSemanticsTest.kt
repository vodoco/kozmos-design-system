package com.kozmos.components.categorytile

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosCategoryPresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

/**
 * The category tile as TalkBack hears it.
 *
 * Its count was the tile's state description. In Compose a state description
 * replaces the "Selected" / "Not selected" TalkBack would otherwise say, so a
 * chosen category with results was never announced as chosen. The count now
 * joins the tile's name, as React's hidden span and the floor selector's
 * levels do, and the selection is left for TalkBack to say.
 */
class KozmosCategoryTileSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private fun tile(selected: Boolean, resultCountLabel: String?) = paparazzi.readSemantics {
        KozmosMaterialTheme {
            KozmosCategoryTile(
                category = KozmosCategoryPresentation(
                    id = "cafes",
                    label = "Cafés",
                    selected = selected,
                    resultCount = resultCountLabel?.let { 12 },
                    resultCountLabel = resultCountLabel
                ),
                onSelect = {}
            )
        }
    }.merged.single { it.click != null }

    @Test
    fun aChosenCategoryWithResultsIsStillSaidToBeChosen() {
        val chosen = tile(selected = true, resultCountLabel = "12 results")

        assertEquals("Cafés, 12 results", chosen.description)
        assertEquals(true, chosen.selected)
        // Unset, so TalkBack says "Selected".
        assertNull(chosen.stateDescription)
    }

    @Test
    fun aCategoryNotChosenSaysItsCountAndNothingInsteadOfItsState() {
        val other = tile(selected = false, resultCountLabel = "12 results")

        assertEquals("Cafés, 12 results", other.description)
        assertEquals(false, other.selected)
        assertNull(other.stateDescription)
    }

    @Test
    fun aCategoryWithNoCountIsItsLabel() {
        val plain = tile(selected = true, resultCountLabel = null)

        assertEquals("Cafés", plain.description)
        assertEquals(true, plain.selected)
        assertNull(plain.stateDescription)
    }
}
