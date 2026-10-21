// Table.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.table.KozmosTable
import com.kozmos.components.table.KozmosTableCell
import com.kozmos.components.table.KozmosTableHeaderCell
import com.kozmos.components.table.KozmosTableRow

// The header row goes in header, the body rows in the content. A cell takes
// a String, and the cells in a row share its width by weight, 1 each by
// default. There is no caption: React's TableCaption has no counterpart.
@Composable
fun PlacesTable() {
    KozmosTable(
        header = {
            KozmosTableRow {
                KozmosTableHeaderCell(text = "Name")
                KozmosTableHeaderCell(text = "Floor")
            }
        }
    ) {
        KozmosTableRow {
            KozmosTableCell(text = "Reception")
            KozmosTableCell(text = "Ground")
        }
    }
}
