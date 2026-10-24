// Table.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The table draws a row for each element of your data, which is
// Identifiable, and a cell takes a String. It has no header row, header
// cell or caption: React's TableHeader, TableHead and TableCaption have no
// counterpart here.
struct PlacesTable: View {
    struct Place: Identifiable {
        let name: String
        let floor: String
        var id: String { name }
    }

    let places = [Place(name: "Reception", floor: "Ground")]

    var body: some View {
        KozmosTable(places) { place in
            KozmosTableRow {
                KozmosTableCell(place.name)
                KozmosTableCell(place.floor)
            }
        }
    }
}
