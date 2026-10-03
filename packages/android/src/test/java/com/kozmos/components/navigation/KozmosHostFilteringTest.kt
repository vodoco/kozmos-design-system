package com.kozmos.components.navigation

import com.kozmos.components.combobox.filteredComboboxOptions
import com.kozmos.components.listbox.KozmosListboxOption
import org.junit.Assert.*
import org.junit.Test

class KozmosHostFilteringTest {
    @Test fun hostFilteringPreservesSynonymsAndRankingWithoutChangingLocalDefault() {
        val options = listOf(KozmosListboxOption("e2", "Elevator B"), KozmosListboxOption("e1", "Elevator A"))
        assertTrue(filteredComboboxOptions(options, "lift", true).isEmpty())
        assertEquals(listOf("e2", "e1"), filteredComboboxOptions(options, "lift", false).map { it.value })
    }
}
