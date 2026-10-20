// Text.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.text.KozmosText

// Body text. Compose's KozmosText takes the words and a modifier, nothing
// else: it has no style, tone or truncation, and draws in the ambient style.
@Composable
fun ReceptionHint() {
    KozmosText(text = "Find your way to reception.")
}
