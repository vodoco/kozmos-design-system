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
 * could replace, read even beside the product's own label.
 */
class KozmosDatePickerWordsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theDefaultFieldIsNamedByItsLabelAlone() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosDatePicker(date = null, onDateSelected = {}) }
        }
        // The label is drawn, and the icon describes nothing.
        assertEquals(
            "the descriptions TalkBack reads, and the words drawn",
            emptyList<String>() to listOf("Select Date"),
            tree.unmerged.mapNotNull { it.description } to tree.unmerged.flatMap { it.texts }
        )
    }

    @Test fun theCalendarIconSaysNothingBesideTheProductsLabel() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosDatePicker(date = LocalDate.of(2026, 5, 25), onDateSelected = {}, label = "Besuchsdatum")
            }
        }
        // The field is named by the product's label alone: the icon is decoration.
        assertEquals(
            "the descriptions TalkBack reads, and the words drawn",
            emptyList<String>() to listOf("Besuchsdatum"),
            tree.unmerged.mapNotNull { it.description } to tree.unmerged.flatMap { it.texts }
        )
    }
}
