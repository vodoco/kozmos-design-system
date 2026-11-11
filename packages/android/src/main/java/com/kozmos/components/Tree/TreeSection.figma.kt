package com.kozmos.components.tree

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

// The TreeSection set is new: its node id is TBD until the plugin builds it,
// so this file stays out of figma.linked.config.json until then.
// GAP-151: a section heading, as Compose's TreeSectionRow. Count Text is a
// sample in the design; in code the count is the product's number.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD")
class KozmosTreeSectionConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val name: String = "POI"

    @FigmaProperty(FigmaType.Boolean, "Show Count")
    val showCount: Boolean = true

    @FigmaProperty(FigmaType.Text, "Count Text")
    val countText: String = "120"

    @FigmaProperty(FigmaType.Enum, "Depth")
    val depth: Int = Figma.mapping(
        "0" to 0,
        "1" to 1,
        "2" to 2
    )

    @FigmaProperty(FigmaType.Enum, "Density")
    val density: KozmosTreeDensity = Figma.mapping(
        "Default" to KozmosTreeDensity.Default,
        "Compact" to KozmosTreeDensity.Compact
    )

    @Composable
    fun ComponentExample() {
        TreeSectionRow(
            name = name,
            // "3,257" reads as 3257; words that are no number draw no count.
            count = if (showCount) countText.filterNot { it in ",. '\u00A0\u202F" }.toIntOrNull() else null,
            depth = depth,
            density = density
        )
    }
}
