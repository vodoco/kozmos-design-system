// Dialog.mdx's Compose snippet ("Media above the title"), word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import com.kozmos.components.dialog.KozmosDialog
import com.kozmos.components.dialog.KozmosDialogMedia

// An illustration above the title, out to the dialog's edges and top corners.
// Left unnamed it is decorative; a label names it as one image.
@Composable
fun AnalyticsInvite(illustration: Painter, onContactSales: () -> Unit, onDismiss: () -> Unit) {
    KozmosDialog(
        onDismissRequest = onDismiss,
        title = "Interested in Analytics?",
        description = "See how people move through your buildings, floor by floor.",
        primaryActionText = "Contact sales",
        onPrimaryAction = onContactSales,
        media = KozmosDialogMedia(bleed = true) {
            Image(
                painter = illustration,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxWidth().height(160.dp)
            )
        }
    )
}
