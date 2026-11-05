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

// Placement=Fixed only: Compose's drawer has no inline form yet (GAP-198 is web
// and Figma first, decision 134), so an Inline instance shows no Compose snippet
// rather than a fixed one.
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
