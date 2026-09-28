import XCTest
import SwiftUI
@testable import Kozmos

/// Decision 36 (row 25 / GAP-013): a rail tile's label is `caption2` — 11pt at
/// the default text size, growing with the reader's — on 14pt lines, up to
/// two, as React's is 11px on 14px. The tile keeps its 72 by 72, and 64 wide
/// compact. It was `caption`, 12pt, on one line, so a two-word label lost its
/// second word to an ellipsis.
///
/// Laid out and drawn without a window, so the first and the last run in
/// `swift test` on a Mac as well as on a simulator. The type's size and its
/// line are iOS's own — a Mac's caption2 is 10pt and does not scale — so those
/// run only on a simulator.
final class KozmosNavigationItemTests: XCTestCase {
    private let offered = CGSize(width: 300, height: 300)

    @MainActor
    private func laidOut<V: View>(_ view: V) -> CGSize {
        #if canImport(UIKit)
        UIHostingController(rootView: view).sizeThatFits(in: offered)
        #else
        NSHostingController(rootView: view).sizeThatFits(in: offered)
        #endif
    }

    /// A rail tile that draws nothing but its label: the icon is clear, and an
    /// unselected tile has no fill.
    private func tile(_ label: String, density: KozmosNavigationItemDensity = .default) -> some View {
        KozmosNavigationItem(label: label, placement: .rail, density: density, content: .iconLabel) {
            Color.clear
        }
        .environment(\.colorScheme, .light)
    }

    /// The lines a view draws: the runs of rows with ink in them.
    @MainActor
    private func drawnLines<V: View>(_ view: V) throws -> [CGRect] {
        try DrawnPixels.draw(view, scale: 3).bands { _, _, _, a in a > 64 }
    }

    /// Two words that each fit the tile but not together take a line each,
    /// inside the tile's padding, and the tile stays 72 by 72. The compact
    /// tile keeps its 64.
    @MainActor func testATwoWordLabelTakesTwoLinesInsideTheTile() throws {
        XCTAssertEqual(laidOut(tile("System Settings")), CGSize(width: 72, height: 72))

        let lines = try drawnLines(tile("System Settings"))
        XCTAssertEqual(lines.count, 2, "\"System Settings\" took \(lines.count) line(s): \(lines)")
        for line in lines {
            XCTAssertGreaterThanOrEqual(line.minX, 8 - 0.5, "a line reaches into the tile's padding: \(line)")
            XCTAssertLessThanOrEqual(line.maxX, 72 - 8 + 0.5, "a line reaches into the tile's padding: \(line)")
        }

        XCTAssertEqual(laidOut(tile("Settings", density: .compact)).width, 64)
    }

    #if os(iOS)
    /// How far apart a two-line label's lines are drawn: "Nearby" and "places"
    /// reach as high (b, l) and as low (y, p) as each other, so their tops
    /// are one line apart.
    @MainActor
    private func linePitch(at size: DynamicTypeSize) throws -> CGFloat {
        let lines = try drawnLines(tile("Nearby places").environment(\.dynamicTypeSize, size))
        XCTAssertEqual(lines.count, 2, "\"Nearby places\" took \(lines.count) line(s) at \(size): \(lines)")
        guard lines.count == 2 else { return 0 }
        return lines[1].minY - lines[0].minY
    }

    /// At the default text size the label draws as wide as 11pt semibold
    /// text, not 12pt, and its lines are 14pt apart.
    @MainActor func testTheLabelIsCaption2On14ptLines() throws {
        let label = try XCTUnwrap(drawnLines(tile("Settings").environment(\.dynamicTypeSize, .large)).first)
        let eleven = try XCTUnwrap(drawnLines(Text("Settings").font(.system(size: 11, weight: .semibold))).first)
        let twelve = try XCTUnwrap(drawnLines(Text("Settings").font(.system(size: 12, weight: .semibold))).first)
        XCTAssertLessThan(abs(label.width - eleven.width), abs(label.width - twelve.width),
                          "the label is \(label.width) wide; 11pt semibold is \(eleven.width), 12pt \(twelve.width)")

        let pitch = try linePitch(at: .large)
        XCTAssertEqual(pitch, 14, accuracy: 0.34, "the label's lines are \(pitch)pt apart")
    }

    /// The label grows with the reader's text size, and its line with it: at
    /// the next size up, where caption2 is 13pt, the lines are at least
    /// 14 × 13 / 11 apart. (SwiftUI sets them by caption2's own 18pt there.)
    @MainActor func testTheLabelAndItsLineGrowWithTheTextSize() throws {
        let caption2 = UIFont.preferredFont(forTextStyle: .caption2,
                                            compatibleWith: UITraitCollection(preferredContentSizeCategory: .extraLarge))
        XCTAssertEqual(caption2.pointSize, 13, "caption2 is \(caption2.pointSize)pt at xLarge")

        let atDefault = try XCTUnwrap(drawnLines(tile("Settings").environment(\.dynamicTypeSize, .large)).first)
        let larger = try XCTUnwrap(drawnLines(tile("Settings").environment(\.dynamicTypeSize, .xLarge)).first)
        XCTAssertGreaterThan(larger.width, atDefault.width * 12 / 11, "the label did not grow: \(atDefault.width) to \(larger.width)")

        let pitch = try linePitch(at: .xLarge)
        XCTAssertGreaterThanOrEqual(pitch, 14 * 13 / 11 - 0.34, "the label's lines are \(pitch)pt apart at xLarge")
    }
    #endif

    /// NavigationItem.mdx's SwiftUI rail example, the same code, so that it
    /// compiles somewhere: the docs' native snippets are compiled nowhere
    /// else. It holds before the change and after it.
    @MainActor func testTheDocsRailExampleIsARailTile() {
        let example = KozmosNavigationItem(
            label: "Nearby places",
            placement: .rail,
            content: .iconLabel
        ) {
            Image(systemName: "mappin.and.ellipse")
        }
        XCTAssertEqual(laidOut(example), CGSize(width: 72, height: 72))
    }
}
