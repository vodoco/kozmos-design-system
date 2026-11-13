import SwiftUI
import Figma

// Inset is what the sides respond to; Block (GAP-116) is the clear space
// above and below, one step on both.
struct KozmosContainerConnect: FigmaConnect {
    let component = KozmosContainer<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-1034"

    @FigmaEnum(
        "Centered",
        mapping: [
            "True": "true",
            "False": "false"
        ]
    )
    var centered: String = "true"

    @FigmaEnum(
        "Inset",
        mapping: [
            "Window": KozmosContainerInset.window,
            "Panel": KozmosContainerInset.panel
        ]
    )
    var inset: KozmosContainerInset = .window

    @FigmaEnum(
        "Block",
        mapping: [
            "None": KozmosContainerBlock.none,
            "Small": KozmosContainerBlock.sm,
            "Medium": KozmosContainerBlock.md,
            "Large": KozmosContainerBlock.lg
        ]
    )
    var block: KozmosContainerBlock = .none

    var body: some View {
        KozmosContainer(inset: self.inset, block: self.block) {
            AnyView(
                Text("Container content")
                    .frame(
                        maxWidth: self.centered == "true" ? 720 : .infinity,
                        alignment: .leading
                    )
            )
        }
    }
}
