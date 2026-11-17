// FileUpload.mdx's Compose snippet ("A button"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import android.net.Uri
import androidx.compose.runtime.Composable
import com.kozmos.components.fileupload.KozmosFileUpload
import com.kozmos.components.fileupload.KozmosFileUploadPreview
import com.kozmos.components.fileupload.KozmosFileUploadVariant

@Composable
fun ClientLogoButton(onLogoChosen: (Uri) -> Unit) {
    KozmosFileUpload(
        browseLabel = "Add logo",
        preview = KozmosFileUploadPreview.Image,
        variant = KozmosFileUploadVariant.Button,
        onFileSelected = onLogoChosen
    )
}
