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

// The rows a designer puts in Tree's Content Slot, as Compose's TreeItem.
// Compose has no divided rows yet (GAP-201 is web and Figma first), so
// Divided changes nothing here.
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

    @Composable
    fun ComponentExample() {
        TreeItem(
            item = TreeNode(id = "row", name = name),
            depth = depth,
            density = density
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

    @Composable
    fun ComponentExample() {
        TreeItem(
            item = TreeNode(id = "row", name = name),
            depth = depth,
            density = density
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

    @Composable
    fun ComponentExample() {
        TreeItem(
            item = TreeNode(id = "row", name = name),
            depth = depth,
            density = density
        )
    }
}
