// Popover.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The popover Kozmos draws is a title and an optional description. Given
// content of its own instead, it draws only that content.
struct OpeningHoursPopover: View {
    @State private var isPresented = false

    var body: some View {
        KozmosButton("Opening hours") { isPresented = true }
            .kozmosPopover(
                isPresented: $isPresented,
                title: "Opening hours",
                description: "Monday–Friday, 09:00–18:00"
            )
    }
}
