// Tag.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.tag.KozmosTag

// The words are a String: a tag holds nothing else. variant and emotion
// colour it, and an onRemove adds a remove button named by removeLabel.
@Composable
fun OpenNowTag() {
    KozmosTag(text = "Open now")
}
