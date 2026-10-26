package com.kozmos.components.accordion

import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's accordion trigger is Radix's: a button with `aria-expanded`, so a
 * screen reader hears whether its panel is open. Compose's trigger was a
 * clickable row with no role whose chevron was described "Expand" or
 * "Collapse", fixed English that named an action, not a state. The trigger
 * is now a button that offers TalkBack expand while closed and collapse
 * while open, which TalkBack reads as the trigger's state in the visitor's
 * own language, and the chevron is decoration.
 *
 * Two items with the second open, so neither state can pass by being the only
 * one there.
 */
class KozmosAccordionSemanticsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Composable
    private fun Place(onChange: (String?) -> Unit = {}) {
        var open by remember { mutableStateOf<String?>("access") }
        KozmosMaterialTheme {
            KozmosAccordion(Modifier.width(360.dp)) {
                KozmosAccordionItem {
                    KozmosAccordionTrigger(value = "hours", selectedValue = open, onValueChange = { open = it; onChange(it) }, title = "Opening hours")
                    KozmosAccordionContent(value = "hours", selectedValue = open) { Text("Nine to five") }
                }
                KozmosAccordionItem {
                    KozmosAccordionTrigger(value = "access", selectedValue = open, onValueChange = { open = it; onChange(it) }, title = "Step-free access")
                    KozmosAccordionContent(value = "access", selectedValue = open) { Text("Lifts at both ends") }
                }
            }
        }
    }

    /** The one control that shows [title]; fails, listing what there is, if not exactly one. */
    private fun ReadSemantics.trigger(title: String): ReadNode {
        val found = merged.filter { title in it.texts }
        check(found.size == 1) { "expected one node showing \"$title\", found ${found.size} among ${merged.map { it.description to it.texts }}" }
        return found.single()
    }

    @Test fun eachTriggerSaysWhetherItsPanelIsOpen() {
        val tree = paparazzi.readSemantics { Place() }
        val hours = tree.trigger("Opening hours")
        val access = tree.trigger("Step-free access")
        assertEquals(
            "what TalkBack is told of each trigger: its description, role, and whether it offers expand and collapse",
            listOf(Triple(null, Role.Button, "expand"), Triple(null, Role.Button, "collapse")),
            listOf(hours, access).map { node ->
                Triple(node.description, node.role, listOfNotNull(node.expand?.let { "expand" }, node.collapse?.let { "collapse" }).joinToString())
            }
        )
        assertTrue("words TalkBack reads: ${tree.unmerged.mapNotNull { it.description }}", tree.unmerged.all { it.description == null })
    }

    /** TalkBack's expand and collapse open and close the panel, and the state follows. */
    @Test fun expandAndCollapseMoveTheState() {
        val changes = mutableListOf<String?>()
        paparazzi.live(content = { Place { changes += it } }) {
            val expand = checkNotNull(read().trigger("Opening hours").expand) { "the closed trigger offers TalkBack no expand" }
            assertTrue("expand was refused", expand())
            frames(4)
            assertNotNull("the opened trigger offers collapse", read().trigger("Opening hours").collapse)
            assertNull("the opened trigger still offers expand", read().trigger("Opening hours").expand)
            assertNotNull("the other trigger offers expand", read().trigger("Step-free access").expand)
            assertTrue("collapse was refused", read().trigger("Opening hours").collapse!!.invoke())
            frames(4)
            assertNotNull("the closed trigger offers expand", read().trigger("Opening hours").expand)
        }
        assertEquals(listOf("hours", null), changes)
    }
}
