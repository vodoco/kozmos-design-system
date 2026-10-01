// LocationPin.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A result's pin, numbered as its card's tab: quiet at rest, filled when the
// result is selected, and dashed when the place is on another floor.
struct ResultPin: View {
    let name: String
    let number: Int
    let isSelected: Bool
    let isOnAnotherFloor: Bool
    let onSelect: () -> Void

    var body: some View {
        KozmosLocationPin(
            label: name,
            number: number,
            selected: isSelected,
            offFloor: isOnAnotherFloor,
            onSelect: onSelect
        )
    }
}
