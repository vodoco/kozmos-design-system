import SwiftUI
import Figma

struct KozmosCardBasicConnect: FigmaConnect {
    let component = KozmosCard<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=87-2536"
    var variant = ["Content": "Basic"]

    @FigmaString("Body Text")
    var bodyText: String = "Use card body content for short supporting detail."

    var body: some View {
        KozmosCard {
            AnyView(
                KozmosCardContent {
                    Text(self.bodyText)
                }
            )
        }
    }
}

struct KozmosCardHeaderConnect: FigmaConnect {
    let component = KozmosCard<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=87-2536"
    var variant = ["Content": "Header"]

    @FigmaString("Title Text")
    var title: String = "Card title"

    @FigmaString("Description Text")
    var description: String = "Supporting description."

    @FigmaString("Body Text")
    var bodyText: String = "Use card body content for short supporting detail."

    // CLOUD-UI-001 / GAP-169: the header's tone; GAP-035: the title's size.
    @FigmaEnum("HeaderTone", mapping: ["Default": KozmosCardHeaderTone.`default`, "Subtle": KozmosCardHeaderTone.subtle])
    var headerTone: KozmosCardHeaderTone = .default

    @FigmaEnum("TitleSize", mapping: ["Large": KozmosCardTitleSize.lg, "Medium": KozmosCardTitleSize.md, "Small": KozmosCardTitleSize.sm])
    var titleSize: KozmosCardTitleSize = .lg

    var body: some View {
        KozmosCard {
            AnyView(
                VStack(alignment: .leading, spacing: 0) {
                    KozmosCardHeader(tone: self.headerTone) {
                        KozmosCardTitle(self.title, size: self.titleSize)
                        KozmosCardDescription(self.description)
                    }
                    KozmosCardContent {
                        Text(self.bodyText)
                    }
                }
            )
        }
    }
}

struct KozmosCardFullConnect: FigmaConnect {
    let component = KozmosCard<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=87-2536"
    var variant = ["Content": "Full"]

    @FigmaString("Title Text")
    var title: String = "Card title"

    @FigmaString("Description Text")
    var description: String = "Supporting description."

    @FigmaString("Body Text")
    var bodyText: String = "Use card body content for short supporting detail."

    // CLOUD-UI-001 / GAP-169: the header's tone; GAP-035: the title's size.
    @FigmaEnum("HeaderTone", mapping: ["Default": KozmosCardHeaderTone.`default`, "Subtle": KozmosCardHeaderTone.subtle])
    var headerTone: KozmosCardHeaderTone = .default

    @FigmaEnum("TitleSize", mapping: ["Large": KozmosCardTitleSize.lg, "Medium": KozmosCardTitleSize.md, "Small": KozmosCardTitleSize.sm])
    var titleSize: KozmosCardTitleSize = .lg

    var body: some View {
        KozmosCard {
            AnyView(
                VStack(alignment: .leading, spacing: 0) {
                    KozmosCardHeader(tone: self.headerTone) {
                        KozmosCardTitle(self.title, size: self.titleSize)
                        KozmosCardDescription(self.description)
                    }
                    KozmosCardContent {
                        Text(self.bodyText)
                    }
                    KozmosCardFooter {
                        KozmosButton("Cancel", variant: .outline, action: {})
                        KozmosButton("Save", action: {})
                    }
                }
            )
        }
    }
}
