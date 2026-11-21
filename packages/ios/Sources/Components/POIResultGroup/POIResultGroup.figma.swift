import SwiftUI
import Figma

// GAP-206: State is defaultExpanded; Hide Text is hideLabel. Show More Text
// is drawn from showMoreLabel(hidden), a function of the count, so it keeps
// its default. Each member is a POIResultCard row from items.
struct KozmosPOIResultGroupConnect: FigmaConnect {
    let component = KozmosPOIResultGroup.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17557"

    @FigmaEnum(
        "State",
        mapping: [
            "Collapsed": false,
            "Expanded": true
        ]
    )
    var defaultExpanded: Bool = false

    @FigmaString("Hide Text")
    var hideLabel: String = "Hide"

    var body: some View {
        KozmosPOIResultGroup(
            items: [],
            label: "Starbucks",
            defaultExpanded: self.defaultExpanded,
            hideLabel: self.hideLabel,
            onSelect: { _ in }
        )
    }
}
