// BottomSheet.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.kozmos.components.bottomsheet.KozmosBottomSheet
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.text.KozmosText
import com.kozmos.components.text.KozmosTextStyle
import com.kozmos.tokens.KozmosDimensions

// The sheet is open while it is composed; a swipe down or a tap outside asks
// for it to close. It draws a drag handle, and no title, description, close
// button or padding of its own: the content pads itself. KozmosText sets the
// title in the headline style, as SwiftUI's; it takes no tone, so the
// description is not muted as SwiftUI's is.
@Composable
fun LocationDetailsSheet() {
    var isOpen by remember { mutableStateOf(false) }
    KozmosButton(onClick = { isOpen = true }) { Text("Show details") }
    if (isOpen) {
        KozmosBottomSheet(onDismissRequest = { isOpen = false }) {
            Column(
                modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing300),
                verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
            ) {
                KozmosText(text = "Location details", style = KozmosTextStyle.Headline)
                KozmosText(text = "Reception is on the ground floor.")
            }
        }
    }
}
