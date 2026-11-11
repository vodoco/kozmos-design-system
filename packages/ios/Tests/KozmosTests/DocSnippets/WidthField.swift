// NumberInput.mdx's SwiftUI snippet ("A unit"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The unit is drawn after the value and never typed: the value stays a
// number. VoiceOver hears the value, then the unit's spoken name.
struct WidthField: View {
    @Binding var width: Double?

    var body: some View {
        KozmosNumberInput(
            value: $width,
            label: "Width",
            min: 0,
            unit: "m",
            unitLabel: "metres"
        )
    }
}
