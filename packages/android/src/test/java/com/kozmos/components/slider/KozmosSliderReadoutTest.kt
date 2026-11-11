package com.kozmos.components.slider

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Slider's readout (GAP-163): with showValue its value is drawn beside the
 * track at rest, as formatValue words it, and TalkBack hears it once, from the
 * slider, never from the readout.
 */
class KozmosSliderReadoutTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val percent: (Float) -> String = { "${Math.round(it * 100)}%" }

    @Test fun theSliderSaysTheFormattedValueAndTheReadoutIsNotHeard() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosSlider(value = 0.6f, onValueChange = {}, showValue = true, formatValue = percent)
            }
        }
        val slider = tree.merged.single { it.progressRange != null }
        assertEquals("60%", slider.stateDescription)
        assertEquals("the readout was heard as well", emptyList<String>(),
            tree.unmerged.filter { "60%" in it.texts }.map { it.texts.joinToString() })
    }

    @Test fun withoutAFormatterTheReadoutIsTheNumber() {
        assertEquals("40", formatSliderValue(40f))
        assertEquals("0.25", formatSliderValue(0.25f))
    }
}
