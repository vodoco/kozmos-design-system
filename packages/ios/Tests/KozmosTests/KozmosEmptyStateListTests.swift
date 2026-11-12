import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-165: "No Map Content Found" lists what to try under its description,
/// read in order, as React's and Compose's lists are.
final class KozmosEmptyStateListTests: XCTestCase {
    private let tries = ["Check the level", "Clear the filters", "Try another name"]

    func testTheListIsKeptInItsOrder() {
        let view = KozmosEmptyState(title: "No Map Content Found", list: tries, listLabel: "What to try")
        XCTAssertEqual(view.list, tries)
        XCTAssertEqual(view.listLabel, "What to try")
        XCTAssertEqual(KozmosEmptyState(title: "No Map Content Found").list, [])
    }

    #if os(iOS)
    @MainActor func testTheItemsAreReadInOrderAfterTheDescription() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        for items in [tries, []] {
            let view = KozmosEmptyState(
                title: "No Map Content Found",
                description: "Nothing on this level matches.",
                list: items,
                listLabel: "What to try"
            )
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 600))
            window.rootViewController = UIHostingController(rootView: view)
            window.makeKeyAndVisible()
            defer { window.isHidden = true }
            try await Task.sleep(nanoseconds: 300_000_000)
            let said = elements(in: window).compactMap(\.accessibilityLabel)
            XCTAssertEqual(said, ["No Map Content Found", "Nothing on this level matches."] + items)
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
    #endif
}
