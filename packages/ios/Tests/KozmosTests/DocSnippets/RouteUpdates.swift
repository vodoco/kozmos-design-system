// Checkbox.mdx's SwiftUI snippet ("A description"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The description is drawn under the label, and VoiceOver reads it as the
// checkbox's hint, after its name.
struct RouteUpdates: View {
    @Binding var isOn: Bool

    var body: some View {
        KozmosCheckbox(
            checked: $isOn,
            label: "Route updates",
            description: "Tell me when a faster route opens"
        )
    }
}
