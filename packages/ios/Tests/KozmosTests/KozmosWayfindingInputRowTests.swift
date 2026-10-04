import XCTest
import SwiftUI
@testable import Kozmos

/// The row as React draws it, at React's width (328 inside a 360 host padded
/// 16), measured from the pixels: a 10 ring at the rail's top, two 300 × 40
/// fields 8 apart and 28 in, filled background/50, and a 44 swap button 12 in
/// from their end, centred between them. Until 2026-09-22 SwiftUI drew two
/// outlined white fields with the swap in a row of its own.
final class KozmosWayfindingInputRowTests: XCTestCase {
    #if os(iOS)
    @MainActor func testTheRowIsLaidOutAsReactsIs() async throws {
        let row = KozmosWayfindingInputRow(
            originValue: .constant("Current location"),
            destinationValue: .constant(""),
            onSwap: {}
        )
        let size = CGSize(width: 360, height: 120)
        let view = ZStack(alignment: .topLeading) {
            KozmosColors.primitivesColorsBackground0
            row.frame(width: 328).padding(16)
        }
        .environment(\.colorScheme, .light)
        let pixels = try await RenderedPixels.render(view, size: size)
        let near = { (r: UInt8, g: UInt8, b: UInt8, to: (Int, Int, Int), by: Int) -> Bool in
            abs(Int(r) - to.0) <= by && abs(Int(g) - to.1) <= by && abs(Int(b) - to.2) <= by
        }
        // Boxes in the row's own coordinates.
        func box(_ region: CGRect, _ match: @escaping (UInt8, UInt8, UInt8) -> Bool) throws -> CGRect {
            let found = try XCTUnwrap(pixels.boundingBox(in: region.offsetBy(dx: 16, dy: 16), where: match))
            return found.offsetBy(dx: -16, dy: -16)
        }
        let field = { (r: UInt8, g: UInt8, b: UInt8) in near(r, g, b, (241, 242, 244), 1) }
        let origin = try box(CGRect(x: 20, y: -4, width: 320, height: 46), field)
        let destination = try box(CGRect(x: 20, y: 44, width: 320, height: 48), field)
        let swap = try box(CGRect(x: 200, y: 0, width: 140, height: 88)) { near($0, $1, $2, (199, 202, 209), 3) }
        let ring = try box(CGRect(x: -2, y: 0, width: 20, height: 30)) { near($0, $1, $2, (16, 81, 232), 40) }

        for (name, got, want) in [
            ("origin field", origin, CGRect(x: 28, y: 0, width: 300, height: 40)),
            ("destination field", destination, CGRect(x: 28, y: 48, width: 300, height: 40)),
            ("swap button", swap, CGRect(x: 272, y: 22, width: 44, height: 44)),
            ("start ring", ring, CGRect(x: 3, y: 12, width: 10, height: 10)),
        ] {
            XCTAssertEqual(got.minX, want.minX, accuracy: 1.5, "\(name) is \(got), React's is \(want)")
            XCTAssertEqual(got.minY, want.minY, accuracy: 1.5, "\(name) is \(got), React's is \(want)")
            XCTAssertEqual(got.width, want.width, accuracy: 1.5, "\(name) is \(got), React's is \(want)")
            XCTAssertEqual(got.height, want.height, accuracy: 1.5, "\(name) is \(got), React's is \(want)")
        }
    }
    #endif
}
