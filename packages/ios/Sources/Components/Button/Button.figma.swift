import SwiftUI
import Figma

struct KozmosButtonConnect: FigmaConnect {
    let component = KozmosButton.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1055"

    @FigmaString("Label Text")
    var label: String = "Button"

    @FigmaEnum(
        "Variant",
        mapping: [
            "Default": KozmosButtonVariant.`default`,
            "Destructive": KozmosButtonVariant.destructive,
            "Outline": KozmosButtonVariant.outline,
            "Secondary": KozmosButtonVariant.secondary,
            "Ghost": KozmosButtonVariant.ghost,
            "Link": KozmosButtonVariant.link,
            "Glass": KozmosButtonVariant.glass,
            "Subtle": KozmosButtonVariant.subtle
        ]
    )
    var buttonVariant: KozmosButtonVariant = .default

    @FigmaEnum(
        "Size",
        mapping: [
            "Default": KozmosButtonSize.`default`,
            "Small": KozmosButtonSize.sm,
            "Large": KozmosButtonSize.lg,
            "Icon": KozmosButtonSize.icon
        ]
    )
    var size: KozmosButtonSize = .default

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Disabled": "disabled",
            "Loading": "loading"
        ]
    )
    var state: String = "default"

    var body: some View {
        KozmosButton(
            self.label,
            variant: self.buttonVariant,
            size: self.size,
            isDisabled: self.state == "disabled",
            isLoading: self.state == "loading",
            action: {}
        )
    }
}
