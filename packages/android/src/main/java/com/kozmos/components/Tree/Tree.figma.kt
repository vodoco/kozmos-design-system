package com.kozmos.components.tree

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=662-5094")
class KozmosTreeConnect {
    @FigmaProperty(FigmaType.Enum, "Density")
    val density: KozmosTreeDensity = Figma.mapping(
        "Default" to KozmosTreeDensity.Default,
        "Compact" to KozmosTreeDensity.Compact
    )

    @Composable
    fun ComponentExample() {
        KozmosTree(
            data = listOf(
                TreeNode(
                    id = "map-content",
                    name = "Map content",
                    children = listOf(
                        TreeNode(id = "places", name = "Places"),
                        TreeNode(id = "amenities", name = "Amenities")
                    )
                ),
                TreeNode(
                    id = "reports",
                    name = "Reports",
                    children = listOf(
                        TreeNode(id = "daily-summary", name = "Daily summary")
                    )
                )
            ),
            density = density
        )
    }
}

// The rows a designer puts in Tree's Content Slot, as Compose's TreeItem,
// Divided as a divided row (GAP-201).
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=684-6080")
class KozmosTreeParentItemConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val name: String = "Map content"

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

    @FigmaProperty(FigmaType.Boolean, "Divided")
    val divided: Boolean = false

    // GAP-107: Meta Below draws Meta Text on a line under the label.
    @FigmaProperty(FigmaType.Boolean, "Meta Below")
    val metaBelow: Boolean = false

    @FigmaProperty(FigmaType.Text, "Meta Text")
    val metaText: String = "Changes awaiting publish"

    @Composable
    fun ComponentExample() {
        TreeItem(
            item = TreeNode(id = "row", name = name, meta = if (metaBelow) metaText else null),
            depth = depth,
            density = density,
            divided = divided,
            metaPlacement = if (metaBelow) KozmosTreeMetaPlacement.Below else KozmosTreeMetaPlacement.Inline
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=687-6789")
class KozmosTreeChildItemConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val name: String = "Place item"

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

    @FigmaProperty(FigmaType.Boolean, "Divided")
    val divided: Boolean = false

    // GAP-107: Meta Below draws Meta Text on a line under the label.
    @FigmaProperty(FigmaType.Boolean, "Meta Below")
    val metaBelow: Boolean = false

    @FigmaProperty(FigmaType.Text, "Meta Text")
    val metaText: String = "Changes awaiting publish"

    @Composable
    fun ComponentExample() {
        TreeItem(
            item = TreeNode(id = "row", name = name, meta = if (metaBelow) metaText else null),
            depth = depth,
            density = density,
            divided = divided,
            metaPlacement = if (metaBelow) KozmosTreeMetaPlacement.Below else KozmosTreeMetaPlacement.Inline
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=723-8776")
class KozmosTreeItemConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val name: String = "Map content"

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

    @FigmaProperty(FigmaType.Boolean, "Divided")
    val divided: Boolean = false

    // GAP-107: Meta Below draws Meta Text on a line under the label.
    @FigmaProperty(FigmaType.Boolean, "Meta Below")
    val metaBelow: Boolean = false

    @FigmaProperty(FigmaType.Text, "Meta Text")
    val metaText: String = "Changes awaiting publish"

    @Composable
    fun ComponentExample() {
        TreeItem(
            item = TreeNode(id = "row", name = name, meta = if (metaBelow) metaText else null),
            depth = depth,
            density = density,
            divided = divided,
            metaPlacement = if (metaBelow) KozmosTreeMetaPlacement.Below else KozmosTreeMetaPlacement.Inline
        )
    }
}

// GAP-151: a section heading, as Compose's TreeSectionRow. Count Text is a
// sample in the design; in code the count is the product's number.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TREE-SECTION-NODE-ID")
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
            count = if (showCount) countText.toInt() else null,
            depth = depth,
            density = density
        )
    }
}
