package com.kozmos.components.imagecropper

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.painterResource
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

// GAP-273: the ImageCropper set, built by the importer in the live file.
// Ratio is the frame's shape: Square is 1, Landscape 16:9.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2516-15104")
class KozmosImageCropperConnect {
    @FigmaProperty(FigmaType.Enum, "Ratio")
    val aspectRatio: Float = Figma.mapping(
        "Square" to 1f,
        "Landscape" to 16f / 9f
    )

    @FigmaProperty(FigmaType.Boolean, "Zoom Controls")
    val showZoomControls: Boolean = true

    @Composable
    fun ComponentExample() {
        KozmosImageCropper(
            painter = painterResource(android.R.drawable.ic_menu_gallery),
            contentDescription = "Client logo",
            crop = null,
            onCropChange = {},
            aspectRatio = aspectRatio,
            showZoomControls = showZoomControls
        )
    }
}
