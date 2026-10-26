package com.kozmos.components.timepicker

import android.text.format.DateFormat
import androidx.compose.ui.platform.LocalConfiguration
import com.kozmos.components.ReadNode
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React's TimePicker is a native time input named by its label, its clock
 * icon hidden from assistive tech (`aria-hidden`). Compose's label has an
 * English default the product replaces, as every Compose label parameter
 * has, but its clock icon was described by a fixed English "Select Time"
 * that nothing could replace. And what a tap opens the dialog on was a box
 * over the field with no role and no name, a second TalkBack stop beside the
 * field, which a double tap only focused.
 */
class KozmosTimePickerWordsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** A node as TalkBack would stop on it: its role, name, state, words and whether it acts. */
    private fun ReadNode.said() =
        "role=$role description=$description state=$stateDescription texts=$texts click=${click != null}"

    /** Every node TalkBack would stop on: one with a click, words or a state. */
    private fun stops(content: @androidx.compose.runtime.Composable () -> Unit) =
        paparazzi.readSemantics { KozmosMaterialTheme { content() } }
            .merged.filter { it.click != null || it.words != null || it.stateDescription != null }
            .map { it.said() }

    @Test fun theDefaultFieldIsOneButtonNamedByItsLabel() {
        assertEquals(
            listOf("role=Button description=Select Time state=null texts=[] click=true"),
            stops { KozmosTimePicker(time = null, onTimeSelected = {}) }
        )
    }

    @Test fun theClockIconSaysNothing() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosTimePicker(time = null, onTimeSelected = {}, label = "Ankunftszeit") }
        }
        // The only description in the whole tree is the control's own name,
        // the product's label: the icon is decoration.
        assertEquals(listOf("Ankunftszeit"), tree.unmerged.mapNotNull { it.description })
    }

    @Test fun theFieldIsOneButtonNamedByTheProductsLabelThatSaysItsTime() {
        val time = LocalTime.of(9, 30)
        var locale = Locale.ROOT
        val stops = stops {
            locale = LocalConfiguration.current.locales[0]
            KozmosTimePicker(time = time, onTimeSelected = {}, label = "Ankunftszeit")
        }
        // The time, as the words the field shows, in the locale's short style on the
        // device's clock (12-hour under layoutlib); KozmosPickerLocaleTest
        // holds the format to the locale.
        val shown = time.format(DateTimeFormatter.ofPattern(DateFormat.getBestDateTimePattern(locale, "hm"), locale))
        assertEquals(listOf("role=Button description=Ankunftszeit state=null texts=[$shown] click=true"), stops)
    }
}
