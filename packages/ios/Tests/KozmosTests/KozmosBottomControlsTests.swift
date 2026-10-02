import SwiftUI
import XCTest
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
    private final class TestWindow: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }
    #endif
}
