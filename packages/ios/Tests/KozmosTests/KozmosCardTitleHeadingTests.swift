import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// GAP-205: a card's title is a heading. React's `CardTitle` is an `h3` (or
/// the level `as` gives it), so a screen reader moves from card to card by
/// its title. SwiftUI's `KozmosCardTitle` was plain text, and VoiceOver's
/// headings rotor passed every card by. It now carries the header trait,
/// with no level and no new API.
///
/// The tree is read as VoiceOver reads it, with accessibility automation on:
/// without it, SwiftUI builds no accessibility tree in a unit test.
final class KozmosCardTitleHeadingTests: XCTestCase {
    #if os(iOS)
    private struct TwoCards: View {
        var body: some View {
            VStack(spacing: 16) {
                KozmosCard {
                    KozmosCardHeader {
                        KozmosCardTitle("Client details")
                        KozmosCardDescription("The client this site belongs to.")
                    }
                    KozmosCardContent { Text("Pointr") }
                }
                KozmosCard(padding: .compact) {
                    KozmosCardHeader {
                        KozmosCardTitle("Search")
                    }
                    KozmosCardFooter { Text("How visitors search") }
                }
            }
            .frame(width: 360)
        }
    }

    /// Each title is a heading, at either padding; the description, the
    /// content and the footer are not.
    @MainActor func testTheTitleIsAHeadingAndNothingElseIs() async throws {
        try await inspect(TwoCards()) { window in
            for title in ["Client details", "Search"] {
                let element = try self.element(named: title, in: window)
                XCTAssertTrue(element.accessibilityTraits.contains(.header),
                              "\(title) is not a heading; the tree:\n\(self.describe(window))")
            }
            for words in ["The client this site belongs to.", "Pointr", "How visitors search"] {
                let element = try self.element(named: words, in: window)
                XCTAssertFalse(element.accessibilityTraits.contains(.header),
                               "\(words) is a heading; the tree:\n\(self.describe(window))")
            }
            let headings = self.elements(window).filter { $0.accessibilityTraits.contains(.header) }
            XCTAssertEqual(headings.compactMap(\.accessibilityLabel), ["Client details", "Search"],
                           "the headings, in VoiceOver's order")
        }
    }

    /// Card.mdx's SwiftUI snippet (DocSnippets/TitledCard.swift), as a
    /// reader copies it: its title is a heading too.
    @MainActor func testTheDocSnippetsTitleIsAHeading() async throws {
        try await inspect(TitledCard().frame(width: 360)) { window in
            let title = try self.element(named: "Card Title", in: window)
            XCTAssertTrue(title.accessibilityTraits.contains(.header), "the tree:\n\(self.describe(window))")
        }
    }

    // MARK: - Reading the tree

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

    /// The tree, for a failure's message: each node's class, traits and name.
    @MainActor private func describe(_ node: NSObject, depth: Int = 0) -> String {
        let line = String(repeating: "  ", count: depth)
            + "\(type(of: node)) traits=\(node.accessibilityTraits.rawValue) element=\(node.isAccessibilityElement) label=\(node.accessibilityLabel ?? "-")"
        let below = (children(node) ?? []).map { describe($0, depth: depth + 1) }
        return ([line] + below).joined(separator: "\n")
    }
    #endif
}
