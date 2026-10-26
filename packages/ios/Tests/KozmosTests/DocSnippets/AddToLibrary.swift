// Tooltip.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The bubble shows on hover, or when a finger holds the view down. Its text
// is VoiceOver's hint too; pass isAccessibilityHint: false where it repeats
// the view's own label. side: .right is the view's right in every language,
// as React's side is; .trailing is after it in the reading direction.
struct AddToLibrary: View {
    let add: () -> Void

    var body: some View {
        KozmosButton("Hover", action: add)
            .kozmosTooltip("Add to library", side: .trailing)
    }
}
