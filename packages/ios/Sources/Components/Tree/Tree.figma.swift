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

    // GAP-277: Checkable draws the row's box and Checked its check;
    // Disclosure End puts the chevron at the row's end.
    @FigmaBoolean("Checkable")
    var checkable: Bool = false

    @FigmaBoolean("Checked")
    var checked: Bool = false

    @FigmaBoolean("Disclosure End")
    var disclosureEnd: Bool = false

    var body: some View {
        KozmosTree(
            nodes: [Node(id: "row", value: self.name, children: [], meta: self.metaBelow ? self.metaText : nil)],
            density: self.density,
            divided: self.divided,
            selection: .constant(self.checked ? ["row"] : []),
            metaPlacement: self.metaBelow ? .below : .inline,
            checkable: self.checkable,
            disclosurePosition: self.disclosureEnd ? .end : .start
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

    // GAP-277: Checkable draws the row's box and Checked its check;
    // Disclosure End puts the chevron at the row's end.
    @FigmaBoolean("Checkable")
    var checkable: Bool = false

    @FigmaBoolean("Checked")
    var checked: Bool = false

    @FigmaBoolean("Disclosure End")
    var disclosureEnd: Bool = false

    var body: some View {
        KozmosTree(
            nodes: [Node(id: "row", value: self.name, meta: self.metaBelow ? self.metaText : nil)],
            density: self.density,
            divided: self.divided,
            selection: .constant(self.checked ? ["row"] : []),
            metaPlacement: self.metaBelow ? .below : .inline,
            checkable: self.checkable,
            disclosurePosition: self.disclosureEnd ? .end : .start
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

    // GAP-277: Checkable draws the row's box and Checked its check;
    // Disclosure End puts the chevron at the row's end.
    @FigmaBoolean("Checkable")
    var checkable: Bool = false

    @FigmaBoolean("Checked")
    var checked: Bool = false

    @FigmaBoolean("Disclosure End")
    var disclosureEnd: Bool = false

    var body: some View {
        KozmosTree(
            nodes: [Node(id: "row", value: self.name, meta: self.metaBelow ? self.metaText : nil)],
            density: self.density,
            divided: self.divided,
            selection: .constant(self.checked ? ["row"] : []),
            metaPlacement: self.metaBelow ? .below : .inline,
            checkable: self.checkable,
            disclosurePosition: self.disclosureEnd ? .end : .start
        )
    }
}
