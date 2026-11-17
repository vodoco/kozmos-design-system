package com.kozmos.components.radio

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Map
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1436")
@FigmaVariant("Variant", "Default")
class KozmosRadioConnect {
    // Decision 191: Mixed is an option of a mixed group, unchosen, with the
    // group's "Multiple values" line under it.
    @FigmaProperty(FigmaType.Enum, "Checked")
    val checked: String = Figma.mapping(
        "Unchecked" to "unchecked",
        "Checked" to "checked",
        "Mixed" to "mixed"
    )

    @FigmaProperty(FigmaType.Text, "Mixed Text")
    val mixedLabel: String = "Multiple values"

    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Option"

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Disabled" to "disabled",
        "Error" to "error"
    )

    @FigmaProperty(FigmaType.Boolean, "Show Description")
    val showDescription: Boolean = false

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Shown on every floor"

    @Composable
    fun ComponentExample() {
        KozmosRadioGroup(mixed = checked == "mixed", mixedLabel = mixedLabel) {
            KozmosRadioGroupItem(
                value = "option",
                selectedValue = if (checked == "checked") "option" else "",
                onOptionSelected = {},
                label = label,
                enabled = state != "disabled",
                error = state == "error",
                description = if (showDescription) description else null
            )
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1436")
@FigmaVariant("Variant", "Card")
class KozmosRadioCardConnect {
    // Decision 191: Mixed is an option of a mixed group, unchosen, with the
    // group's "Multiple values" line under it.
    @FigmaProperty(FigmaType.Enum, "Checked")
    val checked: String = Figma.mapping(
        "Unchecked" to "unchecked",
        "Checked" to "checked",
        "Mixed" to "mixed"
    )

    @FigmaProperty(FigmaType.Text, "Mixed Text")
    val mixedLabel: String = "Multiple values"

    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Vector"

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Disabled" to "disabled",
        "Error" to "error"
    )

    @FigmaProperty(FigmaType.Boolean, "Show Description")
    val showDescription: Boolean = false

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Drawn from the building's plans"

    // GAP-158: the card's image or the tile's icon, shown or not.
    @FigmaProperty(FigmaType.Boolean, "Show Media")
    val showMedia: Boolean = true

    @Composable
    fun ComponentExample() {
        KozmosRadioGroup(mixed = checked == "mixed", mixedLabel = mixedLabel) {
            KozmosRadioGroupItem(
                value = "option",
                selectedValue = if (checked == "checked") "option" else "",
                onOptionSelected = {},
                label = label,
                enabled = state != "disabled",
                error = state == "error",
                description = if (showDescription) description else null,
                variant = KozmosRadioGroupItemVariant.Card,
                media = if (showMedia) {
                    { Icon(Icons.Default.Map, contentDescription = null) }
                } else {
                    null
                }
            )
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1436")
@FigmaVariant("Variant", "Tile")
class KozmosRadioTileConnect {
    // Decision 191: Mixed is an option of a mixed group, unchosen, with the
    // group's "Multiple values" line under it.
    @FigmaProperty(FigmaType.Enum, "Checked")
    val checked: String = Figma.mapping(
        "Unchecked" to "unchecked",
        "Checked" to "checked",
        "Mixed" to "mixed"
    )

    @FigmaProperty(FigmaType.Text, "Mixed Text")
    val mixedLabel: String = "Multiple values"

    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Fade"

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Disabled" to "disabled",
        "Error" to "error"
    )

    @FigmaProperty(FigmaType.Boolean, "Show Description")
    val showDescription: Boolean = false

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Eases in"

    // GAP-158: the card's image or the tile's icon, shown or not.
    @FigmaProperty(FigmaType.Boolean, "Show Media")
    val showMedia: Boolean = true

    @Composable
    fun ComponentExample() {
        KozmosRadioGroup(mixed = checked == "mixed", mixedLabel = mixedLabel) {
            KozmosRadioGroupItem(
                value = "option",
                selectedValue = if (checked == "checked") "option" else "",
                onOptionSelected = {},
                label = label,
                enabled = state != "disabled",
                error = state == "error",
                description = if (showDescription) description else null,
                variant = KozmosRadioGroupItemVariant.Tile,
                media = if (showMedia) {
                    { Icon(Icons.Default.Map, contentDescription = null) }
                } else {
                    null
                }
            )
        }
    }
}
