package com.kozmos.components.progress

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant
import com.kozmos.components.KozmosEmotion

// The bar: the set's Shape=Linear variants.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252")
@FigmaVariant("Shape", "Linear")
class KozmosProgressConnect {
    @FigmaProperty(FigmaType.Enum, "Value")
    val value: String = Figma.mapping(
        "0" to "0",
        "25" to "25",
        "50" to "50",
        "75" to "75",
        "100" to "100"
    )

    @Composable
    fun ComponentExample() {
        KozmosProgress(progress = (value.toFloatOrNull() ?: 0f) / 100f)
    }
}

// The ring (decision 131): the Shape=Circular variants, with their Size,
// Tone and Label, in the hole or beside the dial (Label Beside).
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252")
@FigmaVariant("Shape", "Circular")
class KozmosProgressCircularConnect {
    @FigmaProperty(FigmaType.Enum, "Value")
    val value: String = Figma.mapping(
        "0" to "0",
        "25" to "25",
        "50" to "50",
        "75" to "75",
        "100" to "100"
    )

    @FigmaProperty(FigmaType.Enum, "Size")
    val size: KozmosProgressSize = Figma.mapping(
        "Small" to KozmosProgressSize.Sm,
        "Medium" to KozmosProgressSize.Md,
        "Large" to KozmosProgressSize.Lg
    )

    @FigmaProperty(FigmaType.Enum, "Tone")
    val tone: KozmosEmotion = Figma.mapping(
        "Themed" to KozmosEmotion.Themed,
        "Neutral" to KozmosEmotion.Neutral,
        "Success" to KozmosEmotion.Success,
        "Danger" to KozmosEmotion.Danger,
        "Informative" to KozmosEmotion.Informative,
        "Alert" to KozmosEmotion.Alert
    )

    @FigmaProperty(FigmaType.Boolean, "Label Beside")
    val labelPlacement: KozmosProgressLabelPlacement = Figma.mapping(
        true to KozmosProgressLabelPlacement.End,
        false to KozmosProgressLabelPlacement.Center
    )

    // Show Label is not mapped: the label is always shown.
    @FigmaProperty(FigmaType.Text, "Label")
    val label: String = "Label"

    @Composable
    fun ComponentExample() {
        KozmosProgress(
            progress = (value.toFloatOrNull() ?: 0f) / 100f,
            shape = KozmosProgressShape.Circular,
            size = size,
            tone = tone,
            labelPlacement = labelPlacement
        ) {
            Text(label)
        }
    }
}
