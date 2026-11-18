// Table.mdx's Compose snippet ("Selecting rows"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.table.KozmosTable
import com.kozmos.components.table.KozmosTableCell
import com.kozmos.components.table.KozmosTableHeaderCell
import com.kozmos.components.table.KozmosTableRow
import com.kozmos.components.table.KozmosTableSelectAllCell

// Each row's checkbox selects it; the header's selects every row, mixed
// while some are, and TalkBack hears how many are selected.
@Composable
fun UserSelection() {
    val users = listOf("Ada Lovelace", "Grace Hopper")
    var selected by remember { mutableStateOf(setOf<String>()) }
    KozmosTable(
        header = {
            KozmosTableRow {
                KozmosTableSelectAllCell(
                    selectedCount = users.count { it in selected },
                    rowCount = users.size,
                    onSelectAllChange = { all -> selected = if (all) users.toSet() else emptySet() }
                )
                KozmosTableHeaderCell(text = "Name")
            }
        }
    ) {
        users.forEach { name ->
            KozmosTableRow(
                selected = name in selected,
                onSelectedChange = { on -> selected = if (on) selected + name else selected - name },
                selectLabel = "Select " + name
            ) {
                KozmosTableCell(text = name)
            }
        }
    }
}
