package com.kozmos.components.dialog

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=143-13060")
@FigmaVariant("Content", "Basic")
class KozmosDialogBasicConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Edit profile"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Make changes to your profile here."

    @FigmaProperty(FigmaType.Text, "Body Text")
    val bodyText: String = "Use dialog body content for a short task, form, or confirmation."

    @Composable
    fun ComponentExample() {
        KozmosDialog(
            onDismissRequest = {},
            title = title,
            description = description,
            bodyText = bodyText
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=143-13060")
@FigmaVariant("Content", "Form")
class KozmosDialogFormConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Edit profile"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Make changes to your profile here."

    @FigmaProperty(FigmaType.Text, "Body Text")
    val bodyText: String = "Use dialog body content for a short task, form, or confirmation."

    @Composable
    fun ComponentExample() {
        KozmosDialog(
            onDismissRequest = {},
            title = title,
            description = description,
            bodyText = bodyText,
            primaryActionText = "Save changes",
            onPrimaryAction = {}
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=143-13060")
@FigmaVariant("Content", "Footer")
class KozmosDialogFooterConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Review changes"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Confirm the details before continuing."

    @FigmaProperty(FigmaType.Text, "Body Text")
    val bodyText: String = "Use dialog body content for a short task, form, or confirmation."

    @Composable
    fun ComponentExample() {
        KozmosDialog(
            onDismissRequest = {},
            title = title,
            description = description,
            bodyText = bodyText,
            primaryActionText = "Save changes",
            secondaryActionText = "Cancel",
            onPrimaryAction = {},
            onSecondaryAction = {}
        )
    }
}

// Decision 195, GAP-214: an illustration above the title, out to the
// dialog's edges and top corners.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=143-13060")
@FigmaVariant("Content", "Media")
class KozmosDialogMediaConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Edit profile"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Make changes to your profile here."

    @FigmaProperty(FigmaType.Text, "Body Text")
    val bodyText: String = "Use dialog body content for a short task, form, or confirmation."

    @Composable
    fun ComponentExample() {
        KozmosDialog(
            onDismissRequest = {},
            title = title,
            description = description,
            bodyText = bodyText,
            media = KozmosDialogMedia(bleed = true) {
                Image(
                    painter = painterResource(android.R.drawable.ic_menu_gallery),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxWidth().height(160.dp)
                )
            }
        )
    }
}

// Decision 202, GAP-259: the window less 16 on each side, for media shown
// large.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=143-13060")
@FigmaVariant("Content", "Full")
class KozmosDialogFullConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Edit profile"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Make changes to your profile here."

    @FigmaProperty(FigmaType.Text, "Body Text")
    val bodyText: String = "Use dialog body content for a short task, form, or confirmation."

    @Composable
    fun ComponentExample() {
        KozmosDialog(
            onDismissRequest = {},
            title = title,
            description = description,
            bodyText = bodyText,
            size = KozmosDialogSize.Full
        )
    }
}
