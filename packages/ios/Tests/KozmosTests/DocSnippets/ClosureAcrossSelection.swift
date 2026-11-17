// DateRangePicker.mdx's SwiftUI snippet ("Mixed"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct ClosureAcrossSelection: View {
    let closures: [ClosedRange<Date>]
    @State private var start: Date?
    @State private var end: Date?

    var body: some View {
        let differs = Set(closures).count > 1
        KozmosDateRangePicker(
            startDate: Binding(get: { start ?? closures[0].lowerBound }, set: { start = $0 }),
            endDate: Binding(get: { end ?? closures[0].upperBound }, set: { end = $0 }),
            label: "Closed",
            mixed: differs && start == nil && end == nil,
            onResetMixed: differs ? { start = nil; end = nil } : nil
        )
    }
}
