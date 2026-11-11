package com.kozmos.components.checkbox

import androidx.compose.foundation.layout.Column
import androidx.compose.ui.semantics.Role
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.switch.KozmosSwitch
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-162: a Checkbox's and a Switch's description is the control's own,
 * read with it. Each control stays one TalkBack stop whose words are its
 * label, then its description; and a Switch's state words are drawn but not
 * read, since its Switch role already says on or off.
 */
class KozmosControlDescriptionSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun aCheckboxReadsItsLabelThenItsDescriptionAsOneControl() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosCheckbox(
                    checked = false,
                    onCheckedChange = {},
                    label = "Share my desk booking",
                    description = "Colleagues on your floor see where you sit"
                )
            }
        }
        val controls = tree.merged.filter { it.click != null }
        assertEquals("one control, not one per text", 1, controls.size)
        assertEquals(
            listOf("Share my desk booking", "Colleagues on your floor see where you sit"),
            controls.single().texts
        )
    }

    @Test
    fun aSwitchReadsItsLabelThenItsDescriptionAndNotItsStateWords() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column {
                    KozmosSwitch(
                        checked = true,
                        onCheckedChange = {},
                        label = "Gate alerts",
                        description = "Sends a push when your gate changes",
                        showStateLabel = true
                    )
                    KozmosSwitch(
                        checked = false,
                        onCheckedChange = {},
                        label = "Quiet hours",
                        showStateLabel = true,
                        onLabel = "Activé",
                        offLabel = "Désactivé"
                    )
                }
            }
        }
        val switches = tree.merged.filter { it.role == Role.Switch }
        assertEquals(2, switches.size)
        assertEquals(listOf("Gate alerts", "Sends a push when your gate changes"), switches[0].texts)
        assertEquals(listOf("Quiet hours"), switches[1].texts)
        val everyWord = tree.unmerged.flatMap { it.texts } + tree.merged.flatMap { it.texts }
        for (state in listOf("On", "Off", "Activé", "Désactivé")) {
            assertTrue("\"$state\" is read: $everyWord", state !in everyWord)
        }
        assertNotNull(switches[0].click)
    }
}
