import SwiftUI
import XCTest
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// GAP-178, the owner's rule (21 Oct): an `iconUrl` that is unsafe or fails to
/// load falls back to the icon's `iconName`, or its SF Symbol, on all three
/// platforms, as Compose's always has. iOS fell back for an unsafe URL but
/// drew nothing once a safe one failed to load, so the glyph the tag's name
/// still had was lost.
///
/// The load is made to fail by a URL protocol that answers every request for
/// one test host with an error, so the test needs no network.
///
/// Each test waits for what it is looking for, read in the window the icon is
/// hosted in. These tests used to sleep a second and take a snapshot, which
/// failed now and then on CI: the snapshot strategy moves a controller's view
/// into a window of its own and draws it in the same turn, so a failure that
/// had not reached the icon yet was not drawn, and the move cancels a load
/// still in flight. Polling the strategy would move the view every time.
final class KozmosPOIDetailIconFallbackTests: XCTestCase {
    #if os(iOS)
    private final class FailingAssets: URLProtocol {
        static let host = "kozmos-asset-fails.test"
        private static let lock = NSLock()
        private static var answered = 0
        /// How many requests this test has made.
        static var requests: Int {
            get { lock.withLock { answered } }
            set { lock.withLock { answered = newValue } }
        }
        override class func canInit(with request: URLRequest) -> Bool { request.url?.host == host }
        override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
        override func startLoading() {
            Self.lock.withLock { Self.answered += 1 }
            client?.urlProtocol(self, didFailWithError: URLError(.cannotConnectToHost))
        }
        override func stopLoading() {}
    }

    override func setUp() {
        URLProtocol.registerClass(FailingAssets.self)
        FailingAssets.requests = 0
    }
    override func tearDown() { URLProtocol.unregisterClass(FailingAssets.self) }

    /// No safe areas, as the snapshot strategy's own window has none: the
    /// simulator's would move the icon.
    private final class Window: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    /// The icon on white, in black, so any ink is the icon.
    private struct Stage: View {
        let icon: POIDetailIcon

        var body: some View {
            icon.foregroundColor(.black).frame(width: 16, height: 16).padding(8).background(Color.white)
        }
    }

    private static let iconBox = CGRect(x: 8, y: 8, width: 16, height: 16)
    private static let aboveTheIcon = CGRect(x: 0, y: 0, width: 32, height: 6)
    /// Far past any stall seen on a runner; a pass returns as soon as it can.
    private static let deadline: TimeInterval = 15

    private static func isInk(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { Int(r) + Int(g) + Int(b) < 300 }
    private static func ink(in pixels: RenderedPixels) -> Int { pixels.count(in: iconBox, where: isInk) }

    @MainActor private func host(_ controller: UIViewController) -> UIWindow {
        let window = Window(frame: CGRect(x: 0, y: 0, width: 32, height: 32))
        window.rootViewController = controller
        window.makeKeyAndVisible()
        return window
    }

    /// The window drawn where it stands, again and again until `done` holds or
    /// the deadline passes. The last drawing comes back for the test to judge.
    /// Pixels nothing has painted read as black, so `done` is only asked once
    /// the white is down.
    @MainActor private func drawing(of window: UIWindow, until done: (RenderedPixels) -> Bool) async throws -> RenderedPixels {
        let deadline = Date().addingTimeInterval(Self.deadline)
        while true {
            let image = UIGraphicsImageRenderer(bounds: window.bounds).image { window.layer.render(in: $0.cgContext) }
            let pixels = try RenderedPixels(image, pointWidth: window.bounds.width)
            let painted = pixels.count(in: Self.aboveTheIcon, where: Self.isInk) == 0
            if (painted && done(pixels)) || Date() >= deadline { return pixels }
            try await Task.sleep(nanoseconds: 20_000_000)
        }
    }

    /// How many pixels the icon inks in its 16pt box, read once it has drawn,
    /// or at the deadline if it never does.
    @MainActor private func ink(of icon: POIDetailIcon) async throws -> Int {
        let window = host(UIHostingController(rootView: Stage(icon: icon)))
        defer { window.isHidden = true }
        let pixels = try await drawing(of: window) { Self.ink(in: $0) > 10 }
        XCTAssertEqual(pixels.count(in: Self.aboveTheIcon, where: Self.isInk), 0, "the drawing is not white around the icon")
        return Self.ink(in: pixels)
    }

    @MainActor func testAFailedAssetFallsBackToTheIconName() async throws {
        let drawn = try await ink(of: POIDetailIcon(iconName: "phone", systemImage: nil,
                                                    url: "https://\(FailingAssets.host)/phone.png", monochrome: false))
        XCTAssertGreaterThan(drawn, 10, "a failed asset left no icon where its iconName draws one")
    }

    @MainActor func testAFailedAssetFallsBackToTheSystemImage() async throws {
        let drawn = try await ink(of: POIDetailIcon(systemImage: "wifi",
                                                    url: "https://\(FailingAssets.host)/wifi.png", monochrome: true))
        XCTAssertGreaterThan(drawn, 10, "a failed asset left no icon where its SF Symbol draws one")
    }

    /// An unsafe address fell back already; it still does.
    @MainActor func testAnUnsafeAssetFallsBackToTheIconName() async throws {
        let drawn = try await ink(of: POIDetailIcon(iconName: "phone", systemImage: nil,
                                                    url: "http://\(FailingAssets.host)/phone.png", monochrome: false))
        XCTAssertGreaterThan(drawn, 10)
    }

    /// With nothing to fall back to, a failed asset leaves no icon: the label
    /// stands alone. That icon draws the same before its load fails as after,
    /// so an empty box says nothing by itself: read too early, it passed for a
    /// part that drew on failure. So the same icon starts with a name, whose
    /// ink proves the failure has reached it, in this box, and then loses the
    /// name. Its one load stays failed, and nothing is left to draw.
    @MainActor func testAFailedAssetWithNoNameDrawsNothing() async throws {
        let url = "https://\(FailingAssets.host)/logo.png"
        let controller = UIHostingController(rootView: Stage(icon: POIDetailIcon(iconName: "phone", systemImage: nil,
                                                                                url: url, monochrome: false)))
        let window = host(controller)
        defer { window.isHidden = true }
        let failed = try await drawing(of: window) { Self.ink(in: $0) > 10 }
        XCTAssertGreaterThan(Self.ink(in: failed), 10, "the failure never reached the icon, so an empty box would prove nothing")

        controller.rootView = Stage(icon: POIDetailIcon(systemImage: nil, url: url, monochrome: false))
        let nameless = try await drawing(of: window) { Self.ink(in: $0) == 0 }
        XCTAssertEqual(Self.ink(in: nameless), 0)
        XCTAssertEqual(FailingAssets.requests, 1, "the load ran again, so the box may be empty for another reason")
    }
    #endif
}
