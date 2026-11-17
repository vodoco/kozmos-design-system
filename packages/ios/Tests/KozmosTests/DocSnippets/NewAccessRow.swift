// Table.mdx's SwiftUI snippet ("Highlighting a new row"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The row just added tints in the informative surface and fades back, so
// the eye finds it. Under Reduce Motion it shows and clears with no fade.
struct NewAccessRow: View {
    struct Access: Identifiable {
        let client: String
        let role: String
        var id: String { client }
    }

    let access = [Access(client: "Acme", role: "Editor"), Access(client: "Globex", role: "Viewer")]
    let added = "Globex"

    var body: some View {
        KozmosTable(access) { row in
            KozmosTableRow(highlight: row.client == added ? .new : nil) {
                KozmosTableCell(row.client)
                KozmosTableCell(row.role)
            }
        }
    }
}
