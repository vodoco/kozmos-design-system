import SwiftUI
import XCTest
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// GAP-197, decision 134: IconButton's `counter`, as React's. The count is
/// Counter's small brand pill over the icon's top-end corner: its bottom edge
/// on the button's centre line and its leading edge 2 past it, at every size,
/// mirrored right to left. VoiceOver reads it after the button's name, "Help,
/// 3": the button's value, in `counterLabel`'s words when given; the drawn
/// number is not an element of its own.
///
/// The counter is found as what a button with one draws and the same button
/// without one does not, so nothing here depends on the icon's own ink.
final class KozmosIconButtonCounterTests: XCTestCase {
    /// Room round the button, so a counter that spills past it is drawn.
    private let margin: CGFloat = 20

    private func button(_ counter: Int?, size: KozmosIconButtonSize = .default) -> some View {
        KozmosIconButton(iconName: "questionmark.circle", size: size, counter: counter, action: {})
            // The ghost button keeps the system's style, which on a Mac is a
            // bezel round the label: plain, it draws as it does on a phone.
            .buttonStyle(.plain)
            .padding(margin)
            .environment(\.colorScheme, .light)
    }

    /// The bounding box, in points, of what the counter adds to the drawing.
    @MainActor private func counterBox<V: View, W: View>(_ with: V, _ without: W) throws -> CGRect? {
        let a = try DrawnPixels.draw(with, scale: 2)
        let b = try DrawnPixels.draw(without, scale: 2)
        XCTAssertEqual(a.width, b.width, "the counter changed the button's size")
        var minX = Int.max, minY = Int.max, maxX = -1, maxY = -1
        for y in 0..<a.height {
            for x in 0..<a.width {
                let point = CGPoint(x: (CGFloat(x) + 0.5) / 2, y: (CGFloat(y) + 0.5) / 2)
                let p = a.pixel(at: point), q = b.pixel(at: point)
                let difference = max(abs(Int(p.r) - Int(q.r)), abs(Int(p.g) - Int(q.g)),
                                     abs(Int(p.b) - Int(q.b)), abs(Int(p.a) - Int(q.a)))
                if difference > 64 {
                    minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
                }
            }
        }
        guard maxX >= 0 else { return nil }
        return CGRect(x: CGFloat(minX) / 2, y: CGFloat(minY) / 2,
                      width: CGFloat(maxX - minX + 1) / 2, height: CGFloat(maxY - minY + 1) / 2)
    }

    @MainActor func testTheCountSitsOverTheIconsTopEndCorner() throws {
        for (size, side) in [(KozmosIconButtonSize.default, CGFloat(44)), (.lg, 48)] {
            let centre = margin + side / 2
            let box = try XCTUnwrap(try counterBox(button(3, size: size), button(nil, size: size)), "\(size): no counter drawn")
            XCTAssertEqual(box.maxY, centre, accuracy: 0.75, "\(size): its bottom on the centre line")
            XCTAssertEqual(box.minX, centre + 2, accuracy: 0.75, "\(size): its leading edge 2 past the centre")
            XCTAssertEqual(box.height, 18, accuracy: 1, "\(size): Counter's small pill")
            XCTAssertEqual(box.width, 18, accuracy: 1, "\(size): one digit in its 18 minimum")
        }
    }

    @MainActor func testRightToLeftItIsOverTheTopLeftCorner() throws {
        let rtl = { (counter: Int?) in self.button(counter).environment(\.layoutDirection, .rightToLeft) }
        let box = try XCTUnwrap(try counterBox(rtl(3), rtl(nil)), "no counter drawn")
        let centre = margin + 22
        XCTAssertEqual(box.maxX, centre - 2, accuracy: 0.75, "its leading edge 2 before the centre")
        XCTAssertEqual(box.maxY, centre, accuracy: 0.75)
    }

    @MainActor func testItIsDrawnInTheThemeFill() throws {
        let drawn = try DrawnPixels.draw(button(3), scale: 2)
        let fill = try DrawnPixels.resolved(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle, in: .light)
        let pill = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(fill)), "no theme fill drawn")
        XCTAssertEqual(pill.maxY, margin + 22, accuracy: 0.75)
    }

    @MainActor func testWithoutACountNothingIsAdded() throws {
        XCTAssertNil(try counterBox(button(nil), button(nil)))
        // The call every product makes today draws as a button with no count.
        let plain = KozmosIconButton(iconName: "questionmark.circle", action: {})
            .buttonStyle(.plain).padding(margin).environment(\.colorScheme, .light)
        XCTAssertNil(try counterBox(plain, button(nil)), "the default draws a counter")
    }

    #if os(iOS)
    // MARK: - What VoiceOver hears

    private struct Help: View {
        let counter: Int?
        var counterLabel: (Int) -> String = { String($0) }
        var body: some View {
            KozmosIconButton(iconName: "questionmark.circle", counter: counter, counterLabel: counterLabel, action: {})
                .accessibilityLabel("Help")
                .padding(40)
        }
    }

    /// One element: the button, named by its label, the count its value.
    @MainActor func testVoiceOverReadsTheNameThenTheCount() async throws {
        try await inspect(Help(counter: 3)) { window in
            let found = self.elements(window)
            XCTAssertEqual(found.count, 1, "the drawn number is an element of its own; the tree:\n\(self.describe(window))")
            let button = try XCTUnwrap(found.first)
            XCTAssertEqual(button.accessibilityLabel, "Help")
            XCTAssertEqual(button.accessibilityValue, "3")
            XCTAssertTrue(button.accessibilityTraits.contains(.button))
        }
    }

    @MainActor func testTheCountIsReadInTheProductsWords() async throws {
        try await inspect(Help(counter: 3, counterLabel: { "\($0) tours left" })) { window in
            let button = try XCTUnwrap(self.elements(window).first)
            XCTAssertEqual(button.accessibilityLabel, "Help")
            XCTAssertEqual(button.accessibilityValue, "3 tours left")
        }
    }

    @MainActor func testWithoutACountTheButtonHasNoValue() async throws {
        try await inspect(Help(counter: nil)) { window in
            let found = self.elements(window)
            XCTAssertEqual(found.count, 1, "the tree:\n\(self.describe(window))")
            XCTAssertEqual(found.first?.accessibilityLabel, "Help")
            XCTAssertTrue((found.first?.accessibilityValue ?? "").isEmpty, "a value with no count")
        }
    }

    // MARK: - Reading the tree, as KozmosCardTitleHeadingTests reads it

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

    @MainActor private func describe(_ node: NSObject, depth: Int = 0) -> String {
        let line = String(repeating: "  ", count: depth)
            + "\(type(of: node)) traits=\(node.accessibilityTraits.rawValue) element=\(node.isAccessibilityElement) label=\(node.accessibilityLabel ?? "-") value=\(node.accessibilityValue ?? "-")"
        let below = (children(node) ?? []).map { describe($0, depth: depth + 1) }
        return ([line] + below).joined(separator: "\n")
    }
    #endif
}
