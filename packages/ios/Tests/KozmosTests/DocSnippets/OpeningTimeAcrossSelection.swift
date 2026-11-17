// TimePicker.mdx's SwiftUI snippet ("Mixed"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct OpeningTimeAcrossSelection: View {
    let opens: [Date]
    @State private var edit: Date?

    var body: some View {
        let differs = Set(opens).count > 1
        KozmosTimePicker(
            selection: Binding(get: { edit ?? opens[0] }, set: { edit = $0 }),
            label: "Opens",
            mixed: differs && edit == nil,
            onResetMixed: differs ? { edit = nil } : nil
        )
    }
}
