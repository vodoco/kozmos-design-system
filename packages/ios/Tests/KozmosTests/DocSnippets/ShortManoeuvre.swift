// ManoeuvreCard.mdx's SwiftUI snippet ("The whole instruction"), word for
// word below this comment: compiled here, so a renamed or removed parameter
// fails in this target rather than in a reader's project. Change the two
// together.
import SwiftUI
import Kozmos

// A product that keeps the instruction to two lines, as Kozmos 0.5 drew it.
struct ShortManoeuvre: View {
    let steps: [KozmosItineraryStep]
    @State private var expanded = false

    var body: some View {
        KozmosManoeuvreCard(
            type: .escalatorUp,
            instruction: "Take the escalator near Fountain Court up to Level 1",
            detail: "40 m · Ground Floor",
            instructionLines: 2,
            isExpanded: expanded,
            onToggle: { expanded.toggle() }
        ) {
            KozmosItinerary(origin: "Main Entrance", steps: steps, destination: "Airport Shuttles")
        }
    }
}
