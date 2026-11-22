package com.kozmos.components.mapinfopanel

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

// GAP-206: Content is the content given: Default the whole panel,
// ExpandedFAQ one answer open (expandedFAQ), Minimal a title alone. Title
// Text is content.title, Introduction Text content.introduction. Show Brand
// is the product's brand mark, which a snippet cannot name, so it is left to
// the product.

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17468")
@FigmaVariant("Content", "Default")
class KozmosMapInfoPanelConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "About this map"

    @FigmaProperty(FigmaType.Text, "Introduction Text")
    val introduction: String = "Explore the venue and find the places and services you need."

    @Composable
    fun ComponentExample() {
        KozmosMapInfoPanel(
            content = KozmosMapInfoContent(
                title = title,
                introduction = introduction,
                faqs = listOf(KozmosMapInfoFAQ(id = "hours", question = "When is the venue open?", answer = "Every day, 6:00 to 23:00."))
            ),
            onClose = {}
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17468")
@FigmaVariant("Content", "ExpandedFAQ")
class KozmosMapInfoPanelExpandedConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "About this map"

    @FigmaProperty(FigmaType.Text, "Introduction Text")
    val introduction: String = "Explore the venue and find the places and services you need."

    @Composable
    fun ComponentExample() {
        KozmosMapInfoPanel(
            content = KozmosMapInfoContent(
                title = title,
                introduction = introduction,
                faqs = listOf(KozmosMapInfoFAQ(id = "hours", question = "When is the venue open?", answer = "Every day, 6:00 to 23:00."))
            ),
            onClose = {},
            expandedFAQ = "hours",
            onExpandedFAQChange = {}
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17468")
@FigmaVariant("Content", "Minimal")
class KozmosMapInfoPanelMinimalConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "About this map"

    @Composable
    fun ComponentExample() {
        KozmosMapInfoPanel(content = KozmosMapInfoContent(title = title), onClose = {})
    }
}
