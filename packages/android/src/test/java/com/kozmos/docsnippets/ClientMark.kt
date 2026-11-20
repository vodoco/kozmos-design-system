// Avatar.mdx's Compose snippet ("Sizes"), word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.avatar.KozmosAvatar
import com.kozmos.components.avatar.KozmosAvatarSize

// 24, for a row that keeps its own height (decision 221).
@Composable
fun ClientMark() {
    KozmosAvatar(imageUrl = null, fallbackText = "AA", size = KozmosAvatarSize.Sm)
}
