package com.kozmos.components.chip

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.KozmosEmotion

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=227-1329")
class KozmosChipConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Chip"

    @FigmaProperty(FigmaType.Enum, "Variant")
    val variant: ChipVariant = Figma.mapping(
        "Neutral" to ChipVariant.Neutral,
        "Brand" to ChipVariant.Brand,
        "Destructive" to ChipVariant.Destructive
    )

    // GAP-170, decision 200: one of Tag's six emotions, deciding the colour
    // whatever the Variant. None is a chip in its variant's colours.
    @FigmaProperty(FigmaType.Enum, "Emotion")
    val emotion: KozmosEmotion? = Figma.mapping(
        "None" to null,
        "Themed" to KozmosEmotion.Themed,
        "Neutral" to KozmosEmotion.Neutral,
        "Success" to KozmosEmotion.Success,
        "Danger" to KozmosEmotion.Danger,
        "Informative" to KozmosEmotion.Informative,
        "Alert" to KozmosEmotion.Alert
    )

    @FigmaProperty(FigmaType.Enum, "Size")
    val size: ChipSize = Figma.mapping(
        "Small" to ChipSize.Sm,
        "Default" to ChipSize.Default,
        "Large" to ChipSize.Lg
    )

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Selected" to "selected",
        "Disabled" to "disabled"
    )

    @FigmaProperty(FigmaType.Enum, "Removable")
    val removable: Boolean = Figma.mapping(
        "False" to false,
        "True" to true
    )

    @Composable
    fun ComponentExample() {
        KozmosChip(
            text = label,
            emotion = emotion,
            variant = variant,
            size = size,
            selected = state == "selected",
            enabled = state != "disabled",
            onRemove = if (removable) ({}) else null
        )
    }
}
