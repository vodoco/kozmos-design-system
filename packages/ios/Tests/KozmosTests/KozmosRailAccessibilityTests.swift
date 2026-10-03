import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

final class KozmosRailAccessibilityTests: XCTestCase {
    #if os(iOS)
    @MainActor func testCoincidentWaypointsAreInTheLabelNotOptionalHints() async throws {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get(); set(1); defer { set(old) }
        for progress in [Double?(0.25), nil] {
            let view = KozmosRouteProgressRail(progress: progress, type: .left, label: "Journey",
                valueText: progress == nil ? "Position unbekannt" : nil, waypoints: [
                    KozmosRouteProgressWaypoint(id: "a", position: 0.5, type: .left, label: "Gallery entrance"),
                    KozmosRouteProgressWaypoint(id: "b", position: 0.5, type: .right, label: "Turn right into gallery")
                ]).frame(width: 300).environment(\.locale, Locale(identifier: "de_DE"))
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
            window.rootViewController = UIHostingController(rootView: view)
            window.makeKeyAndVisible()
            defer { window.isHidden = true }
            try await Task.sleep(nanoseconds: 200_000_000)
            let rail = try XCTUnwrap(elements(window).first { $0.accessibilityLabel?.contains("Journey") == true })
            XCTAssertEqual(rail.accessibilityLabel, "Journey; Gallery entrance; Turn right into gallery")
            if progress == nil { XCTAssertEqual(rail.accessibilityValue, "Position unbekannt") }
            else {
                XCTAssertTrue(rail.accessibilityValue?.contains("25") == true)
                XCTAssertFalse(rail.accessibilityValue?.contains("percent") == true)
            }
        }
    }

    @MainActor private func elements(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        let children: [NSObject]
        if let values = node.accessibilityElements as? [NSObject], !values.isEmpty { children = values }
        else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        } else { children = (node as? UIView)?.subviews ?? [] }
        return children.flatMap { elements($0) }
    }
    #endif
}
