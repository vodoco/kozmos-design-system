package com.kozmos.components.chip

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

/**
 * Review finding N4: a chip that can be chosen tells TalkBack whether it is
 * chosen, as React's `aria-pressed` does. Selection used to change only the
 * colours: the chip was a plain clickable, with no role and no state.
 *
 * - an interactive chip is a button, selected or not selected;
 * - remove is a button of its own, named by the chip;
 * - a disabled chip is read as disabled, keeps its state, and runs nothing,
 *   however it is pressed;
 * - a tag with no action is text, never a button or a selection.
 */
class KozmosChipSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    /** The one control whose text is [text]. */
    private fun ReadSemantics.showing(text: String): ReadNode {
        val found = merged.filter { text in it.texts }
        check(found.size == 1) { "expected one node showing \"$text\", found ${found.size} among ${merged.map { it.texts }}" }
        return found.single()
    }

    @Test
    fun anInteractiveChipIsAButtonThatSaysWhetherItIsSelected() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    KozmosChip(text = "Vegan", selected = true, onClick = {})
                    KozmosChip(text = "Halal", onClick = {})
                    // A tag says what a place is; it is not a choice, so it is
                    // text whatever its colours say.
                    KozmosChip(text = "Step-free", selected = true)
                }
            }
        }

        val chosen = tree.showing("Vegan")
        assertEquals("an interactive chip is not a button", Role.Button, chosen.role)
        assertEquals("a selected chip does not say it is selected", true, chosen.selected)

        val open = tree.showing("Halal")
        assertEquals(Role.Button, open.role)
        assertEquals("an unselected chip does not say it is not selected", false, open.selected)

        val tag = tree.showing("Step-free")
        assertNull("a tag with no action can be pressed", tag.click)
        assertNull("a tag with no action has a role", tag.role)
        assertNull("a tag with no action says it is selected", tag.selected)
    }

    /** A press runs the chip's action, and what TalkBack reads follows the state the parent keeps. */
    @Test
    fun theSelectionFollowsTheParentsState() {
        var on by mutableStateOf(false)
        var pressed = 0
        paparazzi.live(content = {
            MaterialTheme {
                KozmosChip(text = "Vegan", selected = on, onClick = {
                    pressed++
                    on = !on
                })
            }
        }) {
            assertEquals(false, read().showing("Vegan").selected)
            read().showing("Vegan").click!!.invoke()
            frames(3)
            assertEquals(1, pressed)
            assertEquals("the chip the parent selected is not read as selected", true, read().showing("Vegan").selected)
            read().showing("Vegan").click!!.invoke()
            frames(3)
            assertEquals(2, pressed)
            assertEquals("the chip the parent cleared is still read as selected", false, read().showing("Vegan").selected)
        }
    }

    /** A removable chip is two controls, as on the web: the chip, whose press is its action, and remove. */
    @Test
    fun removeIsItsOwnButtonAndTheChipsPressIsTheChips() {
        val ran = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    KozmosChip(text = "Coffee", selected = true, onRemove = { ran += "remove Coffee" }, onClick = { ran += "Coffee" })
                    // A filter the visitor can only take away: the tag is
                    // text, and remove is the one control.
                    KozmosChip(text = "Open now", onRemove = { ran += "remove Open now" })
                }
            }
        }

        val chip = tree.showing("Coffee")
        assertEquals(Role.Button, chip.role)
        assertEquals(true, chip.selected)
        chip.click!!.invoke()
        assertEquals(listOf("Coffee"), ran)

        val remove = tree.named("Remove Coffee")
        assertEquals("remove is not a button", Role.Button, remove.role)
        assertNull("remove took the chip's selection", remove.selected)
        remove.click!!.invoke()
        assertEquals(listOf("Coffee", "remove Coffee"), ran)

        val tag = tree.showing("Open now")
        assertNull("a tag with only remove can be pressed", tag.click)
        assertNull(tag.selected)
        val removeTag = tree.named("Remove Open now")
        assertEquals(Role.Button, removeTag.role)
        removeTag.click!!.invoke()
        assertEquals(listOf("Coffee", "remove Coffee", "remove Open now"), ran)
    }

    /**
     * Disabled is read, not only drawn: the chip and its remove are disabled
     * to TalkBack, the chip keeps its state, and neither runs — not even
     * through the click its semantics still carry, which Compose 1.6 runs
     * whether the node is enabled or not (measured 2026-09-29).
     */
    @Test
    fun aDisabledChipIsReadAsDisabledAndRunsNothing() {
        val ran = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    KozmosChip(text = "Vegan", selected = true, enabled = false, onRemove = { ran += "remove" }, onClick = { ran += "Vegan" })
                    KozmosChip(text = "Halal", enabled = false, onClick = { ran += "Halal" })
                }
            }
        }

        val chosen = tree.showing("Vegan")
        assertFalse("a disabled chip is not read as disabled", chosen.enabled)
        assertEquals("a disabled chip lost its state", true, chosen.selected)
        assertEquals(Role.Button, chosen.role)
        chosen.click?.invoke()

        val remove = tree.named("Remove Vegan")
        assertFalse("a disabled chip's remove is not read as disabled", remove.enabled)
        remove.click?.invoke()

        val open = tree.showing("Halal")
        assertFalse(open.enabled)
        assertEquals(false, open.selected)
        open.click?.invoke()

        assertEquals("a disabled chip ran something", emptyList<String>(), ran)
    }
}
