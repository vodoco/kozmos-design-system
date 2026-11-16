package com.kozmos.components.fileupload

import androidx.compose.runtime.Composable
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=444-12724")
class KozmosFileUploadConnect {
    @Composable
    fun ComponentExample() {
        KozmosFileUpload(onFileSelected = {})
    }
}

// Content=Preview: one image, shown with Change and Remove (GAP-270).
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=444-12724")
@FigmaVariant("Content", "Preview")
class KozmosFileUploadPreviewConnect {
    @FigmaProperty(FigmaType.Text, "Change Text")
    val changeLabel: String = "Change"

    @Composable
    fun ComponentExample() {
        KozmosFileUpload(
            preview = KozmosFileUploadPreview.Image,
            changeLabel = changeLabel,
            onFileSelected = {}
        )
    }
}
