// Heading.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.heading.KozmosHeading

// A level-1 heading unless level says otherwise: the level sets its size.
// TalkBack says "heading" but not which level, as Compose's semantics have
// none. Its text is a String, and there is no `as`.
@Composable
fun VenueHeading() {
    KozmosHeading(text = "Venue overview")
}
