// Menu.mdx's Compose snippet ("An item that leaves the app"), word for word
// below the package line: compiled here, so a renamed or removed parameter
// fails in this target rather than in a reader's project. Change the two
// together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Box
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalUriHandler
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.menu.KozmosMenu
import com.kozmos.components.menu.KozmosMenuContent
import com.kozmos.components.menu.KozmosMenuItem

// external draws Pointr's new-tab icon at the item's end and labels its
// click "open in your browser", which TalkBack reads as "Double-tap to open
// in your browser"; externalLabel takes your words. Opening the page is
// still yours, in onItemClick.
@Composable
fun HelpMenu() {
    var expanded by remember { mutableStateOf(false) }
    val uriHandler = LocalUriHandler.current
    Box {
        KozmosButton(onClick = { expanded = true }) { Text("Help") }
        KozmosMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false },
            content = KozmosMenuContent(
                items = listOf(
                    KozmosMenuItem(text = "Keyboard shortcuts"),
                    KozmosMenuItem(text = "Help centre", external = true)
                )
            ),
            onItemClick = { item ->
                if (item.external) uriHandler.openUri("https://help.example.com")
            }
        )
    }
}
