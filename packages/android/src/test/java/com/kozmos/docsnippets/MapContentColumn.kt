// Container.mdx's Compose snippet ("Top and bottom space"), word for word
// below the package line: compiled here, so a renamed or removed parameter
// fails in this target rather than in a reader's project. Change the two
// together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.container.KozmosContainer
import com.kozmos.components.container.KozmosContainerBlock
import com.kozmos.components.container.KozmosContainerInset
import com.kozmos.components.text.KozmosText

// A page column's own space: 16 above and below it, and 16 a side.
@Composable
fun MapContentColumn() {
    KozmosContainer(KozmosContainerInset.Panel, block = KozmosContainerBlock.Sm) {
        KozmosText(text = "Map content")
    }
}
