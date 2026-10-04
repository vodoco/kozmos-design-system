import SwiftUI
import XCTest
#if os(macOS)
import AppKit
#endif
@testable import Kozmos

final class KozmosBottomControlsTests: XCTestCase {
    func testNarrowCornersWrapWithoutOverlapAndMirror() {
        for rtl in [false, true] {
            let frames = KozmosBottomControlsLayout.frames(
                width: 328, start: CGSize(width: 220, height: 44),
                end: CGSize(width: 144, height: 160), gap: 16, rtl: rtl
            )
            XCTAssertFalse(frames[0].intersects(frames[1]))
            XCTAssertEqual(frames[1].minY, 60)
            XCTAssertEqual(frames[0].minX, rtl ? 108 : 0)
            XCTAssertEqual(frames[1].minX, rtl ? 0 : 184)
        }
    }

    func testWideCornersShareARowAtTheirBottomEdges() {
        let frames = KozmosBottomControlsLayout.frames(
            width: 568, start: CGSize(width: 220, height: 44),
            end: CGSize(width: 144, height: 160), gap: 16, rtl: false
        )
        XCTAssertEqual(frames[0].maxY, frames[1].maxY)
        XCTAssertFalse(frames[0].intersects(frames[1]))
    }

    #if os(iOS)
    @MainActor func testWidePanelFitsScrollableContentAndKeepsBottomCornersAtMapEdges() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            for contentHeight in [CGFloat(100), CGFloat(1200)] {
                var frames: [String: CGRect] = [:]
                let view = KozmosAdaptiveMapShell(
                    panelPlacement: .start,
                    controlsBottomStart: { Self.probe("start", width: 100, height: 44) },
                    controlsBottomEnd: { Self.probe("end", width: 60, height: 140) },
                    map: { Color.clear },
                    panel: {
                        KozmosPanelScrollView {
                            Color.clear.frame(height: contentHeight)
                        }.background(GeometryReader { p in
                            Color.clear.preference(key: Frames.self, value: ["panel": p.frame(in: .global)])
                        })
                    }
                ).frame(width: 1000, height: 600)
                    .environment(\.horizontalSizeClass, .regular)
                    .environment(\.layoutDirection, direction)
                    .onPreferenceChange(Frames.self) { frames = $0 }
                let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 1000, height: 600))
                window.rootViewController = UIHostingController(rootView: view)
                window.makeKeyAndVisible()
                defer { window.isHidden = true }
                try await Task.sleep(nanoseconds: 500_000_000)
                let panel = try XCTUnwrap(frames["panel"])
                let start = try XCTUnwrap(frames["start"])
                let end = try XCTUnwrap(frames["end"])
                // This probe is the content scroll view, below the shell's
                // 16-point top inset (the shell itself still starts at 16).
                XCTAssertEqual(panel.minY, 32, accuracy: 1)
                XCTAssertEqual(panel.height, min(contentHeight, 396), accuracy: 1)
                XCTAssertFalse(panel.intersects(start))
                XCTAssertEqual(direction == .leftToRight ? start.minX : 1000 - start.maxX, 16, accuracy: 1)
                XCTAssertEqual(start.maxY, 584, accuracy: 1)
                XCTAssertEqual(end.maxY, 584, accuracy: 1)
            }
        }
    }

    @MainActor func testFullSheetDoesNotExposeControlsOverAttribution() async throws {
      let old = try XCTUnwrap(setAutomation(1))
      defer { _ = setAutomation(old) }
      for detent in [KozmosMapPanelDetent.collapsed, .large] {
        let view = KozmosAdaptiveMapShell(
            panelDetent: .constant(detent),
            attribution: AnyView(Self.probe("credits", width: 280, height: 64)),
            map: { Color.clear }, mapStatusContent: { EmptyView() },
            controls: { Button("Map information") {}.frame(height: 44) },
            topBar: { EmptyView() }, panel: { Text("Details") }
        ).frame(width: 390, height: 720).environment(\.horizontalSizeClass, .compact)
        let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 720))
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        try await Task.sleep(nanoseconds: 350_000_000)
        XCTAssertEqual(elements(in: window).contains { $0.accessibilityLabel == "Map information" }, detent == .collapsed)
        window.isHidden = true
      }
    }

    @MainActor private func elements(in node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        let children: [NSObject]
        if let items = node.accessibilityElements as? [NSObject], !items.isEmpty { children = items }
        else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        } else if let view = node as? UIView { children = view.subviews }
        else { children = [] }
        return children.flatMap { elements(in: $0) }
    }

    // Activate the simulator accessibility tree, as the other hosted AX tests do.
    // This test-only hook is never linked into the library.
    private static let accessibility = dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW)
    private func setAutomation(_ on: Int32) -> Int32? {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        guard let library = Self.accessibility,
              let get = dlsym(library, "_AXSAutomationEnabled"),
              let set = dlsym(library, "_AXSSetAutomationEnabled") else { return nil }
        let old = unsafeBitCast(get, to: Get.self)()
        unsafeBitCast(set, to: Set.self)(on)
        return old
    }

    @MainActor func testAttributionIsCenteredOnFullMapWithWidePanel() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            var frames: [String: CGRect] = [:]
            let view = KozmosAdaptiveMapShell(
                attribution: AnyView(Self.probe("credits", width: 280, height: 64)),
                map: { Color.clear }, panel: {
                    Color.clear.background(GeometryReader { p in
                        Color.clear.preference(key: Frames.self, value: ["panel": p.frame(in: .global)])
                    })
                }
            )
            .frame(width: 1000, height: 600)
            .environment(\.horizontalSizeClass, .regular)
            .environment(\.layoutDirection, direction)
            .onPreferenceChange(Frames.self) { frames = $0 }
            let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 1000, height: 600))
            window.rootViewController = UIHostingController(rootView: view)
            window.makeKeyAndVisible()
            try await Task.sleep(nanoseconds: 350_000_000)
            let credit = try XCTUnwrap(frames["credits"])
            let panel = try XCTUnwrap(frames["panel"])
            XCTAssertFalse(credit.intersects(panel))
            XCTAssertEqual(credit.midX, 500, accuracy: 1)
            window.isHidden = true
        }
    }

    @MainActor func testAttributionCappedMediumSheetAllowsContentScrolling() async throws {
        var canScroll = false
        let view = KozmosAdaptiveMapShell(
            panelDetent: .constant(.medium),
            attribution: AnyView(Self.probe("credits", width: 280, height: 200)),
            map: { Color.clear }, panel: { ScrollProbe() }
        )
        .frame(width: 390, height: 390)
        .environment(\.horizontalSizeClass, .compact)
        .onPreferenceChange(ScrollEnabled.self) { canScroll = $0 }
        let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 390))
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        try await Task.sleep(nanoseconds: 350_000_000)
        defer { window.isHidden = true }
        XCTAssertTrue(canScroll, "A sheet at its attribution-imposed height limit must scroll")
    }

    private struct ScrollEnabled: PreferenceKey {
        static var defaultValue = false
        static func reduce(value: inout Bool, nextValue: () -> Bool) { value = nextValue() }
    }
    private struct ScrollProbe: View {
        @Environment(\.kozmosPanelScrollEnabled) var enabled
        var body: some View { Color.clear.preference(key: ScrollEnabled.self, value: enabled) }
    }

    @MainActor func testAttributionClearsCornersAndPanelInBothDirections() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            for detent in [KozmosMapPanelDetent.collapsed, .large] {
                var frames: [String: CGRect] = [:]
                var bottom = 0.0
                let view = KozmosAdaptiveMapShell(
                    panelDetent: .constant(detent),
                    onCollisionInsetsChange: { bottom = $0.bottom },
                    attribution: AnyView(Color.clear.frame(height: 64).background(GeometryReader { p in
                        Color.clear.preference(key: Frames.self, value: ["credits": p.frame(in: .global)])
                    })),
                    controlsBottomStart: { Self.probe("start", width: 100, height: 44) },
                    controlsBottomEnd: { Self.probe("end", width: 60, height: 140) },
                    map: { Color.clear }, panel: {
                        Color.clear.background(GeometryReader { p in
                            Color.clear.preference(key: Frames.self, value: ["panel": p.frame(in: .global)])
                        })
                    }
                )
                .frame(width: 390, height: 720)
                .environment(\.layoutDirection, direction)
                .environment(\.horizontalSizeClass, .compact)
                .onPreferenceChange(Frames.self) { frames = $0 }
                let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 720))
                window.rootViewController = UIHostingController(rootView: view)
                window.makeKeyAndVisible()
                try await Task.sleep(nanoseconds: 350_000_000)
                let credit = try XCTUnwrap(frames["credits"])
                let panel = try XCTUnwrap(frames["panel"])
                XCTAssertEqual(credit.height, 64, accuracy: 1)
                XCTAssertEqual(credit.midX, 195, accuracy: 1)
                XCTAssertGreaterThanOrEqual(credit.minY, 0)
                XCTAssertFalse(credit.intersects(panel), "\(credit) overlaps \(panel)")
                XCTAssertGreaterThanOrEqual(bottom, 720 - credit.minY - 1)
                if detent == .collapsed {
                    for id in ["start", "end"] {
                        XCTAssertFalse(credit.intersects(try XCTUnwrap(frames[id])))
                        // Probe is the content's frame, 16pt below the sheet edge.
                        XCTAssertEqual(try XCTUnwrap(frames[id]).maxY, panel.minY - 32, accuracy: 1)
                    }
                }
                window.isHidden = true
            }
        }
    }

    @MainActor func testHostedCornersWrapAndRemainInsideAShortShell() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            var frames: [String: CGRect] = [:]
            let view = KozmosAdaptiveMapShell(
                controlsBottomStart: { Self.probe("start", width: 220, height: 44) },
                controlsBottomEnd: { Self.probe("end", width: 144, height: 160) },
                map: { Color.clear },
                panel: { EmptyView() }
            )
            .frame(width: 360, height: 300)
            .environment(\.layoutDirection, direction)
            .environment(\.horizontalSizeClass, .compact)
            .onPreferenceChange(Frames.self) { frames = $0 }
            let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 360, height: 300))
            window.rootViewController = UIHostingController(rootView: view)
            window.makeKeyAndVisible()
            try await Task.sleep(nanoseconds: 250_000_000)
            defer { window.isHidden = true }
            let a = try XCTUnwrap(frames["start"])
            let b = try XCTUnwrap(frames["end"])
            XCTAssertFalse(a.intersects(b), "\(a) overlaps \(b)")
            XCTAssertGreaterThan(a.height, 0)
            XCTAssertGreaterThan(b.height, 0)
            for frame in [a, b] {
                XCTAssertGreaterThanOrEqual(frame.minX, 0)
                XCTAssertGreaterThanOrEqual(frame.minY, 0)
                XCTAssertLessThanOrEqual(frame.maxX, 360)
                XCTAssertLessThanOrEqual(frame.maxY, 300)
            }
            XCTAssertEqual(a.minX, direction == .leftToRight ? 16 : 124, accuracy: 1)
            XCTAssertEqual(b.minX, direction == .leftToRight ? 200 : 16, accuracy: 1)
        }
    }

    @MainActor func testCornerCameraPaddingIsOptInAndRemovedWhenOutOfRoom() async throws {
        for (height, pad, expected) in [(300.0, false, 0.0), (300.0, true, 236.0), (120.0, true, 0.0)] {
            var bottom: Double = -1
            let view = KozmosAdaptiveMapShell(
                onCollisionInsetsChange: { bottom = $0.bottom },
                bottomControlsPadCamera: pad,
                controlsBottomStart: { Self.probe("start", width: 220, height: 44) },
                controlsBottomEnd: { Self.probe("end", width: 144, height: 160) },
                map: { Color.clear }, panel: { EmptyView() }
            )
            .frame(width: 360, height: height)
            .environment(\.horizontalSizeClass, .compact)
            let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 360, height: height))
            window.rootViewController = UIHostingController(rootView: view)
            window.makeKeyAndVisible()
            try await Task.sleep(nanoseconds: 250_000_000)
            XCTAssertEqual(bottom, expected, accuracy: 1)
            window.isHidden = true
        }
    }

    private final class TestWindow: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }
    #endif

    // MARK: One corner, or a corner with nothing in it

    /// The layout tells the corners apart by place, so each must be one
    /// subview whatever it holds. An `EmptyView` or an `if` that is false is
    /// no subview of its own: a shell given one corner read past its
    /// subviews and crashed, "Index out of range". Hosted on a Mac as well,
    /// so `swift test` runs these too. The end corner is what its default
    /// gives, an `EmptyView`.
    @MainActor func testAStartCornerAloneSitsAtTheStartEdge() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let hosted = try await hostedCorners(direction: direction) {
                Self.probe("start", width: 100, height: 44)
            } end: {
                EmptyView()
            }
            let start = try XCTUnwrap(hosted.frames["start"], "\(direction): the start corner was not laid out")
            XCTAssertEqual(start.width, 100, accuracy: 1)
            XCTAssertEqual(start.height, 44, accuracy: 1)
            XCTAssertEqual(direction == .leftToRight ? start.minX : 360 - start.maxX, 16, accuracy: 1, "\(direction)")
            XCTAssertEqual(start.maxY, 284, accuracy: 1, "\(direction)")
            XCTAssertEqual(hosted.cameraPadding, 44 + 16, accuracy: 1, "\(direction): the empty end corner takes room")
        }
    }

    /// The end corner alone stays at the end edge rather than taking the
    /// start corner's place. The start corner is what its default gives.
    @MainActor func testAnEndCornerAloneSitsAtTheEndEdge() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let hosted = try await hostedCorners(direction: direction) {
                EmptyView()
            } end: {
                Self.probe("end", width: 60, height: 140)
            }
            let end = try XCTUnwrap(hosted.frames["end"], "\(direction): the end corner was not laid out")
            XCTAssertEqual(end.width, 60, accuracy: 1)
            XCTAssertEqual(end.height, 140, accuracy: 1)
            XCTAssertEqual(direction == .leftToRight ? 360 - end.maxX : end.minX, 16, accuracy: 1, "\(direction)")
            XCTAssertEqual(end.maxY, 284, accuracy: 1, "\(direction)")
            XCTAssertEqual(hosted.cameraPadding, 140 + 16, accuracy: 1, "\(direction)")
        }
    }

    /// A corner the product supplies with nothing in it for now — a control
    /// it shows only sometimes — takes no room, and the other corner keeps
    /// its own edge, whichever of the two is empty.
    @MainActor func testACornerWithNothingInItLeavesTheOtherAtItsEdge() async throws {
        let shown = false
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let startOnly = try await hostedCorners(direction: direction) {
                Self.probe("start", width: 100, height: 44)
            } end: {
                if shown { Self.probe("end", width: 60, height: 140) }
            }
            let start = try XCTUnwrap(startOnly.frames["start"], "\(direction): the start corner was not laid out")
            XCTAssertNil(startOnly.frames["end"])
            XCTAssertEqual(direction == .leftToRight ? start.minX : 360 - start.maxX, 16, accuracy: 1, "\(direction)")
            XCTAssertEqual(start.maxY, 284, accuracy: 1, "\(direction)")
            XCTAssertEqual(startOnly.cameraPadding, 44 + 16, accuracy: 1, "\(direction): the empty end corner takes room")

            let endOnly = try await hostedCorners(direction: direction) {
                if shown { Self.probe("start", width: 100, height: 44) }
            } end: {
                Self.probe("end", width: 60, height: 140)
            }
            let end = try XCTUnwrap(endOnly.frames["end"], "\(direction): the end corner was not laid out")
            XCTAssertNil(endOnly.frames["start"])
            XCTAssertEqual(direction == .leftToRight ? 360 - end.maxX : end.minX, 16, accuracy: 1, "\(direction)")
            XCTAssertEqual(end.maxY, 284, accuracy: 1, "\(direction)")
            XCTAssertEqual(endOnly.cameraPadding, 140 + 16, accuracy: 1, "\(direction)")
        }
    }

    /// Both corners on one row, each at its own edge, their bottoms level.
    @MainActor func testBothCornersSitAtTheirOwnEdges() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let hosted = try await hostedCorners(direction: direction) {
                Self.probe("start", width: 100, height: 44)
            } end: {
                Self.probe("end", width: 60, height: 140)
            }
            let start = try XCTUnwrap(hosted.frames["start"], "\(direction): the start corner was not laid out")
            let end = try XCTUnwrap(hosted.frames["end"], "\(direction): the end corner was not laid out")
            XCTAssertEqual(hosted.cameraPadding, 140 + 16, accuracy: 1, "\(direction)")
            XCTAssertEqual(direction == .leftToRight ? start.minX : 360 - start.maxX, 16, accuracy: 1, "\(direction)")
            XCTAssertEqual(direction == .leftToRight ? 360 - end.maxX : end.minX, 16, accuracy: 1, "\(direction)")
            XCTAssertEqual(start.maxY, 284, accuracy: 1, "\(direction)")
            XCTAssertEqual(end.maxY, 284, accuracy: 1, "\(direction)")
        }
    }

    /// Where the probes in a shell's bottom corners are laid out, in a
    /// 360 × 300 shell with no panel: 16 in from each edge. With the
    /// camera padded for the corners, the padding is their region's height
    /// and the 16 above it, so an empty corner can be seen to measure nothing.
    @MainActor private func hostedCorners<Start: View, End: View>(
        direction: LayoutDirection,
        @ViewBuilder start: () -> Start,
        @ViewBuilder end: () -> End
    ) async throws -> (frames: [String: CGRect], cameraPadding: CGFloat) {
        var frames: [String: CGRect] = [:]
        var cameraPadding: CGFloat = -1
        let size = CGSize(width: 360, height: 300)
        let view = KozmosAdaptiveMapShell(
            onCollisionInsetsChange: { cameraPadding = $0.bottom },
            bottomControlsPadCamera: true,
            controlsBottomStart: start, controlsBottomEnd: end,
            map: { Color.clear }, panel: { EmptyView() }
        )
        .frame(width: size.width, height: size.height)
        .environment(\.layoutDirection, direction)
        .onPreferenceChange(Frames.self) { frames = $0 }
        #if os(iOS)
        let window = TestWindow(frame: CGRect(origin: .zero, size: size))
        window.rootViewController = UIHostingController(rootView: view.environment(\.horizontalSizeClass, .compact))
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 250_000_000)
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
        return (frames, cameraPadding)
    }

    private struct Frames: PreferenceKey {
        static var defaultValue: [String: CGRect] = [:]
        static func reduce(value: inout [String: CGRect], nextValue: () -> [String: CGRect]) {
            value.merge(nextValue(), uniquingKeysWith: { _, new in new })
        }
    }
    private static func probe(_ id: String, width: CGFloat, height: CGFloat) -> some View {
        Color.blue.frame(width: width, height: height)
            .background(GeometryReader { p in
                Color.clear.preference(key: Frames.self, value: [id: p.frame(in: .global)])
            })
    }
}
