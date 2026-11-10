// ContextMenu.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The system's context menu with KozmosMenu's rows: a long press opens it,
// a secondary click on iPad and Mac, and VoiceOver offers it as the
// element's menu. Picking an item hands it to you and closes the menu.
struct GateContextMenu: View {
    @State private var picked = "Nothing yet"

    var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            KozmosText("Gate A12")
                .kozmosContextMenu(
                    KozmosMenuContent(items: [
                        KozmosMenuItem(text: "Copy gate"),
                        KozmosMenuItem(text: "Share"),
                    ]),
                    onItemSelect: { picked = $0.text }
                )
            KozmosText("Picked: \(picked)")
        }
    }
}
