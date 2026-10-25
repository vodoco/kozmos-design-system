#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-182: the card's close button had no name of its own, only its
/// symbol's, which the system says in the reader's language ("Close",
/// "Schließen"). It is named by `closeLabel`, as Compose's is; left out, it
/// keeps the symbol's own name, so a product that passes nothing loses no
/// language. Read from the accessibility tree VoiceOver walks, in a window on
/// the simulator; run with `-testLanguage de` too.
final class KozmosPOICardCloseLabelTests: XCTestCase {
    private final class TestWindow: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    /// The close button's spoken name, and every other label the card gives VoiceOver.
    @MainActor private func read<Content: View>(@ViewBuilder _ content: () -> Content) async throws -> (close: String?, all: [String]) {
        let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 400))
        window.rootViewController = UIHostingController(rootView: content().environment(\.colorScheme, .light))
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 350_000_000)
        let shown = elements(in: window)
        let close = shown.first { $0.accessibilityTraits.contains(.button) }
        return (close?.accessibilityLabel, shown.compactMap(\.accessibilityLabel))
    }

    @MainActor func testTheCloseButtonSaysAProductsOwnWord() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let read = try await read { KozmosPOICard(title: "Atrium Café", closeLabel: "Schließen", onClose: {}) }
        XCTAssertEqual(read.close, "Schließen", "\(read.all)")
    }

    @MainActor func testLeftOutTheCloseButtonKeepsItsSymbolsNameInTheReadersLanguage() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let card = try await read { KozmosPOICard(title: "Atrium Café", onClose: {}) }
        let symbol = try await read { Button {} label: { Image(systemName: "xmark.circle.fill") } }
        XCTAssertNotNil(card.close, "\(card.all)")
        // "Close" in English; "Schließen" with `-testLanguage de -testRegion DE`.
        XCTAssertEqual(card.close, symbol.close, "\(card.all)")
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

    // Activate the simulator accessibility tree, as the other hosted AX tests do.
    // This test-only hook is never linked into the library.
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
}
#endif
