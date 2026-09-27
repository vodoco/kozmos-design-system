package com.kozmos.components.floorselector

import androidx.compose.material3.MaterialTheme
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The compact stepper's two buttons, as TalkBack hears them.
 *
 * Hard-coded English until row 67. Only the stepper draws them; the lists name
 * each level by its own label, which is product data and was never the
 * problem.
 */
class KozmosFloorSelectorSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun theStepperTakesTheProductsNames() {
        val selected = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosFloorSelector(
                    floors = listOf("2", "1", "G"),
                    selectedFloor = "1",
                    onFloorSelect = { selected += it },
                    variant = KozmosFloorSelectorVariant.CompactStepper,
                    previousFloorLabel = "Vorherige Etage",
                    nextFloorLabel = "Nächste Etage"
                )
            }
        }

        // The previous level in list order is on the up chevron, the next on
        // the down — the names follow the buttons, not the other way round.
        tree.named("Vorherige Etage").click!!.invoke()
        tree.named("Nächste Etage").click!!.invoke()
        assertEquals(listOf("2", "G"), selected)
        assertTrue(tree.names().none { it == "Floor up" || it == "Floor down" })
    }

    @Test
    fun theStepperNamesDefaultToTheEnglishTheyWere() {
        // React's read "Previous floor" and "Next floor"; a product that passes
        // none here hears nothing new.
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosFloorSelector(
                    floors = listOf("2", "1", "G"),
                    selectedFloor = "1",
                    onFloorSelect = {},
                    variant = KozmosFloorSelectorVariant.CompactStepper
                )
            }
        }

        tree.named("Floor up")
        tree.named("Floor down")
    }
}
