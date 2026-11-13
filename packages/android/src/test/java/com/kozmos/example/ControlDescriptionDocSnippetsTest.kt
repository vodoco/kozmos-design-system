// Composes the Compose snippets of Checkbox.mdx's "A description", Switch.mdx's
// "A description and a state label" and Radio.mdx's "Cards and tiles":
// docsnippets/DeskBookingTerms.kt, GateAlerts.kt and MapStyleCards.kt, which
// check-native-snippet-parity holds to the pages word for word.
package com.kozmos.example

import androidx.compose.ui.semantics.Role
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.DeskBookingTerms
import com.kozmos.docsnippets.GateAlerts
import com.kozmos.docsnippets.MapStyleCards
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ControlDescriptionDocSnippetsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun theCheckboxSnippetReadsItsDescriptionAfterItsLabel() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { DeskBookingTerms(accepted = false, onAcceptedChange = {}) } }
        assertEquals(
            listOf("Share my desk booking", "Colleagues on your floor see where you sit"),
            tree.merged.single { it.click != null }.texts
        )
    }

    @Test
    fun theSwitchSnippetReadsItsDescriptionAndNotItsStateWords() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { GateAlerts(isOn = true, onChange = {}) } }
        assertEquals(
            listOf("Gate alerts", "Sends a push when your gate changes"),
            tree.merged.single { it.role == Role.Switch }.texts
        )
    }

    @Test
    fun theRadioSnippetIsTwoRadioCards() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { MapStyleCards() } }
        val radios = tree.merged.filter { it.role == Role.RadioButton }
        assertEquals(listOf("Vector", "Satellite"), radios.map { it.texts.first() })
        assertEquals(listOf(true, false), radios.map { it.selected })
    }
}
