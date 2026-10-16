import SwiftUI
import Figma

// The LocationPin set (decision 79): Kind is Result, Featured or Place; State
// is Default or Selected; Content is Number or Dot on a Result, and None on a
// Featured tile or a Place (every variant names every axis, or Figma holds the
// set in error). One mapping per Kind and Content, as the set's seven
// variants are drawn.
// labelPlacement belongs to the map renderer, so it is not a Figma axis.

struct KozmosLocationPinResultNumberConnect: FigmaConnect {
    let component = KozmosLocationPin.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6847"
    var variant = ["Kind": "Result", "Content": "Number"]

    @FigmaString("Label Text")
    var label: String = "Gate 12"

    @FigmaString("Number Text")
    var number: String = "12"

    @FigmaEnum("State", mapping: ["Default": false, "Selected": true])
    var selected: Bool = false

    var body: some View {
        KozmosLocationPin(
            label: self.label,
            number: Int(self.number),
            selected: self.selected
        )
    }
}

struct KozmosLocationPinResultDotConnect: FigmaConnect {
    let component = KozmosLocationPin.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6847"
    var variant = ["Kind": "Result", "Content": "Dot"]

    @FigmaString("Label Text")
    var label: String = "Gate 12"

    @FigmaEnum("State", mapping: ["Default": false, "Selected": true])
    var selected: Bool = false

    var body: some View {
        KozmosLocationPin(
            label: self.label,
            selected: self.selected
        )
    }
}

struct KozmosLocationPinFeaturedConnect: FigmaConnect {
    let component = KozmosLocationPin.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6847"
    var variant = ["Kind": "Featured", "Content": "None"]

    @FigmaString("Label Text")
    var label: String = "Cafe"

    @FigmaEnum("State", mapping: ["Default": false, "Selected": true])
    var selected: Bool = false

    // The logo is the product's image, passed as `markerContent`.
    var body: some View {
        KozmosLocationPin(
            label: self.label,
            selected: self.selected,
            featured: true
        )
    }
}

struct KozmosLocationPinPlaceConnect: FigmaConnect {
    let component = KozmosLocationPin.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6847"
    var variant = ["Kind": "Place", "Content": "None"]

    @FigmaString("Label Text")
    var label: String = "Gate 12"

    var body: some View {
        KozmosLocationPin(
            label: self.label,
            place: true
        )
    }
}
