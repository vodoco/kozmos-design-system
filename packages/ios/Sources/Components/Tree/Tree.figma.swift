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

    // Decision 211, GAP-279: Mixed is a parent some but not all of whose
    // rows are checked. SwiftUI draws it from the rows under it, so a mixed
    // row is a parent with two rows, one checked, under the independent
    // rule.
    @FigmaBoolean("Mixed")
    var mixed: Bool = false

    // GAP-217: Band draws the selected and hover fills as a band across the
    // row's full width.
    @FigmaEnum(
        "RowFill",
        mapping: [
            "Inset": KozmosTreeRowFill.inset,
            "Band": KozmosTreeRowFill.band
        ]
    )
    var rowFill: KozmosTreeRowFill = .inset

    var body: some View {
        KozmosTree(
            nodes: [
                Node(
                    id: "row",
                    value: self.name,
                    children: self.mixed ? [Node(id: "row-1", value: "Places"), Node(id: "row-2", value: "Amenities")] : [],
                    meta: self.metaBelow ? self.metaText : nil
                )
            ],
            density: self.density,
            divided: self.divided,
            selection: .constant(self.mixed ? ["row-1"] : (self.checked ? ["row"] : [])),
            metaPlacement: self.metaBelow ? .below : .inline,
            checkable: self.checkable,
            checkRule: self.mixed ? .independent : .exclusive,
            disclosurePosition: self.disclosureEnd ? .end : .start,
            rowFill: self.rowFill
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

    // Decision 211, GAP-279: Mixed is not mapped here. SwiftUI draws a
    // row's dash from the rows under it, and a child row has none, so
    // KozmosTree has no API for a mixed child.

    // GAP-217: Band draws the selected and hover fills as a band across the
    // row's full width.
    @FigmaEnum(
        "RowFill",
        mapping: [
            "Inset": KozmosTreeRowFill.inset,
            "Band": KozmosTreeRowFill.band
        ]
    )
    var rowFill: KozmosTreeRowFill = .inset

    var body: some View {
        KozmosTree(
            nodes: [Node(id: "row", value: self.name, meta: self.metaBelow ? self.metaText : nil)],
            density: self.density,
            divided: self.divided,
            selection: .constant(self.checked ? ["row"] : []),
            metaPlacement: self.metaBelow ? .below : .inline,
            checkable: self.checkable,
            disclosurePosition: self.disclosureEnd ? .end : .start,
            rowFill: self.rowFill
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

    // Decision 211, GAP-279: Mixed is a parent some but not all of whose
    // rows are checked. SwiftUI draws it from the rows under it, so a mixed
    // row is a parent with two rows, one checked, under the independent
    // rule.
    @FigmaBoolean("Mixed")
    var mixed: Bool = false

    // GAP-217: Band draws the selected and hover fills as a band across the
    // row's full width.
    @FigmaEnum(
        "RowFill",
        mapping: [
            "Inset": KozmosTreeRowFill.inset,
            "Band": KozmosTreeRowFill.band
        ]
    )
    var rowFill: KozmosTreeRowFill = .inset

    var body: some View {
        KozmosTree(
            nodes: [
                Node(
                    id: "row",
                    value: self.name,
                    children: self.mixed ? [Node(id: "row-1", value: "Places"), Node(id: "row-2", value: "Amenities")] : nil,
                    meta: self.metaBelow ? self.metaText : nil
                )
            ],
            density: self.density,
            divided: self.divided,
            selection: .constant(self.mixed ? ["row-1"] : (self.checked ? ["row"] : [])),
            metaPlacement: self.metaBelow ? .below : .inline,
            checkable: self.checkable,
            checkRule: self.mixed ? .independent : .exclusive,
            disclosurePosition: self.disclosureEnd ? .end : .start,
            rowFill: self.rowFill
        )
    }
}
