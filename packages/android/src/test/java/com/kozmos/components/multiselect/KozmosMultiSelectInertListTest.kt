package com.kozmos.components.multiselect

import androidx.compose.foundation.LocalIndication
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.kozmos.components.LiveSemantics
import com.kozmos.components.Press
import com.kozmos.components.UnpaintedIndication
import com.kozmos.components.live
import com.kozmos.components.press
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * A MultiSelect that cannot be used shows no list and changes nothing. React
 * closes its list when `disabled` or `readOnly` turns on (MultiSelect.tsx,
 * `if (disabled || readOnly) setOpen(false)`) and toggles nothing while
 * either is set; Compose's Combobox hides its list while either is set, and
 * #392 makes SwiftUI's MultiSelect do the same. Compose's MultiSelect showed
 * its list in a read-only field opened with `defaultExpanded` or `expanded`,
 * and passed the list `enabled` alone, so a tap on a row of a read-only
 * field changed its selection; a disabled field showed its list too.
 * Presses are a finger's, on the row's centre.
 */
class KozmosMultiSelectInertListTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val options = listOf(
        KozmosListboxOption("a", "Gate A"),
        KozmosListboxOption("b", "Gate B"),
        KozmosListboxOption("c", "Gate C")
    )

    @Composable
    private fun Field(
        enabled: Boolean,
        readOnly: Boolean,
        expanded: Boolean?,
        changes: MutableList<List<String>>,
        expandedChanges: MutableList<Boolean> = mutableListOf()
    ) {
        KozmosMaterialTheme {
            CompositionLocalProvider(LocalIndication provides UnpaintedIndication) {
                KozmosMultiSelect(
                    selectedValues = listOf("a"),
                    onValueChange = { changes += it },
                    searchValue = "",
                    onSearchValueChange = {},
                    options = options,
                    label = "Gates",
                    enabled = enabled,
                    readOnly = readOnly,
                    expanded = expanded,
                    defaultExpanded = expanded == null,
                    onExpandedChange = { expandedChanges += it }
                )
            }
        }
    }

    /** The unselected option's row, if the list shows it: the chip shows Gate A, never Gate B. */
    private fun LiveSemantics.gateB() = read().merged.singleOrNull { it.words == "Gate B" }

    /** Opened as [expanded] says (null: `defaultExpanded`), then a tap on Gate B's row if there is one: whether a row showed, and the changes. */
    private fun tapGateB(enabled: Boolean, readOnly: Boolean, expanded: Boolean?): Pair<Boolean, List<List<String>>> {
        val changes = mutableListOf<List<String>>()
        var shown = false
        paparazzi.live(content = { Field(enabled, readOnly, expanded, changes) }) {
            val row = gateB()
            shown = row != null
            if (row != null) press(row.frame.center, Press.Finger)
        }
        return shown to changes
    }

    @Test fun aUsableFieldsOpenListTakesATap() {
        assertEquals(true to listOf(listOf("a", "b")), tapGateB(enabled = true, readOnly = false, expanded = null))
    }

    @Test fun aReadOnlyOrDisabledFieldShowsNoListAndChangesNothing() {
        val found = mutableMapOf<String, Pair<Boolean, List<List<String>>>>()
        for ((enabled, readOnly) in listOf(true to true, false to false, false to true)) {
            for (expanded in listOf(null, true)) {
                val case = "enabled=$enabled readOnly=$readOnly ${if (expanded == null) "defaultExpanded" else "expanded=true"}"
                found[case] = tapGateB(enabled, readOnly, expanded)
            }
        }
        println("MultiSelect Android, whether the list showed, and the changes a tap on Gate B made: $found")
        assertEquals("whether the list showed, and the selection changes a tap on Gate B made",
            found.mapValues { false to emptyList<List<String>>() }, found)
    }

    /** An open list closes as the field turns read-only or disabled, and stays closed when it turns back. */
    @Test fun turningReadOnlyOrDisabledOnClosesTheList() {
        val found = mutableMapOf<String, Any>()
        val expected = mutableMapOf<String, Any>()
        for (turn in listOf("readOnly", "disabled")) {
            val changes = mutableListOf<List<String>>()
            val expandedChanges = mutableListOf<Boolean>()
            var inert by mutableStateOf(false)
            paparazzi.live(content = {
                Field(enabled = !(turn == "disabled" && inert), readOnly = turn == "readOnly" && inert,
                    expanded = null, changes = changes, expandedChanges = expandedChanges)
            }) {
                assertTrue("$turn: the list shows before", gateB() != null)
                inert = true
                frames(4)
                found["$turn on: the list shows"] = gateB() != null
                found["$turn on: what the field told its caller of its list"] = expandedChanges.toList()
                inert = false
                frames(4)
                found["$turn off again: the list shows"] = gateB() != null
            }
            found["$turn: the selection changes"] = changes.toList()
            expected["$turn on: the list shows"] = false
            expected["$turn on: what the field told its caller of its list"] = listOf(false)
            expected["$turn off again: the list shows"] = false
            expected["$turn: the selection changes"] = emptyList<List<String>>()
        }
        println("MultiSelect Android, turning the field inert: $found")
        assertEquals(expected, found)
    }
}
