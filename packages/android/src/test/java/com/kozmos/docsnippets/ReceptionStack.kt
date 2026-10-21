// Stack.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.stack.KozmosStack
import com.kozmos.components.text.KozmosText

// A column with Kozmos's spacing between its children, 8dp by default, on
// its start edge. It takes no alignment, wrap or justify, and its children
// are in no ColumnScope, so none can take a weight.
@Composable
fun ReceptionStack() {
    KozmosStack {
        KozmosText(text = "Reception")
        KozmosText(text = "Ground floor")
    }
}
