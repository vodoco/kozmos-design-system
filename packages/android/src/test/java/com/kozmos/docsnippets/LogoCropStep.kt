// ImageCropper.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.painter.Painter
import com.kozmos.components.imagecropper.KozmosImageCrop
import com.kozmos.components.imagecropper.KozmosImageCropper

// The client logo's crop step: a square frame. crop starts null, the
// middle at 100%, and onCropChange is handed the frame it draws, as
// fractions of the image: the product crops. TalkBack reads the frame as
// one node, with actions that move and zoom it.
@Composable
fun LogoCropStep(logo: Painter) {
    var crop by remember { mutableStateOf<KozmosImageCrop?>(null) }
    KozmosImageCropper(
        painter = logo,
        contentDescription = "Client logo",
        crop = crop,
        onCropChange = { crop = it },
        aspectRatio = 1f
    )
}
