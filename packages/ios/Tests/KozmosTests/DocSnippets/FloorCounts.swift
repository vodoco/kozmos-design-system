// Table.mdx's SwiftUI snippet ("Sorting and numbers"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// SwiftUI's table has no sortable header or numeric column (GAP-037 is for
// the web and Vue): order the rows before you hand them over.
struct FloorCounts: View {
    struct Floor: Identifiable {
        let name: String
        let pois: Int
        var id: String { name }
    }

    let floors = [Floor(name: "Roof", pois: 3), Floor(name: "Ground", pois: 1204)]

    var body: some View {
        KozmosTable(floors.sorted { $0.pois > $1.pois }) { floor in
            KozmosTableRow {
                KozmosTableCell(floor.name)
                KozmosTableCell(floor.pois.formatted())
            }
        }
    }
}
