import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

final class KozmosArrivalPanelTests: XCTestCase {
    #if os(iOS)
    @MainActor func testDoneFillsTheHostedPanelWidth() async throws {
        let view = KozmosArrivalPanel(destination: "Gate 3", onDone: {})
            .environment(\.colorScheme, .light).background(Color.white)
        let size = CGSize(width: 320, height: 220)
        let pixels = try await RenderedPixels.render(view, size: size)
        let done = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isTheme))
        XCTAssertEqual(done.width, 320, accuracy: 2, "Done's painted and interactive area must fill the panel")
    }

    @MainActor func testActualMetricsAndPendingDoneAccessibility() async throws {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get(); set(1); defer { set(old) }
        for pending in [false, true] {
            var calls = 0
            let content = KozmosArrivalPanel(destination: "Gate 3", actualDurationText: pending ? "0 min" : nil,
                durationLabel: "Dauer", doneLabel: "Fertig", pending: pending, onDone: { calls += 1 })
                .frame(width: 320)
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
            window.rootViewController = UIHostingController(rootView: content)
            window.makeKeyAndVisible()
            defer { window.isHidden = true }
            try await Task.sleep(nanoseconds: 200_000_000)
            let tree = elements(window)
            let labels = tree.compactMap(\.accessibilityLabel).joined(separator: " | ")
            XCTAssertTrue(labels.contains("Gate 3"))
            XCTAssertFalse(labels.contains("Distance travelled"))
            XCTAssertEqual(labels.contains("0 min"), pending)
            XCTAssertEqual(labels.contains("Dauer"), pending)
            let done = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Fertig" })
            XCTAssertEqual(done.accessibilityTraits.contains(.notEnabled), pending)
            XCTAssertEqual(done.accessibilityFrame.width, 320, accuracy: 2)
            if !pending {
                XCTAssertTrue(done.accessibilityActivate())
                XCTAssertEqual(calls, 1)
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
