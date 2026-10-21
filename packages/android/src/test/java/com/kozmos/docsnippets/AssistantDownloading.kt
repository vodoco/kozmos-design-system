// EmptyState.mdx's Compose snippet ("A wait it explains"), word for word below
// the package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project, and read by
// KozmosEmptyStateProgressTest. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.emptystate.KozmosEmptyState
import com.kozmos.components.emptystate.KozmosEmptyStateProgress

@Composable
fun AssistantDownloading() {
    KozmosEmptyState(
        title = "The assistant isn't downloaded yet",
        description = "It works offline once it's on this device.",
        progress = KozmosEmptyStateProgress(0.4f, "Downloading the assistant", "12 of 30 MB")
    )
}
