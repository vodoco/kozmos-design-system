package com.kozmos.components.notice

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant
import androidx.compose.material3.Text

// Notice (GAP-160): Tone and Status are variants; Summary, Detail and the
// action are the set's own properties. The set is new: its node id is
// filled in once the importer has built it.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD")
class KozmosNoticeConnect {
    @FigmaProperty(FigmaType.Enum, "Tone")
    val tone: KozmosNoticeTone = Figma.mapping(
        "Warning" to KozmosNoticeTone.Warning,
        "Info" to KozmosNoticeTone.Info,
        "Critical" to KozmosNoticeTone.Critical,
        "Success" to KozmosNoticeTone.Success
    )

    @FigmaProperty(FigmaType.Enum, "Status")
    val status: KozmosNoticeStatus? = Figma.mapping(
        "None" to null,
        "Progress" to KozmosNoticeStatus.Progress,
        "Done" to KozmosNoticeStatus.Done
    )

    @FigmaProperty(FigmaType.Text, "Summary")
    val summary: String = "Geometry is set"

    @FigmaProperty(FigmaType.Boolean, "Show Icon")
    val icon: KozmosNoticeIcon = Figma.mapping(
        true to KozmosNoticeIcon.Tone,
        false to KozmosNoticeIcon.None
    )

    @FigmaProperty(FigmaType.Boolean, "Show Detail")
    val expanded: Boolean = Figma.mapping(
        true to true,
        false to false
    )

    @FigmaProperty(FigmaType.Text, "Detail")
    val detail: String = "The building's boundary is saved."

    @FigmaProperty(FigmaType.Boolean, "Show Action")
    val showAction: Boolean = Figma.mapping(
        true to true,
        false to false
    )

    @Composable
    fun ComponentExample() {
        KozmosNotice(
            summary = summary,
            detail = detail,
            tone = tone,
            status = status,
            icon = icon,
            defaultExpanded = expanded,
            action = if (showAction) {
                { KozmosButton(onClick = {}, variant = KozmosButtonVariant.Outline) { Text("Set Building Boundary") } }
            } else null
        )
    }
}
