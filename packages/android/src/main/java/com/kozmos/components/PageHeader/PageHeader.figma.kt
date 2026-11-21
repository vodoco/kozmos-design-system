package com.kozmos.components.pageheader

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.KozmosEmotion
import com.kozmos.components.breadcrumb.KozmosBreadcrumb
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.tag.KozmosTag

// GAP-036: the PageHeader set. Its node id is the set built in the live file
// (2446:23074).
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2446-23074")
class KozmosPageHeaderConnect {
    @FigmaProperty(FigmaType.Enum, "Tone")
    val tone: KozmosPageHeaderTone = Figma.mapping(
        "Subtle" to KozmosPageHeaderTone.Subtle,
        "Default" to KozmosPageHeaderTone.Default
    )

    @FigmaProperty(FigmaType.Enum, "Size")
    val size: KozmosPageHeaderSize = Figma.mapping(
        "Medium" to KozmosPageHeaderSize.Md,
        "Large" to KozmosPageHeaderSize.Lg
    )

    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Settings"

    // Decision 210: a node beside the title and outside its heading, drawn
    // as a status Tag in the alert emotion, on the overload that takes it.
    @FigmaProperty(FigmaType.Boolean, "Show Title Addon")
    val showTitleAddon: Boolean = false

    @FigmaProperty(FigmaType.Text, "Addon Text")
    val addonText: String = "Changes Awaiting Publish"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val descriptionText: String = "Manage the site's map, its levels and who can edit them."

    @FigmaProperty(FigmaType.Boolean, "Description")
    val showDescription: Boolean = true

    @FigmaProperty(FigmaType.Boolean, "Breadcrumb")
    val showBreadcrumb: Boolean = true

    @FigmaProperty(FigmaType.Boolean, "Info")
    val showInfo: Boolean = false

    @FigmaProperty(FigmaType.Boolean, "Actions")
    val showActions: Boolean = true

    @Composable
    fun ComponentExample() {
        KozmosPageHeader(
            title = title,
            titleAddon = if (showTitleAddon) {
                { KozmosTag(text = addonText, emotion = KozmosEmotion.Alert) }
            } else {
                null
            },
            description = if (showDescription) descriptionText else null,
            tone = tone,
            size = size,
            breadcrumb = if (showBreadcrumb) {
                { KozmosBreadcrumb(items = listOf("Boston Logan Airport", title), onItemClick = {}) }
            } else {
                null
            },
            info = if (showInfo) {
                { KozmosIconButton(icon = Icons.Outlined.Info, onClick = {}, contentDescription = "About this page") }
            } else {
                null
            },
            actions = if (showActions) {
                { KozmosButton(onClick = {}) { Text("Save changes") } }
            } else {
                null
            }
        )
    }
}
