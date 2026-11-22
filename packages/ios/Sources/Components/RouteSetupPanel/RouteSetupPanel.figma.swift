import SwiftUI
import Figma

// GAP-206: State is ready and pending (Incomplete not ready, Ready ready,
// Pending ready while the route is worked out); Presentation is
// presentation. Title Text is title, Description Text description (Show
// Description). The two fields are RouteLocationField instances.
struct KozmosRouteSetupPanelConnect: FigmaConnect {
    let component = KozmosRouteSetupPanel<EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17873"

    @FigmaEnum(
        "State",
        mapping: [
            "Incomplete": false,
            "Ready": true,
            "Pending": true
        ]
    )
    var ready: Bool = false

    @FigmaEnum(
        "State",
        mapping: [
            "Incomplete": false,
            "Ready": false,
            "Pending": true
        ]
    )
    var pending: Bool = false

    @FigmaEnum(
        "Presentation",
        mapping: [
            "Hosted": KozmosRoutePresentation.hosted,
            "Standalone": KozmosRoutePresentation.standalone
        ]
    )
    var presentation: KozmosRoutePresentation = .hosted

    @FigmaString("Title Text")
    var title: String = "Set up a route"

    @FigmaString("Description Text")
    var routeDescription: String = "Choose where your route starts and ends."

    @FigmaBoolean("Show Description")
    var showDescription: Bool = true

    var body: some View {
        KozmosRouteSetupPanel(
            ready: self.ready,
            pending: self.pending,
            title: self.title,
            description: self.showDescription ? self.routeDescription : nil,
            presentation: self.presentation,
            onContinue: {},
            onClose: {}
        ) {
            KozmosRouteLocationField(label: "From", location: nil, query: "", options: [], onQueryChange: { _ in }, onSelect: { _ in }, onClear: {})
            KozmosRouteLocationField(label: "To", location: nil, query: "", options: [], onQueryChange: { _ in }, onSelect: { _ in }, onClear: {})
        }
    }
}
