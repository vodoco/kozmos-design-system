// The SwiftUI snippets of MapControlButton.mdx and MapControlsGroup.mdx,
// character for character between the markers, so they compile with the
// package and a renamed or removed parameter fails here rather than in a
// reader's project. Change one, change the other.
import SwiftUI
import Kozmos
import XCTest

// MARK: - MapControlButton.mdx

// A map toggle: grey while off, the theme's blue and navy while on. It rests
// icon-only and says its new state for a moment when it changes.
struct LayersToggle: View {
    @Binding var showsLayers: Bool

    var body: some View {
        KozmosMapControlButton(
            label: String(localized: "Layers"),
            systemImage: "square.3.layers.3d",
            stateLabel: showsLayers ? String(localized: "On") : String(localized: "Off"),
            labelPlacement: .stacked,
            revealOnChange: true,
            pressed: showsLayers
        ) {
            showsLayers.toggle()
        }
    }
}

// MARK: - MapControlsGroup.mdx

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

// MARK: - The snippets draw

final class KozmosMapControlDocSnippetTests: XCTestCase {
    /// Compiling is most of the point; drawing each shows it is a view that
    /// lays out, not only one that type-checks.
    @MainActor func testTheDocsSnippetsDraw() throws {
        for state in KozmosUserLocationState.allCases {
            let controls = MapControls(
                bearing: 30, locationState: state, zoomIn: {}, zoomOut: {}, resetBearing: {}, recenter: {}
            )
            XCTAssertGreaterThan(try DrawnPixels.draw(controls).size.height, 48, "\(state)")
        }
        XCTAssertGreaterThan(try DrawnPixels.draw(WayfindingControls(stepFree: .constant(true))).size.height, 48)
        XCTAssertEqual(try DrawnPixels.draw(LayersToggle(showsLayers: .constant(false))).size.height, 48, accuracy: 0.5)
    }
}
