package com.kozmos.components.splitbutton

import androidx.compose.runtime.Composable
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.icon.KozmosIcon

// Decision 209, GAP-168: the menu's items are the ones Menu Open shows, an
// item with an icon, a separator and a disabled item. Menu Open itself is
// not mapped: it draws the menu open, which the user does.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=383-2332")
class KozmosSplitButtonConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Action"

    @Composable
    fun ComponentExample() {
        KozmosSplitButton(
            label = label,
            onMainClick = {},
            menuItems = listOf(
                SplitContextMenuItem("Publish to staging", icon = { KozmosIcon(name = "download-01") }) {},
                SplitContextMenuSeparator,
                SplitContextMenuItem("Publish to production", enabled = false) {}
            )
        )
    }
}
