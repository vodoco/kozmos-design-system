import XCTest
import SwiftUI
@testable import Kozmos

/// An unchecked switch's track is the muted colour, foreground/400, as React's
/// is (`border-muted-foreground bg-muted-foreground`, Switch.tsx); it was
/// foreground/500. Disabled, it is as it was: foreground/500, dimmed as the
/// plain button style dims a disabled button (owner, 24 Oct).
///
/// Each switch is drawn alone on the page, light and dark. The track and its
/// edge are one colour and the thumb is the page's, so the commonest colour
/// that is not the page's is the track's. It is held to a swatch drawn the same
/// way, within 3 a channel. Drawn without a window, so these run in
/// `swift test` on a Mac too.
final class KozmosSwitchTrackTests: XCTestCase {
    private typealias Ink = (r: UInt8, g: UInt8, b: UInt8)

    /// The commonest opaque colour in the drawing that is not the page's.
    @MainActor private func commonest<V: View>(_ view: V, _ scheme: ColorScheme) throws -> Ink? {
        let drawn = try DrawnPixels.draw(
            view.padding(8).background(KozmosColors.primitivesColorsBackground0).environment(\.colorScheme, scheme),
            scale: 3)
        let corner = drawn.pixel(at: CGPoint(x: 1, y: 1))
        var counts: [Int: Int] = [:]
        for y in 0..<drawn.height {
            for x in 0..<drawn.width {
                let p = drawn.pixel(at: CGPoint(x: (CGFloat(x) + 0.5) / drawn.scale, y: (CGFloat(y) + 0.5) / drawn.scale))
                guard p.a > 240 else { continue }
                if abs(Int(p.r) - Int(corner.r)) <= 6 && abs(Int(p.g) - Int(corner.g)) <= 6 && abs(Int(p.b) - Int(corner.b)) <= 6 { continue }
                counts[Int(p.r) << 16 | Int(p.g) << 8 | Int(p.b), default: 0] += 1
            }
        }
        guard let key = counts.max(by: { $0.value < $1.value })?.key else { return nil }
        return (UInt8(key >> 16 & 0xFF), UInt8(key >> 8 & 0xFF), UInt8(key & 0xFF))
    }

    private func hex(_ c: Ink?) -> String { c.map { String(format: "#%02X%02X%02X", $0.r, $0.g, $0.b) } ?? "nothing" }

    @MainActor func testAnUncheckedSwitchsTrackIsTheMutedColourAndADisabledOneIsAsItWas() throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let enabled = try commonest(KozmosSwitch(checked: .constant(false)), scheme)
            let muted = try commonest(Capsule().fill(KozmosColors.primitivesColorsForeground400).frame(width: 44, height: 24), scheme)
            let disabled = try commonest(KozmosSwitch(checked: .constant(false), disabled: true), scheme)
            // The plain style's disabled button, around a track in the colour
            // a disabled switch has always had.
            let asItWas = try commonest(
                Button(action: {}) {
                    Capsule().fill(KozmosColors.primitivesColorsForeground500).frame(width: 44, height: 24)
                }
                .buttonStyle(PlainButtonStyle())
                .disabled(true),
                scheme)
            for (name, got, want) in [("enabled, foreground/400", enabled, muted), ("disabled, as it was", disabled, asItWas)] {
                print("Switch track iOS, unchecked \(name), \(scheme): \(hex(got)), want \(hex(want))")
                guard let got, let want,
                      abs(Int(got.r) - Int(want.r)) <= 3, abs(Int(got.g) - Int(want.g)) <= 3, abs(Int(got.b) - Int(want.b)) <= 3 else {
                    wrong.append("unchecked \(name), \(scheme): the track is \(hex(got)), not \(hex(want))")
                    continue
                }
            }
        }
        XCTAssertEqual(wrong, [])
    }
}
