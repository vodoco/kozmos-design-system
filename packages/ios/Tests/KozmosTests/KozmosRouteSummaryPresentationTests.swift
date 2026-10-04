import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 43: in the map shell's panel, the panel's surface is the one
/// surface. The navigation summary there takes its hosted presentation by
/// itself, with no surface, radius, shadow or outer padding of its own;
/// standing alone it draws its card; a presentation the caller names wins.
///
/// The shell says it hosts a part through `kozmosPanelSurface`. Drawn without
/// a window by `DrawnPixels`, so these run in `swift test` on a Mac as well.
final class KozmosRouteSummaryPresentationTests: XCTestCase {
    private func summary(_ presentation: KozmosRoutePresentation? = nil) -> some View {
        Group {
            if let presentation {
                KozmosRouteSummary(destination: "Gate 12", durationText: "4 min", distanceText: "201 m",
                                   presentation: presentation, onEndRoute: {}) { EmptyView() }
            } else {
                KozmosRouteSummary(destination: "Gate 12", durationText: "4 min", distanceText: "201 m",
                                   onEndRoute: {}) { EmptyView() }
            }
        }
        .frame(width: 320)
        .environment(\.colorScheme, .light)
    }

    /// Two drawings alike: one size, and no pixel more than the level or two
    /// a shadow's antialiasing moves between renders.
    private func assertAlike(_ a: DrawnPixels, _ b: DrawnPixels, _ message: String, line: UInt = #line) {
        let difference = a.largestDifference(from: b)
        XCTAssertNotNil(difference, "\(message): the sizes differ, \(a.size) and \(b.size)", line: line)
        XCTAssertLessThanOrEqual(difference ?? .max, 2, message, line: line)
    }

    @MainActor func testInTheShellsPanelTheSummaryIsHosted() throws {
        for panel in [KozmosSurfaceStyle.solid, .glass] {
            let automatic = try DrawnPixels.draw(summary().environment(\.kozmosPanelSurface, panel))
            let hosted = try DrawnPixels.draw(summary(.hosted).environment(\.kozmosPanelSurface, panel))
            assertAlike(automatic, hosted, "on the \(panel) panel the summary is not hosted")
        }
    }

    @MainActor func testStandingAloneTheSummaryDrawsItsCard() throws {
        let automatic = try DrawnPixels.draw(summary())
        let standalone = try DrawnPixels.draw(summary(.standalone))
        let hosted = try DrawnPixels.draw(summary(.hosted))
        assertAlike(automatic, standalone, "standing alone the summary is not standalone")
        // The card's 16 of padding on each side, and its fill at its edge.
        XCTAssertEqual(standalone.size.height - hosted.size.height, 2 * KozmosDimensions.primitivesLayoutSpacing200, accuracy: 0.5)
        XCTAssertTrue(standalone.isDrawn(at: CGPoint(x: 160, y: 4)), "the standalone card paints no fill")
        XCTAssertFalse(hosted.isDrawn(at: CGPoint(x: 160, y: 1)), "the hosted summary paints a fill")
    }

    @MainActor func testANamedPresentationWins() throws {
        let inPanel = try DrawnPixels.draw(summary(.standalone).environment(\.kozmosPanelSurface, .solid))
        let alone = try DrawnPixels.draw(summary(.standalone))
        assertAlike(inPanel, alone, "standalone named in the panel is not standalone")
    }

    #if os(iOS)
    /// The real shell, on a phone: the summary as its panel draws as the
    /// hosted one does, and not as the standalone card.
    @MainActor func testTheMapShellsPanelHostsTheSummary() async throws {
        let size = CGSize(width: 390, height: 800)
        func shell(_ presentation: KozmosRoutePresentation?) async throws -> RenderedPixels {
            let view = KozmosAdaptiveMapShell(
                panelDetent: .constant(.medium), panelDetents: [.collapsed, .medium, .large],
                map: { Color.red }, panel: { self.summary(presentation) }, panelHeader: { EmptyView() }
            )
            .environment(\.horizontalSizeClass, .compact)
            .environment(\.layoutDirection, .leftToRight)
            return try await RenderedPixels.render(view, size: size)
        }
        /// Points, two apart, where two drawings differ by more than a shadow's level or two.
        func differing(_ a: RenderedPixels, _ b: RenderedPixels) -> Int {
            var count = 0
            for y in stride(from: 0, to: size.height, by: 2) {
                for x in stride(from: 0, to: size.width, by: 2) {
                    let p = a.color(at: CGPoint(x: x, y: y)), q = b.color(at: CGPoint(x: x, y: y))
                    if max(abs(Int(p.r) - Int(q.r)), abs(Int(p.g) - Int(q.g)), abs(Int(p.b) - Int(q.b))) > 2 { count += 1 }
                }
            }
            return count
        }
        let automatic = try await shell(nil)
        let hosted = try await shell(.hosted)
        let standalone = try await shell(.standalone)
        XCTAssertEqual(differing(automatic, hosted), 0, "the shell's panel does not host the summary")
        XCTAssertGreaterThan(differing(automatic, standalone), 100, "the hosted and standalone summaries draw alike")
    }
    #endif
}
