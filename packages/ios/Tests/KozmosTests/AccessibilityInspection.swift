#if os(iOS)
import Darwin
import SwiftUI
import UIKit
import XCTest

/// Reads what VoiceOver is given: `view` hosted in a window with
/// accessibility automation on, without which SwiftUI builds no
/// accessibility tree in a unit test. The parts' own tests each kept a copy
/// of this; the 0.16.0 native props' tests share this one.
extension XCTestCase {
    @MainActor func inspectAccessibility<V: View>(
        _ view: V,
        size: CGSize = CGSize(width: 390, height: 844),
        check: (UIWindow) async throws -> Void
    ) async throws {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get(); set(1); defer { set(old) }
        let window = UIWindow(frame: CGRect(origin: .zero, size: size))
        window.rootViewController = UIHostingController(rootView: view.frame(width: size.width, height: size.height))
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        try await check(window)
    }

    /// A node's children as VoiceOver walks them, or nil for an element or a hidden node.
    @MainActor func accessibilityChildren(_ node: NSObject) -> [NSObject]? {
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
    @MainActor func accessibilityElements(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        return (accessibilityChildren(node) ?? []).flatMap { accessibilityElements($0) }
    }

    /// Every node under `node`, containers too, in VoiceOver's order.
    @MainActor func accessibilityNodes(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        return [node] + (accessibilityChildren(node) ?? []).flatMap { accessibilityNodes($0) }
    }

    /// The one element named `label`.
    @MainActor func accessibilityElement(named label: String, in window: UIWindow) throws -> NSObject {
        let found = accessibilityElements(window).filter { $0.accessibilityLabel == label }
        XCTAssertEqual(found.count, 1, "elements named \(label); the tree:\n\(describeAccessibility(window))")
        return try XCTUnwrap(found.first, "no element named \(label)")
    }

    /// The tree, for a failure's message: each node's class, traits and name.
    @MainActor func describeAccessibility(_ node: NSObject, depth: Int = 0) -> String {
        let line = String(repeating: "  ", count: depth)
            + "\(type(of: node)) traits=\(node.accessibilityTraits.rawValue) element=\(node.isAccessibilityElement) label=\(node.accessibilityLabel ?? "-")"
        let below = (accessibilityChildren(node) ?? []).map { describeAccessibility($0, depth: depth + 1) }
        return ([line] + below).joined(separator: "\n")
    }
}
#endif
