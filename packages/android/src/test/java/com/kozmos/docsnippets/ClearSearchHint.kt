// Kbd.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import com.kozmos.components.kbd.KozmosKbd
import com.kozmos.components.text.KozmosText
import com.kozmos.tokens.KozmosDimensions

// A key is drawn as you write it and read by its name: TalkBack reads this
// Esc as "Escape". keys = listOf("Ctrl", "K") draws a combination, read
// "Control+K"; label replaces what is read.
@Composable
fun ClearSearchHint() {
    Row(
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50),
        verticalAlignment = Alignment.CenterVertically
    ) {
        KozmosText(text = "Press")
        KozmosKbd(key = "Esc")
        KozmosText(text = "to clear")
    }
}
