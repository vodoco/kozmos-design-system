// DatePicker.mdx's SwiftUI snippet ("Mixed"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct OpeningDayAcrossSelection: View {
    let days: [Date]
    @State private var edit: Date?

    var body: some View {
        let differs = Set(days).count > 1
        KozmosDatePicker(
            selection: Binding(get: { edit ?? days[0] }, set: { edit = $0 }),
            label: "Opens on",
            mixed: differs && edit == nil,
            onResetMixed: differs ? { edit = nil } : nil
        )
    }
}
