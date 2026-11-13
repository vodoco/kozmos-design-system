package com.kozmos.components.list

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonSize
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.components.tag.KozmosTag
import com.kozmos.components.tag.KozmosTagVariant

// GAP-195, decision 135: the ListItem set is a new Figma set. Its node id is
// a placeholder until the plugin's Build gives it one; this file stays out of
// figma.linked.config.json until then.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD")
class KozmosListItemConnect {
    @FigmaProperty(FigmaType.Enum, "Selected")
    val selected: Boolean = Figma.mapping(
        "False" to false,
        "True" to true
    )

    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Explore the map"

    @FigmaProperty(FigmaType.Text, "Addon Text")
    val addon: String = "Viewer"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Pan, zoom and change levels."

    @FigmaProperty(FigmaType.Text, "Meta Text")
    val meta: String = "2 min"

    @FigmaProperty(FigmaType.Text, "Action Text")
    val action: String = "Replay"

    @Composable
    fun ComponentExample() {
        KozmosListItem(
            text = title,
            description = description,
            meta = meta,
            selected = selected,
            leading = { KozmosListItemStatus(status = KozmosListItemStatusValue.Done) },
            titleAddon = { KozmosTag(text = addon, variant = KozmosTagVariant.Secondary) },
            trailing = {
                KozmosButton(onClick = {}, variant = KozmosButtonVariant.Outline, size = KozmosButtonSize.Sm) {
                    Text(action)
                }
            }
        )
    }
}
