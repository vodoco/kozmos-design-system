// Text.mdx's Compose snippet ("Display size"), word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import com.kozmos.components.text.KozmosText
import com.kozmos.components.text.KozmosTextStyle

// A figure at the display size, 48sp bold on 54sp lines, over its label.
@Composable
fun VisitorCount() {
    Column {
        KozmosText(text = "1,284", style = KozmosTextStyle.Display)
        KozmosText(text = "Visitors today", style = KozmosTextStyle.Subheadline)
    }
}
