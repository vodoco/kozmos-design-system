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
// inside KozmosTree, from nodes, so each row reads as a one-node tree, and a
// Divided row as a one-node divided tree (GAP-201).
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

    @FigmaBoolean("Divided")
    var divided: Bool = false

    // GAP-107: Meta Below draws the Meta Text on a second line under the
    // label; off, the row has no meta.
    @FigmaBoolean("Meta Below")
    var metaBelow: Bool = false

    @FigmaString("Meta Text")
    var metaText: String = "Changes awaiting publish"

    var body: some View {
        KozmosTree(
            nodes: [Node(value: self.name, children: [], meta: self.metaBelow ? self.metaText : nil)],
            density: self.density,
            divided: self.divided,
            metaPlacement: self.metaBelow ? .below : .inline
        )
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

    @FigmaBoolean("Divided")
    var divided: Bool = false

    // GAP-107: Meta Below draws the Meta Text on a second line under the
    // label; off, the row has no meta.
    @FigmaBoolean("Meta Below")
    var metaBelow: Bool = false

    @FigmaString("Meta Text")
    var metaText: String = "Changes awaiting publish"

    var body: some View {
        KozmosTree(
            nodes: [Node(value: self.name, meta: self.metaBelow ? self.metaText : nil)],
            density: self.density,
            divided: self.divided,
            metaPlacement: self.metaBelow ? .below : .inline
        )
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

    @FigmaBoolean("Divided")
    var divided: Bool = false

    // GAP-107: Meta Below draws the Meta Text on a second line under the
    // label; off, the row has no meta.
    @FigmaBoolean("Meta Below")
    var metaBelow: Bool = false

    @FigmaString("Meta Text")
    var metaText: String = "Changes awaiting publish"

    var body: some View {
        KozmosTree(
            nodes: [Node(value: self.name, meta: self.metaBelow ? self.metaText : nil)],
            density: self.density,
            divided: self.divided,
            metaPlacement: self.metaBelow ? .below : .inline
        )
    }
}
