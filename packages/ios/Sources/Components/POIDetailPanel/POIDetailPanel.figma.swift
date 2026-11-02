import SwiftUI
import Figma

struct KozmosPOIDetailPanelConnect: FigmaConnect {
    let component = KozmosPOIDetailPanel.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1351-8103"

    @FigmaString("Title Text")
    var title: String = "Kozmos Cafe"

    @FigmaEnum(
        "Presentation",
        mapping: [
            "Inline": KozmosPOIDetailPanel.Presentation.inline,
            "Sheet": KozmosPOIDetailPanel.Presentation.sheet,
            "Panel": KozmosPOIDetailPanel.Presentation.panel
        ]
    )
    var presentation: KozmosPOIDetailPanel.Presentation = .inline

    // Host Action is one of `details.hostActions` (GAP-130), which
    // `onHostAction` runs.
    var body: some View {
        KozmosPOIDetailPanel(
            poi: KozmosPOIPresentation(
                id: "cafe",
                name: self.title,
                floorId: "l2",
                floorLabel: "Level 2",
                actions: []
            ),
            actionLabels: [:],
            onAction: { _, _ in },
            onClose: {},
            presentation: self.presentation,
            onHostAction: { _, _ in }
        )
    }
}
