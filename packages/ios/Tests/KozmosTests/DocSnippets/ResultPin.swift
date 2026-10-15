// LocationPin.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A result's marker, numbered as its card's tab: a theme-bordered pill at
// rest, filled when the result is selected. Its label is its whole spoken
// name, the number included. A double tap opens the place's details.
// `.position(point)` puts the pointer's tip on the point.
struct ResultPin: View {
    let name: String
    let number: Int
    let point: CGPoint
    let isSelected: Bool
    let onSelect: () -> Void
    let onOpen: () -> Void

    var body: some View {
        KozmosLocationPin(
            label: "\(number), \(name)",
            number: number,
            selected: isSelected,
            onSelect: onSelect,
            onOpen: onOpen
        )
        .position(point)
    }
}
