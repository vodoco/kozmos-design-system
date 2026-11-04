package com.kozmos.components.toast

import androidx.compose.runtime.Composable
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

// Tone=Neutral only: Compose's KozmosToast has no tone yet (GAP-167 is web and
// Figma first), so a Success, Info, Warning or Critical instance shows no
// Compose snippet rather than a plain toast without its icon.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8189")
@FigmaVariant("Content", "Basic")
@FigmaVariant("Tone", "Neutral")
class KozmosToastBasicConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Notification"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Your changes have been saved."

    @Composable
    fun ComponentExample() {
        KozmosToast(
            title = title,
            description = description,
            onDismiss = {}
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8189")
@FigmaVariant("Content", "Action")
@FigmaVariant("Tone", "Neutral")
class KozmosToastActionConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Notification"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Your changes have been saved."

    @FigmaProperty(FigmaType.Text, "Action Text")
    val actionText: String = "Undo"

    @Composable
    fun ComponentExample() {
        KozmosToast(
            title = title,
            description = description,
            actionText = actionText,
            onAction = {},
            onDismiss = {}
        )
    }
}
