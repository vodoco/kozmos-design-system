import SwiftUI
import Figma

/// The itinerary the card opens into and whether it is open are the product's;
/// the example shows one step so the snippet reads as a real call.
struct KozmosManoeuvreCardConnect: FigmaConnect {
    let component = KozmosManoeuvreCard<KozmosItinerary>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2210-38624"

    @FigmaString("Instruction Text")
    var instruction: String = "Take Elevator down to First Floor"

    @FigmaString("Detail Text")
    var detail: String = "58 m · Second Floor"

    @FigmaEnum("State", mapping: ["Closed": false, "Open": true])
    var isExpanded: Bool = false

    @FigmaEnum("Appearance", mapping: ["Theme": KozmosManoeuvreAppearance.theme, "Background": KozmosManoeuvreAppearance.background])
    var appearance: KozmosManoeuvreAppearance = .theme

    var body: some View {
        KozmosManoeuvreCard(
            type: .liftDown,
            instruction: self.instruction,
            detail: self.detail,
            isExpanded: self.isExpanded,
            onToggle: {},
            appearance: self.appearance
        ) {
            KozmosItinerary(
                origin: "Dunkin'",
                steps: [
                    KozmosItineraryStep(id: "1", instruction: "Take Elevator down to First Floor", type: .liftDown, isCurrent: true),
                ],
                destination: "Airport Shuttles"
            )
        }
    }
}
