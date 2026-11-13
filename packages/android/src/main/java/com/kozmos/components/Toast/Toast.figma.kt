package com.kozmos.components.toast

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

// Tone is toast()'s tone and KozmosToast's (GAP-167, decision 145): an app
// shows one from anywhere with `toast(title, description = …, tone = …)` and
// a KozmosToaster; this is the toast that call draws, laid out in place.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8189")
@FigmaVariant("Content", "Basic")
class KozmosToastBasicConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Notification"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Your changes have been saved."

    @FigmaProperty(FigmaType.Enum, "Tone")
    val tone: KozmosToastTone = Figma.mapping(
        "Neutral" to KozmosToastTone.Neutral,
        "Success" to KozmosToastTone.Success,
        "Info" to KozmosToastTone.Info,
        "Warning" to KozmosToastTone.Warning,
        "Critical" to KozmosToastTone.Critical
    )

    @Composable
    fun ComponentExample() {
        KozmosToast(
            title = title,
            description = description,
            onDismiss = {},
            tone = tone
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8189")
@FigmaVariant("Content", "Action")
class KozmosToastActionConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Notification"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Your changes have been saved."

    @FigmaProperty(FigmaType.Text, "Action Text")
    val actionText: String = "Undo"

    @FigmaProperty(FigmaType.Enum, "Tone")
    val tone: KozmosToastTone = Figma.mapping(
        "Neutral" to KozmosToastTone.Neutral,
        "Success" to KozmosToastTone.Success,
        "Info" to KozmosToastTone.Info,
        "Warning" to KozmosToastTone.Warning,
        "Critical" to KozmosToastTone.Critical
    )

    @Composable
    fun ComponentExample() {
        KozmosToast(
            title = title,
            description = description,
            actionText = actionText,
            onAction = {},
            onDismiss = {},
            tone = tone
        )
    }
}
