// Select.mdx's Compose snippet ("A ghost trigger"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.select.KozmosSelect
import com.kozmos.components.select.KozmosSelectItem
import com.kozmos.components.select.KozmosSelectTrigger
import com.kozmos.components.select.KozmosSelectTriggerVariant

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LevelControl(level: String, onLevelChange: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    KozmosSelect(
        expanded = expanded,
        onExpandedChange = { expanded = it },
        trigger = {
            KozmosSelectTrigger(
                value = level,
                placeholder = "Level",
                variant = KozmosSelectTriggerVariant.Ghost
            )
        }
    ) {
        listOf("Level 1", "Level 2").forEach { option ->
            KozmosSelectItem(
                value = option,
                label = option,
                onValueChange = onLevelChange,
                onDismissRequest = { expanded = false }
            )
        }
    }
}
