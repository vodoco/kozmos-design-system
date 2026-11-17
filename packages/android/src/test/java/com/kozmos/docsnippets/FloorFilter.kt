// Checkbox.mdx's Compose snippet ("Mixed"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.state.ToggleableState
import com.kozmos.components.checkbox.KozmosCheckbox

// "All floors" is mixed while only some floors are shown; a click shows them all.
@Composable
fun FloorFilter(floors: List<String>, shown: Set<String>, onShownChange: (Set<String>) -> Unit) {
    val all = when (shown.size) {
        0 -> ToggleableState.Off
        floors.size -> ToggleableState.On
        else -> ToggleableState.Indeterminate
    }
    Column {
        KozmosCheckbox(
            state = all,
            onCheckedChange = { checked -> onShownChange(if (checked) floors.toSet() else emptySet()) },
            label = "All floors"
        )
        floors.forEach { floor ->
            KozmosCheckbox(
                checked = floor in shown,
                onCheckedChange = { checked -> onShownChange(if (checked) shown + floor else shown - floor) },
                label = floor
            )
        }
    }
}
