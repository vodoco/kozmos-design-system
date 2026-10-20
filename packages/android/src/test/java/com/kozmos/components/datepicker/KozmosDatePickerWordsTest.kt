package com.kozmos.components.datepicker

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's DatePicker hides its calendar icon from assistive tech
 * (`aria-hidden`) and draws a label only when the product passes one; SwiftUI's
 * label defaults to none. Compose's field said a fixed English "Select Date"
 * twice: its calendar icon was described by it, and its label defaulted to it,
 * so a German or Turkish screen showed and read English the product never
 * wrote.
 */
class KozmosDatePickerWordsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theDefaultFieldSaysNoWordsTheProductDidNotWrite() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosDatePicker(date = null, onDateSelected = {}) }
        }
        // Nothing described and nothing written, not even an empty label.
        val quoted = { words: List<String> -> words.map { "\"$it\"" } }
        assertEquals(
            "the descriptions TalkBack reads, and the words drawn",
            emptyList<String>() to emptyList<String>(),
            quoted(tree.unmerged.mapNotNull { it.description }) to quoted(tree.unmerged.flatMap { it.texts })
        )
    }

    @Test fun theCalendarIconIsDecorationBesideTheProductsLabel() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosDatePicker(date = LocalDate.of(2026, 5, 25), onDateSelected = {}, label = "Besuchsdatum")
            }
        }
        // The icon is described by nothing, as React's aria-hidden icon.
        assertTrue("descriptions: ${tree.unmerged.mapNotNull { it.description }}", tree.unmerged.all { it.description == null })
        // The field is still named by the product's label.
        assertEquals(listOf("Besuchsdatum"), tree.unmerged.flatMap { it.texts })
    }
}
