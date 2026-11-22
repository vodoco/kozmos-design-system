package com.kozmos.components.mapstatuspill

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

// Decision 39, GAP-206: Tone is tone and Status Text the words; Show Mark off
// is icon = null, no mark, one connect each way. live chooses how a change
// is announced and draws nothing.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17374")
@FigmaVariant("Show Mark", "true")
class KozmosMapStatusPillConnect {
    @FigmaProperty(FigmaType.Text, "Status Text")
    val text: String = "Preparing Content"

    @FigmaProperty(FigmaType.Enum, "Tone")
    val tone: KozmosMapStatusPillTone = Figma.mapping(
        "Neutral" to KozmosMapStatusPillTone.Neutral,
        "Progress" to KozmosMapStatusPillTone.Progress,
        "Success" to KozmosMapStatusPillTone.Success,
        "Danger" to KozmosMapStatusPillTone.Danger,
        "Warning" to KozmosMapStatusPillTone.Warning
    )

    @Composable
    fun ComponentExample() {
        KozmosMapStatusPill(text = text, tone = tone)
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17374")
@FigmaVariant("Show Mark", "false")
class KozmosMapStatusPillNoMarkConnect {
    @FigmaProperty(FigmaType.Text, "Status Text")
    val text: String = "Preparing Content"

    @FigmaProperty(FigmaType.Enum, "Tone")
    val tone: KozmosMapStatusPillTone = Figma.mapping(
        "Neutral" to KozmosMapStatusPillTone.Neutral,
        "Progress" to KozmosMapStatusPillTone.Progress,
        "Success" to KozmosMapStatusPillTone.Success,
        "Danger" to KozmosMapStatusPillTone.Danger,
        "Warning" to KozmosMapStatusPillTone.Warning
    )

    @Composable
    fun ComponentExample() {
        KozmosMapStatusPill(text = text, tone = tone, icon = null)
    }
}
