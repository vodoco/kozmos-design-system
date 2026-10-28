import SwiftUI
import Figma

struct KozmosTreeConnect: FigmaConnect {
    let component = KozmosTree.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=662-5094"

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
            nodes: [
                Node(
                    value: "Map content",
                    children: [
                        Node(value: "Places"),
                        Node(value: "Amenities")
                    ]
                ),
                Node(
                    value: "Reports",
                    children: [
                        Node(value: "Daily summary")
                    ]
                )
            ],
            density: self.density
        )
    }
}

// The rows a designer puts in Tree's Content Slot. SwiftUI draws rows only
// inside KozmosTree, from nodes, so each row reads as a one-node tree; it
// has no divided rows yet (GAP-201 is web and Figma first), so Divided
// changes nothing here.
struct KozmosTreeParentItemConnect: FigmaConnect {
    let component = KozmosTree.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=684-6080"

    @FigmaString("Label Text")
    var name: String = "Map content"

    @FigmaEnum(
        "Density",
        mapping: [
            "Default": KozmosTreeDensity.default,
            "Compact": KozmosTreeDensity.compact
        ]
    )
    var density: KozmosTreeDensity = .default

    var body: some View {
        KozmosTree(nodes: [Node(value: self.name, children: [])], density: self.density)
    }
}

struct KozmosTreeChildItemConnect: FigmaConnect {
    let component = KozmosTree.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=687-6789"

    @FigmaString("Label Text")
    var name: String = "Place item"

    @FigmaEnum(
        "Density",
        mapping: [
            "Default": KozmosTreeDensity.default,
            "Compact": KozmosTreeDensity.compact
        ]
    )
    var density: KozmosTreeDensity = .default

    var body: some View {
        KozmosTree(nodes: [Node(value: self.name)], density: self.density)
    }
}

struct KozmosTreeItemConnect: FigmaConnect {
    let component = KozmosTree.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=723-8776"

    @FigmaString("Label Text")
    var name: String = "Map content"

    @FigmaEnum(
        "Density",
        mapping: [
            "Default": KozmosTreeDensity.default,
            "Compact": KozmosTreeDensity.compact
        ]
    )
    var density: KozmosTreeDensity = .default

    var body: some View {
        KozmosTree(nodes: [Node(value: self.name)], density: self.density)
    }
}
