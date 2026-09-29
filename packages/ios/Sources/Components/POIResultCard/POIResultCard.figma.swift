import SwiftUI
import Figma

struct KozmosPOIResultCardConnect: FigmaConnect {
    let component = KozmosPOIResultCard.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1351-8150"

    @FigmaString("Title Text")
    var title: String = "Kozmos Cafe"

    @FigmaEnum(
        "State",
        mapping: ["Default": false, "Selected": true, "Featured": false, "Unavailable": false]
    )
    var selected: Bool = false

    @FigmaEnum(
        "State",
        mapping: ["Default": false, "Selected": false, "Featured": true, "Unavailable": false]
    )
    var featured: Bool = false

    @FigmaEnum(
        "State",
        mapping: ["Default": true, "Selected": true, "Featured": true, "Unavailable": false]
    )
    var available: Bool = true

    // State reads off the KozmosPOIResultPresentation rather than parameters,
    // so the axis feeds the object.
    var body: some View {
        KozmosPOIResultCard(
            poi: KozmosPOIPresentation(
                id: "cafe",
                name: self.title,
                floorId: "l2",
                floorLabel: "Level 2",
                actions: []
            ),
            result: KozmosPOIResultPresentation(
                poiId: "cafe",
                resultIndex: 1,
                selected: self.selected,
                featured: self.featured,
                floorId: "l2",
                available: self.available
            ),
            onSelect: { _ in }
        )
    }
}
