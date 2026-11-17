// ToggleButton.mdx's SwiftUI snippet ("Mixed"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Bold on some of the selected labels and not on others: the toggle is
// mixed until it is tapped, which turns it on and clears mixed. While mixed
// it is held off, so the tap changes it. VoiceOver says "Multiple values"
// as its value; it is never selected.
struct BoldAcrossSelection: View {
    let bold: [Bool]
    @State private var edit: Bool?

    var body: some View {
        let differs = Set(bold).count > 1
        KozmosToggleButton(
            isOn: Binding(get: { edit ?? (differs ? false : bold[0]) }, set: { edit = $0 }),
            label: "Bold",
            mixed: differs && edit == nil,
            onResetMixed: differs ? { edit = nil } : nil
        )
    }
}
