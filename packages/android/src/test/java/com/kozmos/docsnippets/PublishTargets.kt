// SplitButton.mdx's Compose snippet ("Menu items"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.kozmos.components.splitbutton.KozmosSplitButton
import com.kozmos.components.splitbutton.SplitContextMenuItem
import com.kozmos.components.splitbutton.SplitContextMenuSeparator

// An item takes an icon and enabled; a separator draws a line; menuContent
// follows them and is given the function that closes the menu.
@Composable
fun PublishTargets(publish: (String) -> Unit) {
    KozmosSplitButton(
        label = "Publish",
        onMainClick = { publish("draft") },
        menuItems = listOf(
            SplitContextMenuItem(
                label = "Publish to staging",
                icon = { Icon(Icons.Default.Download, contentDescription = null) }
            ) { publish("staging") },
            SplitContextMenuSeparator,
            SplitContextMenuItem(label = "Publish to production", enabled = false) {}
        ),
        menuContent = { close ->
            DropdownMenuItem(text = { Text("Publish tonight") }, onClick = { publish("tonight"); close() })
        }
    )
}
