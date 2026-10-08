package com.kozmos.components.tabs

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.Role
import com.kozmos.components.ReadSemantics
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Rule
import org.junit.Test

/**
 * React's tabs are Radix's: a `tablist` of `tab`s, the selected one
 * `aria-selected`. TalkBack is told the same here: each trigger is a tab
 * that says whether it is selected, and the list is a selectable group whose
 * items are the tabs (WCAG 4.1.2). Until then a trigger was a
 * plain clickable, with no role and no state, and the selected tab was
 * shown only by its segment.
 *
 * Three tabs with the middle one selected, so neither end can pass by
 * standing in for "the first" or "the last".
 */
class KozmosTabsSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val titles = listOf("Hours", "Access", "Reviews")

    @Test
    fun eachTriggerIsATabAndOnlyTheSelectedOneSaysSo() {
        val pressed = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosTabs {
                    KozmosTabsList {
                        for (title in titles) {
                            val value = title.lowercase()
                            KozmosTabsTrigger(value = value, title = title, selectedValue = "access", onValueChange = { pressed += it })
                        }
                    }
                }
            }
        }

        for (title in titles) {
            val tab = tree.saying(title)
            assertEquals("$title is not a tab", Role.Tab, tab.role)
            assertEquals("$title does not say whether it is selected", title == "Access", tab.selected)
        }

        // TalkBack still presses a tab, and the press is that tab's. (Compose
        // offers TalkBack no click on a selected node, so the selected tab
        // has none to press.)
        tree.saying("Reviews").click!!.invoke()
        tree.saying("Hours").click!!.invoke()
        assertEquals(listOf("reviews", "hours"), pressed)
    }

    @Test
    fun theListIsTheOneSelectableGroupAndItsItemsAreTheTabs() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosTabs {
                    KozmosTabsList {
                        for (title in titles) {
                            KozmosTabsTrigger(value = title.lowercase(), title = title, selectedValue = "access", onValueChange = {})
                        }
                    }
                }
            }
        }
        val groups = tree.merged.mapNotNull { it.selectableGroup }
        assertEquals("the tabs are not one selectable group", 1, groups.size)
        assertEquals("the group does not count the tabs", titles, groups.single().map { it.words })
        assertEquals(listOf(false, true, false), groups.single().map { it.selected })
    }

    /** A press through TalkBack moves the selection, and what TalkBack reads follows the parent's state. */
    @Test
    fun theSelectionTalkBackReadsFollowsAPress() {
        var selected by mutableStateOf("hours")
        paparazzi.live(content = {
            KozmosMaterialTheme {
                KozmosTabs {
                    KozmosTabsList {
                        for (title in titles) {
                            KozmosTabsTrigger(value = title.lowercase(), title = title, selectedValue = selected, onValueChange = { selected = it })
                        }
                    }
                }
            }
        }) {
            assertEquals(listOf(true, false, false), read().selections())
            val press = read().saying("Reviews").click
            assertNotNull("Reviews cannot be pressed", press)
            press!!.invoke()
            frames(3)
            assertEquals("reviews", selected)
            assertEquals("the pressed tab is not the one read as selected", listOf(false, false, true), read().selections())
        }
    }

    private fun ReadSemantics.selections(): List<Boolean?> = titles.map { saying(it).selected }
}
