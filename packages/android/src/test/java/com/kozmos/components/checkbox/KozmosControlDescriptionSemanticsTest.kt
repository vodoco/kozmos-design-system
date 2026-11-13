package com.kozmos.components.checkbox

import androidx.compose.foundation.layout.Column
import androidx.compose.ui.semantics.Role
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.switch.KozmosSwitch
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.state.ToggleableState
import com.kozmos.components.live
import androidx.compose.foundation.layout.width
import androidx.compose.ui.unit.dp
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

    /**
     * A checkbox to TalkBack: one node with the Checkbox role and its state,
     * which a double tap turns. It was a bare clickable row, heard as its
     * words and nothing of checked.
     */
    @Test
    fun aCheckboxIsACheckboxThatSaysItsState() {
        var checked by mutableStateOf(false)
        paparazzi.live(content = {
            KozmosMaterialTheme {
                KozmosCheckbox(checked = checked, onCheckedChange = { checked = it }, label = "Route updates")
            }
        }) {
            val before = read().merged.single { "Route updates" in it.texts }
            assertEquals(Role.Checkbox, before.role)
            assertEquals(ToggleableState.Off, before.toggleState)
            assertTrue(checkNotNull(before.click)())
            frames(3)
            assertEquals(ToggleableState.On, read().merged.single { "Route updates" in it.texts }.toggleState)
        }
    }

    /**
     * Right to left, a description's lines start at the right, the layout's
     * start, as a Checkbox's and a Switch's labels do: English words in a
     * right-to-left screen still line up with the control they describe.
     * Switch's wrapped description lined its lines up on the left.
     */
    @Test
    fun aDescriptionsLinesStartAtTheRightInRightToLeft() {
        val words = "Sends a push when your gate changes, and again when boarding starts at it"
        val tree = paparazzi.readSemantics {
            androidx.compose.runtime.CompositionLocalProvider(
                androidx.compose.ui.platform.LocalLayoutDirection provides androidx.compose.ui.unit.LayoutDirection.Rtl
            ) {
                KozmosMaterialTheme {
                    androidx.compose.foundation.layout.Box(androidx.compose.ui.Modifier.width(260.dp)) {
                        Column {
                            KozmosSwitch(checked = true, onCheckedChange = {}, label = "Gate alerts", description = words, showStateLabel = true)
                            KozmosCheckbox(checked = true, onCheckedChange = {}, label = "Route updates", description = words)
                        }
                    }
                }
            }
        }
        val texts = tree.unmerged.filter { it.texts == listOf(words) }
        assertEquals(2, texts.size)
        for ((i, text) in texts.withIndex()) {
            val lines = checkNotNull(text.textLines) { "no layout for the description" }
            val width = checkNotNull(text.textWidth).toFloat()
            assertTrue("description ${i + 1} does not wrap: $lines", lines.size > 1)
            val last = lines.last()
            assertTrue(
                "description ${i + 1}'s last line sits at ${last.first}..${last.second} of $width: not at the right",
                last.second >= width - 1f && last.first > 1f
            )
        }
    }
}
