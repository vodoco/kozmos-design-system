// ToggleButton.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The label is required, and it is what VoiceOver says: there is no
// separate name. The state is yours to hold, and VoiceOver hears the button
// as selected while it is on.
struct ShowLabelsToggle: View {
    @Binding var showLabels: Bool

    var body: some View {
        KozmosToggleButton(isOn: $showLabels, label: "Labels")
    }
}
