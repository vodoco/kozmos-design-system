#if os(iOS)
import SwiftUI
import UIKit
import XCTest
@testable import Kozmos

/// GAP-201: `divided` draws a stroke in the border role under every row and
/// sets an open parent row on a surface of its own, background 50, as React's
/// Tree has since 0.15.0 (#433); `bleed` takes both past the tree to the
/// panel's edges while the rows stay where they are. The tree sits 16 in from
/// a white panel's edges here, as in a panel.
final class KozmosTreeDividedTests: XCTestCase {
    private let size = CGSize(width: 400, height: 400)
    private static let nodes = [
        Node(value: "Main building", children: [Node(value: "Ground floor"), Node(value: "First floor")]),
        Node(value: "Car park"),
    ]

    /// semanticsBorderSubtle, #C7CAD1 in light.
    private static func isStroke(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool {
        abs(Int(r) - 0xC7) < 8 && abs(Int(g) - 0xCA) < 8 && abs(Int(b) - 0xD1) < 8
    }
    /// background 50, #F1F2F4 in light.
    private static func isSurface(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool {
        abs(Int(r) - 0xF1) < 4 && abs(Int(g) - 0xF2) < 4 && abs(Int(b) - 0xF4) < 4
    }

    @MainActor private func render(divided: Bool = true, bleed: CGFloat, _ name: String) async throws -> RenderedPixels {
        let view = KozmosTree(nodes: Self.nodes, divided: divided, bleed: bleed, expanded: [[0]])
            .padding(16)
            .background(Color.white)
            .environment(\.colorScheme, .light)
        let pixels = try await RenderedPixels.render(view, size: size)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        return pixels
    }

    /// The rows the strokes are drawn on, from the top: each a line of stroke
    /// down the column at `x`.
    private func strokeRows(_ pixels: RenderedPixels, at x: CGFloat) -> [CGFloat] {
        var rows: [CGFloat] = []
        var y: CGFloat = 0
        while y < size.height {
            let c = pixels.color(at: CGPoint(x: x, y: y))
            if Self.isStroke(c.r, c.g, c.b), rows.last.map({ y - $0 > 2 }) ?? true { rows.append(y) }
            y += 0.5
        }
        return rows
    }

    /// One stroke under each of the four rows drawn, the open parent's two
    /// children among them, each row 44 and its stroke 1 under it.
    @MainActor func testAStrokeRunsUnderEveryRow() async throws {
        let pixels = try await render(bleed: 0, "gap-201-strokes")
        let rows = strokeRows(pixels, at: 200)
        XCTAssertEqual(rows.count, 4, "strokes at \(rows)")
        for (a, b) in zip(rows, rows.dropFirst()) {
            XCTAssertEqual(b - a, 45, accuracy: 1, "a row and its stroke are not 45: \(rows)")
        }
    }

    /// The open parent sits on background 50; a closed row does not.
    @MainActor func testAnOpenParentSitsOnASurface() async throws {
        let pixels = try await render(bleed: 0, "gap-201-surface")
        let rows = strokeRows(pixels, at: 200)
        let open = pixels.color(at: CGPoint(x: 300, y: try XCTUnwrap(rows.first) - 10))
        XCTAssertTrue(Self.isSurface(open.r, open.g, open.b), "the open row is not on background 50: \(open)")
        let child = pixels.color(at: CGPoint(x: 300, y: rows[1] - 10))
        XCTAssertFalse(Self.isSurface(child.r, child.g, child.b), "a closed row is on the surface: \(child)")
    }

    /// Without bleed the strokes stop at the tree's edges, 16 in; with the
    /// panel's 16 they reach its edges.
    @MainActor func testBleedTakesTheStrokesToThePanelsEdges() async throws {
        let tree = try await render(bleed: 0, "gap-201-no-bleed")
        let y = try XCTUnwrap(strokeRows(tree, at: 200).first)
        let inset = tree.color(at: CGPoint(x: 8, y: y))
        XCTAssertFalse(Self.isStroke(inset.r, inset.g, inset.b), "a stroke runs past the tree with no bleed")
        let bled = try await render(bleed: 16, "gap-201-bleed")
        let y2 = try XCTUnwrap(strokeRows(bled, at: 200).first)
        for x: CGFloat in [1, size.width - 1] {
            let c = bled.color(at: CGPoint(x: x, y: y2))
            XCTAssertTrue(Self.isStroke(c.r, c.g, c.b), "the stroke does not reach the panel's edge at x = \(x): \(c)")
        }
    }

    /// The rows a divided tree draws: an open parent's children under it,
    /// a closed one's not, keyed by place so a product rebuilding its nodes
    /// keeps what is open. (VoiceOver's "Expanded" value is not read back
    /// here: the hosted scroll view gives the walk no elements in a unit test.)
    func testAnOpenParentDrawsItsChildrenUnderIt() {
        let open = KozmosTree.dividedRows(Self.nodes, expanded: [[0]]).map(\.node.value)
        XCTAssertEqual(open, ["Main building", "Ground floor", "First floor", "Car park"])
        let closed = KozmosTree.dividedRows(Self.nodes, expanded: []).map(\.node.value)
        XCTAssertEqual(closed, ["Main building", "Car park"])
        let rebuilt = [Node(value: "Main building", children: [Node(value: "Ground floor")])]
        XCTAssertEqual(KozmosTree.dividedRows(rebuilt, expanded: [[0]]).count, 2, "a rebuilt node lost its open state")
    }
}
#endif
