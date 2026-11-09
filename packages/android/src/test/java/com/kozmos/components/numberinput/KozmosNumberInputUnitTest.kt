package com.kozmos.components.numberinput

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * NumberInput's unit (GAP-098): drawn in the field after the value, read once
 * with it in its spoken form, and never part of the value.
 */
class KozmosNumberInputUnitTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theUnitIsReadOnceWithTheValueAndIsNotTheValue() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosNumberInput(value = 15.0, onValueChange = {}, label = "Width", unit = "m", unitLabel = "metres")
            }
        }
        val field = tree.merged.single { it.setText != null }
        assertEquals("15", field.editableText)
        assertEquals("15 metres", field.stateDescription)
        // Drawn for the eye, not heard a second time.
        assertEquals(emptyList<String>(), tree.unmerged.filter { "m" in it.texts }.map { it.texts.joinToString() })
    }

    @Test fun theUnitIsSpokenAsWrittenWithoutAUnitLabel() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosNumberInput(value = 20.0, onValueChange = {}, unit = "km") }
        }
        assertEquals("20 km", tree.merged.single { it.setText != null }.stateDescription)
    }
}
