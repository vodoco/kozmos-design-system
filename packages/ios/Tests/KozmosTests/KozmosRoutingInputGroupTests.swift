import XCTest
import SwiftUI
@testable import Kozmos

/// The group as React draws it, measured from the pixels, relative to its
/// content (16 in; React's CSS border adds 1 more there and takes 2 from the
/// fields' width, which a SwiftUI overlay does not): a 14 start ring 12 down
/// in theme/600, a 2 × 36 connector in the border role 8 below it, 40-high
/// fields 12 apart and 28 in, washed black at 5 %, and a 40 swap 24 down, 12
/// from the fields, in the secondary fill. Until 2026-09-22 the fields were
/// washed in foreground/900 at 5 %, which showed on neither theme, the swap was
/// a 40 circle 28 down, and the rail theme/500 over foreground/300.
final class KozmosRoutingInputGroupTests: XCTestCase {
    func testLegacyTrailingRemovalAndLocalizedInitializersCompile() {
        _ = KozmosRoutingInputGroup(points: [], onPointChange: { _, _ in }, onSwap: nil, onAddPoint: nil) { (_: String) in }
        _ = KozmosRoutingInputGroup(points: [KozmosRoutePoint(id: "a", value: "Lobby", label: "Desde")], swapLabel: "Intercambiar", addPointLabel: "Añadir", removePointLabel: { "Quitar \($0.label ?? "parada")" }, onPointChange: { _, _ in })
    }
    #if os(iOS)
    @MainActor func testTheGroupIsLaidOutAsReactsIs() async throws {
        let group = KozmosRoutingInputGroup(
            points: [
                KozmosRoutePoint(id: "a", value: ""),
                KozmosRoutePoint(id: "b", value: ""),
            ],
            onPointChange: { _, _ in },
            onSwap: {},
            onAddPoint: {}
        )
        let size = CGSize(width: 400, height: 220)
        let view = ZStack(alignment: .topLeading) {
            Color.white
            group.frame(width: 360).padding(20)
        }
        .environment(\.colorScheme, .light)
        let pixels = try await RenderedPixels.render(view, size: size)
        let near = { (r: UInt8, g: UInt8, b: UInt8, to: (Int, Int, Int), by: Int) -> Bool in
            abs(Int(r) - to.0) <= by && abs(Int(g) - to.1) <= by && abs(Int(b) - to.2) <= by
        }
        // The group's content starts 16 in from its edge at (20, 20).
        let origin = CGPoint(x: 36, y: 36)
        func box(_ region: CGRect, _ match: @escaping (UInt8, UInt8, UInt8) -> Bool) throws -> CGRect {
            let found = try XCTUnwrap(
                pixels.boundingBox(in: region.offsetBy(dx: origin.x, dy: origin.y), where: match),
                "nothing matched in \(region)"
            )
            return found.offsetBy(dx: -origin.x, dy: -origin.y)
        }
        let wash = { (r: UInt8, g: UInt8, b: UInt8) in near(r, g, b, (242, 242, 242), 1) }
        let fields = 328.0 - 16 - 12 - 12 - 40
        let start = try box(CGRect(x: 20, y: -2, width: fields + 10, height: 46), wash)
        let end = try box(CGRect(x: 20, y: 46, width: fields + 10, height: 48), wash)
        let ring = try box(CGRect(x: -2, y: 0, width: 20, height: 30)) { near($0, $1, $2, (16, 81, 232), 40) }
        let connector = try box(CGRect(x: -2, y: 28, width: 20, height: 44)) { near($0, $1, $2, (199, 202, 209), 3) }
        let swap = try box(CGRect(x: 250, y: 0, width: 80, height: 70)) { near($0, $1, $2, (199, 202, 209), 3) }

        for (name, got, want) in [
            ("start field", start, CGRect(x: 28, y: 0, width: fields, height: 40)),
            ("end field", end, CGRect(x: 28, y: 52, width: fields, height: 40)),
            ("start ring", ring, CGRect(x: 1, y: 12, width: 14, height: 14)),
            ("connector", connector, CGRect(x: 7, y: 34, width: 2, height: 36)),
            ("swap", swap, CGRect(x: 28 + fields + 12, y: 24, width: 40, height: 40)),
        ] {
            XCTAssertEqual(got.minX, want.minX, accuracy: 1.5, "\(name) is \(got), React's is \(want)")
            XCTAssertEqual(got.minY, want.minY, accuracy: 1.5, "\(name) is \(got), React's is \(want)")
            XCTAssertEqual(got.width, want.width, accuracy: 1.5, "\(name) is \(got), React's is \(want)")
            XCTAssertEqual(got.height, want.height, accuracy: 1.5, "\(name) is \(got), React's is \(want)")
        }
    }
    #endif
}
