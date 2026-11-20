import SwiftUI
import Figma

// GAP-221, decision 199: Layout is layout. Each Label N Text and Value N
// Text is an item's label and value; Action is the third item's copy
// button, its trailing action.
struct KozmosDescriptionListConnect: FigmaConnect {
    let component = KozmosDescriptionList<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68523"

    @FigmaEnum(
        "Layout",
        mapping: [
            "Stack": KozmosDescriptionListLayout.stack,
            "Row": KozmosDescriptionListLayout.row
        ]
    )
    var layout: KozmosDescriptionListLayout = .stack

    @FigmaString("Label 1 Text")
    var label1: String = "Name"

    @FigmaString("Value 1 Text")
    var value1: String = "Gate A12"

    @FigmaString("Label 2 Text")
    var label2: String = "Featured"

    @FigmaString("Value 2 Text")
    var value2: String = "Yes"

    @FigmaString("Label 3 Text")
    var label3: String = "FID"

    @FigmaString("Value 3 Text")
    var value3: String = "f-1209"

    @FigmaBoolean("Action")
    var showAction: Bool = true

    var body: some View {
        KozmosDescriptionList(layout: self.layout) {
            KozmosDescriptionListItem(label: self.label1, value: self.value1)
            KozmosDescriptionListItem(label: self.label2, value: self.value2)
            if self.showAction {
                KozmosDescriptionListItem(label: self.label3, value: self.value3) {
                    KozmosIconButton(iconName: "doc.on.doc") {}
                        .accessibilityLabel("Copy")
                }
            } else {
                KozmosDescriptionListItem(label: self.label3, value: self.value3)
            }
        }
    }
}
