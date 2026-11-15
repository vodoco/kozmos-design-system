import XCTest
import SwiftUI
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// GAP-254, decision 182: a tab list wider than its space scrolls sideways
/// inside its own track. The track keeps the width of the space and is the
/// scroll view, with no indicator; each tab keeps its natural width; the
/// selected tab is scrolled into view when the list is first shown and when
/// the selection changes; right to left it starts at the right. A list that
/// fits is drawn as before, with no scroll view. Until then the tabs were
/// squeezed into the space and their titles cut short.
///
/// The Cloud type picker's five families, each an icon over its title, in a
/// 320pt column, hosted in a window and read as VoiceOver reads them, with
/// accessibility automation on: each tab's frame on screen is where it is
/// drawn.
final class KozmosTabsScrollTests: XCTestCase {
    #if os(iOS)
    private static let families = ["Everything", "POI", "Interior asset", "Structural", "Virtual"]

    private final class Model: ObservableObject {
        @Published var selection: String
        /// Each tab's frame in the window, as it is drawn.
        var frames: [String: CGRect] = [:]
        init(_ selection: String) { self.selection = selection }
    }

    /// Each tab's frame in the window. An in-process walk of the
    /// accessibility tree cannot read inside a SwiftUI scroll view (see
    /// KozmosManoeuvreCardTests), so each tab reports where it is.
    private struct TabFrames: PreferenceKey {
        static let defaultValue: [String: CGRect] = [:]
        static func reduce(value: inout [String: CGRect], nextValue: () -> [String: CGRect]) {
            value.merge(nextValue()) { $1 }
        }
    }

    private struct FamilyTabs: View {
        @ObservedObject var model: Model
        let titles: [String]
        let width: CGFloat

        var body: some View {
            VStack(spacing: 0) {
                KozmosTabsList {
                    ForEach(titles, id: \.self) { title in
                        KozmosTabsTrigger(value: title.lowercased(), title: title, selection: $model.selection) {
                            Image(systemName: "square.fill")
                        }
                        .background(GeometryReader { proxy in
                            Color.clear.preference(key: TabFrames.self, value: [title: proxy.frame(in: .global)])
                        })
                    }
                }
                .frame(width: width)
                Spacer(minLength: 0)
            }
            // Clear of the window's top safe area, which a scroll view
            // reaches into.
            .padding(.top, 100)
            .onPreferenceChange(TabFrames.self) { model.frames = $0 }
        }
    }

    private static let size = CGSize(width: 320, height: 400)

    /// The tabs' frames in the window, in order, as they report them.
    @MainActor private func frames(_ titles: [String], of model: Model) throws -> [CGRect] {
        try titles.map { try XCTUnwrap(model.frames[$0], "\($0) reported no frame") }
    }

    /// Every scroll view in the window.
    @MainActor private func scrollViews(_ view: UIView) -> [UIScrollView] {
        ((view as? UIScrollView).map { [$0] } ?? []) + view.subviews.flatMap { scrollViews($0) }
    }

    /// Whether a frame lies wholly on the 320pt screen, give or take a point.
    private func onScreen(_ frame: CGRect) -> Bool {
        frame.minX >= -1 && frame.maxX <= Self.size.width + 1
    }

    @MainActor func testAListWiderThanItsSpaceScrollsInsideItsTrackShowingTheSelectedTab() async throws {
        let model = Model("structural")
        try await inspectAccessibility(FamilyTabs(model: model, titles: Self.families, width: Self.size.width),
                                       size: Self.size) { window in
            let scrolls = self.scrollViews(window)
            XCTAssertEqual(scrolls.count, 1, "the list should be one scroll view")
            let scroll = try XCTUnwrap(scrolls.first)
            // The track is the space's width; the tabs, wider, scroll in it,
            // with no indicator.
            XCTAssertEqual(scroll.bounds.width, Self.size.width, accuracy: 1)
            XCTAssertGreaterThan(scroll.contentSize.width, scroll.bounds.width + 20)
            XCTAssertFalse(scroll.showsHorizontalScrollIndicator, "a scroll indicator is shown")
            // Each tab keeps its natural width: wider than its title alone,
            // which a squeezed tab cut short.
            let frames = try self.frames(Self.families, of: model)
            for (title, frame) in zip(Self.families, frames) {
                let natural = UIHostingController(rootView: Text(title).font(KozmosTypography.subheadline).fontWeight(.medium))
                    .sizeThatFits(in: CGSize(width: 1000, height: 100)).width
                XCTAssertGreaterThanOrEqual(frame.width, natural + 24 - 1, "\(title) is squeezed to \(frame.width)")
            }
            // Structural, the fourth, is in view without scrolling, and the
            // list has scrolled to show it.
            XCTAssertTrue(self.onScreen(frames[3]), "Structural is at \(frames[3]), off the 320pt track")
            XCTAssertGreaterThan(scroll.contentOffset.x, 0)
        }
    }

    /// With Reduce Motion on: a window hosted in a unit test is in no
    /// scene, so an animated scroll never moves there (measured: the offset
    /// stayed 0 for 0.8 s). The animated path is the same `scrollTo`
    /// inside `withAnimation(KozmosMotion.standard)`.
    @MainActor func testChangingTheSelectionScrollsItsTabIntoView() async throws {
        let model = Model("everything")
        try await inspectAccessibility(FamilyTabs(model: model, titles: Self.families, width: Self.size.width)
                                        .environment(\._accessibilityReduceMotion, true),
                                       size: Self.size) { window in
            var frames = try self.frames(Self.families, of: model)
            XCTAssertTrue(self.onScreen(frames[0]))
            XCTAssertFalse(self.onScreen(frames[4]), "Virtual is already in view; the test proves nothing")
            model.selection = "virtual"
            try await Task.sleep(nanoseconds: 500_000_000)
            frames = try self.frames(Self.families, of: model)
            XCTAssertTrue(self.onScreen(frames[4]), "Virtual is at \(frames[4]), off the 320pt track")
        }
    }

    @MainActor func testRightToLeftTheListStartsAtTheRight() async throws {
        let model = Model("everything")
        try await inspectAccessibility(
            FamilyTabs(model: model, titles: Self.families, width: Self.size.width)
                .environment(\.layoutDirection, .rightToLeft)
                .environment(\._accessibilityReduceMotion, true),
            size: Self.size
        ) { window in
            var frames = try self.frames(Self.families, of: model)
            // The first tab sits at the track's right end, 4pt in.
            XCTAssertEqual(frames[0].maxX, Self.size.width - 4, accuracy: 1)
            XCTAssertLessThan(frames[1].maxX, frames[0].minX + 1, "the tabs do not run right to left")
            XCTAssertFalse(self.onScreen(frames[4]))
            model.selection = "virtual"
            try await Task.sleep(nanoseconds: 800_000_000)
            frames = try self.frames(Self.families, of: model)
            XCTAssertTrue(self.onScreen(frames[4]), "Virtual is at \(frames[4]), off the 320pt track")
        }
    }

    /// A list that fits is today's: no scroll view, its tabs sharing the
    /// track's width.
    @MainActor func testAListThatFitsDoesNotScroll() async throws {
        let titles = ["Hours", "Access"]
        let model = Model("hours")
        try await inspectAccessibility(FamilyTabs(model: model, titles: titles, width: Self.size.width),
                                       size: Self.size) { window in
            XCTAssertTrue(self.scrollViews(window).isEmpty, "a list that fits should not scroll")
            let frames = try self.frames(titles, of: model)
            for frame in frames {
                XCTAssertEqual(frame.width, (Self.size.width - 8) / 2, accuracy: 1)
            }
        }
    }
    #endif
}
