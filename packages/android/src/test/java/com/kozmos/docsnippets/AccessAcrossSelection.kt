// Radio.mdx's Compose snippet ("Mixed"), word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.radio.KozmosRadioGroup
import com.kozmos.components.radio.KozmosRadioGroupItem

// The features' access differs, so the group is mixed until an option is
// chosen: none is selected, and "Multiple values" is under the options.
@Composable
fun AccessAcrossSelection(levels: List<String>) {
    val differs = levels.distinct().size > 1
    var edit by remember(levels) { mutableStateOf<String?>(null) }
    val selected = edit ?: if (differs) "" else levels.first()
    KozmosRadioGroup(
        mixed = differs && edit == null,
        onResetMixed = if (differs) ({ edit = null }) else null
    ) {
        listOf("public" to "Public", "staff" to "Staff only", "closed" to "Closed").forEach { (value, label) ->
            KozmosRadioGroupItem(
                value = value,
                selectedValue = selected,
                onOptionSelected = { edit = it },
                label = label
            )
        }
    }
}
