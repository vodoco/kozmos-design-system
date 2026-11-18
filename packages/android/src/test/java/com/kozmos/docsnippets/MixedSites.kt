// Tree.mdx's Compose snippet ("Mixed parents"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kozmos.components.tree.KozmosTree
import com.kozmos.components.tree.KozmosTreeCheckRule
import com.kozmos.components.tree.TreeNode

// Independent checks: Acme with one of its sites checked is mixed. Checking
// it checks every site; unchecking it unchecks them.
@Composable
fun MixedSites() {
    var checked by remember { mutableStateOf(setOf("acme-hq")) }
    KozmosTree(
        data = listOf(
            TreeNode(
                id = "acme",
                name = "Acme",
                children = listOf(
                    TreeNode(id = "acme-hq", name = "Acme HQ"),
                    TreeNode(id = "acme-lab", name = "Acme Lab")
                )
            ),
            TreeNode(id = "initech", name = "Initech")
        ),
        modifier = Modifier.height(240.dp),
        selectedIds = checked,
        onSelectedIdsChange = { checked = it },
        checkable = true,
        checkRule = KozmosTreeCheckRule.Independent
    )
}
