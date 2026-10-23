// MapStatusPill.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project, and drawn by
// KozmosMapStatusPillDocSnippetTests. Change the two together.
import SwiftUI
import Kozmos

// The product's words, in the visitor's language, and its tone for each.
struct PositioningStatus: View {
    let isCalculating: Bool

    var body: some View {
        KozmosMapStatusPill(
            isCalculating
                ? String(localized: "Calculating Precise Position")
                : String(localized: "Established"),
            tone: isCalculating ? .progress : .success
        )
    }
}

// A mark in place of the tone's. Kozmos names Bluetooth-off on every
// platform; SF Symbols has no Bluetooth glyph, so iOS draws Pointr's outline.
struct BluetoothStatus: View {
    var body: some View {
        KozmosMapStatusPill(String(localized: "No Bluetooth"), tone: .danger) {
            KozmosIcon("bluetooth-off", size: .lg)
        }
    }
}

// The system's walking figure, in the progress tone's blue.
struct WalkingStatus: View {
    var body: some View {
        KozmosMapStatusPill(String(localized: "Walking improves accuracy"), tone: .progress) {
            Image(systemName: "figure.walk").resizable().scaledToFit()
        }
    }
}
