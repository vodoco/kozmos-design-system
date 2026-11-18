// FileUpload.mdx's Compose snippet ("Limits and their messages"), word for
// word below the package line: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project. Change
// the two together.
package com.kozmos.docsnippets

import android.net.Uri
import androidx.compose.runtime.Composable
import com.kozmos.components.fileupload.KozmosFileUpload

@Composable
fun FloorPlans(onPlansChosen: (List<Uri>) -> Unit) {
    KozmosFileUpload(
        browseLabel = "Grundrisse hochladen",
        maxSize = 10L * 1024 * 1024,
        maxFiles = 3,
        tooManyFilesLabel = { "Höchstens $it Dateien." },
        tooLargeLabel = { name, limit -> "$name ist größer als $limit." },
        onFilesChange = onPlansChosen,
        onFileSelected = {}
    )
}
