// MapControlButton.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project, and drawn by
// KozmosMapControlDocSnippetTests. Change the two together.
import SwiftUI
import Kozmos

// A map toggle: grey while off, the theme's blue and navy while on. It rests
// icon-only and says its new state for a moment when it changes.
struct LayersToggle: View {
    @Binding var showsLayers: Bool

    var body: some View {
        KozmosMapControlButton(
            label: String(localized: "Layers"),
            systemImage: "square.3.layers.3d",
            stateLabel: showsLayers ? String(localized: "On") : String(localized: "Off"),
            labelPlacement: .stacked,
            revealOnChange: true,
            pressed: showsLayers
        ) {
            showsLayers.toggle()
        }
    }
}
