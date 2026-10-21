// Draws MapControlButton.mdx's and MapControlsGroup.mdx's SwiftUI snippets,
// DocSnippets/LayersToggle.swift and DocSnippets/MapControls.swift, which
// check-native-snippet-parity holds to their pages word for word.
import SwiftUI
import Kozmos
import XCTest

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
