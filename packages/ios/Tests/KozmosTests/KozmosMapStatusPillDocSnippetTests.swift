// Draws MapStatusPill.mdx's SwiftUI snippet, DocSnippets/PositioningStatus.swift,
// which check-native-snippet-parity holds to the page word for word.
import SwiftUI
import Kozmos
import XCTest

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
        XCTAssertEqual(try DrawnPixels.draw(WalkingStatus()).size.height, 48, accuracy: 0.5)
    }
}
