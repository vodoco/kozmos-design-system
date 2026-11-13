package com.kozmos.components.card

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=87-2536")
@FigmaVariant("Content", "Basic")
class KozmosCardBasicConnect {
    @FigmaProperty(FigmaType.Text, "Body Text")
    val bodyText: String = "Use card body content for short supporting detail."

    @Composable
    fun ComponentExample() {
        KozmosCard {
            KozmosCardContent {
                Text(bodyText)
            }
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=87-2536")
@FigmaVariant("Content", "Header")
class KozmosCardHeaderConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Card title"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Supporting description."

    @FigmaProperty(FigmaType.Text, "Body Text")
    val bodyText: String = "Use card body content for short supporting detail."

    // CLOUD-UI-001 / GAP-169: the header's tone; GAP-035: the title's size.
    @FigmaProperty(FigmaType.Enum, "HeaderTone")
    val headerTone: KozmosCardHeaderTone = Figma.mapping(
        "Default" to KozmosCardHeaderTone.Default,
        "Subtle" to KozmosCardHeaderTone.Subtle
    )

    @FigmaProperty(FigmaType.Enum, "TitleSize")
    val titleSize: KozmosCardTitleSize = Figma.mapping(
        "Large" to KozmosCardTitleSize.Lg,
        "Medium" to KozmosCardTitleSize.Md,
        "Small" to KozmosCardTitleSize.Sm
    )

    @Composable
    fun ComponentExample() {
        KozmosCard {
            KozmosCardHeader(tone = headerTone) {
                KozmosCardTitle(title, size = titleSize)
                KozmosCardDescription(description)
            }
            KozmosCardContent {
                Text(bodyText)
            }
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=87-2536")
@FigmaVariant("Content", "Full")
class KozmosCardFullConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Card title"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Supporting description."

    @FigmaProperty(FigmaType.Text, "Body Text")
    val bodyText: String = "Use card body content for short supporting detail."

    // CLOUD-UI-001 / GAP-169: the header's tone; GAP-035: the title's size.
    @FigmaProperty(FigmaType.Enum, "HeaderTone")
    val headerTone: KozmosCardHeaderTone = Figma.mapping(
        "Default" to KozmosCardHeaderTone.Default,
        "Subtle" to KozmosCardHeaderTone.Subtle
    )

    @FigmaProperty(FigmaType.Enum, "TitleSize")
    val titleSize: KozmosCardTitleSize = Figma.mapping(
        "Large" to KozmosCardTitleSize.Lg,
        "Medium" to KozmosCardTitleSize.Md,
        "Small" to KozmosCardTitleSize.Sm
    )

    @Composable
    fun ComponentExample() {
        KozmosCard {
            KozmosCardHeader(tone = headerTone) {
                KozmosCardTitle(title, size = titleSize)
                KozmosCardDescription(description)
            }
            KozmosCardContent {
                Text(bodyText)
            }
            KozmosCardFooter {
                Text("Cancel")
                Text("Save")
            }
        }
    }
}
