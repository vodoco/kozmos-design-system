package com.kozmos.components.drawer

import androidx.compose.foundation.layout.Spacer
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

// One connect per Placement (GAP-198): Fixed, the drawer as it always was, and
// Inline, the floating panel in its region.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=232-2042")
@FigmaVariant("Placement", "Fixed")
class KozmosDrawerConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Manage layers"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Update map display settings."

    @FigmaProperty(FigmaType.Text, "Body Text")
    val bodyText: String = "Drawer body content"

    @FigmaProperty(FigmaType.Enum, "Side")
    val side: KozmosDrawerSide = Figma.mapping(
        "Top" to KozmosDrawerSide.Top,
        "Right" to KozmosDrawerSide.Right,
        "Bottom" to KozmosDrawerSide.Bottom,
        "Left" to KozmosDrawerSide.Left
    )

    @Composable
    fun ComponentExample() {
        KozmosDrawer(
            open = true,
            onDismissRequest = {},
            side = side,
            drawerContent = {
                DrawerHeader(
                    title = title,
                    description = description,
                    showCloseButton = false,
                    onDismissRequest = {}
                )
                Text(bodyText)
                Spacer(modifier = Modifier.weight(1f))
            }
        ) {
            Text("Screen content")
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=232-2042")
@FigmaVariant("Placement", "Inline")
class KozmosDrawerInlineConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Manage layers"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Update map display settings."

    @FigmaProperty(FigmaType.Text, "Body Text")
    val bodyText: String = "Drawer body content"

    @FigmaProperty(FigmaType.Enum, "Side")
    val side: KozmosDrawerSide = Figma.mapping(
        "Top" to KozmosDrawerSide.Top,
        "Right" to KozmosDrawerSide.Right,
        "Bottom" to KozmosDrawerSide.Bottom,
        "Left" to KozmosDrawerSide.Left
    )

    @Composable
    fun ComponentExample() {
        KozmosDrawer(
            open = true,
            onDismissRequest = {},
            side = side,
            placement = KozmosDrawerPlacement.Inline,
            label = title,
            drawerContent = {
                DrawerHeader(
                    title = title,
                    description = description,
                    showCloseButton = false,
                    onDismissRequest = {}
                )
                Text(bodyText)
                Spacer(modifier = Modifier.weight(1f))
            }
        ) {
            Text("Screen content")
        }
    }
}
