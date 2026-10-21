import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// React's accordion trigger is Radix's: a button with `aria-expanded`, so a
/// screen reader hears whether its panel is open. SwiftUI's trigger was a
/// plain button, which VoiceOver heard as a name and nothing more. It now
/// says "collapsed" or "expanded" in the visitor's own language, through
/// UIKit's `accessibilityExpandedStatus` (iOS 18), which SwiftUI has no
/// modifier for.
///
/// Two items with the second open, so neither state can pass by being the
/// only one there. The tree is read as VoiceOver reads it, with
/// accessibility automation on: without it, SwiftUI builds no accessibility
/// tree in a unit test.
final class KozmosAccordionAccessibilityTests: XCTestCase {
    #if os(iOS)
    private struct Place: View {
        @State var open: String? = "access"

        var body: some View {
            KozmosAccordion {
                KozmosAccordionItem {
                    KozmosAccordionTrigger(value: "hours", title: "Opening hours", selection: $open)
                    KozmosAccordionContent(value: "hours", selection: $open) { Text("Nine to five") }
                }
                KozmosAccordionItem {
                    KozmosAccordionTrigger(value: "access", title: "Step-free access", selection: $open)
                    KozmosAccordionContent(value: "access", selection: $open) { Text("Lifts at both ends") }
                }
            }
            .frame(width: 360)
        }
    }

    private func requireExpandedStatus() throws {
        try XCTSkipUnless(ProcessInfo.processInfo.isOperatingSystemAtLeast(OperatingSystemVersion(majorVersion: 18, minorVersion: 0, patchVersion: 0)),
                          "UIKit reports an expanded status from iOS 18")
    }

    @MainActor func testEachTriggerSaysWhetherItsPanelIsOpen() async throws {
        try requireExpandedStatus()
        try await inspect(Place()) { window in
            let hours = try self.element(named: "Opening hours", in: window)
            let access = try self.element(named: "Step-free access", in: window)
            for trigger in [hours, access] {
                XCTAssertTrue(trigger.accessibilityTraits.contains(.button), "\(trigger.accessibilityLabel ?? "-") is no longer a button")
            }
            if #available(iOS 18.0, *) {
                XCTAssertEqual(hours.accessibilityExpandedStatus, .collapsed, "the closed trigger; the tree:\n\(self.describe(window))")
                XCTAssertEqual(access.accessibilityExpandedStatus, .expanded, "the open trigger; the tree:\n\(self.describe(window))")
            }
        }
    }

    /// VoiceOver's double tap still opens and closes the panel, and the
    /// status follows it.
    @MainActor func testActivatingATriggerMovesTheExpandedStatus() async throws {
        try requireExpandedStatus()
        try await inspect(Place()) { window in
            XCTAssertTrue(try self.element(named: "Opening hours", in: window).accessibilityActivate(), "VoiceOver cannot activate the trigger")
            try await Task.sleep(nanoseconds: 400_000_000)
            if #available(iOS 18.0, *) {
                XCTAssertEqual(try self.element(named: "Opening hours", in: window).accessibilityExpandedStatus, .expanded)
                XCTAssertEqual(try self.element(named: "Step-free access", in: window).accessibilityExpandedStatus, .collapsed)
            }
            XCTAssertTrue(self.elements(window).contains { $0.accessibilityLabel == "Nine to five" }, "the panel did not open")
            XCTAssertFalse(self.elements(window).contains { $0.accessibilityLabel == "Lifts at both ends" }, "the other panel did not close")

            XCTAssertTrue(try self.element(named: "Opening hours", in: window).accessibilityActivate())
            try await Task.sleep(nanoseconds: 400_000_000)
            if #available(iOS 18.0, *) {
                XCTAssertEqual(try self.element(named: "Opening hours", in: window).accessibilityExpandedStatus, .collapsed, "the panel did not close")
            }
            XCTAssertFalse(self.elements(window).contains { $0.accessibilityLabel == "Nine to five" })
        }
    }

    /// The information panel's questions are accordion triggers: each says
    /// its state once, through the trigger, and the panel adds no element of
    /// its own. It put its `collapsedLabel` on the trigger as a value, which
    /// also landed on the rule under it: an unnamed element that said
    /// "Collapsed".
    @MainActor func testTheInformationPanelsQuestionsSayTheirStateOnce() async throws {
        try requireExpandedStatus()
        let content = KozmosMapInfoContent(title: "About this map", introduction: nil,
                                           faqs: [.init(id: "floors", question: "How do I change floors?", answer: "Open the floor selector.")])
        try await inspect(KozmosMapInfoPanel(content: content, onClose: {})) { window in
            let question = try self.element(named: "How do I change floors?", in: window)
            XCTAssertTrue(question.accessibilityTraits.contains(.button))
            if #available(iOS 18.0, *) {
                XCTAssertEqual(question.accessibilityExpandedStatus, .collapsed, "the tree:\n\(self.describe(window))")
            }
            XCTAssertNil(question.accessibilityValue, "the state said twice, as a value too")
            let unnamed = self.elements(window).filter { ($0.accessibilityLabel ?? "").isEmpty }
            XCTAssertTrue(unnamed.isEmpty, "elements with no name; the tree:\n\(self.describe(window))")
        }
    }

    /// A product's UI tests find the trigger by its identifier, as XCUITest
    /// looks one up: `app.buttons["faq-floors"]`. From iOS 18 VoiceOver and
    /// XCUITest read the UIKit element over the trigger, which a SwiftUI
    /// `.accessibilityIdentifier` on the trigger never reaches, so the
    /// trigger takes the identifier itself and sets it on whichever element
    /// is read: the UIKit element from iOS 18, the button before.
    @MainActor func testUITestsFindTheTriggerByItsIdentifier() async throws {
        try requireExpandedStatus()
        struct Identified: View {
            @State var open: String? = nil
            var body: some View {
                KozmosAccordion {
                    KozmosAccordionItem {
                        KozmosAccordionTrigger(value: "floors", title: "How do I change floors?", selection: $open,
                                               accessibilityIdentifier: "faq-floors")
                        KozmosAccordionContent(value: "floors", selection: $open) { Text("Open the floor selector.") }
                    }
                    KozmosAccordionItem {
                        KozmosAccordionTrigger(value: "lifts", title: "Where are the lifts?", selection: $open)
                    }
                }
                .frame(width: 360)
            }
        }
        try await inspect(Identified()) { window in
            let found = self.elements(window).filter { self.identifier(of: $0) == "faq-floors" }
            XCTAssertEqual(found.count, 1, "elements with the identifier; the tree:\n\(self.describe(window))")
            let trigger = try XCTUnwrap(found.first)
            XCTAssertEqual(trigger.accessibilityLabel, "How do I change floors?")
            XCTAssertTrue(trigger.accessibilityTraits.contains(.button))
            if #available(iOS 18.0, *) {
                XCTAssertEqual(trigger.accessibilityExpandedStatus, .collapsed)
            }
            // A trigger given none has none.
            let lifts = try self.element(named: "Where are the lifts?", in: window)
            XCTAssertEqual(self.identifier(of: lifts) ?? "", "")
        }
    }

    // MARK: - Reading the tree

    /// A node's accessibility identifier, as XCUITest reads it: a view's, or
    /// a SwiftUI element's, whichever the node is.
    @MainActor private func identifier(of node: NSObject) -> String? {
        let getter = NSSelectorFromString("accessibilityIdentifier")
        guard node.responds(to: getter) else { return nil }
        return node.perform(getter)?.takeUnretainedValue() as? String
    }

    /// The one element named `label`; fails, with the tree, if not exactly one.
    @MainActor private func element(named label: String, in window: UIWindow) throws -> NSObject {
        let found = elements(window).filter { $0.accessibilityLabel == label }
        XCTAssertEqual(found.count, 1, "elements named \(label); the tree:\n\(describe(window))")
        return try XCTUnwrap(found.first, "no element named \(label)")
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

    /// The tree, for a failure's message: each node's class, traits, name, value and expanded status.
    @MainActor private func describe(_ node: NSObject, depth: Int = 0) -> String {
        var status = ""
        if #available(iOS 18.0, *) { status = " expanded=\(node.accessibilityExpandedStatus.rawValue)" }
        let line = String(repeating: "  ", count: depth)
            + "\(type(of: node)) traits=\(node.accessibilityTraits.rawValue) element=\(node.isAccessibilityElement) label=\(node.accessibilityLabel ?? "-") value=\(node.accessibilityValue ?? "-")\(status) id=\(identifier(of: node) ?? "-")"
        let below = (children(node) ?? []).map { describe($0, depth: depth + 1) }
        return ([line] + below).joined(separator: "\n")
    }
    #endif
}
