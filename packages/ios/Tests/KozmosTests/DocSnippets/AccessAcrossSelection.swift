// Radio.mdx's SwiftUI snippet ("Mixed"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The features' access differs, so the group is mixed until an option is
// chosen: none shows as chosen, and "Multiple values" is under the options.
struct AccessAcrossSelection: View {
    let levels: [String]
    @State private var edit: String?

    var body: some View {
        let differs = Set(levels).count > 1
        let selection = Binding(get: { edit ?? (differs ? "" : levels[0]) }, set: { edit = $0 })
        KozmosRadioGroup(mixed: differs && edit == nil, onResetMixed: differs ? { edit = nil } : nil) {
            KozmosRadioGroupItem(value: "public", label: "Public", selection: selection)
            KozmosRadioGroupItem(value: "staff", label: "Staff only", selection: selection)
            KozmosRadioGroupItem(value: "closed", label: "Closed", selection: selection)
        }
    }
}
