package com.kozmos.components.progress

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant
import com.kozmos.components.KozmosEmotion

// The bar: the set's Shape=Linear variants with a value, in the flow or at
// the top (Placement, GAP-159). One mapping per Value, so Value=Indeterminate
// (below) matches only the indeterminate bar's: a mapping on Shape alone
// matched it too, and Figma could show a value for a bar that has none.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252")
@FigmaVariant("Shape", "Linear")
@FigmaVariant("Value", "0")
class KozmosProgress0Connect {
    @FigmaProperty(FigmaType.Enum, "Placement")
    val placement: KozmosProgressPlacement = Figma.mapping(
        "Inline" to KozmosProgressPlacement.Inline,
        "Top" to KozmosProgressPlacement.Top
    )

    @Composable
    fun ComponentExample() {
        KozmosProgress(progress = 0f, placement = placement)
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252")
@FigmaVariant("Shape", "Linear")
@FigmaVariant("Value", "25")
class KozmosProgress25Connect {
    @FigmaProperty(FigmaType.Enum, "Placement")
    val placement: KozmosProgressPlacement = Figma.mapping(
        "Inline" to KozmosProgressPlacement.Inline,
        "Top" to KozmosProgressPlacement.Top
    )

    @Composable
    fun ComponentExample() {
        KozmosProgress(progress = 0.25f, placement = placement)
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252")
@FigmaVariant("Shape", "Linear")
@FigmaVariant("Value", "50")
class KozmosProgress50Connect {
    @FigmaProperty(FigmaType.Enum, "Placement")
    val placement: KozmosProgressPlacement = Figma.mapping(
        "Inline" to KozmosProgressPlacement.Inline,
        "Top" to KozmosProgressPlacement.Top
    )

    @Composable
    fun ComponentExample() {
        KozmosProgress(progress = 0.5f, placement = placement)
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252")
@FigmaVariant("Shape", "Linear")
@FigmaVariant("Value", "75")
class KozmosProgress75Connect {
    @FigmaProperty(FigmaType.Enum, "Placement")
    val placement: KozmosProgressPlacement = Figma.mapping(
        "Inline" to KozmosProgressPlacement.Inline,
        "Top" to KozmosProgressPlacement.Top
    )

    @Composable
    fun ComponentExample() {
        KozmosProgress(progress = 0.75f, placement = placement)
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252")
@FigmaVariant("Shape", "Linear")
@FigmaVariant("Value", "100")
class KozmosProgress100Connect {
    @FigmaProperty(FigmaType.Enum, "Placement")
    val placement: KozmosProgressPlacement = Figma.mapping(
        "Inline" to KozmosProgressPlacement.Inline,
        "Top" to KozmosProgressPlacement.Top
    )

    @Composable
    fun ComponentExample() {
        KozmosProgress(progress = 1f, placement = placement)
    }
}

// The indeterminate bar (GAP-159): Shape=Linear, Value=Indeterminate, a
// segment sweeping from the inline start, in the flow or at the top.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252")
@FigmaVariant("Shape", "Linear")
@FigmaVariant("Value", "Indeterminate")
class KozmosProgressIndeterminateConnect {
    @FigmaProperty(FigmaType.Enum, "Placement")
    val placement: KozmosProgressPlacement = Figma.mapping(
        "Inline" to KozmosProgressPlacement.Inline,
        "Top" to KozmosProgressPlacement.Top
    )

    @Composable
    fun ComponentExample() {
        KozmosProgress(placement = placement)
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
