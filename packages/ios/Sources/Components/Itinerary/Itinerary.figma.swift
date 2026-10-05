import SwiftUI
import Figma

/// The route's steps come from the product's routing, not from Figma; the
/// example shows one so the snippet reads as a real call.
struct KozmosItineraryConnect: FigmaConnect {
    let component = KozmosItinerary.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2201-9608"

    @FigmaString("Origin Text")
    var origin: String = "Dunkin'"

    @FigmaString("Destination Text")
    var destination: String = "Airport Shuttles"

    @FigmaString("Origin Label")
    var originLabel: String = "From"

    @FigmaString("Destination Label")
    var destinationLabel: String = "To"

    var body: some View {
        KozmosItinerary(
            origin: self.origin,
            steps: [
                KozmosItineraryStep(id: "1", instruction: "Take Elevator down to First Floor", type: .liftDown, isCurrent: true),
            ],
            destination: self.destination,
            originLabel: self.originLabel,
            destinationLabel: self.destinationLabel
        )
    }
}
