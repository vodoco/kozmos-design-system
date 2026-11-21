import SwiftUI
import Figma

// GAP-206: State is pending; Presentation is presentation. Title,
// Destination, Location and Message Text are title, destination,
// locationText and message, each optional one shown by its Show property;
// Show Metrics shows the journey as travelled, with its labels. Show Image
// is the destination's picture, the product's to give.
struct KozmosArrivalPanelConnect: FigmaConnect {
    let component = KozmosArrivalPanel.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17956"

    @FigmaEnum(
        "State",
        mapping: [
            "Default": false,
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
    var title: String = "You've arrived"

    @FigmaString("Destination Text")
    var destination: String = "Gate B12"

    @FigmaString("Location Text")
    var locationText: String = "Terminal 2, Level 1"

    @FigmaBoolean("Show Location")
    var showLocation: Bool = true

    @FigmaString("Message Text")
    var message: String = "Your gate opens 40 minutes before departure."

    @FigmaBoolean("Show Message")
    var showMessage: Bool = false

    @FigmaString("Duration Text")
    var durationText: String = "6 min"

    @FigmaString("Distance Text")
    var distanceText: String = "202 m"

    @FigmaString("Duration Label Text")
    var durationLabel: String = "Journey time"

    @FigmaString("Distance Label Text")
    var distanceLabel: String = "Distance travelled"

    @FigmaBoolean("Show Metrics")
    var showMetrics: Bool = true

    @FigmaBoolean("Show Image", mapping: [true: "https://example.com/gate-b12.jpg", false: nil])
    var destinationImage: String? = nil

    var body: some View {
        KozmosArrivalPanel(
            destination: self.destination,
            destinationImage: self.destinationImage,
            locationText: self.showLocation ? self.locationText : nil,
            title: self.title,
            message: self.showMessage ? self.message : nil,
            actualDurationText: self.showMetrics ? self.durationText : nil,
            actualDistanceText: self.showMetrics ? self.distanceText : nil,
            durationLabel: self.durationLabel,
            distanceLabel: self.distanceLabel,
            pending: self.pending,
            presentation: self.presentation,
            onDone: {}
        )
    }
}
