import SnapshotTesting
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
final class KozmosPOIDetailIconFallbackTests: XCTestCase {
    #if os(iOS)
    private final class FailingAssets: URLProtocol {
        static let host = "kozmos-asset-fails.test"
        override class func canInit(with request: URLRequest) -> Bool { request.url?.host == host }
        override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
        override func startLoading() {
            client?.urlProtocol(self, didFailWithError: URLError(.cannotConnectToHost))
        }
        override func stopLoading() {}
    }

    override func setUp() { URLProtocol.registerClass(FailingAssets.self) }
    override func tearDown() { URLProtocol.unregisterClass(FailingAssets.self) }

    /// How many pixels the icon inks in its 16pt box, hosted, given a second
    /// for the load to fail, then drawn: on white, in black, so any ink is
    /// the icon.
    @MainActor private func ink(of icon: POIDetailIcon) async throws -> Int {
        let view = icon.foregroundColor(.black).frame(width: 16, height: 16).padding(8).background(Color.white)
        let controller = UIHostingController(rootView: view)
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 32, height: 32))
        window.rootViewController = controller
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 1_000_000_000)
        let strategy = Snapshotting<UIViewController, UIImage>.image(size: CGSize(width: 32, height: 32))
        let image = await withCheckedContinuation { continuation in
            strategy.snapshot(controller).run { continuation.resume(returning: $0) }
        }
        let pixels = try RenderedPixels(image, pointWidth: 32)
        XCTAssertEqual(pixels.count(in: CGRect(x: 0, y: 0, width: 32, height: 6)) { r, g, b in Int(r) + Int(g) + Int(b) < 300 }, 0,
                       "the drawing is not white around the icon")
        return pixels.count(in: CGRect(x: 8, y: 8, width: 16, height: 16)) { r, g, b in Int(r) + Int(g) + Int(b) < 300 }
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

    /// With nothing to fall back to, a failed asset leaves no icon: the label stands alone.
    @MainActor func testAFailedAssetWithNoNameDrawsNothing() async throws {
        let drawn = try await ink(of: POIDetailIcon(systemImage: nil,
                                                    url: "https://\(FailingAssets.host)/logo.png", monochrome: false))
        XCTAssertEqual(drawn, 0)
    }
    #endif
}
