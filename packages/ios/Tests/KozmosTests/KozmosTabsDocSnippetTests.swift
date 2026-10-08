// The SwiftUI snippet of Tabs.mdx, character for character below its
// imports, so it compiles with the package and a renamed or removed parameter
// fails here rather than in a reader's project. Change one, change the other.
import SwiftUI
import Kozmos
import XCTest

// MARK: - Tabs.mdx

// The list is a background/100 track. The selected tab is a background/0
// segment 4pt inside it, raised by KozmosShadows.semanticsElevationRaised,
// with foreground/0 words; the other tabs' words are foreground/400. No theme
// colour, as on the web and in Compose (decision 65).
struct PlaceDetailsTabs: View {
    @State private var selection = "overview"

    var body: some View {
        KozmosTabs(selection: $selection) {
            KozmosTabsList {
                KozmosTabsTrigger(value: "overview", title: "Overview", selection: $selection)
                KozmosTabsTrigger(value: "access", title: "Access", selection: $selection)
            }
            KozmosTabsContent(value: "overview", selection: $selection) {
                Text("Reception is on the ground floor.")
            }
            KozmosTabsContent(value: "access", selection: $selection) {
                Text("Step-free access through the main entrance.")
            }
        }
    }
}

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
