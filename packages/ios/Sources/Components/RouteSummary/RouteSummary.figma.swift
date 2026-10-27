import SwiftUI
import Figma

struct KozmosRouteSummaryConnect: FigmaConnect {
    let component = KozmosRouteSummary<KozmosIcon>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1351-8296"

    @FigmaString("ETA Text")
    var etaText: String = "6 min"

    @FigmaString("Distance Text")
    var distanceText: String = "320 m"

    @FigmaEnum(
        "State",
        mapping: [
            "Preview": KozmosRouteSummaryState.preview,
            "Active": KozmosRouteSummaryState.active
        ]
    )
    var state: KozmosRouteSummaryState = .preview

    var body: some View {
        KozmosRouteSummary(
            etaText: self.etaText,
            distanceText: self.distanceText,
            state: self.state,
            onEndRoute: {},
            onStartNavigation: {}
        ) {
            KozmosIcon("walking")
        }
    }
}
