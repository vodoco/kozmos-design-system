package com.kozmos.components.datepicker

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React's DatePicker hides its calendar icon from assistive tech
 * (`aria-hidden`): the label names the field. Compose's label has an English
 * default the product replaces, as every Compose label parameter has, but its
 * calendar icon was described by a fixed English "Select Date" that nothing
 * could replace, read even beside the product's own label. The field is a
 * Kozmos field now, one button named by its label (decision 106).
 */
class KozmosDatePickerWordsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theDefaultFieldIsOneButtonNamedByItsLabel() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosDatePicker(date = null, onDateSelected = {}) }
        }
        // The one node with a description is the field, named by its label.
        assertEquals(
            listOf("Button: Select Date"),
            tree.unmerged.filter { it.description != null }.map { "${it.role}: ${it.description}" }
        )
    }

    @Test fun theCalendarIconSaysNothingBesideTheProductsLabel() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosDatePicker(date = LocalDate.of(2026, 5, 25), onDateSelected = {}, label = "Besuchsdatum")
            }
        }
        // The icon is described by nothing, as React's aria-hidden icon: the
        // one description is the field's name, the product's label.
        assertEquals(
            listOf("Button: Besuchsdatum"),
            tree.unmerged.filter { it.description != null }.map { "${it.role}: ${it.description}" }
        )
    }
}
