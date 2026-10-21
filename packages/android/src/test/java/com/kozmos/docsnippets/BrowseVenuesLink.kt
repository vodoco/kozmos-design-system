// Link.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.link.KozmosLink

// Underlined text in the theme colour, with no destination: a press calls
// onClick, and where it goes is yours. TalkBack is told no role, so it does
// not hear a link. There is no subtle variant.
@Composable
fun BrowseVenuesLink(showVenues: () -> Unit) {
    KozmosLink(text = "Browse venues", onClick = showVenues)
}
