// Avatar.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import com.kozmos.components.avatar.KozmosAvatar

// The initials show only when imageUrl is null: loading or failed, the image
// leaves an empty circle. The avatar takes no alt text: TalkBack says the
// description it is given.
@Composable
fun ProfileAvatar() {
    KozmosAvatar(
        imageUrl = "https://github.com/shadcn.png",
        fallbackText = "CN",
        modifier = Modifier.clearAndSetSemantics { contentDescription = "@shadcn" }
    )
}
