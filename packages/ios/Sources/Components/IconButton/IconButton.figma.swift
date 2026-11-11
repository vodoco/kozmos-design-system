import SwiftUI
import Figma

struct KozmosIconButtonConnect: FigmaConnect {
    let component = KozmosIconButton.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1203"

    @FigmaEnum(
        "Variant",
        mapping: [
            "Default": KozmosIconButtonVariant.`default`,
            "Destructive": KozmosIconButtonVariant.destructive,
            "Outline": KozmosIconButtonVariant.outline,
            "Secondary": KozmosIconButtonVariant.secondary,
            "Ghost": KozmosIconButtonVariant.ghost,
            "Link": KozmosIconButtonVariant.link,
            "Glass": KozmosIconButtonVariant.glass
        ]
    )
    var iconVariant: KozmosIconButtonVariant = .ghost

    @FigmaEnum(
        "Size",
        mapping: [
            "Default": KozmosIconButtonSize.`default`,
            "Small": KozmosIconButtonSize.sm,
            "Large": KozmosIconButtonSize.lg
        ]
    )
    var size: KozmosIconButtonSize = .default

    @FigmaEnum("State", mapping: ["Default": false, "Disabled": true, "Loading": false])
    var isDisabled: Bool = false

    @FigmaEnum("State", mapping: ["Default": false, "Disabled": false, "Loading": true])
    var isLoading: Bool = false

    // GAP-197: Counter shows the count over the icon's top-end corner. Counter
    // Text is a sample in the design; in code the count is the product's
    // number, which a snippet cannot read from text.
    @FigmaBoolean("Counter", mapping: [true: 3, false: nil])
    var counter: Int? = nil

    var body: some View {
        KozmosIconButton(
            iconName: "magnifyingglass",
            variant: self.iconVariant,
            size: self.size,
            isDisabled: self.isDisabled,
            isLoading: self.isLoading,
            counter: self.counter,
            action: {}
        )
    }
}
