// Switch.mdx's SwiftUI snippet ("Mixed"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The features' settings differ, so the switch is mixed until it is tapped:
// the tap turns it on, and that edit clears mixed. While mixed it is held
// off, so the tap changes it. VoiceOver says "Multiple values" as its value.
struct StepFreeAcrossSelection: View {
    let settings: [Bool]
    @State private var edit: Bool?

    var body: some View {
        let differs = Set(settings).count > 1
        KozmosSwitch(
            checked: Binding(get: { edit ?? (differs ? false : settings[0]) }, set: { edit = $0 }),
            label: "Step-free",
            mixed: differs && edit == nil,
            onResetMixed: differs ? { edit = nil } : nil
        )
    }
}
