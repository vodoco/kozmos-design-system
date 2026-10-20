// Backdrop.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The scrim fills the space it is given, past the safe areas, so it goes
// under what it dims at the screen's root. A tap on it calls onTap: what
// that closes, and the overlay's focus and semantics, are yours.
struct DismissibleBackdrop: View {
    @Binding var isOpen: Bool

    var body: some View {
        KozmosBackdrop(visible: isOpen, onTap: { isOpen = false })
    }
}
