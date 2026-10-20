// Draws Tabs.mdx's SwiftUI snippet, DocSnippets/PlaceDetailsTabs.swift, which
// check-native-snippet-parity holds to the page word for word.
import SwiftUI
import Kozmos
import XCTest

// MARK: - The snippet draws

final class KozmosTabsDocSnippetTests: XCTestCase {
    /// Compiling is most of the point; drawing it shows the track is the
    /// 44pt target the tabs promise, in light and in dark. The panel's words
    /// start below the track, so the top 50pt hold the track alone.
    @MainActor func testTheDocsSnippetDrawsA44PointTrackInLightAndDark() throws {
        let track: [ColorScheme: (r: UInt8, g: UInt8, b: UInt8, a: UInt8)] = [
            .light: (0xE3, 0xE4, 0xE8, 255),
            .dark: (0x17, 0x19, 0x1C, 255),
        ]
        for scheme in [ColorScheme.light, .dark] {
            let pixels = try DrawnPixels.draw(
                PlaceDetailsTabs().frame(width: 320).environment(\.colorScheme, scheme),
                scale: 3
            )
            let box = pixels.boundingBox(
                in: CGRect(x: 0, y: 0, width: 320, height: 50),
                where: DrawnPixels.matches(track[scheme]!, tolerance: 4)
            )
            XCTAssertEqual(box?.height ?? 0, 44, accuracy: 0.7, "\(scheme): the track is \(String(describing: box))")
            XCTAssertEqual(box?.width ?? 0, 320, accuracy: 0.7, "\(scheme): the track is \(String(describing: box))")
        }
    }
}
