// Table.mdx's Compose snippet ("Sorting and numbers"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.table.KozmosTable
import com.kozmos.components.table.KozmosTableCell
import com.kozmos.components.table.KozmosTableHeaderCell
import com.kozmos.components.table.KozmosTableRow

// Compose's table has no sortable header or numeric column (GAP-037 is for
// the web and Vue): order the rows before you draw them.
@Composable
fun FloorCounts() {
    val floors = listOf("Roof" to 3, "Ground" to 1204)
    KozmosTable(
        header = {
            KozmosTableRow {
                KozmosTableHeaderCell(text = "Floor")
                KozmosTableHeaderCell(text = "POIs")
            }
        }
    ) {
        floors.sortedByDescending { it.second }.forEach { (name, pois) ->
            KozmosTableRow {
                KozmosTableCell(text = name)
                KozmosTableCell(text = pois.toString())
            }
        }
    }
}
