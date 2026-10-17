import SwiftUI
import XCTest
@testable import Kozmos

/// The colour picker's saturation and lightness square is drawn physically,
/// as React draws it: white at the left, the hue at the right, black at the
/// bottom, in either reading direction. The handle shows the value on that
/// square, so it must sit over the colour the value is, right to left too.
/// Until this test the gradient stayed physical right to left while the
/// handle's alignment and offset mirrored, so a full-saturation red sat its
/// handle over the white end.
///
/// The picker is drawn open with #FF0000 (hue 0, saturation 100, lightness
/// 50) and no presets, so the only reds drawn are the field's swatch and the
/// square. Drawn without a window by `DrawnPixels`, so these run in
/// `swift test` on a Mac as well as on the simulator.
final class KozmosColorPickerAreaTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    private static func describe(_ p: Pixel) -> String {
        String(format: "#%02X%02X%02X", p.r, p.g, p.b)
    }

    /// How much redder than its other channels a pixel is.
    private static func redness(_ p: Pixel) -> Int {
        Int(p.r) - max(Int(p.g), Int(p.b))
    }

    private struct Square {
        /// The square's left and right edges, in points.
        let minX: CGFloat
        let maxX: CGFloat
        /// The handle's box, in points.
        let handle: CGRect
        /// The square a quarter of the way down, at its left and right ends.
        let leftEnd: Pixel
        let rightEnd: Pixel
        /// The square just above the handle: the colour the handle points at.
        let atHandle: Pixel
    }

    /// Draws the open picker 360 wide on a mid grey, at 2x, and reads the
    /// square off it. At 320 the format row is wider than the panel and the
    /// panel outgrows the frame.
    @MainActor private func square(value: String = "#FF0000", rtl: Bool) throws -> Square {
        let pixels = try DrawnPixels.draw(
            KozmosColorPicker(value: .constant(value), presets: [], defaultOpen: true)
                .frame(width: 360)
                .padding(16)
                .background(Color(.sRGB, red: 0.5, green: 0.5, blue: 0.5, opacity: 1))
                .environment(\.layoutDirection, rtl ? .rightToLeft : .leftToRight)
                .environment(\.colorScheme, .light)
        )
        // The square is the one tall run of red rows: the swatch is 32pt, and
        // the square's bottom third is too dark to count as red.
        let reds = pixels.bands { r, g, b, a in a > 240 && Int(r) - max(Int(g), Int(b)) > 80 }
        let band = try XCTUnwrap(reds.first { $0.height > 60 }, "no square among \(reds)")
        // A quarter of the way down the square its lightest pixel is under
        // 200 a channel and the panel round it over 230, so the run of darker
        // pixels round the middle of the drawing is the square.
        let rowY = band.minY + 36
        let isPanel: (Pixel) -> Bool = { $0.r > 230 && $0.g > 230 && $0.b > 230 }
        let middle = pixels.size.width / 2
        var minX = middle, maxX = middle
        while minX > 0, !isPanel(pixels.pixel(at: CGPoint(x: minX - 0.5, y: rowY))) { minX -= 0.5 }
        while maxX < pixels.size.width, !isPanel(pixels.pixel(at: CGPoint(x: maxX + 0.5, y: rowY))) { maxX += 0.5 }
        // At lightness 50 the handle is mid-square, where the black is half
        // drawn and only the handle is white.
        let handle = try XCTUnwrap(pixels.boundingBox(
            in: CGRect(x: minX + 1, y: band.minY + 48, width: maxX - minX - 2, height: 48),
            where: { r, g, b, a in a > 240 && r > 245 && g > 245 && b > 245 }
        ), "no handle")
        return Square(
            minX: minX,
            maxX: maxX,
            handle: handle,
            leftEnd: pixels.pixel(at: CGPoint(x: minX + 4, y: rowY)),
            rightEnd: pixels.pixel(at: CGPoint(x: maxX - 4, y: rowY)),
            atHandle: pixels.pixel(at: CGPoint(x: handle.midX, y: handle.minY - 4))
        )
    }

    private static func report(_ s: Square, rtl: Bool) -> String {
        "\(rtl ? "right to left" : "left to right"): square x \(s.minX)–\(s.maxX), handle centre x \(s.handle.midX)"
            + " (\(Int(((s.handle.midX - s.minX) / (s.maxX - s.minX) * 100).rounded()))% across),"
            + " left end \(describe(s.leftEnd)), right end \(describe(s.rightEnd)),"
            + " above the handle \(describe(s.atHandle))"
    }

    /// The hue is at the right and white at the left in both directions.
    @MainActor func testTheSquareRunsWhiteToTheHueLeftToRightInBothDirections() throws {
        for rtl in [false, true] {
            let s = try square(rtl: rtl)
            XCTAssertLessThan(Self.redness(s.leftEnd), 60, Self.report(s, rtl: rtl))
            XCTAssertGreaterThan(Self.redness(s.rightEnd), 120, Self.report(s, rtl: rtl))
        }
    }

    /// Full saturation puts the handle at the square's right edge, over the
    /// hue, in both directions: the colour beside it is the red it shows.
    @MainActor func testAFullySaturatedHandleSitsOverTheHueInBothDirections() throws {
        for rtl in [false, true] {
            let s = try square(rtl: rtl)
            XCTAssertEqual(s.handle.midX, s.maxX - 9, accuracy: 2, Self.report(s, rtl: rtl))
            XCTAssertGreaterThan(Self.redness(s.atHandle), 80, Self.report(s, rtl: rtl))
        }
    }

    /// No saturation puts the handle at the square's left edge, over the
    /// white, in both directions. #808080 is hue 0, saturation 0.
    @MainActor func testAnUnsaturatedHandleSitsOverTheWhiteInBothDirections() throws {
        for rtl in [false, true] {
            let s = try square(value: "#808080", rtl: rtl)
            XCTAssertEqual(s.handle.midX, s.minX + 9, accuracy: 2, Self.report(s, rtl: rtl))
            XCTAssertLessThan(Self.redness(s.atHandle), 30, Self.report(s, rtl: rtl))
        }
    }
}
