import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// `KozmosLink`'s `external` (GAP-202, decision 122): a link that leaves the
/// app draws Pointr's new-tab icon, `link-external-01`, at its end, in its
/// colour and the body text's size, and says where it goes as VoiceOver's
/// hint, "Opens in your browser", or the product's words. A link without
/// `external` is drawn and read as before.
///
/// Drawn hosted, as on a device; the tree is read with accessibility
/// automation on, without which SwiftUI builds no accessibility tree in a
/// unit test.
final class KozmosLinkExternalTests: XCTestCase {
    #if os(iOS)
    private let size = CGSize(width: 320, height: 120)
    private let destination = URL(string: "https://example.com/privacy")!

    // MARK: What VoiceOver hears

    @MainActor func testAnExternalLinkIsOneLinkWithItsNameAndTheHint() async throws {
        try await inspect(KozmosLink("Privacy Policy", destination: destination, external: true)) { window in
            let found = self.elements(window)
            XCTAssertEqual(found.count, 1, "one element, the icon hidden; the tree:\n\(self.describe(window))")
            let link = try XCTUnwrap(found.first)
            XCTAssertEqual(link.accessibilityLabel, "Privacy Policy")
            XCTAssertTrue(link.accessibilityTraits.contains(.link), "a link")
            XCTAssertEqual(link.accessibilityHint, "Opens in your browser")
        }
    }

    @MainActor func testTheHintIsTheProductsOwnWords() async throws {
        try await inspect(KozmosLink(
            "Datenschutz", destination: destination, external: true,
            externalLabel: "Öffnet sich in deinem Browser"
        )) { window in
            let link = try XCTUnwrap(self.elements(window).first)
            XCTAssertEqual(link.accessibilityLabel, "Datenschutz")
            XCTAssertEqual(link.accessibilityHint, "Öffnet sich in deinem Browser")
        }
    }

    /// The guard: a link that stays in the app has no hint.
    @MainActor func testALinkThatStaysHasNoHint() async throws {
        try await inspect(KozmosLink("Browse venues", destination: destination)) { window in
            let found = self.elements(window)
            XCTAssertEqual(found.count, 1, "the tree:\n\(self.describe(window))")
            XCTAssertEqual(found.first?.accessibilityLabel, "Browse venues")
            XCTAssertTrue(found.first?.accessibilityTraits.contains(.link) ?? false, "a link")
            XCTAssertNil(found.first?.accessibilityHint.flatMap { $0.isEmpty ? nil : $0 })
        }
    }

    // MARK: What it draws

    private func scene(external: Bool, _ direction: LayoutDirection, _ type: DynamicTypeSize = .large) -> some View {
        KozmosLink("Privacy Policy", destination: destination, external: external)
            .padding(.horizontal, 16)
            .frame(width: size.width, height: size.height, alignment: .leading)
            .background(Color.white)
            .environment(\.layoutDirection, direction)
            .environment(\.colorScheme, .light)
            .environment(\.dynamicTypeSize, type)
    }

    @MainActor private func render<V: View>(_ view: V, _ name: String) async throws -> RenderedPixels {
        let pixels = try await RenderedPixels.render(view, size: size)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        return pixels
    }

    /// The box around every one of `rects`; nil for none.
    private static func union(_ rects: [CGRect]) -> CGRect? {
        rects.dropFirst().reduce(rects.first) { box, rect in box?.union(rect) }
    }

    /// The theme-coloured shapes the link draws, its letters and its icon.
    private func ink(_ pixels: RenderedPixels) -> [CGRect] {
        pixels.shapes(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isTheme)
    }

    /// The icon's box: the theme-coloured ink the external link draws beyond
    /// the plain one's words, at its end.
    @MainActor private func icon(_ direction: LayoutDirection, _ type: DynamicTypeSize = .large) async throws -> (box: CGRect?, words: CGRect?, drawn: RenderedPixels) {
        let name = "gap-202-link-\(direction == .leftToRight ? "ltr" : "rtl")-\(type)"
        let plain = try await render(scene(external: false, direction, type), "\(name)-plain")
        let drawn = try await render(scene(external: true, direction, type), "\(name)-external")
        let words = Self.union(ink(plain))
        let all = Self.union(ink(drawn))
        guard let words, let all else { return (nil, words, drawn) }
        // The external link's words are the plain one's, moved over by the
        // icon in right to left; the icon is what lies past them.
        let beyond: CGRect
        if direction == .leftToRight {
            let start = all.minX + words.width + 1
            beyond = CGRect(x: start, y: 0, width: size.width - start, height: size.height)
        } else {
            beyond = CGRect(x: 0, y: 0, width: all.maxX - words.width - 1, height: size.height)
        }
        let box = drawn.boundingBox(in: beyond, where: RenderedPixels.isTheme)
        return (box, CGRect(x: direction == .leftToRight ? all.minX : all.maxX - words.width, y: words.minY, width: words.width, height: words.height), drawn)
    }

    /// The icon follows the words, in the theme colour, about a capital's
    /// height (Pointr's outline spans 3 to 21 of its 24, and its stroke one
    /// more each side: 20 of 24, so 14.17 of 17), level with them.
    @MainActor func testTheIconFollowsTheWordsInTheirColourAndSize() async throws {
        let (box, words, _) = try await icon(.leftToRight)
        let glyph = try XCTUnwrap(box, "no icon after the words")
        let text = try XCTUnwrap(words)
        print("GAP-202 iOS, left to right: words \(text), icon \(glyph)")
        XCTAssertGreaterThan(glyph.minX - text.maxX, 2, "a gap after the words")
        XCTAssertLessThan(glyph.minX - text.maxX, 10, "the icon is by the words")
        XCTAssertEqual(glyph.height, 17 * 20 / 24, accuracy: 1, "the outline at the body text's size")
        XCTAssertEqual(glyph.width, 17 * 20 / 24, accuracy: 1)
        XCTAssertLessThan(abs(glyph.midY - text.midY), 3, "level with the words")
    }

    /// Right to left it sits at the words' end, their left, and points to
    /// it: the arrow's head, its topmost ink, is at the icon's left.
    @MainActor func testRightToLeftTheIconIsAtTheEndAndMirrored() async throws {
        let (ltrBox, _, ltr) = try await icon(.leftToRight)
        let (rtlBox, rtlWords, rtl) = try await icon(.rightToLeft)
        let start = try XCTUnwrap(ltrBox), end = try XCTUnwrap(rtlBox), words = try XCTUnwrap(rtlWords)
        print("GAP-202 iOS, right to left: words \(words), icon \(end)")
        XCTAssertGreaterThan(words.minX - end.maxX, 2, "the icon is before the words, at their end")
        // The head: the topmost half point of ink, the arrow's top bar, which
        // sits two units of the 24 grid above the frame's top edge.
        let head = { (pixels: RenderedPixels, box: CGRect) in
            pixels.boundingBox(in: CGRect(x: box.minX, y: box.minY, width: box.width, height: 0.5), where: RenderedPixels.isTheme)
        }
        let ltrHead = try XCTUnwrap(head(ltr, start)), rtlHead = try XCTUnwrap(head(rtl, end))
        XCTAssertGreaterThan(ltrHead.midX, start.midX, "left to right the arrow points right")
        XCTAssertLessThan(rtlHead.midX, end.midX, "right to left the arrow points left")
    }

    /// The icon grows with the reader's text size, as the words do.
    @MainActor func testTheIconGrowsWithDynamicType() async throws {
        let (large, _, _) = try await icon(.leftToRight)
        let (bigger, _, _) = try await icon(.leftToRight, .accessibility1)
        let at = try XCTUnwrap(large), grown = try XCTUnwrap(bigger)
        print("GAP-202 iOS, Dynamic Type: icon \(at.height) at large, \(grown.height) at accessibility1")
        XCTAssertGreaterThan(grown.height, at.height * 1.4)
    }

    /// The guard: a link that stays in the app draws its words alone, the
    /// ink of the same words in the theme colour.
    @MainActor func testALinkThatStaysDrawsNoIcon() async throws {
        let plain = try await render(scene(external: false, .leftToRight), "gap-202-link-plain")
        let text = try await render(
            Text("Privacy Policy")
                .foregroundColor(KozmosColors.primitivesColorsTheme600)
                .padding(.horizontal, 16)
                .frame(width: size.width, height: size.height, alignment: .leading)
                .background(Color.white)
                .environment(\.colorScheme, .light),
            "gap-202-text-plain")
        let link = try XCTUnwrap(Self.union(ink(plain))), words = try XCTUnwrap(Self.union(ink(text)))
        XCTAssertEqual(link.minX, words.minX, accuracy: 0.5)
        XCTAssertEqual(link.maxX, words.maxX, accuracy: 0.5, "the link draws more than its words")
    }

    // MARK: - Reading the tree

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

    /// The tree, for a failure's message: each node's class, traits, name and hint.
    @MainActor private func describe(_ node: NSObject, depth: Int = 0) -> String {
        let line = String(repeating: "  ", count: depth)
            + "\(type(of: node)) traits=\(node.accessibilityTraits.rawValue) element=\(node.isAccessibilityElement) label=\(node.accessibilityLabel ?? "-") hint=\(node.accessibilityHint ?? "-")"
        let below = (children(node) ?? []).map { describe($0, depth: depth + 1) }
        return ([line] + below).joined(separator: "\n")
    }
    #endif
}
