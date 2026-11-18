import XCTest
import SwiftUI
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// GAP-216, decision 225: a read-only block of code, MAP-619's merged unit's
/// JSON: the mono family on the muted surface, wrapped or scrolling
/// sideways, an optional copy in the product's words, no colouring. One
/// VoiceOver container named by its label, holding the code.
final class KozmosCodeBlockTests: XCTestCase {
    private static let json = "{\n  \"mergedUnit\": { \"fid\": \"f-1209\" }\n}"

    func testItsDefaults() {
        let block = KozmosCodeBlock(Self.json, label: "mergedUnit JSON")
        XCTAssertEqual(block.code, Self.json)
        XCTAssertTrue(block.wrap, "a code block does not wrap by default")
        XCTAssertFalse(block.copyable, "a code block copies by default")
        XCTAssertEqual(block.copyLabel, "Copy")
        XCTAssertEqual(block.copiedLabel, "Copied")
        XCTAssertEqual(KozmosCodeBlock.padding, KozmosDimensions.primitivesLayoutSpacing150)
        XCTAssertEqual(KozmosCodeBlock.cornerRadius, KozmosDimensions.semanticsRadiusControl)
    }

    /// The mono family is the platform's monospaced design (Semantics /
    /// Typography / Family / Mono), as Compose's `KozmosTypography.mono`.
    func testTheMonoFamily() {
        XCTAssertEqual(KozmosTypography.mono(.subheadline), Font.system(.subheadline, design: .monospaced))
    }

    #if os(iOS)
    /// A container named by its label, the code inside it as written, and
    /// the copy its own button, in the product's words.
    @MainActor func testItIsAContainerNamedByItsLabelWithItsCopy() async throws {
        var copied: String?
        let view = KozmosCodeBlock(Self.json, label: "mergedUnit JSON", copyable: true,
                                   copyLabel: "Copy JSON", onCopy: { copied = $0 })
            .padding(16)
        try await inspectAccessibility(view) { window in
            let nodes = accessibilityNodes(window)
            let region = nodes.filter { $0.accessibilityLabel == "mergedUnit JSON" }
            XCTAssertEqual(region.count, 1, "no container named by the label:\n\(describeAccessibility(window))")
            XCTAssertFalse(region.first?.isAccessibilityElement ?? true, "the region swallowed the code:\n\(describeAccessibility(window))")
            let code = accessibilityElements(window).filter { $0.accessibilityLabel == Self.json }
            XCTAssertEqual(code.count, 1, "the code is not read as written:\n\(describeAccessibility(window))")
            let copy = try accessibilityElement(named: "Copy JSON", in: window)
            XCTAssertTrue(copy.accessibilityTraits.contains(.button))
            XCTAssertTrue(copy.accessibilityActivate())
            try await Task.sleep(nanoseconds: 300_000_000)
            XCTAssertEqual(copied, Self.json)
        }
    }

    /// No copy unless asked.
    @MainActor func testNoCopyUnlessAsked() async throws {
        try await inspectAccessibility(KozmosCodeBlock(Self.json, label: "mergedUnit JSON").padding(16)) { window in
            XCTAssertTrue(accessibilityElements(window).allSatisfy { !$0.accessibilityTraits.contains(.button) },
                          "a button is drawn:\n\(describeAccessibility(window))")
        }
    }

    /// Wrapped, a long line breaks onto the lines under it and the block is
    /// as wide as it is given; with wrap off the line stays whole, so the
    /// block is one line tall and scrolls.
    @MainActor func testWrapBreaksALongLineAndScrollKeepsItWhole() async throws {
        let long = String(repeating: "\"levels\": [1, 2, 3], ", count: 8)
        let size = CGSize(width: 240, height: 400)
        func height(_ wrap: Bool) async throws -> CGFloat {
            let view = KozmosCodeBlock(long, label: "JSON", wrap: wrap)
                .frame(width: 240)
                .frame(maxHeight: .infinity, alignment: .top)
                .background(Color.white)
                .environment(\.colorScheme, .light)
            let pixels = try await RenderedPixels.render(view, size: size)
            // The muted surface: background/100 is not white.
            let box = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: { r, g, b in
                r < 250 && g < 250 && b < 250
            }), "nothing drawn")
            XCTAssertEqual(box.width, 240, accuracy: 1.5, "the block is not as wide as it is given: \(box)")
            return box.height
        }
        let wrapped = try await height(true)
        let scrolling = try await height(false)
        XCTAssertGreaterThan(wrapped, scrolling * 2, "a wrapped long line did not break: \(wrapped) against \(scrolling)")
        // One line of 20 or so and the 12s above and below.
        XCTAssertLessThan(scrolling, 60, "with wrap off the line broke: \(scrolling)")
    }
    #endif
}
