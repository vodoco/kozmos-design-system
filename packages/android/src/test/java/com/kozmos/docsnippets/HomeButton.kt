// IconButton.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.runtime.Composable
import com.kozmos.components.iconbutton.KozmosIconButton

// An action with no words of its own. The icon is an ImageVector, not a
// Kozmos icon's name (KozmosIcon's "home-line" draws Material's Home), and
// contentDescription is what TalkBack says, as aria-label is on the web.
@Composable
fun HomeButton(goHome: () -> Unit) {
    KozmosIconButton(
        icon = Icons.Default.Home,
        onClick = goHome,
        contentDescription = "Home"
    )
}
