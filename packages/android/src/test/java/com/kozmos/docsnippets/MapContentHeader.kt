// PageHeader.mdx's Compose snippet ("A title addon"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.KozmosEmotion
import com.kozmos.components.pageheader.KozmosPageHeader
import com.kozmos.components.tag.KozmosTag

@Composable
fun MapContentHeader() {
    KozmosPageHeader(
        title = "Map Content",
        titleAddon = { KozmosTag(text = "Changes Awaiting Publish", emotion = KozmosEmotion.Alert) }
    )
}
