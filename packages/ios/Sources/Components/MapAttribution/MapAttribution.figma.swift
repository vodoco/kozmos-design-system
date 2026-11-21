import SwiftUI
import Figma

// GAP-206: Appearance is appearance; Credit Text and Credit Text 2 are the
// credits' labels, in order; Show Brand is showBrand. The brand is the
// product's mark.
struct KozmosMapAttributionConnect: FigmaConnect {
    let component = KozmosMapAttribution.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17387"

    @FigmaString("Credit Text")
    var credit1: String = "© Example venue"

    @FigmaString("Credit Text 2")
    var credit2: String = "© OpenStreetMap"

    @FigmaBoolean("Show Brand")
    var showBrand: Bool = true

    @FigmaEnum(
        "Appearance",
        mapping: [
            "Map": KozmosMapAttributionAppearance.map,
            "Surface": KozmosMapAttributionAppearance.surface
        ]
    )
    var appearance: KozmosMapAttributionAppearance = .map

    var body: some View {
        KozmosMapAttribution(
            credits: [
                KozmosMapAttributionCredit(id: "venue", label: self.credit1),
                KozmosMapAttributionCredit(id: "basemap", label: self.credit2)
            ],
            showBrand: self.showBrand,
            appearance: self.appearance
        )
    }
}
