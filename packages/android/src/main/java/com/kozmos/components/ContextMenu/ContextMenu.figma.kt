package com.kozmos.components.contextmenu

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant
import com.kozmos.components.menu.KozmosMenuContent
import com.kozmos.components.menu.KozmosMenuContentType
import com.kozmos.components.menu.KozmosMenuItem

// GAP-155: the set's panel and properties are Menu's; what differs is how it
// opens, a long press or a secondary click on the area, or the Menu key on a
// marked target. External draws the new-tab icon on Item 2, which only Basic
// and Submenu paint.

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11998")
@FigmaVariant("Content", "Basic")
class KozmosContextMenuBasicConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Feature actions"

    @FigmaProperty(FigmaType.Text, "Item 1 Text")
    val item1: String = "Copy"

    @FigmaProperty(FigmaType.Text, "Item 2 Text")
    val item2: String = "Open guide"

    @FigmaProperty(FigmaType.Text, "Item 3 Text")
    val item3: String = "Report a problem"

    @FigmaProperty(FigmaType.Text, "Shortcut Text")
    val shortcut: String = "Ctrl+C"

    @FigmaProperty(FigmaType.Boolean, "External")
    val external: Boolean = false

    @Composable
    fun ComponentExample() {
        KozmosContextMenuArea(
            menu = KozmosMenuContent(
                label = label,
                items = listOf(
                    KozmosMenuItem(text = item1, shortcut = shortcut),
                    KozmosMenuItem(text = item2, external = external),
                    KozmosMenuItem(text = item3)
                ),
                contentType = KozmosMenuContentType.Basic
            ),
            onItemClick = {}
        ) {
            Text("Gate A12", Modifier.kozmosContextMenuTarget())
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11998")
@FigmaVariant("Content", "Checkbox")
class KozmosContextMenuCheckboxConnect {
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
        KozmosContextMenuArea(
            menu = KozmosMenuContent(
                label = label,
                items = listOf(
                    KozmosMenuItem(text = item1, checked = true),
                    KozmosMenuItem(text = item2),
                    KozmosMenuItem(text = item3, checked = true)
                ),
                contentType = KozmosMenuContentType.Checkbox
            ),
            onItemClick = {}
        ) {
            Text("Level 2", Modifier.kozmosContextMenuTarget())
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11998")
@FigmaVariant("Content", "Radio")
class KozmosContextMenuRadioConnect {
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
        KozmosContextMenuArea(
            menu = KozmosMenuContent(
                label = label,
                items = listOf(
                    KozmosMenuItem(text = item1, selected = true),
                    KozmosMenuItem(text = item2),
                    KozmosMenuItem(text = item3)
                ),
                contentType = KozmosMenuContentType.Radio
            ),
            onItemClick = {}
        ) {
            Text("Route to Gate A12", Modifier.kozmosContextMenuTarget())
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11998")
@FigmaVariant("Content", "Submenu")
class KozmosContextMenuSubmenuConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Feature actions"

    @FigmaProperty(FigmaType.Text, "Item 1 Text")
    val item1: String = "Copy"

    @FigmaProperty(FigmaType.Text, "Item 2 Text")
    val item2: String = "Open guide"

    @FigmaProperty(FigmaType.Text, "Item 3 Text")
    val item3: String = "Move to level"

    @FigmaProperty(FigmaType.Boolean, "External")
    val external: Boolean = false

    @Composable
    fun ComponentExample() {
        KozmosContextMenuArea(
            menu = KozmosMenuContent(
                label = label,
                items = listOf(
                    KozmosMenuItem(text = item1),
                    KozmosMenuItem(text = item2, external = external),
                    KozmosMenuItem(
                        text = item3,
                        submenuItems = listOf("Level 1", "Level 2")
                    )
                ),
                contentType = KozmosMenuContentType.Submenu
            ),
            onItemClick = {}
        ) {
            Text("Gate A12", Modifier.kozmosContextMenuTarget())
        }
    }
}
