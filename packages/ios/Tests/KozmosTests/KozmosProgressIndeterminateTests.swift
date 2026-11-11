import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// GAP-159: the bar with no value moves, stands still under Reduce Motion,
/// is said once, and can be the screen's 4 tall loading bar at the top, as
/// React's `Progress` with no value and `placement="top"`.
final class KozmosProgressIndeterminateTests: XCTestCase {
    typealias Sweep = KozmosProgressSweep

    // MARK: The sweep

    /// A quarter of the track, from wholly before the start to wholly past
    /// the end every 2 s, linear: Pointr Cloud's loading bar.
    func testTheSegmentSweepsAQuarterOfTheTrackEveryTwoSeconds() {
        XCTAssertEqual(Sweep.width, 0.25)
        XCTAssertEqual(Sweep.period, 2)
        XCTAssertEqual(Sweep.start(at: 0, reduceMotion: false), -0.25, accuracy: 1e-9)
        XCTAssertEqual(Sweep.start(at: 0.5, reduceMotion: false), 0.0625, accuracy: 1e-9)
        XCTAssertEqual(Sweep.start(at: 1, reduceMotion: false), 0.375, accuracy: 1e-9)
        XCTAssertEqual(Sweep.start(at: 1.999_999, reduceMotion: false), 1, accuracy: 1e-5)
        // Forever: the next period starts again before the track.
        XCTAssertEqual(Sweep.start(at: 2, reduceMotion: false), -0.25, accuracy: 1e-9)
        XCTAssertEqual(Sweep.start(at: 803.0, reduceMotion: false), Sweep.start(at: 1, reduceMotion: false), accuracy: 1e-9)
    }

    /// Under Reduce Motion it stands in the middle of the track, whatever
    /// the time, where it reads as a wait and not as a value.
    func testUnderReduceMotionTheSegmentStandsStillInTheMiddle() {
        for time in [0.0, 0.3, 1.7, 1_000.25] {
            XCTAssertEqual(Sweep.start(at: time, reduceMotion: true), 0.375, accuracy: 1e-9)
        }
        let x = Sweep.x(start: Sweep.still, trackWidth: 320, direction: .leftToRight)
        XCTAssertEqual(x, 120, accuracy: 1e-9)
        XCTAssertEqual(x + 320 * CGFloat(Sweep.width) / 2, 160, accuracy: 1e-9)
        XCTAssertEqual(Sweep.x(start: Sweep.still, trackWidth: 320, direction: .rightToLeft), 120, accuracy: 1e-9)
    }

    /// Right to left the inline start is the right edge: the segment enters
    /// past the right and leaves past the left.
    func testRightToLeftItSweepsFromTheRight() {
        XCTAssertEqual(Sweep.x(start: -0.25, trackWidth: 400, direction: .leftToRight), -100, accuracy: 1e-9)
        XCTAssertEqual(Sweep.x(start: 1, trackWidth: 400, direction: .leftToRight), 400, accuracy: 1e-9)
        XCTAssertEqual(Sweep.x(start: -0.25, trackWidth: 400, direction: .rightToLeft), 400, accuracy: 1e-9)
        XCTAssertEqual(Sweep.x(start: 1, trackWidth: 400, direction: .rightToLeft), -100, accuracy: 1e-9)
        XCTAssertEqual(Sweep.x(start: 0.1, trackWidth: 400, direction: .rightToLeft), 260, accuracy: 1e-9)
    }

    // MARK: Placement

    func testTheBarIsEightInTheFlowAndFourAtTheTop() {
        XCTAssertEqual(KozmosProgressPlacement.inline.height, KozmosDimensions.primitivesLayoutSpacing100)
        XCTAssertEqual(KozmosProgressPlacement.top.height, KozmosDimensions.primitivesLayoutSpacing50)
        XCTAssertEqual(KozmosProgressPlacement.top.height, 4)
    }

    func testARingIsAlwaysInTheFlow() {
        XCTAssertEqual(KozmosProgress(value: 0.5, placement: .top).resolvedPlacement, .top)
        XCTAssertEqual(KozmosProgress(placement: .top).resolvedPlacement, .top)
        XCTAssertEqual(KozmosProgress(value: 0.5, shape: .circular, placement: .top).resolvedPlacement, .inline)
    }

    func testTheIndeterminateBarIsNamedLoadingUnlessGivenWords() {
        XCTAssertTrue(KozmosProgress().indeterminate)
        XCTAssertEqual(KozmosProgress().spokenLabel, "Loading")
        XCTAssertEqual(KozmosProgress(label: "Loading the map").spokenLabel, "Loading the map")
        XCTAssertFalse(KozmosProgress(value: 0.4).indeterminate)
    }

    // MARK: Said once per wait

    /// Review of #522: a bar that leaves the screen and comes back while it
    /// still waits (a row scrolled out of a List and back, a tab switched
    /// away and back) is not said again.
    func testAWaitIsSaidOnceThoughItsBarComesBack() {
        var waits = KozmosProgressWaits()
        let wait = UUID()
        XCTAssertEqual(waits.appear(wait, label: "Loading", at: 0), "Loading")
        XCTAssertNil(waits.appear(wait, label: "Loading", at: 5))
        XCTAssertNil(waits.appear(wait, label: "Loading", at: 60))
    }

    /// Review of #522: a label that changes while the bar waits is not
    /// said again.
    func testALabelThatChangesWhileItWaitsIsNotSaidAgain() {
        var waits = KozmosProgressWaits()
        let wait = UUID()
        XCTAssertEqual(waits.appear(wait, label: "Loading the map", at: 0), "Loading the map")
        XCTAssertNil(waits.appear(wait, label: "Loading the map, 50 tiles", at: 2))
    }

    /// Second review of #522: bars that start together share one
    /// announcement. Five uploads within 500 ms are one "Upload 1", also
    /// when one comes back.
    func testFiveStartingTogetherSpeakOnce() {
        var waits = KozmosProgressWaits()
        let bars = (1...5).map { _ in UUID() }
        let said = bars.enumerated().map { waits.appear($1, label: "Upload \($0 + 1)", at: 10 + Double($0) * 0.1) }
        XCTAssertEqual(said, ["Upload 1", nil, nil, nil, nil])
        XCTAssertNil(waits.appear(bars[3], label: "Upload 4", at: 12))
    }

    /// Second review of #522: a later, unrelated wait speaks even while an
    /// earlier long wait still runs: "Sync" goes on, "Uploading plan"
    /// starts two seconds later and is said.
    func testALaterWaitSpeaksWhileALongOneRuns() {
        var waits = KozmosProgressWaits()
        XCTAssertEqual(waits.appear(UUID(), label: "Sync", at: 100), "Sync")
        XCTAssertEqual(waits.appear(UUID(), label: "Uploading plan", at: 102), "Uploading plan")
    }

    /// Second review of #522: A ends while B still waits; C, starting
    /// afterwards, speaks.
    func testWhenOneEndsAndAnotherWaitsALaterOneSpeaks() {
        var waits = KozmosProgressWaits()
        let a = UUID(), b = UUID(), c = UUID()
        XCTAssertEqual(waits.appear(a, label: "A", at: 0), "A")
        XCTAssertNil(waits.appear(b, label: "B", at: 0.2))
        waits.end(a)
        XCTAssertEqual(waits.appear(c, label: "C", at: 3), "C")
    }

    /// A value ends the wait; the bar's next wait is said again. No words,
    /// nothing said.
    func testAValueEndsTheWait() {
        var waits = KozmosProgressWaits()
        let wait = UUID()
        XCTAssertEqual(waits.appear(wait, label: "Loading", at: 0), "Loading")
        waits.end(wait)
        XCTAssertTrue(waits.settled.isEmpty)
        XCTAssertEqual(waits.appear(wait, label: "Loading", at: 4), "Loading")
        var silent = KozmosProgressWaits()
        XCTAssertNil(silent.appear(UUID(), label: "", at: 0))
    }

    #if os(iOS)
    /// Second review of #522: a bar that goes for good takes its wait out
    /// of the registry, so the registry holds only the bars that exist.
    @MainActor
    func testTheRegistryEmptiesWhenBarsGo() async throws {
        KozmosProgressWaitRegistry.waits = KozmosProgressWaits()
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        var host: UIHostingController<AnyView>? = UIHostingController(rootView: AnyView(
            VStack { ForEach(0..<3) { n in KozmosProgress(label: "Upload \(n)") } }))
        window.rootViewController = host
        window.makeKeyAndVisible()
        try await Task.sleep(nanoseconds: 300_000_000)
        XCTAssertEqual(KozmosProgressWaitRegistry.waits.settled.count, 3)
        host?.rootView = AnyView(Text("Done"))
        try await Task.sleep(nanoseconds: 300_000_000)
        window.rootViewController = nil
        host = nil
        window.isHidden = true
        try await Task.sleep(nanoseconds: 300_000_000)
        XCTAssertTrue(KozmosProgressWaitRegistry.waits.settled.isEmpty,
                      "waits left behind: \(KozmosProgressWaitRegistry.waits.settled.count)")
    }

    /// Second review of #522: VoiceOver meets the indeterminate bar as the
    /// system's indeterminate progress indicator, named by its words, as
    /// React's is a progressbar and Compose's an Indeterminate range.
    @MainActor
    func testTheIndeterminateBarIsTheSystemsProgressIndicator() async throws {
        let bar = try await axElements(KozmosProgress(label: "Loading the map"))
        let system = try await axElements(ProgressView { Text("Loading the map") })
        XCTAssertEqual(bar.count, 1, "the bar is one element: \(bar)")
        XCTAssertEqual(bar, system)
    }

    /// Each element VoiceOver walks: its name, value and traits.
    @MainActor
    private func axElements<V: View>(_ view: V) async throws -> [String] {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get(); set(1); defer { set(old) }
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = UIHostingController(rootView: view.frame(width: 300))
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        func elements(_ node: NSObject) -> [NSObject] {
            if node.accessibilityElementsHidden { return [] }
            if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
            if node.isAccessibilityElement { return [node] }
            if let values = node.accessibilityElements as? [NSObject], !values.isEmpty {
                return values.flatMap(elements)
            }
            if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
                return (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }.flatMap(elements)
            }
            return ((node as? UIView)?.subviews ?? []).flatMap(elements)
        }
        return elements(window).map {
            "\($0.accessibilityLabel ?? "-") | \($0.accessibilityValue ?? "-") | \($0.accessibilityTraits.rawValue)"
        }
    }
    #endif

    /// Review of #522: the determinate top bar is named for VoiceOver,
    /// "Progress" unless given, as the inline bar's ProgressView is.
    func testTheTopBarIsNamed() {
        XCTAssertEqual(KozmosProgress(value: 0.4, placement: .top).accessibilityName, "Progress")
        XCTAssertEqual(KozmosProgress(value: 0.4, placement: .top, accessibilityName: "Upload").accessibilityName, "Upload")
        XCTAssertEqual(KozmosTopBar(fraction: 0.4, accessibilityName: "Upload").accessibilityName, "Upload")
    }

    #if os(iOS)
    /// Review of #522: in an overlay at the top of the screen's content the
    /// bar sits under the status bar or notch, inside the safe area.
    @MainActor
    func testAtTheTopItSitsInsideTheSafeArea() throws {
        final class Box { var frame: CGRect = .null }
        let box = Box()
        let view = Color.clear
            .overlay(alignment: .top) {
                KozmosProgress(placement: .top)
                    .background(GeometryReader { g in
                        Color.clear.onAppear { box.frame = g.frame(in: .global) }
                    })
            }
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        let host = UIHostingController(rootView: view)
        host.additionalSafeAreaInsets = UIEdgeInsets(top: 47, left: 0, bottom: 34, right: 0)
        window.rootViewController = host
        window.makeKeyAndVisible()
        host.view.layoutIfNeeded()
        RunLoop.main.run(until: Date().addingTimeInterval(0.3))
        let top = host.view.safeAreaInsets.top
        XCTAssertGreaterThanOrEqual(top, 47)
        XCTAssertEqual(box.frame.minY, top, accuracy: 0.5)
        XCTAssertEqual(box.frame.height, 4, accuracy: 0.5)
        XCTAssertEqual(box.frame.width, 390, accuracy: 0.5)
        window.isHidden = true
    }
    #endif

    // MARK: Drawn

    @MainActor
    private func draw<V: View>(_ view: V, width: CGFloat = 200, direction: LayoutDirection = .leftToRight) throws -> DrawnPixels {
        try DrawnPixels.draw(
            view.frame(width: width)
                .environment(\.layoutDirection, direction)
                .environment(\.colorScheme, .light),
            scale: 2
        )
    }

    /// The top bar is 4 tall and square: its corner pixel is drawn.
    @MainActor
    func testTheTopBarIsDrawnFourTallAndSquare() throws {
        let top = try draw(KozmosTopBar(fraction: 0.5))
        XCTAssertEqual(CGFloat(top.height) / top.scale, 4)
        XCTAssertTrue(top.isDrawn(at: CGPoint(x: 0.25, y: 0.25)), "the top bar's corner is not square")
    }

    /// A determinate top bar fills from the inline start: the right, right
    /// to left.
    @MainActor
    func testTheTopBarFillsFromTheInlineStart() throws {
        let theme = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        let ltr = try XCTUnwrap(draw(KozmosTopBar(fraction: 0.25)).boundingBox(where: DrawnPixels.matches(theme)))
        XCTAssertEqual(ltr.minX, 0, accuracy: 1)
        XCTAssertEqual(ltr.width, 50, accuracy: 1)
        let rtl = try XCTUnwrap(draw(KozmosTopBar(fraction: 0.25), direction: .rightToLeft)
            .boundingBox(where: DrawnPixels.matches(theme)))
        XCTAssertEqual(rtl.maxX, 200, accuracy: 1)
        XCTAssertEqual(rtl.width, 50, accuracy: 1)
    }

    /// The indeterminate bar draws its track and at most a quarter of it in
    /// the theme's colour, never the empty, still track it drew before.
    @MainActor
    func testTheIndeterminateBarDrawsItsTrackAndAQuarterSegment() throws {
        let track = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground200, in: .light)
        let theme = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        for placement in KozmosProgressPlacement.allCases {
            let drawn = try draw(KozmosIndeterminateBar(placement: placement))
            XCTAssertEqual(CGFloat(drawn.height) / drawn.scale, placement.height)
            XCTAssertNotNil(drawn.boundingBox(where: DrawnPixels.matches(track, tolerance: 3)))
            if let segment = drawn.boundingBox(where: DrawnPixels.matches(theme)) {
                XCTAssertLessThanOrEqual(segment.width, 50.5)
            }
        }
    }
}
