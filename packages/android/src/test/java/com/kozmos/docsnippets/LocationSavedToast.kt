// Toast.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.toast.KozmosToast
import com.kozmos.tokens.KozmosDimensions

// This KozmosToast draws where you put it and stays until its close button,
// named by closeLabel ("Dismiss notification" unless you pass your own),
// calls onDismiss: it does not time out.
// KozmosToast(hostState) draws a SnackbarHostState's snackbars the same way,
// with a message, an action and a close button, but no description.
@Composable
fun LocationSavedToast() {
    var isOpen by remember { mutableStateOf(false) }
    Box(modifier = Modifier.fillMaxSize()) {
        KozmosButton(onClick = { isOpen = true }) { Text("Show toast") }
        if (isOpen) {
            KozmosToast(
                title = "Location saved",
                description = "Find it in your saved places.",
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(KozmosDimensions.primitivesLayoutSpacing300),
                onDismiss = { isOpen = false }
            )
        }
    }
}
