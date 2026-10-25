import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// React's stepper marks its current step `aria-current="step"`, so a screen
/// reader hears which step the visitor is on. SwiftUI's said nothing of it:
/// VoiceOver walked each step's number and its name as separate words, the
/// current one like any other. Each step is now one element, its number and
/// name together, and the current step is selected, the platform's word for
/// the current item of a set, as the breadcrumb's current page is.
///
/// Three steps with the middle one current, so neither end can pass by
/// standing in for "the first" or "the last". Read with accessibility
/// automation on: without it, SwiftUI builds no accessibility tree in a unit
/// test.
final class KozmosStepperAccessibilityTests: XCTestCase {
    #if os(iOS)
    private static let steps = ["Search", "Route", "Go"]

    @MainActor func testEachStepIsOneElementAndOnlyTheCurrentOneIsSelected() async throws {
        try await inspect(KozmosStepper(steps: Self.steps, currentStep: 1).frame(width: 360)) { window in
            let elements = self.elements(window)
            let steps = try Self.steps.map { name -> NSObject in
                let found = elements.filter { ($0.accessibilityLabel ?? "").contains(name) }
                XCTAssertEqual(found.count, 1, "elements naming \(name); the tree:\n\(self.describe(window))")
                return try XCTUnwrap(found.first)
            }
            XCTAssertEqual(elements.count, 3, "the elements VoiceOver walks: \(elements.map { $0.accessibilityLabel ?? "-" })")
            XCTAssertEqual(steps.map { $0.accessibilityTraits.contains(.selected) }, [false, true, false],
                           "the selected trait; the tree:\n\(self.describe(window))")
            XCTAssertTrue((steps[1].accessibilityLabel ?? "").contains("2"), "the current step's number is not in its name")
        }
    }

    /// Past the last step every step is done, and none is current.
    @MainActor func testWhenEveryStepIsDoneNoneIsSelected() async throws {
        try await inspect(KozmosStepper(steps: Self.steps, currentStep: 3).frame(width: 360)) { window in
            XCTAssertFalse(self.elements(window).contains { $0.accessibilityTraits.contains(.selected) })
        }
    }

    // MARK: - Reading the tree

    @MainActor private func inspect<V: View>(_ view: V, check: (UIWindow) async throws -> Void) async throws {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get(); set(1); defer { set(old) }
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        try await check(window)
    }

    /// A node's children as VoiceOver walks them, or nil for an element or a hidden node.
    @MainActor private func children(_ node: NSObject) -> [NSObject]? {
        if node.accessibilityElementsHidden { return nil }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return nil }
        if node.isAccessibilityElement { return nil }
        if let values = node.accessibilityElements as? [NSObject], !values.isEmpty { return values }
        if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            return (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        }
        return (node as? UIView)?.subviews ?? []
    }

    /// Every element under `node`, in VoiceOver's order.
    @MainActor private func elements(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        return (children(node) ?? []).flatMap { elements($0) }
    }

    /// The tree, for a failure's message: each node's class, traits and name.
    @MainActor private func describe(_ node: NSObject, depth: Int = 0) -> String {
        let line = String(repeating: "  ", count: depth)
            + "\(type(of: node)) traits=\(node.accessibilityTraits.rawValue) element=\(node.isAccessibilityElement) label=\(node.accessibilityLabel ?? "-")"
        let below = (children(node) ?? []).map { describe($0, depth: depth + 1) }
        return ([line] + below).joined(separator: "\n")
    }
    #endif
}
