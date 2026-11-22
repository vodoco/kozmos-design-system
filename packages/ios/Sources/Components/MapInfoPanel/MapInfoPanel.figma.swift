import SwiftUI
import Figma

// GAP-206: Content is the content given: Default the whole panel,
// ExpandedFAQ one answer open (expandedFAQ), Minimal a title alone. Title
// Text is content.title, Introduction Text content.introduction. Show Brand
// is the product's brand mark, which a snippet cannot name, so it is left to
// the product.
struct KozmosMapInfoPanelConnect: FigmaConnect {
    let component = KozmosMapInfoPanel.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17468"
    var variant = ["Content": "Default"]

    @FigmaString("Title Text")
    var title: String = "About this map"

    @FigmaString("Introduction Text")
    var introduction: String = "Explore the venue and find the places and services you need."

    var body: some View {
        KozmosMapInfoPanel(
            content: KozmosMapInfoContent(
                title: self.title,
                introduction: self.introduction,
                faqs: [KozmosMapInfoFAQ(id: "hours", question: "When is the venue open?", answer: "Every day, 6:00 to 23:00.")]
            ),
            onClose: {}
        )
    }
}

struct KozmosMapInfoPanelExpandedConnect: FigmaConnect {
    let component = KozmosMapInfoPanel.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17468"
    var variant = ["Content": "ExpandedFAQ"]

    @FigmaString("Title Text")
    var title: String = "About this map"

    @FigmaString("Introduction Text")
    var introduction: String = "Explore the venue and find the places and services you need."

    var body: some View {
        KozmosMapInfoPanel(
            content: KozmosMapInfoContent(
                title: self.title,
                introduction: self.introduction,
                faqs: [KozmosMapInfoFAQ(id: "hours", question: "When is the venue open?", answer: "Every day, 6:00 to 23:00.")]
            ),
            expandedFAQ: .constant("hours"),
            onClose: {}
        )
    }
}

struct KozmosMapInfoPanelMinimalConnect: FigmaConnect {
    let component = KozmosMapInfoPanel.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17468"
    var variant = ["Content": "Minimal"]

    @FigmaString("Title Text")
    var title: String = "About this map"

    var body: some View {
        KozmosMapInfoPanel(content: KozmosMapInfoContent(title: self.title), onClose: {})
    }
}
