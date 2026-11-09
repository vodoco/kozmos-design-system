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
import kotlin.math.roundToInt

// The readout stays at the slider's end, at rest too. TalkBack hears the
// value once, from the slider, in the readout's words.
@Composable
fun FloorPlanOpacity(opacity: Float, onOpacityChange: (Float) -> Unit) {
    KozmosFieldWrapper(label = "Floor-plan opacity") {
        KozmosSlider(
            value = opacity,
            onValueChange = onOpacityChange,
            showValue = true,
            formatValue = { "${(it * 100).roundToInt()}%" },
            modifier = Modifier.semantics { contentDescription = "Floor-plan opacity" }
        )
    }
}
