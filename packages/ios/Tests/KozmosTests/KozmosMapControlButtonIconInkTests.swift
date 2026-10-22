import XCTest
import SwiftUI
@testable import Kozmos

/// A map control's `KozmosIcon` is drawn in the control's ink, as its system
/// image is: grey while a toggle is off, the theme's blue while it is on, and
/// the ink when it is not a toggle. React's icon is `currentColor`, and
/// Compose's follows `LocalContentColor`. SwiftUI's `KozmosIcon` kept its own
/// foreground/100, because the control set no `kozmosIconHostInk`, so the
/// layers toggle could draw Kozmos's layers glyph only in the wrong colour.
///
/// Drawn without a window, so these run in `swift test` on a Mac too.
final class KozmosMapControlButtonIconInkTests: XCTestCase {
    private typealias Ink = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    private func hex(_ c: Ink?) -> String { c.map { String(format: "#%02X%02X%02X", $0.r, $0.g, $0.b) } ?? "nothing" }

    private func close(_ a: Ink?, _ b: Ink, within tolerance: Int = 10) -> Bool {
        guard let a else { return false }
        return abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance && abs(Int(a.b) - Int(b.b)) <= tolerance
    }

    @MainActor func testAKozmosIconTakesTheControlsInk() throws {
        var wrong: [String] = []
        for (pressed, token, name) in [(Bool?.none, KozmosColors.primitivesColorsForeground100, "not a toggle, the ink"),
                                       (false, KozmosColors.primitivesColorsForeground400, "off, grey"),
                                       (true, KozmosColors.primitivesColorsTheme600, "on, the theme's blue")] {
            let control = KozmosMapControlButton(label: "Layers", pressed: pressed, action: {}) {
                KozmosIcon("plus", size: .lg)
            }
            let drawn = try DrawnPixels.draw(control.padding(8).background(Color.white).environment(\.colorScheme, .light), scale: 3)
            // The 24pt icon, centred in the 48pt control.
            let icon = drawn.darkest(in: CGRect(x: 8 + 12, y: 8 + 12, width: 24, height: 24))
            let expected = try DrawnPixels.resolved(token, in: .light)
            if !close(icon, expected) { wrong.append("\(name): \(hex(icon)), not \(hex(expected))") }
        }
        XCTAssertEqual(wrong, [], "KozmosIcons not in the control's ink")
    }
}
