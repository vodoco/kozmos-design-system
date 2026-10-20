// Switch.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The switch draws its label beside it, and the whole row toggles.
struct AirplaneMode: View {
    @Binding var isOn: Bool

    var body: some View {
        KozmosSwitch(checked: $isOn, label: "Airplane Mode")
    }
}
