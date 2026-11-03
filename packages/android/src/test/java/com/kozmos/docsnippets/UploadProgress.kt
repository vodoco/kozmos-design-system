// Progress.mdx's Compose snippet ("Implementation"), word for word below
// the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.kozmos.components.progress.KozmosProgress

// progress is a fraction of 1: Compose takes no max, so 25 of 50 is 0.5.
// The bar has no name of its own: TalkBack says the one it is given.
@Composable
fun UploadProgress() {
    KozmosProgress(
        progress = 25f / 50f,
        modifier = Modifier.semantics { contentDescription = "Upload progress" }
    )
}
