import SwiftUI
import Figma

// Placement=Fixed only: SwiftUI's drawer has no inline form yet (GAP-198 is web
// and Figma first, decision 134), so an Inline instance shows no SwiftUI snippet
// rather than a fixed one.

struct KozmosDrawerConnect: FigmaConnect {
    let component = KozmosDrawer<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=232-2042"
    var variant = ["Placement": "Fixed"]

    @FigmaEnum(
        "Side",
        mapping: [
            "Top": KozmosDrawerSide.top,
            "Right": KozmosDrawerSide.right,
            "Bottom": KozmosDrawerSide.bottom,
            "Left": KozmosDrawerSide.left
        ]
    )
    var side: KozmosDrawerSide = .right

    @FigmaString("Title Text")
    var title: String = "Manage layers"

    @FigmaString("Description Text")
    var description: String = "Update map display settings."

    @FigmaString("Body Text")
    var bodyText: String = "Drawer body content"

    var body: some View {
        KozmosDrawer(
            isPresented: .constant(true),
            side: self.side,
            title: self.title,
            description: self.description,
            bodyText: self.bodyText
        ) {
            AnyView(Spacer(minLength: 0))
        }
    }
}
