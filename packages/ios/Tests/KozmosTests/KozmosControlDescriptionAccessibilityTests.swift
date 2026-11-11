import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// GAP-158 and GAP-162 (decision 132): a Checkbox's, a Switch's and a
/// radio's description is the control's hint, VoiceOver's counterpart of
/// React's `aria-describedby`, read after the name and never part of it; a
/// Switch's state words are drawn for the eye and not read again; a radio
/// card or tile is one radio, named by its title alone, its media and
/// description no part of the name, selected only when chosen.
///
/// The tree is read with accessibility automation on, as
/// KozmosRadioToggleAccessibilityTests reads it.
final class KozmosControlDescriptionAccessibilityTests: XCTestCase {
    #if os(iOS)
    private struct Controls: View {
        @State var updates = false
        @State var alerts = true
        var body: some View {
            VStack {
                KozmosCheckbox(checked: $updates, label: "Route updates", description: "Tell me when a faster route opens")
                KozmosSwitch(checked: $alerts, label: "Gate alerts", description: "A notification when your gate changes", showStateLabel: true)
            }
        }
    }

    private struct Choices: View {
        @State var style = "satellite"
        @State var transition = "fade"
        var body: some View {
            VStack {
                KozmosRadioGroup {
                    KozmosRadioGroupItem(value: "vector", label: "Vector", description: "Drawn from map data", variant: .card, selection: $style) {
                        Image(systemName: "map")
                    }
                    KozmosRadioGroupItem(value: "satellite", label: "Satellite", description: "Aerial imagery", variant: .card, selection: $style) {
                        Image(systemName: "globe")
                    }
                }
                KozmosRadioGroup {
                    HStack {
                        KozmosRadioGroupItem(value: "fade", label: "Fade", description: "Cross-fades the floors", variant: .tile, selection: $transition) {
                            Image(systemName: "circle.lefthalf.filled")
                        }
                        KozmosRadioGroupItem(value: "slide", label: "Slide", variant: .tile, selection: $transition) {
                            Image(systemName: "arrow.right")
                        }
                    }
                }
            }
        }
    }

    @MainActor func testACheckboxDescriptionIsItsHintNotItsName() async throws {
        try await inspect(Controls()) { window in
            let checkbox = try self.named(["Route updates"], in: window)[0]
            XCTAssertEqual(checkbox.accessibilityHint, "Tell me when a faster route opens", "the tree:\n\(self.describe(window))")
            XCTAssertFalse(self.labels(window).contains { $0.contains("faster route") }, "the description is read as a name too; the tree:\n\(self.describe(window))")
        }
    }

    @MainActor func testASwitchDescriptionIsItsHintAndItsStateWordsAreNotRead() async throws {
        try await inspect(Controls()) { window in
            let toggle = try self.named(["Gate alerts"], in: window)[0]
            XCTAssertEqual(toggle.accessibilityHint, "A notification when your gate changes", "the tree:\n\(self.describe(window))")
            let labels = self.labels(window)
            XCTAssertFalse(labels.contains { $0.contains("gate changes") }, "the description is read as a name too; the tree:\n\(self.describe(window))")
            XCTAssertFalse(labels.contains { $0 == "On" || $0 == "Off" || $0.contains("On,") || $0.hasSuffix(" On") }, "the state words are read; the tree:\n\(self.describe(window))")
        }
    }

    @MainActor func testARadioCardAndTileAreEachOneRadioNamedByItsTitle() async throws {
        try await inspect(Choices()) { window in
            let titles = ["Vector", "Satellite", "Fade", "Slide"]
            let radios = try self.named(titles, in: window)
            XCTAssertEqual(radios.map { $0.accessibilityTraits.contains(.selected) }, [false, true, true, false],
                           "the selected trait; the tree:\n\(self.describe(window))")
            XCTAssertEqual(radios.map { $0.accessibilityHint ?? "" }, ["Drawn from map data", "Aerial imagery", "Cross-fades the floors", ""])
            XCTAssertTrue(radios.allSatisfy { $0.accessibilityTraits.contains(.button) }, "a radio is no longer a button")
            // The media and the descriptions are no element and no name of their own.
            XCTAssertEqual(self.elements(window).count, titles.count, "more elements than radios; the tree:\n\(self.describe(window))")
        }
    }

    /// VoiceOver's double tap chooses a card, and the trait follows it.
    @MainActor func testActivatingARadioCardMovesTheSelection() async throws {
        try await inspect(Choices()) { window in
            XCTAssertTrue(try self.named(["Vector"], in: window)[0].accessibilityActivate())
            try await Task.sleep(nanoseconds: 300_000_000)
            XCTAssertEqual(try self.named(["Vector", "Satellite"], in: window).map { $0.accessibilityTraits.contains(.selected) }, [true, false])
        }
    }

    @MainActor private func labels(_ window: UIWindow) -> [String] {
        elements(window).compactMap { $0.accessibilityLabel }
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
