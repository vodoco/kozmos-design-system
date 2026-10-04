#if os(iOS)
import SwiftUI
import UIKit
import XCTest
@testable import Kozmos

/// What VoiceOver hears of a tooltip. By default its text is the view's
/// hint. Where the text repeats the view's own label, the caller turns that
/// off, or VoiceOver reads the text twice.
final class KozmosTooltipTests: XCTestCase {
    /// `help` sets the same hint on iOS (measured on iOS 26.5), so the
    /// tooltip leaves both off when asked to: the hint is gone, not just one
    /// of its two sources.
    @MainActor func testTheTextIsTheHintUnlessItRepeatsTheLabel() async throws {
        let automationWas = try XCTUnwrap(setAutomation(1), "libAccessibility has no automation switch here")
        defer { _ = setAutomation(automationWas) }
        let window = await host(VStack {
            Button("Zoom in") {}.kozmosTooltip("Zooms the map in")
            Button {} label: { Text("2F") }
                .accessibilityLabel("Second floor")
                .kozmosTooltip("Second floor", side: .left, isAccessibilityHint: false)
        })
        defer { window.isHidden = true }
        let elements = elements(in: window)
        let hinted = try XCTUnwrap(elements.first { $0.accessibilityLabel == "Zoom in" }, "no element for the hinted button")
        XCTAssertEqual(hinted.accessibilityHint, "Zooms the map in", "the tooltip is no longer the hint by default")
        let named = try XCTUnwrap(elements.first { $0.accessibilityLabel == "Second floor" }, "no element for the named button")
        XCTAssertNil(named.accessibilityHint, "the tooltip repeats the label as a hint")
    }

    /// No safe areas, as the snapshot strategy's own window has none.
    private final class Window: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    @MainActor private func host(_ view: some View) async -> UIWindow {
        let window = Window(frame: CGRect(x: 0, y: 0, width: 320, height: 200))
        window.rootViewController = UIHostingController(rootView: view.frame(width: 320, height: 200))
        window.makeKeyAndVisible()
        for _ in 0..<10 {
            RunLoop.main.run(until: Date().addingTimeInterval(0.03))
            await Task.yield()
        }
        return window
    }

    /// The elements VoiceOver can land on under `node`, as UIKit hands
    /// SwiftUI's elements to it.
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

    // SwiftUI hands its elements to UIKit only while the accessibility
    // runtime is on, as KozmosManoeuvreCardTests sets out. Test-only: this
    // hook is never linked into the library.
    private static let accessibility = dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW)
    private func setAutomation(_ on: Int32) -> Int32? {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        guard let library = Self.accessibility,
              let get = dlsym(library, "_AXSAutomationEnabled"),
              let set = dlsym(library, "_AXSSetAutomationEnabled") else { return nil }
        let was = unsafeBitCast(get, to: Get.self)()
        unsafeBitCast(set, to: Set.self)(on)
        return was
    }
}
#endif
