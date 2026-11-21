import SwiftUI
import Figma

struct KozmosTableConnectRow: Identifiable {
    let id: String
    let first: String
    let second: String
    let third: String
}

struct KozmosTableConnect: FigmaConnect {
    let component = KozmosTable<[KozmosTableConnectRow], AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=237-2547"

    @FigmaEnum(
        "Density",
        mapping: [
            "Default": "default",
            "Compact": "compact"
        ]
    )
    var density: String = "default"

    @FigmaString("Header 1 Text")
    var header1: String = "Name"

    @FigmaString("Header 2 Text")
    var header2: String = "Status"

    @FigmaString("Header 3 Text")
    var header3: String = "Updated"

    @FigmaString("Row 1 Cell 1 Text")
    var row1Cell1: String = "Beacon sync"

    @FigmaString("Row 1 Cell 2 Text")
    var row1Cell2: String = "Ready"

    @FigmaString("Row 1 Cell 3 Text")
    var row1Cell3: String = "Today"

    @FigmaString("Row 2 Cell 1 Text")
    var row2Cell1: String = "Indoor map"

    @FigmaString("Row 2 Cell 2 Text")
    var row2Cell2: String = "Draft"

    @FigmaString("Row 2 Cell 3 Text")
    var row2Cell3: String = "Yesterday"

    @FigmaString("Row 3 Cell 1 Text")
    var row3Cell1: String = "Analytics"

    @FigmaString("Row 3 Cell 2 Text")
    var row3Cell2: String = "Queued"

    @FigmaString("Row 3 Cell 3 Text")
    var row3Cell3: String = "May 21"

    // GAP-171: Selectable is the selecting table, its select-all box and a
    // box at each row's start, the last row selected as Figma draws it.
    // Sortable and Numeric Column are not mapped: KozmosTableCell has no
    // sort arrow and no end alignment, so SwiftUI has no API for either.
    @FigmaBoolean("Selectable")
    var selectable: Bool = false

    var body: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            KozmosTableRow {
                KozmosTableCell(self.header1)
                KozmosTableCell(self.header2)
                KozmosTableCell(self.header3)
            }

            if self.selectable {
                KozmosTable(
                    rows,
                    selection: .constant(["row-3"]),
                    rowSelectLabel: { row in "Select \(row.first)" }
                ) { row in
                    AnyView(
                        KozmosTableRow {
                            KozmosTableCell(row.first)
                            KozmosTableCell(row.second)
                            KozmosTableCell(row.third)
                        }
                    )
                }
            } else {
                KozmosTable(rows) { row in
                    AnyView(
                        KozmosTableRow {
                            KozmosTableCell(row.first)
                            KozmosTableCell(row.second)
                            KozmosTableCell(row.third)
                        }
                    )
                }
            }
        }
    }

    private var rows: [KozmosTableConnectRow] {
        [
            KozmosTableConnectRow(
                id: "row-1",
                first: self.row1Cell1,
                second: self.row1Cell2,
                third: self.row1Cell3
            ),
            KozmosTableConnectRow(
                id: "row-2",
                first: self.row2Cell1,
                second: self.row2Cell2,
                third: self.row2Cell3
            ),
            KozmosTableConnectRow(
                id: "row-3",
                first: self.row3Cell1,
                second: self.row3Cell2,
                third: self.row3Cell3
            )
        ]
    }
}
