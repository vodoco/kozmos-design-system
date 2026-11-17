import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// GAP-221, decision 199: DescriptionList, a label over its value with no
/// field chrome: MAP-619's Read-Only view. A value is text, a yes/no said in
/// words, or any view (tags); an item can carry a trailing action, such as
/// Copy. Items stack or sit side by side. VoiceOver hears each item as one
/// element, its label then its value; the action is its own element.
final class KozmosDescriptionListTests: XCTestCase {
    func testAYesOrNoIsSaidInWords() {
        XCTAssertEqual(KozmosDescriptionListItem<Text, EmptyView>(label: "Featured", isOn: true).valueWords, "Yes")
        XCTAssertEqual(KozmosDescriptionListItem<Text, EmptyView>(label: "Featured", isOn: false).valueWords, "No")
        XCTAssertEqual(KozmosDescriptionListItem<Text, EmptyView>(label: "Visible", isOn: true, yesLabel: "Shown", noLabel: "Hidden").valueWords, "Shown")
        XCTAssertEqual(KozmosDescriptionListItem<Text, EmptyView>(label: "Name", value: "Bean & Leaf Café").valueWords, "Bean & Leaf Café")
    }

    func testTheLayoutsAndTheirSpacing() {
        XCTAssertEqual(KozmosDescriptionList<EmptyView>.itemSpacing, KozmosDimensions.primitivesLayoutSpacing200)
        XCTAssertEqual(KozmosDescriptionListItem<Text, EmptyView>.labelSpacing, KozmosDimensions.primitivesLayoutSpacing50)
        _ = KozmosDescriptionList(layout: .row) {
            KozmosDescriptionListItem(label: "Name", value: "Bean & Leaf Café")
        }
    }

    #if os(iOS)
    private struct Details: View {
        var body: some View {
            KozmosDescriptionList {
                KozmosDescriptionListItem(label: "Name", value: "Bean & Leaf Café")
                KozmosDescriptionListItem(label: "Featured", isOn: true)
                KozmosDescriptionListItem(label: "FID", value: "f-1042") {
                    KozmosIconButton(iconName: "doc.on.doc") {}
                        .accessibilityLabel("Copy FID")
                }
            }
        }
    }

    @MainActor func testEachItemIsHeardAsItsLabelThenItsValueAndTheActionApart() async throws {
        try await inspect(Details()) { window in
            let all = self.elements(window)
            let describe = all.map { "\($0.accessibilityLabel ?? "-") = \($0.accessibilityValue ?? "-")" }.joined(separator: "\n")
            for (label, value) in [("Name", "Bean & Leaf Café"), ("Featured", "Yes"), ("FID", "f-1042")] {
                let found = all.filter { $0.accessibilityLabel == label }
                XCTAssertEqual(found.count, 1, "elements named \(label):\n\(describe)")
                XCTAssertEqual(found.first?.accessibilityValue, value, "\(label)'s value:\n\(describe)")
            }
            XCTAssertEqual(all.filter { $0.accessibilityLabel == "Copy FID" }.count, 1, "the action is not its own element:\n\(describe)")
            XCTAssertFalse(all.contains { $0.accessibilityLabel == "Bean & Leaf Café" }, "a value was read as a name of its own:\n\(describe)")
        }
    }

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

    @MainActor private func elements(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        return (children(node) ?? []).flatMap { elements($0) }
    }
    #endif
}
