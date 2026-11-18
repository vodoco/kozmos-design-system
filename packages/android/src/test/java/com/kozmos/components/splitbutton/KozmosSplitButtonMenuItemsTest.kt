package com.kozmos.components.splitbutton

import androidx.compose.foundation.layout.Column
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-168 (decision 209): a split button's menu takes full items, as
 * React's `menuItems`: an item with an icon, a separator, a disabled item,
 * and custom content after them. The rows are read as the menu draws them,
 * hosted in a column: the popup itself is a window of its own.
 */
class KozmosSplitButtonMenuItemsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun items(ran: MutableList<String>) = listOf(
        SplitContextMenuItem(
            label = "Publish to staging",
            icon = { Icon(Icons.Default.Download, contentDescription = null) }
        ) { ran += "staging" },
        SplitContextMenuSeparator,
        SplitContextMenuItem(label = "Publish to production", enabled = false) { ran += "production" }
    )

    @Test fun eachItemIsNamedByItsWordsAndTheDisabledOneIsDisabled() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column {
                    KozmosSplitButtonMenuRows(items(mutableListOf()), close = {}) { close ->
                        DropdownMenuItem(text = { Text("Publish tonight") }, onClick = close)
                    }
                }
            }
        }
        val rows = tree.merged.filter { it.click != null }
        assertEquals(listOf("Publish to staging", "Publish to production", "Publish tonight"), rows.map { it.words })
        assertTrue(tree.saying("Publish to staging").enabled)
        assertFalse(tree.saying("Publish to production").enabled)
    }

    @Test fun anEnabledItemRunsAndClosesTheMenu() {
        val ran = mutableListOf<String>()
        var closed = 0
        paparazzi.live(content = {
            KozmosMaterialTheme {
                Column { KozmosSplitButtonMenuRows(items(ran), close = { closed += 1 }) }
            }
        }) {
            assertTrue(checkNotNull(read().saying("Publish to staging").click)())
            frames(2)
            assertEquals(listOf("staging"), ran)
            assertEquals(1, closed)
        }
    }

    @Test fun theItemsBeforeGap168StillCompile() {
        val item = SplitContextMenuItem("Save draft") {}
        assertEquals("Save draft", item.label)
        assertTrue(item.enabled)
        assertEquals(null, item.icon)
    }
}
