// Box.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.box.KozmosBox
import com.kozmos.components.text.KozmosText

// KozmosBox is Compose's Box and adds nothing to it: what it holds stacks
// at its top-start corner, one child over the next.
@Composable
fun OverviewBox() {
    KozmosBox {
        KozmosText(text = "Venue overview")
    }
}
