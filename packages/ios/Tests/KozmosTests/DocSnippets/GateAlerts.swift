// Switch.mdx's SwiftUI snippet ("A description and a state label"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// VoiceOver reads the description after the switch's name. The state label
// draws the state in words beside the track; VoiceOver hears the same words
// once, as the switch's value. Pass onLabel and offLabel in your app's language.
struct GateAlerts: View {
    @Binding var isOn: Bool

    var body: some View {
        KozmosSwitch(
            checked: $isOn,
            label: "Gate alerts",
            description: "A notification when your gate changes",
            showStateLabel: true
        )
    }
}
