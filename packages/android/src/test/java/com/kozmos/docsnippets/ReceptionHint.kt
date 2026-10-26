// Text.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.text.KozmosText

// Body text. style names a step on the type ramp, such as
// KozmosTextStyle.Footnote, as SwiftUI's does; left out, the words draw in
// the style around them. Compose's KozmosText has no tone or truncation.
@Composable
fun ReceptionHint() {
    KozmosText(text = "Find your way to reception.")
}
