// Slider.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The readout stays at the slider's end, at rest too. VoiceOver hears the
// value once, from the slider, in the readout's words.
struct FloorPlanOpacity: View {
    @Binding var opacity: Double

    var body: some View {
        KozmosFieldWrapper(label: "Floor-plan opacity") {
            KozmosSlider(
                value: $opacity,
                range: 0...1,
                showValue: true,
                formatValue: { "\(Int(($0 * 100).rounded()))%" }
            )
            .accessibilityLabel("Floor-plan opacity")
        }
    }
}
