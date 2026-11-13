import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
import Accessibility
#endif
@testable import Kozmos

/// GAP-158 and GAP-162 (decision 132): a Checkbox's, a Switch's and a
/// radio's description is the control's custom content, spoken by default
/// after the name (VoiceOver's counterpart of React's `aria-describedby`)
/// and never part of the name; a Switch and a Checkbox say their state as
/// their value, in the caller's words, and from iOS 17 are toggles; a
/// Switch's drawn state words are not read a second time; a radio card or
/// tile is one radio, named by its title alone, its media and description no
/// part of the name, selected only when chosen.
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

    @MainActor func testACheckboxDescriptionIsReadNotItsName() async throws {
        try await inspect(Controls()) { window in
            let checkbox = try self.named(["Route updates"], in: window)[0]
            XCTAssertEqual(self.description(of: checkbox), "Tell me when a faster route opens", "\(type(of: checkbox)) protocol=\(checkbox is AXCustomContentProvider) property=\(checkbox.responds(to: NSSelectorFromString("accessibilityCustomContent"))) block=\(checkbox.responds(to: NSSelectorFromString("accessibilityCustomContentBlock"))); the tree:\n\(self.describe(window))")
            XCTAssertFalse(self.labels(window).contains { $0.contains("faster route") }, "the description is read as a name too; the tree:\n\(self.describe(window))")
        }
    }

    @MainActor func testASwitchDescriptionIsReadAndItsStateWordsAreNotReadTwice() async throws {
        try await inspect(Controls()) { window in
            let toggle = try self.named(["Gate alerts"], in: window)[0]
            XCTAssertEqual(self.description(of: toggle), "A notification when your gate changes", "the tree:\n\(self.describe(window))")
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
            XCTAssertEqual(radios.map { self.description(of: $0) ?? "" }, ["Drawn from map data", "Aerial imagery", "Cross-fades the floors", ""])
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

    /// A Switch and a Checkbox say their state: the caller's words as their
    /// value, and from iOS 17 the toggle trait. VoiceOver heard a name and
    /// nothing of on, off or checked.
    @MainActor func testASwitchAndACheckboxSayTheirState() async throws {
        try await inspect(Controls()) { window in
            let checkbox = try self.named(["Route updates"], in: window)[0]
            let toggle = try self.named(["Gate alerts"], in: window)[0]
            XCTAssertEqual(checkbox.accessibilityValue, "Unchecked", "the tree:\n\(self.describe(window))")
            XCTAssertEqual(toggle.accessibilityValue, "On", "the tree:\n\(self.describe(window))")
            if #available(iOS 17, *) {
                XCTAssertTrue(checkbox.accessibilityTraits.contains(.toggleButton), "the checkbox is no toggle")
                XCTAssertTrue(toggle.accessibilityTraits.contains(.toggleButton), "the switch is no toggle")
            }
            XCTAssertTrue(checkbox.accessibilityActivate())
            XCTAssertTrue(toggle.accessibilityActivate())
            try await Task.sleep(nanoseconds: 300_000_000)
            XCTAssertEqual(try self.named(["Route updates"], in: window)[0].accessibilityValue, "Checked")
            XCTAssertEqual(try self.named(["Gate alerts"], in: window)[0].accessibilityValue, "Off")
        }
    }

    /// A checked checkbox with no description is named by its label alone:
    /// its drawn checkmark is no part of the name ("Checkmark, Accept terms"),
    /// and its state is its value.
    @MainActor func testACheckedCheckboxIsNamedByItsLabelAlone() async throws {
        struct Ticked: View {
            @State var accepted = true
            var body: some View { KozmosCheckbox(checked: $accepted, label: "Accept terms") }
        }
        try await inspect(Ticked()) { window in
            XCTAssertFalse(self.labels(window).contains { $0.localizedCaseInsensitiveContains("checkmark") }, "the checkmark is read; the tree:\n\(self.describe(window))")
            let checkbox = try self.named(["Accept terms"], in: window)[0]
            XCTAssertEqual(checkbox.accessibilityValue, "Checked")
        }
    }

    /// The caller's words for the states.
    @MainActor func testTheStateWordsAreTheCallers() async throws {
        struct French: View {
            @State var on = true
            @State var ticked = false
            var body: some View {
                VStack {
                    KozmosSwitch(checked: $on, label: "Alertes", onLabel: "Activé", offLabel: "Désactivé")
                    KozmosCheckbox(checked: $ticked, label: "Mises à jour", checkedLabel: "Coché", uncheckedLabel: "Non coché")
                }
            }
        }
        try await inspect(French()) { window in
            XCTAssertEqual(try self.named(["Alertes", "Mises à jour"], in: window).map { $0.accessibilityValue ?? "" }, ["Activé", "Non coché"])
        }
    }

    /// GAP-158: a card with no title is never named by its description;
    /// a debug build is told, and an icon-only tile takes the caller's
    /// accessibilityLabel.
    @MainActor func testAnUntitledCardIsNotNamedByItsDescription() async throws {
        struct Untitled: View {
            @State var choice = "auto"
            var body: some View {
                KozmosRadioGroup {
                    KozmosRadioGroupItem(value: "auto", description: "Traced for you", variant: .card, selection: $choice)
                    KozmosRadioGroupItem(value: "fade", variant: .tile, selection: $choice) {
                        Image(systemName: "circle.lefthalf.filled")
                    }
                    .accessibilityLabel("Fade")
                }
            }
        }
        try await inspect(Untitled()) { window in
            let labels = self.labels(window)
            XCTAssertFalse(labels.contains { $0.contains("Traced") }, "named by its description; the tree:\n\(self.describe(window))")
            XCTAssertEqual(try self.named(["Fade"], in: window).count, 1)
        }
        XCTAssertNotNil(KozmosUntitledOption.warning(variant: .card, label: nil))
        XCTAssertNotNil(KozmosUntitledOption.warning(variant: .tile, label: ""))
        XCTAssertNil(KozmosUntitledOption.warning(variant: .tile, label: "Fade"))
        XCTAssertNil(KozmosUntitledOption.warning(variant: .default, label: nil))
    }

    /// GAP-158's layout: a tile is at least 96 tall, as React's min-h-24 and
    /// Figma's tile; a card fills the width it is offered, its media across
    /// the top adding the media's height and the 12 gap.
    @MainActor func testATileIsAtLeast96TallAndACardFillsItsWidth() throws {
        let selection = Binding.constant("vector")
        func size<V: View>(_ view: V, width: CGFloat) -> CGSize {
            UIHostingController(rootView: view).sizeThatFits(in: CGSize(width: width, height: .greatestFiniteMagnitude))
        }
        let tile = size(KozmosRadioGroupItem(value: "fade", label: "Fade", variant: .tile, selection: selection), width: 120)
        XCTAssertGreaterThanOrEqual(tile.height, 96)
        XCTAssertEqual(tile.width, 120, accuracy: 0.5, "a tile fills its cell")
        let bare = size(KozmosRadioGroupItem(value: "vector", label: "Vector", variant: .card, selection: selection), width: 300)
        let pictured = size(KozmosRadioGroupItem(value: "vector", label: "Vector", variant: .card, selection: selection) {
            Color.clear.frame(height: 80)
        }, width: 300)
        XCTAssertEqual(bare.width, 300, accuracy: 0.5, "a card fills its width")
        XCTAssertEqual(pictured.height - bare.height, 80 + 12, accuracy: 0.5, "the media sits above the ring, 12 apart")
    }

    /// The description VoiceOver reads after the name: high-importance
    /// custom content named "Description".
    @MainActor private func description(of element: NSObject) -> String? {
        customContent(of: element).first { $0.label == "Description" && $0.importance == .high }?.value
    }

    /// The element's custom content however it offers it: the protocol, the
    /// property by name, or iOS 17's block, which SwiftUI's elements use.
    @MainActor private func customContent(of element: NSObject) -> [AXCustomContent] {
        if let provider = element as? AXCustomContentProvider, let content = provider.accessibilityCustomContent {
            return content
        }
        if element.responds(to: NSSelectorFromString("accessibilityCustomContent")),
           let content = element.value(forKey: "accessibilityCustomContent") as? [AXCustomContent] {
            return content
        }
        if element.responds(to: NSSelectorFromString("accessibilityCustomContentBlock")),
           let block = element.value(forKey: "accessibilityCustomContentBlock") {
            typealias Block = @convention(block) () -> NSArray?
            let call = unsafeBitCast(block as AnyObject, to: Block.self)
            return (call() as? [AXCustomContent]) ?? []
        }
        return []
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
