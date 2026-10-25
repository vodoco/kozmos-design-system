import XCTest
import SwiftUI
@testable import Kozmos

/// A navigation item's icon is drawn in the item's colour: React's `Icon` is
/// `currentColor` inside the item, and Compose's `KozmosIcon` follows
/// `LocalContentColor`. SwiftUI's `KozmosIcon` sets its own ink unless the part
/// around it says otherwise, and `KozmosNavigationItem` did not, so a
/// selected rail item drew a theme/600 label under a foreground/100 icon, and
/// an item at rest a foreground/400 label under it. The item now gives its
/// icon its colour, and its trailing content the muted colour it draws it in,
/// as `KozmosButton` gives its icon its ink.
///
/// Drawn without a window, so these run in `swift test` on a Mac too.
final class KozmosNavigationItemIconInkTests: XCTestCase {
    private typealias Ink = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    @MainActor private func darkest<V: View>(_ view: V, width: CGFloat, in region: CGRect) throws -> Ink? {
        try DrawnPixels.draw(
            view.frame(width: width).background(Color.white).environment(\.colorScheme, .light),
            scale: 3
        ).darkest(in: region)
    }

    private func close(_ a: Ink?, _ b: Ink, within tolerance: Int = 10) -> Bool {
        guard let a else { return false }
        return abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance && abs(Int(a.b) - Int(b.b)) <= tolerance
    }

    private func hex(_ c: Ink?) -> String { c.map { String(format: "#%02X%02X%02X", $0.r, $0.g, $0.b) } ?? "nothing" }

    @MainActor func testARailItemsIconIsItsColour() throws {
        var wrong: [String] = []
        for (selected, token, name) in [(false, KozmosColors.primitivesColorsForeground400, "at rest, foreground/400"),
                                        (true, KozmosColors.primitivesColorsTheme600, "selected, theme/600")] {
            let item = KozmosNavigationItem(label: "Home", placement: .rail, content: .iconLabel, selected: selected) {
                KozmosIcon("home-line", size: .lg)
            }
            // The 24pt icon, centred 16pt down a 96pt rail.
            let icon = try darkest(item, width: 96, in: CGRect(x: 36, y: 16, width: 24, height: 24))
            let expected = try DrawnPixels.resolved(token, in: .light)
            if !close(icon, expected) { wrong.append("\(name): the icon is \(hex(icon)), not \(hex(expected))") }
        }
        XCTAssertEqual(wrong, [])
    }

    @MainActor func testARowItemsIconIsItsColourAndItsTrailingContentMuted() throws {
        let selected = KozmosNavigationItem(label: "Home", placement: .side, content: .iconLabel, selected: true) {
            KozmosIcon("home-line", size: .md)
        }
        // The 20pt icon, 12pt in from the leading edge of a 44pt row.
        let icon = try darkest(selected, width: 240, in: CGRect(x: 12, y: 12, width: 20, height: 20))
        let primary = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        XCTAssertTrue(close(icon, primary), "selected, the icon is \(hex(icon)), not theme/600 \(hex(primary))")

        let trailing = KozmosNavigationItem(label: "Levels", placement: .side, icon: { KozmosIcon("home-line", size: .md) },
                                            trailing: { KozmosIcon("chevron-right", size: .md) })
        // The trailing chevron, at the item's trailing edge.
        let chevron = try darkest(trailing, width: 240, in: CGRect(x: 200, y: 8, width: 32, height: 28))
        let muted = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground400, in: .light)
        XCTAssertTrue(close(chevron, muted), "the trailing icon is \(hex(chevron)), not foreground/400 \(hex(muted))")
    }
}
