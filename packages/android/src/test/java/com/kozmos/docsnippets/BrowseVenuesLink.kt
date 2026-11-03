// Link.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import com.kozmos.components.link.KozmosLink

// Underlined text in the theme colour, with no destination: a press calls
// onClick, and where it goes is yours. TalkBack is told no role, so it does
// not hear a link. There is no subtle variant. A link that leaves the app is
// external: it draws the new-tab icon after its last word, and TalkBack says
// "Double-tap to open in your browser".
@Composable
fun BrowseVenuesLink(showVenues: () -> Unit, openPrivacyPolicy: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KozmosLink(text = "Browse venues", onClick = showVenues)
        KozmosLink(text = "Privacy Policy", onClick = openPrivacyPolicy, external = true)
    }
}
