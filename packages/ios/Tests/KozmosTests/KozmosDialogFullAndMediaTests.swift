import SwiftUI
import XCTest
@testable import Kozmos

/// Decisions 195 and 202 on SwiftUI: KozmosDialog's `size: .full`, the window
/// less 16 on each side, and its `media(label:bleeds:_:)`, above the title,
/// inside the padding or bled to the dialog's edges and top corners, the close
/// in the dialog's corner over it, decorative unless named.
///
/// Drawn without a window by `DrawnPixels`, in a 360 by 640 frame, so these
/// run in `swift test` on a Mac as well as on the simulator. The surface is
/// what is drawn opaque in the surface's colour: the scrim around it is not.
final class KozmosDialogFullAndMediaTests: XCTestCase {
    private let window = CGSize(width: 360, height: 640)

    @MainActor private func draw<V: View>(_ dialog: V) throws -> DrawnPixels {
        try DrawnPixels.draw(
            dialog
                .frame(width: window.width, height: window.height)
                .environment(\.colorScheme, .light),
            scale: 2
        )
    }

    /// The surface: the opaque pixels in Surface/0, the dialog's fill.
    @MainActor private func surface(_ drawn: DrawnPixels) throws -> CGRect {
        let fill = try DrawnPixels.resolved(KozmosColors.semanticsSurface0, in: .light)
        return try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(fill)), "no surface drawn")
    }

    private func isRed(_ p: (r: UInt8, g: UInt8, b: UInt8, a: UInt8)) -> Bool {
        p.a > 240 && p.r > 220 && p.g < 40 && p.b < 40
    }

    @MainActor func testFullFillsTheWindowLessSixteenOnEachSide() throws {
        let full = try surface(draw(KozmosDialog(isPresented: .constant(true), title: "Image 1", size: .full)))
        XCTAssertEqual(full.minX, 16, accuracy: 1, "16 from the start: \(full)")
        XCTAssertEqual(full.minY, 16, accuracy: 1, "16 from the top: \(full)")
        XCTAssertEqual(full.width, window.width - 32, accuracy: 1.5, "the window's width less 32: \(full)")
        XCTAssertEqual(full.height, window.height - 32, accuracy: 1.5, "the window's height less 32: \(full)")
        // The default keeps its size: as tall as its content, 32 in.
        let standard = try surface(draw(KozmosDialog(isPresented: .constant(true), title: "Image 1")))
        XCTAssertEqual(standard.minX, 32, accuracy: 1, "default: 32 from the start: \(standard)")
        XCTAssertLessThan(standard.height, 200, "default: as tall as its content: \(standard)")
    }

    @MainActor func testBledMediaReachesTheEdgesAndTopCornersAndTheCloseSitsOverIt() throws {
        let drawn = try draw(
            KozmosDialog(isPresented: .constant(true), title: "Interested in Analytics?")
                .media(label: "Charts rising over a floor plan", bleeds: true) {
                    Color(red: 1, green: 0, blue: 0).frame(height: 120)
                }
        )
        let dialog = try surface(drawn)
        let red = try XCTUnwrap(drawn.boundingBox { r, g, b, a in self.isRed((r, g, b, a)) }, "no media drawn")
        // Out to the surface's edges and its top, inside its 1 edge at most.
        XCTAssertEqual(red.minX, dialog.minX, accuracy: 1.5, "from the start edge: \(red) in \(dialog)")
        XCTAssertEqual(red.maxX, dialog.maxX, accuracy: 1.5, "to the end edge: \(red) in \(dialog)")
        // The surface's own top is hidden under the media: read the dialog's
        // top as 120 above where the media ends.
        XCTAssertEqual(red.height, 120, accuracy: 1.5, "as tall as the media: \(red)")
        // The top corners are the dialog's: its very corner is not red.
        XCTAssertFalse(isRed(drawn.pixel(at: CGPoint(x: red.minX + 0.5, y: red.minY + 0.5))), "the top start corner is rounded")
        XCTAssertFalse(isRed(drawn.pixel(at: CGPoint(x: red.maxX - 0.5, y: red.minY + 0.5))), "the top end corner is rounded")
        // The close: in the corner, 24 in, on its own surface over the media,
        // so the media does not show where it is; and only there.
        let close = CGPoint(x: red.maxX - 24 - 22, y: red.minY + 24 + 22)
        for dx in [-12.0, 0, 12] {
            let p = drawn.pixel(at: CGPoint(x: close.x + dx, y: close.y))
            XCTAssertFalse(isRed(p), "the close covers the media at \(close.x + dx), \(close.y): \(p)")
        }
        XCTAssertTrue(isRed(drawn.pixel(at: CGPoint(x: close.x - 40, y: close.y))), "the media shows beside the close")
    }

    @MainActor func testMediaInsideThePaddingKeepsTheDialogsTwentyFour() throws {
        let drawn = try draw(
            KozmosDialog(isPresented: .constant(true), title: "Interested in Analytics?")
                .media { Color(red: 1, green: 0, blue: 0).frame(height: 80) }
        )
        let dialog = try surface(drawn)
        let red = try XCTUnwrap(drawn.boundingBox { r, g, b, a in self.isRed((r, g, b, a)) }, "no media drawn")
        XCTAssertEqual(red.minX, dialog.minX + 24, accuracy: 1.5, "24 inside the start edge: \(red) in \(dialog)")
        XCTAssertEqual(red.maxX, dialog.maxX - 24, accuracy: 1.5, "24 inside the end edge: \(red) in \(dialog)")
        XCTAssertEqual(red.minY, dialog.minY + 24, accuracy: 1.5, "24 under the top edge: \(red) in \(dialog)")
    }

    /// Unnamed media is hidden from VoiceOver; named, it is one image.
    func testMediaIsDecorativeUnlessNamed() {
        let plain = KozmosDialog(isPresented: .constant(true), title: "Interested in Analytics?")
        let decorative = plain.media { Color.red }
        let named = plain.media(label: "Charts rising over a floor plan", bleeds: true) { Color.red }
        XCTAssertNil(plain.media)
        XCTAssertNotNil(decorative.media)
        XCTAssertNil(decorative.mediaLabel)
        XCTAssertFalse(decorative.mediaBleeds)
        XCTAssertEqual(named.mediaLabel, "Charts rising over a floor plan")
        XCTAssertTrue(named.mediaBleeds)
        XCTAssertEqual(named.size, .default)
    }
}
