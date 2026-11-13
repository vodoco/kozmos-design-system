package com.kozmos.components.menu

import androidx.compose.runtime.Composable
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8170")
@FigmaVariant("Content", "Basic")
class KozmosMenuBasicConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Actions"

    @FigmaProperty(FigmaType.Text, "Item 1 Text")
    val item1: String = "Rename"

    @FigmaProperty(FigmaType.Text, "Item 2 Text")
    val item2: String = "Duplicate"

    @FigmaProperty(FigmaType.Text, "Item 3 Text")
    val item3: String = "Archive"

    // Decision 152: External shows the new-tab icon on the second item.
    @FigmaProperty(FigmaType.Boolean, "External")
    val external: Boolean = false

    @FigmaProperty(FigmaType.Text, "Shortcut Text")
    val shortcut: String = "R"

    @Composable
    fun ComponentExample() {
        KozmosMenu(
            expanded = true,
            onDismissRequest = {},
            content = KozmosMenuContent(
                label = label,
                items = listOf(
                    KozmosMenuItem(text = item1, shortcut = shortcut),
                    KozmosMenuItem(text = item2, external = external),
                    KozmosMenuItem(text = item3)
                ),
                contentType = KozmosMenuContentType.Basic
            )
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8170")
@FigmaVariant("Content", "Checkbox")
class KozmosMenuCheckboxConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Map layers"

    @FigmaProperty(FigmaType.Text, "Item 1 Text")
    val item1: String = "Transit"

    @FigmaProperty(FigmaType.Text, "Item 2 Text")
    val item2: String = "Amenities"

    @FigmaProperty(FigmaType.Text, "Item 3 Text")
    val item3: String = "Accessibility"

    @Composable
    fun ComponentExample() {
        KozmosMenu(
            expanded = true,
            onDismissRequest = {},
            content = KozmosMenuContent(
                label = label,
                items = listOf(
                    KozmosMenuItem(text = item1, checked = true),
                    KozmosMenuItem(text = item2),
                    KozmosMenuItem(text = item3, checked = true)
                ),
                contentType = KozmosMenuContentType.Checkbox
            )
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8170")
@FigmaVariant("Content", "Radio")
class KozmosMenuRadioConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Route preference"

    @FigmaProperty(FigmaType.Text, "Item 1 Text")
    val item1: String = "Fastest"

    @FigmaProperty(FigmaType.Text, "Item 2 Text")
    val item2: String = "Accessible"

    @FigmaProperty(FigmaType.Text, "Item 3 Text")
    val item3: String = "Fewest transfers"

    @Composable
    fun ComponentExample() {
        KozmosMenu(
            expanded = true,
            onDismissRequest = {},
            content = KozmosMenuContent(
                label = label,
                items = listOf(
                    KozmosMenuItem(text = item1, selected = true),
                    KozmosMenuItem(text = item2),
                    KozmosMenuItem(text = item3)
                ),
                contentType = KozmosMenuContentType.Radio
            )
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8170")
@FigmaVariant("Content", "Submenu")
class KozmosMenuSubmenuConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Workspace"

    @FigmaProperty(FigmaType.Text, "Item 1 Text")
    val item1: String = "Members"

    @FigmaProperty(FigmaType.Text, "Item 2 Text")
    val item2: String = "Settings"

    @FigmaProperty(FigmaType.Text, "Item 3 Text")
    val item3: String = "Share"

    // Decision 152: External shows the new-tab icon on the second item.
    @FigmaProperty(FigmaType.Boolean, "External")
    val external: Boolean = false

    @Composable
    fun ComponentExample() {
        KozmosMenu(
            expanded = true,
            onDismissRequest = {},
            content = KozmosMenuContent(
                label = label,
                items = listOf(
                    KozmosMenuItem(text = item1),
                    KozmosMenuItem(text = item2, external = external),
                    KozmosMenuItem(
                        text = item3,
                        submenuItems = listOf("Invite people", "Export")
                    )
                ),
                contentType = KozmosMenuContentType.Submenu
            )
        )
    }
}
