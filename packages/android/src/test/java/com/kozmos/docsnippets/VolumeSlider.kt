// Slider.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.kozmos.components.fieldwrapper.KozmosFieldWrapper
import com.kozmos.components.slider.KozmosSlider

// The slider draws no label: KozmosFieldWrapper puts one above it, and
// TalkBack says the one the slider is given.
@Composable
fun VolumeSlider(volume: Float, onVolumeChange: (Float) -> Unit) {
    KozmosFieldWrapper(label = "Volume") {
        KozmosSlider(
            value = volume,
            onValueChange = onVolumeChange,
            valueRange = 0f..100f,
            modifier = Modifier.semantics { contentDescription = "Volume" }
        )
    }
}
