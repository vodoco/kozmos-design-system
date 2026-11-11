import SwiftUI
import Figma

// The TreeSection set is new: its node id is TBD until the plugin builds it,
// so this file stays out of figma.linked.config.json until then.
// A section heading (GAP-151): its label and count over the section's items,
// which are drawn at the section's own depth. SwiftUI draws a section only
// inside KozmosTree, from a section node, so the heading reads as a one-section
// tree; its depth is where the section sits in the nodes, not a property.
struct KozmosTreeSectionConnect: FigmaConnect {
    let component = KozmosTree.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD"

    @FigmaString("Label Text")
    var name: String = "POI"

    @FigmaBoolean("Show Count")
    var showCount: Bool = true

    @FigmaString("Count Text")
    var countText: String = "120"

    @FigmaEnum(
        "Density",
        mapping: [
            "Default": KozmosTreeDensity.default,
            "Compact": KozmosTreeDensity.compact
        ]
    )
    var density: KozmosTreeDensity = .default

    var body: some View {
        KozmosTree(
            nodes: [Node.section(self.name, count: self.showCount ? self.countText : nil, children: [])],
            density: self.density
        )
    }
}
