// MultiSelect.mdx's Compose snippet ("Mixed"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.multiselect.KozmosMultiSelect

// Each selected feature's facilities; where they differ, the field shows
// "Multiple values" and no chips, and a choice is the edit for them all.
@Composable
fun FacilitiesAcrossSelection(facilities: List<List<String>>, options: List<KozmosListboxOption>) {
    val differs = facilities.distinct().size > 1
    var edit by remember(facilities) { mutableStateOf<List<String>?>(null) }
    var query by remember { mutableStateOf("") }
    KozmosMultiSelect(
        selectedValues = edit ?: if (differs) emptyList() else facilities.first(),
        onValueChange = { edit = it },
        searchValue = query,
        onSearchValueChange = { query = it },
        options = options,
        label = "Facilities",
        mixed = differs && edit == null,
        onResetMixed = if (differs) ({ edit = null }) else null
    )
}
