package com.kozmos.components.poiresultcard

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.poiresultgroup.KozmosPOIResultGroup
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem
import com.kozmos.contracts.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class KozmosPOIResultGroupTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    private fun items(selected: String? = null) = (1..3).map { index ->
        KozmosPOIResultListItem(KozmosPOIPresentation(id = "$index", name = "Bakery $index"),
            KozmosPOIResultPresentation(poiId = "$index", resultIndex = 1233 + index, selected = selected == "$index",
                featured = index == 1, badge = if (index == 2) KozmosPOIResultBadgePresentation("Alternative") else null,
                actions = listOf(KozmosPOIResultActionPresentation(KozmosPOIResultAction.Navigate, "Go", primary = true))))
    }

    @Test fun expansionSelectionAndActionsStayIndependentAndCollapsePreservesSelection() {
        val changes = mutableListOf<Boolean>()
        val actions = mutableListOf<String>()
        paparazzi.live(content = {
            var selected by remember { mutableStateOf<String?>(null) }
            MaterialTheme {
                KozmosPOIResultGroup(items = items(), selectedPoiId = selected, numbered = true,
                    onSelect = { selected = it }, onExpandedChange = { changes += it },
                    onAction = { action, id -> actions += "${action.value}:$id" })
            }
        }) {
            fun shown() = read().merged.filter { it.words?.contains("Bakery") == true }
            fun footer(text: String) = read().merged.single { text in it.texts }
            assertEquals(1, shown().size)
            footer("Show 2 more").expand!!.invoke(); frames(3)
            assertEquals(3, shown().size)
            shown().single { it.words!!.contains("Bakery 2") }.click!!.invoke(); frames(3)
            assertEquals("1235, Alternative, Bakery 2", shown().single { it.selected == true }.words)
            read().merged.single { "Go" in it.texts }.click!!.invoke(); frames(3)
            assertEquals(listOf("navigate:2"), actions)
            footer("Hide").collapse!!.invoke(); frames(3)
            assertEquals(1, shown().size)
            footer("Show 2 more").click!!.invoke(); frames(3)
            assertEquals("1235, Alternative, Bakery 2", shown().single { it.selected == true }.words)
            assertEquals(listOf(true, false, true), changes)
        }
    }

    @Test fun controlledExpansionOnlyRequestsAChangeAndOneItemHasNoToggle() {
        var requested: Boolean? = null
        val tree = paparazzi.readSemantics { MaterialTheme {
            KozmosPOIResultGroup(items = items(), expanded = false, onSelect = {}, onExpandedChange = { requested = it })
        } }
        tree.merged.single { "Show 2 more" in it.texts }.click!!.invoke()
        assertEquals(true, requested)
        assertEquals(1, tree.merged.count { it.words?.contains("Bakery") == true })
        val single = paparazzi.readSemantics { MaterialTheme { KozmosPOIResultGroup(items = items().take(1), onSelect = {}) } }
        assertTrue(single.merged.none { it.expand != null || it.collapse != null })
    }
}
