// FileUpload.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import android.net.Uri
import androidx.compose.runtime.Composable
import com.kozmos.components.fieldwrapper.KozmosFieldWrapper
import com.kozmos.components.fileupload.KozmosFileUpload

// One file of any type, picked with the system's picker: no drag and drop, no
// second file, no type or size limit and no message. The part draws no label,
// so KozmosFieldWrapper puts one above it. Picking a file hands you its Uri
// and uploads nothing; removing it hands you the same Uri. browseLabel and
// removeLabel are its words, "Tap to upload file" and "Remove" unless you
// pass your own.
@Composable
fun DocumentUpload(receive: (Uri) -> Unit, drop: (Uri) -> Unit) {
    KozmosFieldWrapper(label = "Documents") {
        KozmosFileUpload(onFileRemoved = drop, onFileSelected = receive)
    }
}
