import SwiftUI
import XCTest
@testable import Kozmos

/// The open colour picker's format row — the format menu, the value boxes
/// and the opacity box — at a phone's widths.
///
/// Until these tests the row was an HStack whose boxes could not shrink: the
/// menu 72pt, each value box at least 60 and the opacity box 52, 328pt with
/// its gaps. With the panel's 12pt padding the open picker needed 352pt, so
/// on a 375pt phone with 16pt margins (343pt) it grew 9pt past its frame, and
/// 32pt at 320. Where it does not fit, the row now wraps as React's
/// `repeat(auto-fit, minmax(3.5rem, 1fr))` grid does: equal columns at least
/// 56pt (96 for HEX) and at least as wide as the widest box's text, as many
/// to a line as fit. Where it fits, it is laid out as the HStack laid it out.
///
/// Drawn without a window by `DrawnPixels`, at 3x, so these run in `swift
/// test` on a Mac as well as on the simulator. The colour is #FF0000, so the
/// square holds no bluish grey for the boxes' border to be mistaken for, and
/// there are no presets, so the palette field is the panel's last box. The
/// sliders, and on iOS the menu's label, are UIKit and draw as placeholders
/// there; the boxes' outlines are SwiftUI's own and draw.
final class KozmosColorPickerFormatRowTests: XCTestCase {
    private static let scale: CGFloat = 3
    private static let margin: CGFloat = 16

    private struct Box: CustomStringConvertible {
        /// Left and right edges, top and bottom, in points.
        let minX: CGFloat, maxX: CGFloat, minY: CGFloat, maxY: CGFloat
        var width: CGFloat { maxX - minX }
        var height: CGFloat { maxY - minY }
        var description: String {
            String(format: "%.1f–%.1f (%.1f wide, %.1f tall)", minX, maxX, width, height)
        }
    }

    private struct Row: CustomStringConvertible {
        /// The panel's left and right edges, in points.
        let panelMinX: CGFloat, panelMaxX: CGFloat
        /// The boxes, a line of them at a time, top to bottom, each line left to right.
        let lines: [[Box]]
        var description: String {
            String(format: "panel %.1f–%.1f; ", panelMinX, panelMaxX)
                + lines.enumerated().map { "line \($0.offset + 1): \($0.element)" }.joined(separator: "; ")
        }
    }

    @MainActor private static func picker(
        width: CGFloat, format: KozmosColorPickerFormat = .hsl, rtl: Bool = false,
        textSize: DynamicTypeSize = .large
    ) -> some View {
        // The swatch at the top left is the border colour as drawn, for the
        // boxes' outlines to be found by.
        VStack(alignment: .leading, spacing: 0) {
            KozmosColors.semanticsBorderInput.frame(width: 8, height: 8)
            KozmosColorPicker(value: .constant("#FF0000"), presets: [], format: format, defaultOpen: true)
                .frame(width: width)
                .padding(.horizontal, margin)
                .padding(.vertical, 8)
                .environment(\.layoutDirection, rtl ? .rightToLeft : .leftToRight)
        }
        // A green no part of the picker draws, and no shade of the border.
        .background(Color(.sRGB, red: 0, green: 0.6, blue: 0, opacity: 1))
        .environment(\.colorScheme, .light)
        .environment(\.dynamicTypeSize, textSize)
    }

    /// Reads the panel's edges and the format row's boxes off the drawing:
    /// the boxes are the bands of pixel rows, above the palette field, that
    /// cross more of the border's vertical lines than the panel's own two.
    @MainActor private func row(
        width: CGFloat, format: KozmosColorPickerFormat = .hsl, rtl: Bool = false,
        textSize: DynamicTypeSize = .large
    ) throws -> Row {
        let pixels = try DrawnPixels.draw(Self.picker(width: width, format: format, rtl: rtl, textSize: textSize), scale: Self.scale)
        let swatch = pixels.pixel(at: CGPoint(x: 4, y: 4))
        let border = (r: Int(swatch.r), g: Int(swatch.g), b: Int(swatch.b))
        let isBorder: (Int, Int) -> Bool = { x, y in
            let p = pixels.pixel(at: CGPoint(x: (CGFloat(x) + 0.5) / Self.scale, y: (CGFloat(y) + 0.5) / Self.scale))
            return abs(Int(p.r) - border.r) <= 10 && abs(Int(p.g) - border.g) <= 10 && abs(Int(p.b) - border.b) <= 10
        }
        // Each pixel row's runs of border, as pixel columns.
        func runs(_ y: Int) -> [ClosedRange<Int>] {
            var found: [ClosedRange<Int>] = []
            var start: Int?
            for x in 0...pixels.width {
                let hit = x < pixels.width && isBorder(x, y)
                if hit, start == nil { start = x }
                if !hit, let s = start {
                    if let last = found.last, s - last.upperBound <= 2 {
                        found[found.count - 1] = last.lowerBound...(x - 1)
                    } else {
                        found.append(s...(x - 1))
                    }
                    start = nil
                }
            }
            return found
        }
        let rowRuns = (0..<pixels.height).map(runs)
        var bands: [ClosedRange<Int>] = []
        for y in rowRuns.indices where rowRuns[y].count >= 4 {
            if let last = bands.last, last.upperBound == y - 1 { bands[bands.count - 1] = last.lowerBound...y } else { bands.append(y...y) }
        }
        // The palette field is the last band and the format row's last line
        // the band above it; the lines above that are 6pt apart, closer than
        // the 12pt between the row and the opacity slider.
        let palette = try XCTUnwrap(bands.last, "no palette field")
        var lineBands: [ClosedRange<Int>] = []
        for band in bands.dropLast().reversed() {
            if let below = lineBands.first, CGFloat(below.lowerBound - band.upperBound) / Self.scale >= 10 { break }
            lineBands.insert(band, at: 0)
        }
        XCTAssertFalse(lineBands.isEmpty, "no format row above the palette field")
        let middleOfPalette = rowRuns[(palette.lowerBound + palette.upperBound) / 2]
        let centre: (ClosedRange<Int>) -> CGFloat = { CGFloat($0.lowerBound + $0.upperBound + 1) / 2 / Self.scale }
        let lines: [[Box]] = lineBands.map { band in
            let middle = (band.lowerBound + band.upperBound) / 2
            let sides = Array(rowRuns[middle].dropFirst().dropLast())
            return stride(from: 0, to: sides.count - 1, by: 2).map { i in
                let minX = centre(sides[i]), maxX = centre(sides[i + 1])
                // The box's top and bottom borders, straight up and down from
                // its middle. A line of one box starts its band below its top
                // border, where its sides part, so look a little past it.
                let column = Int((minX + maxX) / 2 * Self.scale)
                let reach = Int(4 * Self.scale)
                var top = middle, bottom = middle
                while top > band.lowerBound - reach, !isBorder(column, top) { top -= 1 }
                while bottom < band.upperBound + reach, !isBorder(column, bottom) { bottom += 1 }
                return Box(minX: minX, maxX: maxX, minY: CGFloat(top) / Self.scale, maxY: CGFloat(bottom + 1) / Self.scale)
            }
        }
        return Row(
            panelMinX: centre(try XCTUnwrap(middleOfPalette.first)),
            panelMaxX: centre(try XCTUnwrap(middleOfPalette.last)),
            lines: lines
        )
    }

    private static let phoneWidths: [CGFloat] = [320, 343, 359, 390]

    @MainActor private func laidOutWidth<V: View>(_ view: V, width: CGFloat) -> CGFloat {
        let offered = CGSize(width: width, height: 10_000)
        #if canImport(UIKit)
        return UIHostingController(rootView: view).sizeThatFits(in: offered).width
        #else
        return NSHostingController(rootView: view).sizeThatFits(in: offered).width
        #endif
    }

    /// Offered a phone's width, the open picker takes no more of it, in
    /// every format and reading direction.
    @MainActor func testTheOpenPickerIsNoWiderThanTheWidthItIsGiven() {
        for width in Self.phoneWidths {
            for format in [KozmosColorPickerFormat.hsl, .rgb, .hex] {
                for rtl in [false, true] {
                    let picker = KozmosColorPicker(value: .constant("#135BEC"), format: format, defaultOpen: true)
                        .environment(\.layoutDirection, rtl ? .rightToLeft : .leftToRight)
                    XCTAssertLessThanOrEqual(laidOutWidth(picker, width: width), width + 0.01,
                                             "\(format) at \(width)\(rtl ? ", right to left" : "")")
                }
            }
        }
    }

    /// Every box is drawn inside the panel's 12pt padding, none over another,
    /// in both reading directions. In RGB, #FF0000's channels are 255, 0 and
    /// 0: two boxes say the same, and both are drawn.
    @MainActor func testEveryBoxIsDrawnInsideThePanel() throws {
        for width in Self.phoneWidths {
            for format in [KozmosColorPickerFormat.hsl, .rgb, .hex] {
                for rtl in [false, true] {
                    let row = try row(width: width, format: format, rtl: rtl)
                    let state = "\(format) at \(width)\(rtl ? ", right to left" : ""): \(row)"
                    XCTAssertEqual(row.panelMinX, Self.margin, accuracy: 0.5, state)
                    XCTAssertEqual(row.panelMaxX, Self.margin + width, accuracy: 0.5, state)
                    XCTAssertEqual(row.lines.flatMap { $0 }.count, format == .hex ? 3 : 5, state)
                    for line in row.lines {
                        for box in line {
                            XCTAssertGreaterThanOrEqual(box.minX, row.panelMinX + 12 - 0.5, state)
                            XCTAssertLessThanOrEqual(box.maxX, row.panelMaxX - 12 + 0.5, state)
                        }
                        for (left, right) in zip(line, line.dropFirst()) {
                            XCTAssertGreaterThanOrEqual(right.minX - left.maxX, 6 - 0.5, state)
                        }
                    }
                }
            }
        }
    }

    /// Where the row fits — from 352pt at the default text size — it is the
    /// row it was: the menu 72pt, the value boxes sharing what is left
    /// between 60 and 72 each, the opacity box 52, 6pt apart from the panel's
    /// leading padding.
    @MainActor func testWhereTheRowFitsItIsLaidOutAsItWas() throws {
        for (width, value): (CGFloat, CGFloat) in [(359, 187.0 / 3), (390, 72), (430, 72)] {
            for rtl in [false, true] {
                let row = try row(width: width, rtl: rtl)
                let state = "at \(width)\(rtl ? ", right to left" : ""): \(row)"
                XCTAssertEqual(row.lines.count, 1, state)
                let boxes = try XCTUnwrap(row.lines.first)
                guard boxes.count == 5 else { return XCTFail(state) }
                let widths = (rtl ? boxes.reversed() : boxes).map(\.width)
                for (drawn, expected) in zip(widths, [72, value, value, value, 52]) {
                    XCTAssertEqual(drawn, expected, accuracy: 0.5, state)
                }
                for box in boxes { XCTAssertEqual(box.height, 36, accuracy: 0.5, state) }
                if rtl {
                    XCTAssertEqual(boxes[4].maxX, row.panelMaxX - 12, accuracy: 0.5, state)
                } else {
                    XCTAssertEqual(boxes[0].minX, row.panelMinX + 12, accuracy: 0.5, state)
                }
            }
        }
    }

    /// Where it does not fit it wraps as React's grid does: at 343 the five
    /// boxes share the 319pt as five 59pt columns on one line; at 320 four
    /// 69.5pt columns fit, and the opacity box starts a second line at the
    /// leading edge.
    @MainActor func testWhereTheRowDoesNotFitItWrapsIntoEqualColumns() throws {
        for (width, perLine, column): (CGFloat, [Int], CGFloat) in [(343, [5], 59), (320, [4, 1], 69.5)] {
            for rtl in [false, true] {
                let row = try row(width: width, rtl: rtl)
                let state = "at \(width)\(rtl ? ", right to left" : ""): \(row)"
                XCTAssertEqual(row.lines.map(\.count), perLine, state)
                for box in row.lines.flatMap({ $0 }) {
                    XCTAssertEqual(box.width, column, accuracy: 0.5, state)
                    XCTAssertEqual(box.height, 36, accuracy: 0.5, state)
                }
                if let last = row.lines.last?.first, row.lines.count > 1 {
                    if rtl {
                        XCTAssertEqual(last.maxX, row.panelMaxX - 12, accuracy: 0.5, state)
                    } else {
                        XCTAssertEqual(last.minX, row.panelMinX + 12, accuracy: 0.5, state)
                    }
                }
            }
        }
    }

    #if os(iOS)
    /// At the largest text sizes the row still fits the width, and wraps
    /// rather than squeezing a box's text: every box on a line is as tall as
    /// the others, one line of its text. The value boxes used to stop at
    /// 72pt, so at accessibility sizes their digits stood one above another,
    /// the menu's label became an ellipsis and "100%" broke across lines,
    /// even at 390.
    @MainActor func testAtLargeTextSizesTheRowWrapsRatherThanSqueezingItsText() throws {
        for textSize in [DynamicTypeSize.xxxLarge, .accessibility1, .accessibility3, .accessibility5] {
            for width in [CGFloat(343), 390] {
                for format in [KozmosColorPickerFormat.hsl, .hex] {
                    let state = "\(format) at \(width), \(textSize)"
                    let picker = KozmosColorPicker(value: .constant("#135BEC"), format: format, defaultOpen: true)
                        .environment(\.dynamicTypeSize, textSize)
                    XCTAssertLessThanOrEqual(laidOutWidth(picker, width: width), width + 0.01, state)
                    let row = try row(width: width, format: format, textSize: textSize)
                    for line in row.lines {
                        let heights = line.map(\.height)
                        XCTAssertLessThanOrEqual((heights.max() ?? 0) - (heights.min() ?? 0), 1, "\(state): \(row)")
                    }
                }
            }
        }
    }
    #endif
}
