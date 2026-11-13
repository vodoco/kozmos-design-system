// Tree.mdx's Compose snippet ("Sections, ranges and a menu"), word for word
// below the package line: compiled here, so a renamed or removed parameter
// fails in this target rather than in a reader's project. Change the two
// together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kozmos.components.menu.KozmosMenuContent
import com.kozmos.components.menu.KozmosMenuItem
import com.kozmos.components.tree.KozmosTree
import com.kozmos.components.tree.KozmosTreeMetaPlacement
import com.kozmos.components.tree.KozmosTreeSelectionMode
import com.kozmos.components.tree.TreeNode

// One lazy list over the visible rows: give the tree a height. Shift+click
// or Shift+Down selects a range, Ctrl+click toggles a row, and a right click,
// a long press or the Menu key opens that row's menu.
@Composable
fun MapContentTree() {
    var selected by remember { mutableStateOf(emptySet<String>()) }
    KozmosTree(
        data = listOf(
            TreeNode(
                id = "poi",
                name = "POI",
                count = 2,
                section = true,
                children = listOf(
                    TreeNode(id = "cafe", name = "Bean & Leaf Café", meta = "Changes awaiting publish"),
                    TreeNode(id = "gate", name = "Gate A12")
                )
            ),
            TreeNode(
                id = "structural",
                name = "Structural",
                count = 1,
                section = true,
                children = listOf(TreeNode(id = "wall", name = "North wall"))
            )
        ),
        modifier = Modifier.height(400.dp),
        selectionMode = KozmosTreeSelectionMode.Multiple,
        selectedIds = selected,
        onSelectedIdsChange = { selected = it },
        metaPlacement = KozmosTreeMetaPlacement.Below,
        contextMenu = { node ->
            KozmosMenuContent(
                label = node.name,
                items = listOf(KozmosMenuItem(text = "Rename"), KozmosMenuItem(text = "Delete"))
            )
        },
        onContextMenuSelect = { node, item -> /* item.text on node.id */ }
    )
}
