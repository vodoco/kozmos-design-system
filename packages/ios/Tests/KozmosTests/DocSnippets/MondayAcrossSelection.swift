// SegmentedControl.mdx's SwiftUI snippet ("Mixed"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The features' Mondays differ, so the control is mixed until an option is
// chosen: none shows as chosen, and "Multiple values" is under the track.
struct MondayAcrossSelection: View {
    let days: [Int]
    @State private var edit: Int?

    var body: some View {
        let differs = Set(days).count > 1
        KozmosSegmentedControl(
            selection: Binding(get: { edit ?? days[0] }, set: { edit = $0 }),
            items: ["Hours", "Closed", "Always open"],
            size: .sm,
            mixed: differs && edit == nil,
            onResetMixed: differs ? { edit = nil } : nil
        )
    }
}
