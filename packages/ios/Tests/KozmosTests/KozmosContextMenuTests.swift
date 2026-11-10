import XCTest
import SwiftUI
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// `kozmosContextMenu` (GAP-155): SwiftUI's `.contextMenu` with the rows
/// `KozmosMenu` draws, from the same content, opened as the system opens a
/// context menu: a long press on touch, a secondary click on a pointer.
final class KozmosContextMenuTests: XCTestCase {
    private let content = KozmosMenuContent(
        label: "Gate A12",
        items: [KozmosMenuItem(text: "Copy gate"), KozmosMenuItem(text: "Help centre", external: true)]
    )

    /// The context menu's rows are KozmosMenu's own builder, given the same
    /// content and the same selection.
    func testTheContextMenuDrawsKozmosMenusRows() {
        var picked: [String] = []
        let menu = KozmosMenu(title: "Gate", content: content) { picked.append("menu: \($0.text)") }
        let contextMenu = KozmosContextMenuModifier(content: content) { picked.append("context: \($0.text)") }
        let menuRows: KozmosMenuRows = menu.rows
        let contextRows: KozmosMenuRows = contextMenu.rows
        XCTAssertEqual(contextRows.content, menuRows.content)
        contextRows.onItemSelect(content.items[0])
        menuRows.onItemSelect(content.items[0])
        XCTAssertEqual(picked, ["context: Copy gate", "menu: Copy gate"])
    }

    #if os(iOS)
    /// The system's context menu, which a long press and a secondary click
    /// open and VoiceOver offers: a UIContextMenuInteraction on the view.
    @MainActor func testTheModifierInstallsTheSystemsContextMenu() async throws {
        try await MenusAXTree.inspect(Text("Gate A12").kozmosContextMenu(content)) { window in
            XCTAssertFalse(Self.contextMenuInteractions(window).isEmpty, "no context-menu interaction on the view")
        }
    }

    /// The guard: a view without it has none.
    @MainActor func testAViewWithoutItHasNoContextMenu() async throws {
        try await MenusAXTree.inspect(Text("Gate A12")) { window in
            XCTAssertTrue(Self.contextMenuInteractions(window).isEmpty)
        }
    }

    @MainActor private static func contextMenuInteractions(_ view: UIView) -> [UIContextMenuInteraction] {
        view.interactions.compactMap { $0 as? UIContextMenuInteraction }
            + view.subviews.flatMap { contextMenuInteractions($0) }
    }
    #endif
}

/// A menu item's `external` (decision 152, as `KozmosLink`'s): Pointr's
/// new-tab icon at the row's end, and "Opens in your browser" as
/// VoiceOver's hint, or the product's words. Read from the rows `KozmosMenu`
/// and `kozmosContextMenu` both draw, hosted outside a system menu.
final class KozmosMenuItemExternalTests: XCTestCase {
    /// The icon is Pointr's `link-external-01` drawn into an image, its
    /// arrow pointing to the row's end: up and right, mirrored right to left.
    func testTheNewTabImageIsPointrsGlyphPointingToTheEnd() throws {
        for mirrored in [false, true] {
            let image = try XCTUnwrap(KozmosNewTabImage.cgImage(side: 24, scale: 2, mirrored: mirrored))
            XCTAssertEqual(image.width, 48)
            let ink = try Self.ink(image)
            let top = try XCTUnwrap(ink.map(\.y).min(), "nothing drawn")
            // The head: the topmost ink, the arrow's top bar.
            let head = ink.filter { $0.y <= top + 1 }.map { Double($0.x) }
            let headMiddle = head.reduce(0, +) / Double(head.count)
            if mirrored {
                XCTAssertLessThan(headMiddle, 24, "right to left the arrow points left")
            } else {
                XCTAssertGreaterThan(headMiddle, 24, "left to right the arrow points right")
            }
        }
    }

    /// The opaque pixels of an image, top row first.
    private static func ink(_ image: CGImage) throws -> [(x: Int, y: Int)] {
        let width = image.width, height = image.height
        var bytes = [UInt8](repeating: 0, count: width * height * 4)
        let context = try XCTUnwrap(CGContext(
            data: &bytes, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ))
        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        var found: [(x: Int, y: Int)] = []
        for y in 0..<height {
            for x in 0..<width where bytes[(y * width + x) * 4 + 3] > 128 {
                found.append((x, y))
            }
        }
        return found
    }

    #if os(iOS)
    private func rows(_ items: [KozmosMenuItem]) -> some View {
        VStack { KozmosMenuRows(content: KozmosMenuContent(items: items), onItemSelect: { _ in }) }
    }

    @MainActor func testAnExternalItemIsOneButtonWithTheHint() async throws {
        try await MenusAXTree.inspect(rows([KozmosMenuItem(text: "Help centre", external: true)])) { window in
            let found = MenusAXTree.elements(window)
            XCTAssertEqual(found.count, 1, "one element, the icon in it; the tree:\n\(MenusAXTree.describe(window))")
            let item = try XCTUnwrap(found.first)
            XCTAssertEqual(item.accessibilityLabel, "Help centre")
            XCTAssertTrue(item.accessibilityTraits.contains(.button), "a button")
            XCTAssertEqual(item.accessibilityHint, "Opens in your browser")
        }
    }

    @MainActor func testTheHintIsTheProductsOwnWords() async throws {
        try await MenusAXTree.inspect(rows([
            KozmosMenuItem(text: "Hilfe", external: true, externalLabel: "Öffnet sich in deinem Browser"),
        ])) { window in
            let item = try XCTUnwrap(MenusAXTree.elements(window).first)
            XCTAssertEqual(item.accessibilityHint, "Öffnet sich in deinem Browser")
        }
    }

    /// The guard: an item that stays in the app has no hint.
    @MainActor func testAnItemThatStaysHasNoHint() async throws {
        try await MenusAXTree.inspect(rows([KozmosMenuItem(text: "Rename")])) { window in
            let item = try XCTUnwrap(MenusAXTree.elements(window).first)
            XCTAssertEqual(item.accessibilityLabel, "Rename")
            XCTAssertNil(item.accessibilityHint.flatMap { $0.isEmpty ? nil : $0 })
        }
    }
    #endif
}
