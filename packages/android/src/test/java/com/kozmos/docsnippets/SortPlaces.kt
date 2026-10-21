// Menu.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.menu.KozmosMenu
import com.kozmos.components.text.KozmosText
import com.kozmos.tokens.KozmosDimensions

// Compose's menu is the list alone: you hold whether it is open and draw the
// button that opens it, sharing a Box, as the list opens at its parent.
// Picking an item hands you its text and closes the menu.
@Composable
fun SortPlaces() {
    var expanded by remember { mutableStateOf(false) }
    var sort by remember { mutableStateOf("Nearby") }
    Column(verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)) {
        Box {
            KozmosButton(onClick = { expanded = true }) { Text("Sort places") }
            KozmosMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                items = listOf("Nearby", "Name"),
                onItemClick = { sort = it }
            )
        }
        KozmosText(text = "Sort: $sort")
    }
}
