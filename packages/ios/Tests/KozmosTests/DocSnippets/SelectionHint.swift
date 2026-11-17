// Tooltip.mdx's SwiftUI snippet ("Inverse tone"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// tone: .inverse draws the dark bubble, Semantics.Inverse: dark on a light
// page and light on a dark one, the same size as the default bubble.
struct SelectionHint: View {
    let adjust: () -> Void

    var body: some View {
        KozmosButton("Adjust", variant: .outline, action: adjust)
            .kozmosTooltip("Keep holding Shift for multi-selection", tone: .inverse)
    }
}
