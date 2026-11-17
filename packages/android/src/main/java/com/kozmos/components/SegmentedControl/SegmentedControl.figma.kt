package com.kozmos.components.segmentedcontrol

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=309-5165")
class KozmosSegmentedControlConnect {
    @FigmaProperty(FigmaType.Text, "Item 1 Text")
    val item1Text: String = "Overview"

    @FigmaProperty(FigmaType.Text, "Item 2 Text")
    val item2Text: String = "Details"

    @FigmaProperty(FigmaType.Text, "Item 3 Text")
    val item3Text: String = "Activity"

    @FigmaProperty(FigmaType.Enum, "Size")
    val size: SegmentedControlSize = Figma.mapping(
        "Small" to SegmentedControlSize.Sm,
        "Default" to SegmentedControlSize.Default,
        "Large" to SegmentedControlSize.Lg
    )

    @FigmaProperty(FigmaType.Enum, "Active")
    val activeIndex: Int = Figma.mapping(
        "One" to 0,
        "Two" to 1,
        "Three" to 2
    )

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Focus" to "focus",
        "Disabled" to "disabled",
        "Error" to "error",
        "Mixed" to "mixed"
    )

    // Decision 191: no option chosen, and the "Multiple values" line. Mixed
    // Text is mapped once the owner's plugin Update has put it in the
    // library: the dry run reads the live file.

    @Composable
    fun ComponentExample() {
        KozmosSegmentedControl(
            options = listOf(item1Text, item2Text, item3Text),
            selectedIndex = activeIndex,
            onOptionSelected = {},
            size = size,
            enabled = state != "disabled",
            mixed = state == "mixed"
        )
    }
}
