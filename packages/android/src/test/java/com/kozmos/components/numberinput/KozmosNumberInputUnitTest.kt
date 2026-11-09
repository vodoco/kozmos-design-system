package com.kozmos.components.numberinput

import com.kozmos.components.ReadNode
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * NumberInput's unit (GAP-098): drawn in the field after the value, and heard
 * once, after the value, which is heard once too: TalkBack reads the merged
 * field, its text then its state, "15, metres". The unit is never the value.
 */
class KozmosNumberInputUnitTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** Everything TalkBack can read off a merged node, in its order. */
    private fun ReadNode.spoken() = listOfNotNull(description) + texts + listOfNotNull(editableText, stateDescription)

    @Test fun theMergedFieldSaysTheValueOnceThenTheUnitOnce() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosNumberInput(value = 15.0, onValueChange = {}, label = "Width", unit = "m", unitLabel = "metres")
            }
        }
        val field = tree.merged.single { it.setText != null }
        assertEquals("15", field.editableText)
        assertEquals("metres", field.stateDescription)
        val heard = tree.merged.flatMap { it.spoken() }
        assertEquals("the value was heard ${heard.count { "15" in it }} times in $heard", 1, heard.count { "15" in it })
        assertEquals("the unit was heard ${heard.count { "metres" in it }} times in $heard", 1, heard.count { "metres" in it })
        // The drawn "m" is for the eye: heard once already, as "metres".
        assertEquals(emptyList<String>(), heard.filter { it == "m" })
    }

    @Test fun theUnitIsSpokenAsWrittenWithoutAUnitLabel() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosNumberInput(value = 20.0, onValueChange = {}, unit = "km") }
        }
        val field = tree.merged.single { it.setText != null }
        assertEquals("20", field.editableText)
        assertEquals("km", field.stateDescription)
    }
}
