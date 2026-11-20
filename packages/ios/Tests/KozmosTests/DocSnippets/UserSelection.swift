// Table.mdx's SwiftUI snippet ("Selecting rows"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A selectable table starts each row with a checkbox named for its row, and
// draws a first row whose checkbox selects every row, mixed while some are.
// selection holds the selected rows' ids; VoiceOver hears how many.
struct UserSelection: View {
    struct User: Identifiable {
        let name: String
        let role: String
        var id: String { name }
    }

    let users = [User(name: "Ada Lovelace", role: "Admin"), User(name: "Grace Hopper", role: "Editor")]
    @State private var selection: Set<String> = []

    var body: some View {
        KozmosTable(users, selection: $selection, rowSelectLabel: { "Select " + $0.name }) { user in
            KozmosTableRow {
                KozmosTableCell(user.name)
                KozmosTableCell(user.role)
            }
        }
    }
}
