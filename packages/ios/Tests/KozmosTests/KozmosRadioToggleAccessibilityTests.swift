import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// React's radio is Radix's, `role="radio"` with `aria-checked`, and its
/// toggle button is Radix's Toggle, a button with `aria-pressed`: a screen
/// reader hears which radio is chosen and whether the toggle is on.
/// SwiftUI's were plain buttons, so VoiceOver heard the name and nothing of
/// the state, which only the dot and the fill showed. The chosen radio and a
/// toggle that is on are now selected, the trait VoiceOver says as
/// "selected" in the visitor's language, as the chip's `aria-pressed` and
/// the tabs' `aria-selected` already are.
///
/// Three radios with the middle one chosen, so neither end can pass by
/// standing in for "the first" or "the last". The tree is read with
/// accessibility automation on: without it, SwiftUI builds no accessibility
/// tree in a unit test.
final class KozmosRadioToggleAccessibilityTests: XCTestCase {
    #if os(iOS)
    private static let floors = ["Ground", "First", "Second"]

    private struct Floors: View {
        @State var selection = "First"
        var body: some View {
            KozmosRadioGroup {
                ForEach(KozmosRadioToggleAccessibilityTests.floors, id: \.self) { floor in
                    KozmosRadioGroupItem(value: floor, label: floor, selection: $selection)
                }
            }
        }
    }

    private struct Toggles: View {
        @State var stepFree = true
        @State var quiet = false
        var body: some View {
            VStack {
                KozmosToggleButton(isOn: $stepFree, label: "Step-free")
                KozmosToggleButton(isOn: $quiet, label: "Quiet route", variant: .outline)
            }
        }
    }

    @MainActor func testOnlyTheChosenRadioIsSelected() async throws {
        try await inspect(Floors()) { window in
            let radios = try self.named(Self.floors, in: window)
            XCTAssertEqual(radios.map { $0.accessibilityTraits.contains(.selected) }, [false, true, false],
                           "the selected trait; the tree:\n\(self.describe(window))")
            XCTAssertTrue(radios.allSatisfy { $0.accessibilityTraits.contains(.button) }, "a radio is no longer a button")
        }
    }

    /// VoiceOver's double tap chooses a radio, and the trait follows it.
    @MainActor func testActivatingARadioMovesTheSelection() async throws {
        try await inspect(Floors()) { window in
            XCTAssertTrue(try self.named(["Second"], in: window)[0].accessibilityActivate())
            try await Task.sleep(nanoseconds: 300_000_000)
            XCTAssertEqual(try self.named(Self.floors, in: window).map { $0.accessibilityTraits.contains(.selected) }, [false, false, true])
        }
    }

    @MainActor func testAToggleThatIsOnIsSelected() async throws {
        try await inspect(Toggles()) { window in
            let toggles = try self.named(["Step-free", "Quiet route"], in: window)
            XCTAssertEqual(toggles.map { $0.accessibilityTraits.contains(.selected) }, [true, false],
                           "the selected trait; the tree:\n\(self.describe(window))")
            XCTAssertTrue(toggles.allSatisfy { $0.accessibilityTraits.contains(.button) }, "a toggle is no longer a button")
        }
    }

    /// VoiceOver's double tap turns the toggle on and off, and the trait follows.
    @MainActor func testActivatingAToggleTurnsItOnAndOff() async throws {
        try await inspect(Toggles()) { window in
            XCTAssertTrue(try self.named(["Quiet route"], in: window)[0].accessibilityActivate())
            try await Task.sleep(nanoseconds: 300_000_000)
            XCTAssertTrue(try self.named(["Quiet route"], in: window)[0].accessibilityTraits.contains(.selected), "the toggle did not turn on")
            XCTAssertTrue(try self.named(["Step-free"], in: window)[0].accessibilityActivate())
            try await Task.sleep(nanoseconds: 300_000_000)
            XCTAssertFalse(try self.named(["Step-free"], in: window)[0].accessibilityTraits.contains(.selected), "the toggle did not turn off")
        }
    }

    // MARK: - Reading the tree

    /// The elements named `labels`, in that order, each found once.
    @MainActor private func named(_ labels: [String], in window: UIWindow) throws -> [NSObject] {
        let all = elements(window)
        return try labels.map { label in
            let found = all.filter { $0.accessibilityLabel == label }
            XCTAssertEqual(found.count, 1, "elements named \(label); the tree:\n\(describe(window))")
            return try XCTUnwrap(found.first, "no element named \(label)")
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
