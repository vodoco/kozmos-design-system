// Tooltip.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The bubble shows on hover, or when a finger holds the view down. Its text
// is VoiceOver's hint too; pass isAccessibilityHint: false where it repeats
// the view's own label.
struct AddToLibrary: View {
    let add: () -> Void

    var body: some View {
        KozmosButton("Hover", action: add)
            .kozmosTooltip("Add to library")
    }
}
