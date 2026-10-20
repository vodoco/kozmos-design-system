// Slider.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The slider draws no label: KozmosFieldWrapper puts one above it, and
// VoiceOver says the one the slider is given.
struct VolumeSlider: View {
    @Binding var volume: Double

    var body: some View {
        KozmosFieldWrapper(label: "Volume") {
            KozmosSlider(value: $volume, range: 0...100)
                .accessibilityLabel("Volume")
        }
    }
}
