import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 188 (17 Nov 2026): Checkbox's mixed state, React's
/// `checked="indeterminate"`, on SwiftUI. Mixed is painted exactly like
/// checked, the same edge and fill, with React's dash (the `Minus` icon at 16,
/// a line 28/3 long, 4/3 thick, round caps) where checked has its tick; it
/// keeps that when disabled and in error; and a tap makes it checked.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on the simulator.
final class KozmosCheckboxMixedTests: XCTestCase {
    private enum Look: String, CaseIterable { case `default`, disabled, error }

    @MainActor private func box(_ state: KozmosCheckboxState, _ look: Look, _ scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(
            KozmosCheckbox(checked: .constant(state), disabled: look == .disabled, error: look == .error)
                .padding(12)
                .background(KozmosColors.primitivesColorsBackground0)
                .environment(\.colorScheme, scheme),
            scale: 3
        )
    }

    /// The box: what is drawn on the page's ground, the 20pt square at the
    /// 44pt target's start.
    private func square(_ drawn: DrawnPixels) throws -> CGRect {
        let ground = drawn.pixel(at: CGPoint(x: 1, y: 1))
        return try XCTUnwrap(drawn.boundingBox { r, g, b, _ in
            abs(Int(r) - Int(ground.r)) + abs(Int(g) - Int(ground.g)) + abs(Int(b) - Int(ground.b)) > 30
        }, "nothing drawn")
    }

    /// The colour inside the box, just within its edge: its fill.
    private func fill(_ drawn: DrawnPixels, _ square: CGRect) -> (r: UInt8, g: UInt8, b: UInt8, a: UInt8) {
        drawn.pixel(at: CGPoint(x: square.minX + 3, y: square.minY + 3))
    }

    /// The mark: the pixels inside the box that are far from its fill.
    private func mark(_ drawn: DrawnPixels, _ square: CGRect) -> CGRect? {
        let f = fill(drawn, square)
        return drawn.boundingBox(in: square.insetBy(dx: 2, dy: 2)) { r, g, b, a in
            a > 200 && abs(Int(r) - Int(f.r)) + abs(Int(g) - Int(f.g)) + abs(Int(b) - Int(f.b)) > 90
        }
    }

    @MainActor func testAMixedCheckboxIsFilledLikeACheckedOneAndDrawsADash() throws {
        for scheme in [ColorScheme.light, .dark] {
            for look in Look.allCases {
                let name = "\(look.rawValue), \(scheme)"
                let mixed = try box(.indeterminate, look, scheme)
                let checked = try box(.checked, look, scheme)
                let mixedSquare = try square(mixed)
                let checkedSquare = try square(checked)
                // The same paint as checked: its fill, sampled the same way.
                let m = fill(mixed, mixedSquare), c = fill(checked, checkedSquare)
                XCTAssertTrue(
                    abs(Int(m.r) - Int(c.r)) <= 4 && abs(Int(m.g) - Int(c.g)) <= 4 && abs(Int(m.b) - Int(c.b)) <= 4 && m.a > 240,
                    "\(name): mixed is filled \(m), checked \(c)"
                )
                // A dash: a short level line across the middle, not a tick.
                let dash = try XCTUnwrap(mark(mixed, mixedSquare), "\(name): no mark on the mixed box")
                XCTAssertEqual(dash.width, 28.0 / 3 + 4.0 / 3, accuracy: 1.2, "\(name): the dash is \(dash.width) wide")
                XCTAssertLessThanOrEqual(dash.height, 2.4, "\(name): the mark is \(dash.height) tall, no dash")
                XCTAssertEqual(dash.midY, mixedSquare.midY, accuracy: 0.8, "\(name): the dash is off the middle")
                XCTAssertEqual(dash.midX, mixedSquare.midX, accuracy: 0.8, "\(name): the dash is off centre")
            }
        }
    }

    /// A tap on a mixed box checks it, as Radix's does; the others swap.
    func testATapOnAMixedCheckboxChecksIt() {
        XCTAssertEqual(KozmosCheckboxState.indeterminate.toggled, .checked)
        XCTAssertEqual(KozmosCheckboxState.checked.toggled, .unchecked)
        XCTAssertEqual(KozmosCheckboxState.unchecked.toggled, .checked)
        XCTAssertEqual(KozmosCheckboxState(true), .checked)
        XCTAssertEqual(KozmosCheckboxState(false), .unchecked)
    }
}
