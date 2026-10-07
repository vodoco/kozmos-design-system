import SwiftUI
import XCTest
#if os(macOS)
import AppKit
#endif
@testable import Kozmos

/// RouteSummary's actions (GAP-110) and its route preview (GAP-111): the
/// journey's actions after the progress, in equal columns in reading order,
/// and the navigation layout with no End and the place's line under the
/// destination. Hosted in a window on iOS and on a Mac, so `swift test`
/// runs these as well as the simulator.
final class KozmosRouteSummaryActionsTests: XCTestCase {
    #if os(iOS)
    private final class TestWindow: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }
    #endif

    /// Where the views tagged with `probe` were laid out, in a window
    /// `width` wide, the content at its top.
    @MainActor private func frames<Content: View>(
        width: CGFloat = 320, direction: LayoutDirection = .leftToRight,
        sizeCategory: ContentSizeCategory = .large,
        @ViewBuilder _ content: () -> Content
    ) async throws -> [String: CGRect] {
        var frames: [String: CGRect] = [:]
        let size = CGSize(width: width, height: 600)
        let view = VStack(spacing: 0) {
            content()
            Spacer(minLength: 0)
        }
        .frame(width: size.width, height: size.height)
        .environment(\.layoutDirection, direction)
        .environment(\.sizeCategory, sizeCategory)
        .environment(\.colorScheme, .light)
        .onPreferenceChange(ActionFrames.self) { frames = $0 }
        #if os(iOS)
        let window = TestWindow(frame: CGRect(origin: .zero, size: size))
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        #else
        let host = NSHostingView(rootView: view)
        let window = NSWindow(contentRect: CGRect(origin: .zero, size: size),
                              styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        window.orderFront(nil)
        defer { window.close() }
        for _ in 0..<5 {
            host.layoutSubtreeIfNeeded()
            try await Task.sleep(nanoseconds: 50_000_000)
        }
        #endif
        return frames
    }

    /// The progress a test gives the summary: a green bar, tagged.
    private static var rail: some View { Color.green.frame(height: 6).probe("progress") }

    /// Previous and Next in static wayfinding, tagged; Previous unavailable on the first step.
    @ViewBuilder private static func steps(previous: String = "Previous", next: String = "Next") -> some View {
        KozmosButton(previous, variant: .outline, isDisabled: true) {}.probe("previous")
        KozmosButton(next) {}.probe("next")
    }

    // MARK: GAP-110: the actions

    @MainActor func testWithoutActionsNothingIsDrawnUnderTheProgress() async throws {
        for explicit in [false, true] {
            let frames = try await self.frames {
                if explicit {
                    KozmosRouteSummary(destination: "Airport Shuttles", durationText: "4 min", distanceText: "201 m",
                                       presentation: .hosted, onEndRoute: {}) {
                        Self.rail
                    } actions: {
                        EmptyView()
                    }
                    .probe("summary")
                } else {
                    KozmosRouteSummary(destination: "Airport Shuttles", durationText: "4 min", distanceText: "201 m",
                                       presentation: .hosted, onEndRoute: {}) {
                        Self.rail
                    }
                    .probe("summary")
                }
            }
            let summary = try XCTUnwrap(frames["summary"]), progress = try XCTUnwrap(frames["progress"])
            XCTAssertEqual(summary.maxY, progress.maxY, accuracy: 0.5,
                           "explicit \(explicit): something is drawn under the progress")
        }
    }

    @MainActor func testActionsSitUnderTheProgressInEqualColumns() async throws {
        let frames = try await self.frames {
            KozmosRouteSummary(destination: "Airport Shuttles", durationText: "4 min", distanceText: "201 m",
                               presentation: .hosted, onEndRoute: {}) {
                Self.rail
            } actions: {
                Self.steps()
            }
            .probe("summary")
        }
        let summary = try XCTUnwrap(frames["summary"]), progress = try XCTUnwrap(frames["progress"])
        let previous = try XCTUnwrap(frames["previous"], "Previous was not laid out")
        let next = try XCTUnwrap(frames["next"], "Next was not laid out")
        // Under the progress, the summary's 12 apart, and the summary's last part.
        XCTAssertEqual(previous.minY - progress.maxY, KozmosDimensions.primitivesLayoutSpacing150, accuracy: 0.5)
        XCTAssertEqual(previous.minY, next.minY, accuracy: 0.5)
        XCTAssertEqual(summary.maxY, max(previous.maxY, next.maxY), accuracy: 0.5)
        // Equal columns, 8 apart, filling the summary's width, Previous first.
        XCTAssertEqual(previous.width, next.width, accuracy: 0.5)
        XCTAssertEqual(next.minX - previous.maxX, KozmosDimensions.primitivesLayoutSpacing100, accuracy: 0.5)
        XCTAssertEqual(previous.minX, summary.minX, accuracy: 0.5)
        XCTAssertEqual(next.maxX, summary.maxX, accuracy: 0.5)
    }

    @MainActor func testEveryActionIsAtLeast44PointsTall() async throws {
        for size in [ContentSizeCategory.large, .accessibilityExtraExtraExtraLarge] {
            for (previous, next) in [("Previous", "Next"), ("Zurück zum vorherigen Schritt", "Weiter")] {
                let frames = try await self.frames(sizeCategory: size) {
                    KozmosRouteSummary(destination: "Airport Shuttles", presentation: .hosted, onEndRoute: {}) {
                        Self.rail
                    } actions: {
                        Self.steps(previous: previous, next: next)
                    }
                    .probe("summary")
                }
                let summary = try XCTUnwrap(frames["summary"])
                let p = try XCTUnwrap(frames["previous"]), n = try XCTUnwrap(frames["next"])
                let label = "\(size) \(previous)"
                XCTAssertGreaterThanOrEqual(p.height, 44 - 0.5, label)
                XCTAssertGreaterThanOrEqual(n.height, 44 - 0.5, label)
                // A label that wraps grows its button, and the row: both as tall as the taller.
                XCTAssertEqual(p.height, n.height, accuracy: 0.5, label)
                XCTAssertEqual(p.width, n.width, accuracy: 0.5, label)
                XCTAssertLessThanOrEqual(n.maxX, summary.maxX + 0.5, "\(label): the row overflows")
            }
        }
    }

    @MainActor func testRightToLeftPutsTheFirstActionOnTheRight() async throws {
        let frames = try await self.frames(direction: .rightToLeft) {
            KozmosRouteSummary(destination: "المطار", presentation: .hosted, onEndRoute: {}) {
                Self.rail
            } actions: {
                Self.steps(previous: "السابق", next: "التالي")
            }
            .probe("summary")
        }
        let summary = try XCTUnwrap(frames["summary"])
        let previous = try XCTUnwrap(frames["previous"]), next = try XCTUnwrap(frames["next"])
        XCTAssertGreaterThan(previous.minX, next.minX, "Previous is not at the inline start")
        XCTAssertEqual(previous.maxX, summary.maxX, accuracy: 0.5)
        XCTAssertEqual(next.minX, summary.minX, accuracy: 0.5)
        XCTAssertEqual(previous.width, next.width, accuracy: 0.5)
    }

    /// An `if` that is false is no subview of the layout, and a layout that
    /// read a fixed number of subviews crashed with one (the bottom controls,
    /// 2026-10-04). The row takes whatever is there.
    @MainActor func testAConditionalActionDoesNotBreakTheLayout() async throws {
        for shown in [false, true] {
            let frames = try await self.frames {
                KozmosRouteSummary(destination: "Airport Shuttles", presentation: .hosted, onEndRoute: {}) {
                    Self.rail
                } actions: {
                    KozmosButton("Previous", variant: .outline) {}.probe("previous")
                    if shown { KozmosButton("Next") {}.probe("next") }
                }
                .probe("summary")
            }
            let summary = try XCTUnwrap(frames["summary"]), previous = try XCTUnwrap(frames["previous"])
            if shown {
                let next = try XCTUnwrap(frames["next"])
                XCTAssertEqual(previous.width, next.width, accuracy: 0.5)
            } else {
                XCTAssertNil(frames["next"])
                XCTAssertEqual(previous.width, summary.width, accuracy: 0.5, "one action takes the whole row")
            }
        }
        // Nothing at all to lay out: the only action's condition is false.
        let none = false
        let empty = try await self.frames {
            KozmosRouteSummary(destination: "Airport Shuttles", presentation: .hosted, onEndRoute: {}) {
                Self.rail
            } actions: {
                if none { KozmosButton("Next") {} }
            }
            .probe("summary")
        }
        XCTAssertNotNil(empty["summary"], "the summary was not laid out")
        XCTAssertNotNil(empty["progress"], "the progress was not laid out")
    }

    // MARK: GAP-111: the route preview

    /// Drawn on the drawing's own clear ground: the danger outline's red.
    private static func isDanger(_ r: UInt8, _ g: UInt8, _ b: UInt8, _ a: UInt8) -> Bool {
        a > 200 && r > 140 && g < 80 && b < 110 && Int(r) > Int(b) + 60
    }
    private static func isMarker(_ r: UInt8, _ g: UInt8, _ b: UInt8, _ a: UInt8) -> Bool {
        a > 200 && g > 150 && r < 120 && b < 140
    }

    @MainActor func testThePreviewWithoutEndDrawsNoDangerButton() throws {
        // The same summary with End, so the classifier is seen to find it.
        let navigation = try DrawnPixels.draw(
            KozmosRouteSummary(destination: "Tessel Shoes", durationText: "3 min", distanceText: "205 m",
                               presentation: .hosted, onEndRoute: {}) {
                Color.green.frame(height: 6)
            }
            .frame(width: 320).environment(\.colorScheme, .light))
        XCTAssertNotNil(navigation.boundingBox(where: Self.isDanger), "End is not drawn in the danger outline")
        // Without onEndRoute, a trailing closure still fills the progress, not End.
        let preview = try DrawnPixels.draw(
            KozmosRouteSummary(destination: "Tessel Shoes", durationText: "3 min", distanceText: "205 m",
                               presentation: .hosted) {
                Color.green.frame(height: 6)
            } actions: {
                KozmosButton("Go") {}
                KozmosButton("Details", variant: .outline) {}
            }
            .frame(width: 320).environment(\.colorScheme, .light))
        XCTAssertNil(preview.boundingBox(where: Self.isDanger), "the preview draws End")
        XCTAssertNotNil(preview.boundingBox(where: Self.isMarker), "the trailing closure is not the progress")
    }

    @MainActor func testTheLocationLineFollowsTheDestination() throws {
        func lines(_ locationText: String?) throws -> (bands: [CGRect], pixels: DrawnPixels) {
            let pixels = try DrawnPixels.draw(
                KozmosRouteSummary(destination: "Tessel Shoes", locationText: locationText,
                                   presentation: .hosted) {
                    EmptyView()
                }
                .frame(width: 320).environment(\.colorScheme, .light))
            return (pixels.bands { _, _, _, a in a > 60 }, pixels)
        }
        let without = try lines(nil)
        XCTAssertEqual(without.bands.count, 1, "the destination is not one line: \(without.bands)")
        let with = try lines("Store · Level 1 · Harbour Point Mall")
        XCTAssertEqual(with.bands.count, 2, "no line under the destination: \(with.bands)")
        guard with.bands.count == 2 else { return }
        let (title, location) = (with.bands[0], with.bands[1])
        XCTAssertEqual(title.minY, without.bands[0].minY, accuracy: 0.5, "the destination moved")
        XCTAssertGreaterThan(location.minY, title.maxY)
        XCTAssertEqual(location.minX, title.minX, accuracy: 1, "the line does not start where the destination does")
        // Muted: no pixel of the line is the destination's near-black.
        func darkest(_ band: CGRect) -> Int {
            var darkest = 255
            for y in stride(from: band.minY, to: band.maxY, by: 0.5) {
                for x in stride(from: band.minX, to: band.maxX, by: 0.5) {
                    let p = with.pixels.pixel(at: CGPoint(x: x, y: y))
                    if p.a > 250 { darkest = min(darkest, Int(p.r)) }
                }
            }
            return darkest
        }
        XCTAssertLessThan(darkest(title), 60, "the destination is not drawn in the foreground colour")
        XCTAssertGreaterThan(darkest(location), 90, "the location line is not muted")
    }

    // MARK: The docs' snippets (DocSnippets/RouteSummaryActions.swift)

    #if os(iOS)
    /// Compiling is most of the point; drawing each shows the filled action
    /// takes its half of the row: Next in the steps, Go in the preview. On
    /// the simulator: a Mac draws a SwiftUI Button in its own bordered chrome.
    @MainActor func testTheDocsSnippetsDrawTheirActionsInEqualColumns() async throws {
        // Standing alone in 320: the card's 16 each side, then two columns 8 apart.
        let column = (320 - 2 * KozmosDimensions.primitivesLayoutSpacing200 - KozmosDimensions.primitivesLayoutSpacing100) / 2
        let size = CGSize(width: 320, height: 260)
        let steps = try await RenderedPixels.render(
            StepByStepSummary(steps: ["Step 1 of 3", "Step 2 of 3", "Step 3 of 3"], onEnd: {})
                .frame(maxHeight: .infinity, alignment: .top).background(Color.white)
                .environment(\.colorScheme, .light), size: size)
        let preview = try await RenderedPixels.render(
            RoutePreviewSummary(onGo: {}, onDetails: {})
                .frame(maxHeight: .infinity, alignment: .top).background(Color.white)
                .environment(\.colorScheme, .light), size: size)
        for (name, pixels) in [("steps", steps), ("preview", preview)] {
            // The filled action is the lowest themed thing; 6 points above its
            // foot no label is drawn, and an outline's themed label is not.
            let whole = CGRect(origin: .zero, size: size)
            let themed = try XCTUnwrap(pixels.boundingBox(in: whole, where: RenderedPixels.isTheme),
                                       "\(name): no filled action")
            let y = themed.maxY - 6
            let filled = stride(from: CGFloat(0), to: size.width, by: 1 / pixels.scale).filter {
                let p = pixels.color(at: CGPoint(x: $0, y: y))
                return RenderedPixels.isTheme(p.r, p.g, p.b)
            }
            // 6 above the foot, the rounded corners take a little of each end.
            let r = KozmosDimensions.semanticsRadiusControl, rise = min(6, r)
            let corners = 2 * (r - (r * r - (r - rise) * (r - rise)).squareRoot())
            XCTAssertEqual(CGFloat(filled.count) / pixels.scale, column - corners, accuracy: 2,
                           "\(name): the filled action is not half the row")
            XCTAssertGreaterThanOrEqual(themed.maxY - themed.minY, 44 - 0.5, name)
        }
        XCTAssertNil(preview.boundingBox(in: CGRect(origin: .zero, size: size), where: { r, g, b in
            Self.isDanger(r, g, b, 255)
        }), "the preview snippet draws End")
    }
    #endif

    // MARK: Source compatibility

    /// Compiled, not run for what it draws: every way the navigation layout
    /// was called before the actions and the optional End, with the trailing
    /// closure still the progress, and the new forms beside them.
    @MainActor func testExistingTrailingProgressCallsStillCompile() {
        func endRoute() {}
        let rail = KozmosRouteProgressRail(progress: 0.16, type: .straight, label: "Step 1 of 4")
        let calls: [AnyView] = [
            AnyView(KozmosRouteSummary(destination: "Airport Shuttles", durationText: "4 min", distanceText: "201 m",
                                       arrivalText: "Arrive 12:58", onEndRoute: {}) { rail }),
            AnyView(KozmosRouteSummary(destination: "Airport Shuttles", durationText: "4 min", distanceText: "201 m",
                                       arrivalText: "Arrive 12:58", surface: .glass, onEndRoute: endRoute) { rail }),
            AnyView(KozmosRouteSummary(destination: "Gate 12", endLabel: "Beenden", presentation: .hosted,
                                       destinationImage: "/gate.png", onEndRoute: {}) { EmptyView() }),
            AnyView(KozmosRouteSummary(destination: "Gate 12", onEndRoute: {}, progress: { rail })),
            AnyView(KozmosRouteSummary(etaText: "4 min", distanceText: "201 m", onEndRoute: {})),
            AnyView(KozmosRouteSummary(etaText: "4 min", distanceText: "201 m", state: .preview, onEndRoute: {},
                                       onStartNavigation: {}) { Image(systemName: "figure.walk") }),
            // New: the actions, and the preview without End.
            AnyView(KozmosRouteSummary(destination: "Gate 12", onEndRoute: {}) { rail } actions: {
                KozmosButton("Previous", variant: .outline) {}
                KozmosButton("Next") {}
            }),
            AnyView(KozmosRouteSummary(destination: "Tessel Shoes", locationText: "Store · Level 1",
                                       progress: { EmptyView() }, actions: { KozmosButton("Go") {} })),
        ]
        XCTAssertEqual(calls.count, 8)
    }
}

private struct ActionFrames: PreferenceKey {
    static var defaultValue: [String: CGRect] = [:]
    static func reduce(value: inout [String: CGRect], nextValue: () -> [String: CGRect]) {
        value.merge(nextValue(), uniquingKeysWith: { _, new in new })
    }
}

private extension View {
    /// Tags the view with its frame in the window, under `id`.
    func probe(_ id: String) -> some View {
        background(GeometryReader { proxy in
            Color.clear.preference(key: ActionFrames.self, value: [id: proxy.frame(in: .global)])
        })
    }
}
