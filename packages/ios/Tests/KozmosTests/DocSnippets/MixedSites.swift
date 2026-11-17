// Tree.mdx's SwiftUI snippet ("Mixed parents"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Each row's check is its own. A client with some of its sites checked is
// mixed, heard as "Mixed"; a tap on it checks all its sites, and a tap on a
// checked client clears them.
struct MixedSites: View {
    @State private var checked: Set<String> = ["acme-hq"]

    var body: some View {
        KozmosTree(
            nodes: [
                Node(id: "acme", value: "Acme", children: [
                    Node(id: "acme-hq", value: "Acme HQ"),
                    Node(id: "acme-lab", value: "Acme Lab"),
                ]),
            ],
            selection: $checked,
            checkable: true,
            checkRule: .independent
        )
    }
}
