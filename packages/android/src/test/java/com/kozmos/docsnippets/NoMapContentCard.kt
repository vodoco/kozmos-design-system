// EmptyState.mdx's Compose snippet ("A tone"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.KozmosEmotion
import com.kozmos.components.emptystate.KozmosEmptyState

@Composable
fun NoMapContentCard() {
    KozmosEmptyState(
        title = "No Map Content Found",
        description = "Nothing on this level matches your search.",
        list = listOf("Check the building and level", "Clear the type filters"),
        listLabel = "What to try",
        tone = KozmosEmotion.Alert
    )
}
