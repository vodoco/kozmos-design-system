// Tree.mdx's SwiftUI snippet ("Sections, ranges and a menu"), word for word
// below this comment: compiled here, so a renamed or removed parameter fails
// in this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A level's items in sections, each with its count. A tap adds a row to the
// selection or takes it away; with a keyboard, Shift selects a range and
// Command one row more. Only the rows in view are drawn, so thousands scroll
// as ten do. A long press, or a secondary click, opens a row's menu.
struct MapContentTree: View {
    @State private var selected: Set<String> = []
    @State private var picked = ""

    var body: some View {
        KozmosTree(
            nodes: [
                Node(id: "level-1", value: "Level 1", children: [
                    .section("POI", count: "2", children: [
                        Node(id: "cafe", value: "Bean & Leaf Café", meta: "Changes awaiting publish"),
                        Node(id: "gate", value: "Gate A12"),
                    ]),
                    .section("Structural", count: "1", children: [
                        Node(id: "wall", value: "Wall"),
                    ]),
                ]),
            ],
            divided: true,
            bleed: KozmosDimensions.primitivesLayoutSpacing200,
            selectionMode: .multiple,
            selection: $selected,
            metaPlacement: .below,
            contextMenu: { _ in
                KozmosMenuContent(items: [
                    KozmosMenuItem(text: "Rename"),
                    KozmosMenuItem(text: "Delete"),
                ])
            },
            onContextMenuSelect: { node, item in
                picked = item.text + " " + node.value
            }
        )
    }
}
