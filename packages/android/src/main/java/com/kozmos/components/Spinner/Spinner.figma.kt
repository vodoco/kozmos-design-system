package com.kozmos.components.spinner

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-261")
class KozmosSpinnerConnect {
    @FigmaProperty(FigmaType.Enum, "Size")
    val size: KozmosSpinnerSize = Figma.mapping(
        "Small" to KozmosSpinnerSize.Sm,
        "Medium" to KozmosSpinnerSize.Md,
        "Large" to KozmosSpinnerSize.Lg,
        "XLarge" to KozmosSpinnerSize.Xl
    )

    @Composable
    fun ComponentExample() {
        // The size is the component's own now, not a modifier around it: until
        // 2026-09-22 `KozmosSpinner` took none and Dev Mode showed a spinner
        // wrapped in a `Modifier.size`, which is not how a caller should write
        // one.
        KozmosSpinner(size = size)
    }
}
