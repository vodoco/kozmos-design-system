// The SwiftUI snippet of MapStatusPill.mdx, character for character between
// the markers, so it compiles with the package and a renamed or removed
// parameter fails here rather than in a reader's project. Change one, change
// the other.
import SwiftUI
import Kozmos
import XCTest

// MARK: - MapStatusPill.mdx

// The product's words, in the visitor's language, and its tone for each.
struct PositioningStatus: View {
    let isCalculating: Bool

    var body: some View {
        KozmosMapStatusPill(
            isCalculating
                ? String(localized: "Calculating Precise Position")
                : String(localized: "Established"),
            tone: isCalculating ? .progress : .success
        )
    }
}

// The product's own mark in place of the tone's. iOS has no Bluetooth
// symbol, so the mark is the app's own asset.
struct BluetoothStatus: View {
    var body: some View {
        KozmosMapStatusPill(String(localized: "No Bluetooth"), tone: .danger) {
            Image("bluetooth-off")
        }
    }
}

// MARK: - The snippet draws

final class KozmosMapStatusPillDocSnippetTests: XCTestCase {
    /// Compiling is most of the point; drawing each shows it is a pill that
    /// lays out at the map controls' 48, not only one that type-checks.
    @MainActor func testTheDocsSnippetDraws() throws {
        for isCalculating in [true, false] {
            let height = try DrawnPixels.draw(PositioningStatus(isCalculating: isCalculating)).size.height
            XCTAssertEqual(height, 48, accuracy: 0.5, "calculating \(isCalculating): the pill is \(height) tall")
        }
        XCTAssertEqual(try DrawnPixels.draw(BluetoothStatus()).size.height, 48, accuracy: 0.5)
    }
}
