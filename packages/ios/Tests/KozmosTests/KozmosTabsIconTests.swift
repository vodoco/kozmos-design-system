import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-152: a tab can carry an icon, stacked over its title, keeping
/// decision 65's raised segment. The icon is 20pt square, 4pt over the
/// title, both centred in the tab, and drawn in the title's colour:
/// foreground/0 on the selected segment, foreground/400 on the track. The
/// track grows to hold the taller tab. Until then a tab was its title alone.
///
/// Read off what is drawn, in light and dark, left to right and right to
/// left. The icon here is a plain square, so its edges can be measured; it
/// fills with the tab's foreground, as an SF Symbol or a KozmosIcon does.
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on the simulator.
final class KozmosTabsIconTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    private static func describe(_ p: Pixel) -> String {
        String(format: "#%02X%02X%02X", p.r, p.g, p.b)
    }

    /// Two tabs, the first selected, 280 wide on a mid grey that is none of
    /// the tabs' colours, at 3x.
    @MainActor private func draw<Icon: View>(_ scheme: ColorScheme, rtl: Bool = false, @ViewBuilder icon: @escaping () -> Icon) throws -> DrawnPixels {
        try DrawnPixels.draw(
            KozmosTabsList {
                KozmosTabsTrigger(value: "hours", title: "Hours", selection: .constant("hours"), icon: icon)
                KozmosTabsTrigger(value: "access", title: "Access", selection: .constant("hours"), icon: icon)
            }
            .frame(width: 280)
            .padding(24)
            .background(Color(.sRGB, red: 0.5, green: 0.5, blue: 0.5, opacity: 1))
            .environment(\.layoutDirection, rtl ? .rightToLeft : .leftToRight)
            .environment(\.colorScheme, scheme),
            scale: 3
        )
    }

    @MainActor private func drawPlain(_ scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(
            KozmosTabsList {
                KozmosTabsTrigger(value: "hours", title: "Hours", selection: .constant("hours"))
                KozmosTabsTrigger(value: "access", title: "Access", selection: .constant("hours"))
            }
            .frame(width: 280)
            .padding(24)
            .background(Color(.sRGB, red: 0.5, green: 0.5, blue: 0.5, opacity: 1))
            .environment(\.colorScheme, scheme),
            scale: 3
        )
    }

    /// The track: background/100 over at least a quarter of its box, give or
    /// take 12 a channel for the segment's shadow on it.
    @MainActor private static func track(in pixels: DrawnPixels, _ scheme: ColorScheme) throws -> CGRect? {
        let colour = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground100, in: scheme)
        let matches = DrawnPixels.matches(colour, tolerance: 12)
        guard let box = pixels.boundingBox(in: CGRect(origin: .zero, size: pixels.size), where: matches) else { return nil }
        let filled = pixels.count(in: box, where: matches)
        let boxPixels = (box.width * pixels.scale).rounded() * (box.height * pixels.scale).rounded()
        return Double(filled) >= 0.25 * Double(boxPixels) ? box : nil
    }

    /// The two tabs' boxes, left and right: the track less its 4pt ends,
    /// halved.
    private static func tabs(in track: CGRect) -> (left: CGRect, right: CGRect) {
        let halves = track.insetBy(dx: 4, dy: 0).divided(atDistance: (track.width - 8) / 2, from: .minXEdge)
        return (halves.slice, halves.remainder)
    }

    /// One tab's icon and title, as the bands of its ink, top to bottom, in
    /// the tab's half of the track: the solid icon square, then the title's
    /// line, and what is wrong with how they stack.
    @MainActor private func stackProblems(_ scheme: ColorScheme, rtl: Bool) throws -> [String] {
        let whereDrawn = "\(scheme), \(rtl ? "right to left" : "left to right")"
        let pixels = try draw(scheme, rtl: rtl) { Rectangle() }
        guard let track = try Self.track(in: pixels, scheme) else {
            return ["\(whereDrawn): no background/100 track is drawn"]
        }
        let (leftHalf, rightHalf) = Self.tabs(in: track)
        // The first tab, selected, is at the track's start: the right, right to left.
        let tabs: [(name: String, half: CGRect, ink: Color, inkName: String)] = [
            ("the selected tab", rtl ? rightHalf : leftHalf, KozmosColors.primitivesColorsForeground0, "foreground/0"),
            ("the other tab", rtl ? leftHalf : rightHalf, KozmosColors.primitivesColorsForeground400, "foreground/400")
        ]
        var problems: [String] = []
        for tab in tabs {
            let ink = try DrawnPixels.resolved(tab.ink, in: scheme)
            let part = pixels.cropped(to: tab.half)
            let bands = part.bands(where: DrawnPixels.matches(ink, tolerance: 8))
            let label = "\(whereDrawn), \(tab.name)"
            guard bands.count >= 2 else {
                problems.append("\(label): \(bands.count) band(s) of \(tab.inkName) \(Self.describe(ink)) ink, not an icon over a title: \(bands)")
                continue
            }
            let icon = bands[0], title = bands[1]
            // The icon is a 20pt square in the title's colour.
            if abs(icon.width - 20) > 0.7 || abs(icon.height - 20) > 0.7 {
                problems.append("\(label): the icon is \(icon.size), not 20 by 20, in \(tab.inkName)")
            }
            // Over the title, 4pt clear of it; the glyphs' own leading adds a little.
            let gap = title.minY - icon.maxY
            if gap < 4 - 0.4 || gap > 9 {
                problems.append("\(label): the title starts \(gap)pt under the icon, not 4 and its leading")
            }
            // Both centred in the tab.
            let centre = tab.half.width / 2
            if abs(icon.midX - centre) > 1 {
                problems.append("\(label): the icon's centre is \(icon.midX), the tab's \(centre)")
            }
            if abs(title.midX - centre) > 1.5 {
                problems.append("\(label): the title's centre is \(title.midX), the tab's \(centre)")
            }
        }
        return problems
    }

    @MainActor func testAnIconStacksCentredOverItsTitleInTheTitlesColourInLightAndDark() throws {
        let problems = try [ColorScheme.light, .dark].flatMap { try stackProblems($0, rtl: false) }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    @MainActor func testRightToLeftAnIconStillStacksCentredOverItsTitle() throws {
        let problems = try [ColorScheme.light, .dark].flatMap { try stackProblems($0, rtl: true) }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// The track grows to hold the stack: its 4pt inset, the tab's 6pt above
    /// and below, the 20pt icon, its 4pt and the title's line, where a plain
    /// track is 44. The selected tab is still decision 65's segment, 4pt
    /// inside it top and bottom.
    @MainActor func testTheTrackGrowsToHoldTheStackAndTheSegmentStaysRaisedInIt() throws {
        var problems: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let plain = try drawPlain(scheme)
            let stacked = try draw(scheme) { Rectangle() }
            guard let plainTrack = try Self.track(in: plain, scheme),
                  let track = try Self.track(in: stacked, scheme) else {
                problems.append("\(scheme): no background/100 track is drawn")
                continue
            }
            // The title's line as this platform sets it: a Text's frame.
            let line = try DrawnPixels.draw(Text("Hours").font(KozmosTypography.subheadline).fontWeight(.medium), scale: 3).size.height
            let expected = 4 + 6 + 20 + 4 + line + 6 + 4
            if abs(track.height - expected) > 1 || track.height <= plainTrack.height {
                problems.append("\(scheme): the track is \(track.height) with icons and \(plainTrack.height) without, not \(expected): 4 + 6 + the icon's 20 + 4 + the title's \(line) + 6 + 4")
            }
            let background0 = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme)
            guard let segment = stacked.boundingBox(in: track, where: DrawnPixels.matches(background0, tolerance: 4)) else {
                problems.append("\(scheme): no background/0 segment in the track")
                continue
            }
            let above = segment.minY - track.minY, below = track.maxY - segment.maxY
            if abs(above - 4) > 1 || abs(below - 4) > 1 {
                problems.append("\(scheme): the segment is \(above) under the track's top and \(below) over its bottom, not 4")
            }
            if segment.width > track.width * 0.6 {
                problems.append("\(scheme): the segment is \(segment.width) of the track's \(track.width), more than one of two tabs")
            }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// A KozmosIcon at its default colour takes the tab's, as React's icon is
    /// currentColor: foreground/400 on an unselected tab, not the icon's own
    /// foreground/100.
    @MainActor func testAKozmosIconTakesTheTabsColour() throws {
        var problems: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let pixels = try draw(scheme) { KozmosIcon("check") }
            guard let track = try Self.track(in: pixels, scheme) else {
                problems.append("\(scheme): no background/100 track is drawn")
                continue
            }
            let other = Self.tabs(in: track).right
            // The icon's 20pt, above the title.
            let iconRow = CGRect(x: other.minX, y: track.minY + 4, width: other.width, height: 6 + 20)
            let ink = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground400, in: scheme)
            let own = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground100, in: scheme)
            let inked = pixels.count(in: iconRow, where: DrawnPixels.matches(ink, tolerance: 8))
            let ownInked = pixels.count(in: iconRow, where: DrawnPixels.matches(own, tolerance: 8))
            if inked < 20 || ownInked * 4 > inked {
                problems.append("\(scheme): the icon draws \(inked) foreground/400 \(Self.describe(ink)) pixels and \(ownInked) foreground/100 \(Self.describe(own))")
            }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// A list where one tab has an icon and the other has only words, the
    /// given one selected.
    @MainActor private func drawMixed(_ scheme: ColorScheme, selected: String) throws -> DrawnPixels {
        try DrawnPixels.draw(
            KozmosTabsList {
                KozmosTabsTrigger(value: "hours", title: "Hours", selection: .constant(selected)) { Rectangle() }
                KozmosTabsTrigger(value: "access", title: "Access", selection: .constant(selected))
            }
            .frame(width: 280)
            .padding(24)
            .background(Color(.sRGB, red: 0.5, green: 0.5, blue: 0.5, opacity: 1))
            .environment(\.colorScheme, scheme),
            scale: 3
        )
    }

    /// Decision 3: once one tab in a list has an icon, every tab in it takes
    /// the stacked height, so the raised segment fills the track whichever
    /// tab is chosen. A tab with only words centres its title in that
    /// height. Chosen, the word tab's segment is as tall as the icon tab's,
    /// 4pt inside the track top and bottom, and its title's line sits on the
    /// segment's centre.
    @MainActor func testEveryTabInAListWithAnIconTakesTheStackedHeight() throws {
        var problems: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let iconChosen = try drawMixed(scheme, selected: "hours")
            let wordChosen = try drawMixed(scheme, selected: "access")
            let background0 = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme)
            guard let iconTrack = try Self.track(in: iconChosen, scheme),
                  let wordTrack = try Self.track(in: wordChosen, scheme),
                  let iconSegment = iconChosen.boundingBox(in: iconTrack, where: DrawnPixels.matches(background0, tolerance: 4)),
                  let wordSegment = wordChosen.boundingBox(in: wordTrack, where: DrawnPixels.matches(background0, tolerance: 4)) else {
                problems.append("\(scheme): no track or no background/0 segment in it")
                continue
            }
            if abs(wordTrack.height - iconTrack.height) > 0.7 {
                problems.append("\(scheme): the track is \(wordTrack.height) with the word tab chosen and \(iconTrack.height) with the icon tab")
            }
            if abs(wordSegment.height - iconSegment.height) > 0.7 {
                problems.append("\(scheme): the word tab's segment is \(wordSegment.height) tall, the icon tab's \(iconSegment.height)")
            }
            let above = wordSegment.minY - wordTrack.minY, below = wordTrack.maxY - wordSegment.maxY
            if abs(above - 4) > 1 || abs(below - 4) > 1 {
                problems.append("\(scheme): the word tab's segment is \(above) under the track's top and \(below) over its bottom, not 4")
            }
            // The chosen word tab's title, foreground/0, centred in its segment.
            let ink = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground0, in: scheme)
            if let title = wordChosen.boundingBox(in: wordSegment, where: DrawnPixels.matches(ink, tolerance: 8)) {
                // Cap height over the baseline sits a little high of the line's centre.
                if abs(title.midY - wordSegment.midY) > 1.5 {
                    problems.append("\(scheme): the word tab's title is centred at \(title.midY), its segment at \(wordSegment.midY)")
                }
            } else {
                problems.append("\(scheme): the chosen word tab draws no foreground/0 title in its segment")
            }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// A tab with no icon is drawn as before: one line in a 44pt track.
    @MainActor func testATabWithNoIconKeepsTheFortyFourPointTrack() throws {
        for scheme in [ColorScheme.light, .dark] {
            let pixels = try drawPlain(scheme)
            let track = try XCTUnwrap(try Self.track(in: pixels, scheme), "\(scheme): no track")
            XCTAssertEqual(track.height, 44, accuracy: 0.7, "\(scheme): the track")
            let background0 = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme)
            let segment = try XCTUnwrap(pixels.boundingBox(in: track, where: DrawnPixels.matches(background0, tolerance: 4)),
                                        "\(scheme): no segment")
            XCTAssertEqual(segment.height, 36, accuracy: 0.7, "\(scheme): the segment")
            let ink = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground400, in: scheme)
            let other = Self.tabs(in: track).right
            XCTAssertEqual(pixels.cropped(to: other).bands(where: DrawnPixels.matches(ink, tolerance: 8)).count, 1,
                           "\(scheme): the other tab draws more than its one line")
        }
    }
}
