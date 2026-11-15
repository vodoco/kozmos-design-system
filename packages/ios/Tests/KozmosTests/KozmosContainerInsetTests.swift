import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-134: React's Container pads the sides only, by `inset`; SwiftUI's padded every side.
final class KozmosContainerInsetTests: XCTestCase {
    func testWindowInsetStepsWithTheWidthAndPanelKeepsSixteen() {
        XCTAssertEqual(KozmosContainerInset.padding(.window, width: 390), 16)
        XCTAssertEqual(KozmosContainerInset.padding(.window, width: 639), 16)
        XCTAssertEqual(KozmosContainerInset.padding(.window, width: 640), 24)
        XCTAssertEqual(KozmosContainerInset.padding(.window, width: 1023), 24)
        XCTAssertEqual(KozmosContainerInset.padding(.window, width: 1024), 32)
        for width in [CGFloat(390), 800, 1280] {
            XCTAssertEqual(KozmosContainerInset.padding(.panel, width: width), 16)
        }
    }

    /// One measure, with no window and nothing drawn: what UIKit's
    /// `sizeThatFits`, a self-sizing cell or a parent layout asks. The
    /// content is as tall as the width it is given, so the height read back
    /// is the width the container left it. The container read its width with
    /// a GeometryReader into state, so this measure padded for a width of 0
    /// (16 at any width) and the step only arrived once a frame had been laid
    /// out and the state written.
    @MainActor func testOneMeasurePadsForTheWidthOffered() {
        for (inset, width, side): (KozmosContainerInset, CGFloat, CGFloat) in [
            (.window, 390, 16), (.window, 800, 24), (.window, 1100, 32), (.panel, 1100, 16),
        ] {
            let view = KozmosContainer(inset: inset) { TallAsItIsWide { Color.clear } }
            XCTAssertEqual(laidOut(view, width: width).height, width - 2 * side, accuracy: 0.5, "\(inset) at \(width)")
        }
    }

    /// Drawn without a window, so it runs in `swift test` on a Mac as well,
    /// where the window test below compiles to nothing.
    @MainActor func testItDrawsTheStepForTheWidthOffered() throws {
        for (inset, width, side): (KozmosContainerInset, CGFloat, CGFloat) in [
            (.window, 390, 16), (.window, 800, 24), (.window, 1100, 32), (.panel, 1100, 16),
        ] {
            let view = KozmosContainer(inset: inset) { Color.black.frame(height: 40) }.frame(width: width)
            let drawn = try DrawnPixels.draw(view, scale: 1)
            let state = "\(inset) at \(width)"
            let box = try XCTUnwrap(drawn.boundingBox { _, _, _, a in a > 200 }, state)
            XCTAssertEqual(drawn.size.width, width, accuracy: 0.5, state)
            XCTAssertEqual(box.minX, side, accuracy: 0.5, state)
            XCTAssertEqual(width - box.maxX, side, accuracy: 0.5, state)
        }
    }

    /// Offered no width (an ideal size, as in a horizontal scroll or
    /// `fixedSize`), the container is its content's width and the step that
    /// width lands on: 200 takes 16 a side, and 700, past 640 once padded, 24.
    @MainActor func testOfferedNoWidthItTakesTheStepItsOwnWidthPicks() throws {
        for (content, side): (CGFloat, CGFloat) in [(200, 16), (700, 24)] {
            let view = KozmosContainer(inset: .window) { Color.black.frame(width: content, height: 40) }
            let drawn = try DrawnPixels.draw(view, scale: 1)
            let state = "\(content) of content"
            let box = try XCTUnwrap(drawn.boundingBox { _, _, _, a in a > 200 }, state)
            XCTAssertEqual(drawn.size.width, content + 2 * side, accuracy: 0.5, state)
            XCTAssertEqual(box.minX, side, accuracy: 0.5, state)
            XCTAssertEqual(box.width, content, accuracy: 0.5, state)
        }
    }

    /// Several views of content stack top to bottom, each the width inside
    /// the padding, rather than drawing over one another.
    @MainActor func testContentOfSeveralViewsStacks() throws {
        let view = KozmosContainer(inset: .window) {
            Color.black.frame(height: 10)
            Color.black.frame(height: 30)
        }.frame(width: 800)
        let drawn = try DrawnPixels.draw(view, scale: 1)
        let box = try XCTUnwrap(drawn.boundingBox { _, _, _, a in a > 200 })
        XCTAssertEqual(drawn.size.height, 40, accuracy: 0.5)
        XCTAssertEqual(box.minX, 24, accuracy: 0.5)
        XCTAssertEqual(box.width, 800 - 48, accuracy: 0.5)
        XCTAssertEqual(box.height, 40, accuracy: 0.5)
    }

    /// Container.mdx's SwiftUI example (DocSnippets/VenueOverview.swift),
    /// drawn as well as compiled: 1100 wide, where `.window` takes 32, the
    /// panel inset keeps its text 16 from the side.
    @MainActor func testTheDocsSnippetKeepsSixteenASide() throws {
        let drawn = try DrawnPixels.draw(VenueOverview().frame(width: 1100), scale: 2)
        let text = try XCTUnwrap(drawn.boundingBox { _, _, _, a in a > 100 }, "no text drawn")
        // The first glyph's side bearing puts its ink a little inside the box.
        XCTAssertEqual(text.minX, 16, accuracy: 1.5)
    }

    // MARK: - Block inset (GAP-116)

    /// Each step is the layout spacing token React's `block` reads: 0, 16,
    /// 24 and 32.
    func testBlockStepsAreTheLayoutSpacingSteps() {
        XCTAssertEqual(KozmosContainerBlockInset.none.length, 0)
        XCTAssertEqual(KozmosContainerBlockInset.sm.length, 16)
        XCTAssertEqual(KozmosContainerBlockInset.md.length, 24)
        XCTAssertEqual(KozmosContainerBlockInset.lg.length, 32)
        XCTAssertEqual(KozmosContainerBlock.none, KozmosContainerBlock(start: .none, end: .none))
        XCTAssertEqual(KozmosContainerBlock.sm, KozmosContainerBlock(start: .sm, end: .sm))
        XCTAssertEqual(KozmosContainerBlock.md, KozmosContainerBlock(start: .md, end: .md))
        XCTAssertEqual(KozmosContainerBlock.lg, KozmosContainerBlock(start: .lg, end: .lg))
    }

    /// Each step adds its space above and below the content, at any inset,
    /// and the content is drawn that far down; the sides are as before.
    @MainActor func testBlockPadsAboveAndBelow() throws {
        for (inset, block, top, bottom): (KozmosContainerInset, KozmosContainerBlock, CGFloat, CGFloat) in [
            (.panel, .sm, 16, 16), (.panel, .md, 24, 24), (.window, .lg, 32, 32),
            (.window, .init(start: .lg, end: .md), 32, 24), (.panel, .init(start: .sm), 16, 0),
            (.panel, .init(end: .md), 0, 24),
        ] {
            let view = KozmosContainer(inset: inset, block: block) { Color.black.frame(height: 40) }.frame(width: 800)
            let drawn = try DrawnPixels.draw(view, scale: 1)
            let state = "\(inset), \(block)"
            let box = try XCTUnwrap(drawn.boundingBox { _, _, _, a in a > 200 }, state)
            XCTAssertEqual(drawn.size.height, top + 40 + bottom, accuracy: 0.5, state)
            XCTAssertEqual(box.minY, top, accuracy: 0.5, state)
            XCTAssertEqual(drawn.size.height - box.maxY, bottom, accuracy: 0.5, state)
            XCTAssertEqual(box.minX, KozmosContainerInset.padding(inset, width: 800), accuracy: 0.5, state)
        }
    }

    /// Left out, or `.none`, the container is its content's height, as before.
    @MainActor func testNoBlockAddsNoSpace() throws {
        for view in [
            AnyView(KozmosContainer(inset: .window) { Color.black.frame(height: 40) }),
            AnyView(KozmosContainer(inset: .window, block: .none) { Color.black.frame(height: 40) }),
        ] {
            let drawn = try DrawnPixels.draw(view.frame(width: 800), scale: 1)
            let box = try XCTUnwrap(drawn.boundingBox { _, _, _, a in a > 200 })
            XCTAssertEqual(drawn.size.height, 40, accuracy: 0.5)
            XCTAssertEqual(box.minY, 0, accuracy: 0.5)
        }
    }

    /// One measure includes the space: what a self-sizing cell asks.
    @MainActor func testOneMeasureIncludesTheBlock() {
        let view = KozmosContainer(inset: .panel, block: .init(start: .lg, end: .md)) { TallAsItIsWide { Color.clear } }
        XCTAssertEqual(laidOut(view, width: 400).height, 400 - 32 + 32 + 24, accuracy: 0.5)
    }

    /// Container.mdx's block snippet (DocSnippets/MapContentColumn.swift),
    /// drawn as well as compiled: its text starts 16 down and 16 in.
    @MainActor func testTheBlockDocsSnippetPadsSixteenAbove() throws {
        let drawn = try DrawnPixels.draw(MapContentColumn().frame(width: 400), scale: 2)
        let text = try XCTUnwrap(drawn.boundingBox { _, _, _, a in a > 100 }, "no text drawn")
        XCTAssertGreaterThanOrEqual(text.minY, 16)
        XCTAssertLessThan(text.minY, 24)
        XCTAssertGreaterThanOrEqual(drawn.size.height - text.maxY, 16)
    }

    @MainActor private func laidOut<V: View>(_ view: V, width: CGFloat) -> CGSize {
        let offered = CGSize(width: width, height: 10_000)
        #if canImport(UIKit)
        return UIHostingController(rootView: view).sizeThatFits(in: offered)
        #else
        return NSHostingController(rootView: view).sizeThatFits(in: offered)
        #endif
    }

    /// As tall as the width it is offered.
    private struct TallAsItIsWide: Layout {
        func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
            let width = proposal.width ?? 0
            return CGSize(width: width, height: width)
        }

        func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
            for subview in subviews { subview.place(at: bounds.origin, proposal: ProposedViewSize(bounds.size)) }
        }
    }

    #if os(iOS)
    @MainActor func testInsetPadsTheSidesOnlyAndTheDefaultStillPadsEverySide() async throws {
        for (inset, width, side, top): (KozmosContainerInset?, CGFloat, CGFloat, Bool) in [
            (.panel, 1100, 16, false), (.window, 390, 16, false), (.window, 800, 24, false),
            (.window, 1100, 32, false), (nil, 390, 16, true),
        ] {
            var frame = CGRect.zero
            let probe = Color.blue.frame(height: 40).background(GeometryReader { proxy in
                Color.clear.preference(key: ProbeFrame.self, value: proxy.frame(in: .global))
            })
            let container: AnyView = inset.map { AnyView(KozmosContainer(inset: $0) { probe }) }
                ?? AnyView(KozmosContainer { probe })
            let view = VStack(spacing: 0) { container; Spacer(minLength: 0) }
                .frame(width: width, height: 300)
                .onPreferenceChange(ProbeFrame.self) { frame = $0 }
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: width, height: 300))
            window.rootViewController = UIHostingController(rootView: view.ignoresSafeArea())
            window.makeKeyAndVisible()
            defer { window.isHidden = true }
            try await Task.sleep(nanoseconds: 300_000_000)
            let state = "\(String(describing: inset)) at \(width)"
            XCTAssertEqual(frame.minX, side, accuracy: 1, state)
            XCTAssertEqual(width - frame.maxX, side, accuracy: 1, state)
            if top { XCTAssertGreaterThan(frame.minY, 0, state) } else { XCTAssertEqual(frame.minY, 0, accuracy: 1, state) }
        }
    }

    private struct ProbeFrame: PreferenceKey {
        static var defaultValue = CGRect.zero
        static func reduce(value: inout CGRect, nextValue: () -> CGRect) {
            let next = nextValue()
            if !next.isEmpty { value = next }
        }
    }
    #endif
}
