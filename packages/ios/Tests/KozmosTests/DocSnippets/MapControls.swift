// MapControlsGroup.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project, and drawn by
// KozmosMapControlDocSnippetTests. Change the two together.
import SwiftUI
import Kozmos

struct MapControls: View {
    let bearing: Double
    let locationState: KozmosUserLocationState
    let zoomIn: () -> Void
    let zoomOut: () -> Void
    let resetBearing: () -> Void
    let recenter: () -> Void

    var body: some View {
        KozmosMapControlsGroup(
            compassBearing: bearing,
            onZoomIn: zoomIn,
            onZoomOut: zoomOut,
            onCompassReset: resetBearing,
            onMyLocation: recenter,
            // Every name is the product's to translate.
            zoomInLabel: String(localized: "Zoom in"),
            zoomOutLabel: String(localized: "Zoom out"),
            compassResetLabel: String(localized: "Reset bearing"),
            locationState: locationState,
            // The SDK's control: "Focus" over "Off" or "On" for a moment when
            // the mode changes, and "No Location" alone with no position.
            locationLabel: String(localized: "Focus"),
            locationStateLabel: stateLabel,
            locationHeadingDescription: String(localized: "map turns with you"),
            locationHeadingPausedDescription: String(localized: "press to turn the map with you again"),
            locationRevealOnChange: true,
            locationLabelPlacement: .stacked
        )
    }

    private var stateLabel: String {
        switch locationState {
        case .following, .heading:
            return String(localized: "On")
        case .unavailable, .permissionDenied:
            return String(localized: "No Location")
        default:
            return String(localized: "Off")
        }
    }
}

// While a route is shown, step-free takes the location control's place.
struct WayfindingControls: View {
    @Binding var stepFree: Bool

    var body: some View {
        KozmosMapControlsGroup(
            locationRevealOnChange: true,
            locationLabelPlacement: .stacked,
            onStepFreeChange: { stepFree = $0 },
            stepFree: stepFree,
            stepFreeLabel: String(localized: "Step-free")
        )
    }
}
