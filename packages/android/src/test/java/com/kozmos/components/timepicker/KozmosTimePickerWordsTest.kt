package com.kozmos.components.timepicker

import com.kozmos.components.ReadNode
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React's TimePicker is a native time input named by the product's optional
 * label, its clock icon hidden from assistive tech (`aria-hidden`); SwiftUI's
 * label defaults to none. Compose's field said a fixed English "Select Time"
 * twice, as the date picker did: its clock icon was described by it, and its
 * label defaulted to it. And what a tap opens the dialog on was a box over
 * the field with no role and no name, a second TalkBack stop beside the
 * field, which a double tap only focused.
 */
class KozmosTimePickerWordsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** A node as TalkBack would stop on it: its role, name, state, words and whether it acts. */
    private fun ReadNode.said() =
        "role=$role description=$description state=$stateDescription texts=$texts click=${click != null}"

    @Test fun theDefaultFieldSaysNoWordsTheProductDidNotWrite() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosTimePicker(time = null, onTimeSelected = {}) }
        }
        // Nothing described and nothing written, not even an empty label.
        val quoted = { words: List<String> -> words.map { "\"$it\"" } }
        assertEquals(
            "the descriptions TalkBack reads, and the words drawn",
            emptyList<String>() to emptyList<String>(),
            quoted(tree.unmerged.mapNotNull { it.description }) to quoted(tree.unmerged.flatMap { it.texts })
        )
    }

    @Test fun theFieldIsOneButtonNamedByTheProductsLabelThatSaysItsTime() {
        val time = LocalTime.of(9, 30)
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosTimePicker(time = time, onTimeSelected = {}, label = "Ankunftszeit")
            }
        }
        // Every node TalkBack would stop on: one, the control a tap opens the
        // dialog on, a button named by the product's label, its time its state.
        val stops = tree.merged.filter {
            it.click != null || it.words != null || it.stateDescription != null
        }
        val shown = time.format(DateTimeFormatter.ofPattern("hh:mm a"))
        assertEquals(
            listOf("role=Button description=Ankunftszeit state=$shown texts=[] click=true"),
            stops.map { it.said() }
        )
    }
}
