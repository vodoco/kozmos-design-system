// Dialog.mdx's Compose snippet ("Full size"), word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.ContentScale
import com.kozmos.components.dialog.KozmosDialog
import com.kozmos.components.dialog.KozmosDialogSize
import com.kozmos.components.text.KozmosText
import com.kozmos.components.text.KozmosTextStyle

// The window less 16 on each side: the words keep their height and the
// image takes the rest, as large as it fits.
@Composable
fun ImagePreview(image: Painter, onDismiss: () -> Unit) {
    KozmosDialog(onDismissRequest = onDismiss, size = KozmosDialogSize.Full) {
        Column(modifier = Modifier.fillMaxSize()) {
            KozmosText(text = "Image 1", style = KozmosTextStyle.Title3)
            KozmosText(text = "Main entrance", style = KozmosTextStyle.Subheadline)
            Image(
                painter = image,
                contentDescription = "Main entrance",
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}
