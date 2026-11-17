import SwiftUI
import Figma

// GAP-221: the DescriptionList set. Its node id is a placeholder until the set
// is built in the live file, so this file stays out of figma.linked.config.json.
// Layout is how the items sit: Stack, one under another; Row, side by side.
struct KozmosDescriptionListConnect: FigmaConnect {
    let component = KozmosDescriptionList<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD"

    @FigmaEnum(
        "Layout",
        mapping: [
            "Stack": KozmosDescriptionListLayout.stack,
            "Row": KozmosDescriptionListLayout.row
        ]
    )
    var layout: KozmosDescriptionListLayout = .stack

    var body: some View {
        KozmosDescriptionList(layout: self.layout) {
            KozmosDescriptionListItem(label: "Name", value: "Bean & Leaf Café")
            KozmosDescriptionListItem(label: "Featured", isOn: true)
        }
    }
}
