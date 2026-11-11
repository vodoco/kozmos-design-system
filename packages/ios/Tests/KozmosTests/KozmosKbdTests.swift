import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// `KozmosKbd` (GAP-156): one key or a combination, drawn as key caps and
/// read by the key's name. Done when the hint draws Esc as a key and
/// VoiceOver reads "Escape".
final class KozmosKbdTests: XCTestCase {
    /// Words in any case, symbols exactly; any other key as written.
    func testTheSpokenNames() {
        let expected: [String: String] = [
            "Esc": "Escape", "ESC": "Escape", "ctrl": "Control", "Cmd": "Command", "⌘": "Command",
            "Opt": "Option", "⌥": "Option", "⇧": "Shift", "⌃": "Control", "↵": "Enter", "⏎": "Enter",
            "⌫": "Backspace", "Bksp": "Backspace", "Del": "Delete", "⌦": "Delete", "⇥": "Tab",
            "↑": "Up arrow", "↓": "Down arrow", "←": "Left arrow", "→": "Right arrow",
            "PgUp": "Page up", "PgDn": "Page down", "␣": "Space", "Ins": "Insert", "⇪": "Caps lock",
            "Win": "Windows", "F5": "F5", "K": "K", "Enter": "Enter",
        ]
        let spoken = Dictionary(uniqueKeysWithValues: expected.keys.map { ($0, KozmosKbd.spokenName($0)) })
        XCTAssertEqual(spoken, expected)
    }

    #if os(iOS)
    @MainActor func testEscIsOneElementReadEscape() async throws {
        try await MenusAXTree.inspect(KozmosKbd("Esc")) { window in
            let found = MenusAXTree.elements(window)
            XCTAssertEqual(found.map { $0.accessibilityLabel ?? "-" }, ["Escape"], "the tree:\n\(MenusAXTree.describe(window))")
        }
    }

    @MainActor func testACombinationIsReadByItsKeysNamesJoinedWithPlus() async throws {
        try await MenusAXTree.inspect(KozmosKbd(keys: ["Ctrl", "C"])) { window in
            XCTAssertEqual(MenusAXTree.elements(window).map { $0.accessibilityLabel ?? "-" }, ["Control+C"])
        }
        try await MenusAXTree.inspect(KozmosKbd(keys: ["⌘", "⇧", "P"])) { window in
            XCTAssertEqual(MenusAXTree.elements(window).map { $0.accessibilityLabel ?? "-" }, ["Command+Shift+P"])
        }
    }

    @MainActor func testTheLabelReplacesWhatIsRead() async throws {
        try await MenusAXTree.inspect(KozmosKbd(keys: ["Ctrl", "C"], label: "Kopieren")) { window in
            XCTAssertEqual(MenusAXTree.elements(window).map { $0.accessibilityLabel ?? "-" }, ["Kopieren"], "the tree:\n\(MenusAXTree.describe(window))")
        }
    }

    /// Kbd.mdx's snippet, DocSnippets/ClearSearchHint.swift: its key reads "Escape".
    @MainActor func testTheDocsSnippetReadsTheKeyByItsName() async throws {
        try await MenusAXTree.inspect(ClearSearchHint()) { window in
            XCTAssertEqual(MenusAXTree.elements(window).map { $0.accessibilityLabel ?? "-" }, ["Press", "Escape", "to clear"])
        }
    }

    /// A cap is React's h-5 min-w-5: 20 tall, at least 20 wide, at the
    /// default text size.
    @MainActor func testACapIs20PointsTall() {
        let host = UIHostingController(rootView: KozmosKbd("K").environment(\.dynamicTypeSize, .large))
        let size = host.sizeThatFits(in: CGSize(width: 400, height: 400))
        XCTAssertEqual(size.height, 20, accuracy: 0.5)
        XCTAssertGreaterThanOrEqual(size.width, 19.5)
    }
    #endif
}

#if os(iOS)
/// What VoiceOver walks, read with accessibility automation on, without
/// which SwiftUI builds no accessibility tree in a unit test. As
/// KozmosLinkExternalTests reads it.
enum MenusAXTree {
    @MainActor static func inspect<V: View>(_ view: V, check: (UIWindow) async throws -> Void) async throws {
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
        // The tree is built a little after the first layout, later under a
        // busy simulator: wait for it, up to two seconds.
        try await Task.sleep(nanoseconds: 300_000_000)
        for _ in 0..<17 where elements(window).isEmpty {
            try await Task.sleep(nanoseconds: 100_000_000)
        }
        try await check(window)
    }

    @MainActor static func children(_ node: NSObject) -> [NSObject]? {
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
    @MainActor static func elements(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        return (children(node) ?? []).flatMap { elements($0) }
    }

    @MainActor static func describe(_ node: NSObject, depth: Int = 0) -> String {
        let line = String(repeating: "  ", count: depth)
            + "\(type(of: node)) traits=\(node.accessibilityTraits.rawValue) element=\(node.isAccessibilityElement) label=\(node.accessibilityLabel ?? "-") hint=\(node.accessibilityHint ?? "-")"
        let below = (children(node) ?? []).map { describe($0, depth: depth + 1) }
        return ([line] + below).joined(separator: "\n")
    }
}
#endif
