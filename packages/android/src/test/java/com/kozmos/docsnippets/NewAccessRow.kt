// Table.mdx's Compose snippet ("Highlighting a new row"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.table.KozmosTable
import com.kozmos.components.table.KozmosTableCell
import com.kozmos.components.table.KozmosTableHeaderCell
import com.kozmos.components.table.KozmosTableRow
import com.kozmos.components.table.KozmosTableRowHighlight

// The row just added tints in the informative surface, then fades.
@Composable
fun NewAccessRow(added: String?) {
    val people = listOf("Ada Lovelace", "Grace Hopper")
    KozmosTable(
        header = {
            KozmosTableRow {
                KozmosTableHeaderCell(text = "Name")
            }
        }
    ) {
        people.forEach { name ->
            KozmosTableRow(highlight = if (name == added) KozmosTableRowHighlight.New else null) {
                KozmosTableCell(text = name)
            }
        }
    }
}
