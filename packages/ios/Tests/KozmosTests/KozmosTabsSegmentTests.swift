import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 65 (Olcay, 2026-10-08): tabs draw React's raised segment on every
/// platform. The list is a muted track, background/100; the selected tab is a
/// segment of background/0 inside it, raised, with foreground/0 words, and the
/// other tabs' words are foreground/400. Nothing on tabs is the theme's
/// colour. Until the decision SwiftUI drew a background/0 list with a 2pt
/// theme-500 underline under the selected tab.
///
/// Read off what is drawn, in light and in dark, left to right and right to
/// left. The colours are written out: they are what the decision names. The
/// tabs sit on a mid grey that is none of them, so a background/0 pixel can
/// only be the segment. Drawn without a window by `DrawnPixels`, so these run
/// in `swift test` on a Mac as well as on the simulator.
final class KozmosTabsSegmentTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    private static let theme500: Pixel = (0x13, 0x5B, 0xEC, 255)
    private static func background0(_ scheme: ColorScheme) -> Pixel {
        scheme == .dark ? (0x00, 0x00, 0x00, 255) : (0xFF, 0xFF, 0xFF, 255)
    }
    private static func background100(_ scheme: ColorScheme) -> Pixel {
        scheme == .dark ? (0x17, 0x19, 0x1C, 255) : (0xE3, 0xE4, 0xE8, 255)
    }
    private static func foreground0(_ scheme: ColorScheme) -> Pixel {
        scheme == .dark ? (0xFF, 0xFF, 0xFF, 255) : (0x00, 0x00, 0x00, 255)
    }
    private static func foreground400(_ scheme: ColorScheme) -> Pixel {
        scheme == .dark ? (0xA2, 0x9D, 0x90, 255) : (0x5D, 0x62, 0x6F, 255)
    }

    private static func describe(_ p: Pixel) -> String {
        String(format: "#%02X%02X%02X", p.r, p.g, p.b)
    }

    /// Two tabs, the first selected, 280 wide on a mid grey, at 3x so a stem
    /// of text covers whole pixels. The grey reaches 24pt past the tabs: the
    /// old underline was drawn 12pt below the tab's own frame, and a drawing
    /// that ends at the tabs' edge would have cut it off.
    @MainActor private func draw(_ scheme: ColorScheme, rtl: Bool = false, disabled: Bool = false) throws -> DrawnPixels {
        try DrawnPixels.draw(
            KozmosTabs(selection: .constant("overview")) {
                KozmosTabsList {
                    KozmosTabsTrigger(value: "overview", title: "Overview", selection: .constant("overview"))
                    KozmosTabsTrigger(value: "access", title: "Access", selection: .constant("overview"))
                }
            }
            .disabled(disabled)
            .frame(width: 280)
            .padding(24)
            .background(Color(.sRGB, red: 0.5, green: 0.5, blue: 0.5, opacity: 1))
            .environment(\.layoutDirection, rtl ? .rightToLeft : .leftToRight)
            .environment(\.colorScheme, scheme),
            scale: 3
        )
    }

    /// The box, in points, round `colour` inside `region`, if the colour fills
    /// at least `share` of it: a fill, not the scattered pixels of an
    /// anti-aliased edge that happen to land on the colour, which cover under
    /// 1% of theirs.
    private static func fill(of colour: Pixel, in pixels: DrawnPixels, region: CGRect? = nil, share: Double = 0.5, tolerance: Int = 4) -> CGRect? {
        let matches = DrawnPixels.matches(colour, tolerance: tolerance)
        let area = region ?? CGRect(origin: .zero, size: pixels.size)
        guard let box = pixels.boundingBox(in: area, where: matches) else { return nil }
        let filled = pixels.count(in: box, where: matches)
        let boxPixels = (box.width * pixels.scale).rounded() * (box.height * pixels.scale).rounded()
        return Double(filled) >= share * Double(boxPixels) ? box : nil
    }

    /// The track: background/100 over at least a quarter of its box, since
    /// the segment and the words cover much of it, give or take 12 a channel,
    /// so the track the segment's shadow falls on still counts.
    private static func track(in pixels: DrawnPixels, _ scheme: ColorScheme) -> CGRect? {
        fill(of: background100(scheme), in: pixels, share: 0.25, tolerance: 12)
    }

    /// The track, the segment inside it at the first tab's end, and no theme
    /// 500, as a list of what is wrong, so a failure names all of it.
    @MainActor private func segmentProblems(_ scheme: ColorScheme, rtl: Bool) throws -> [String] {
        let pixels = try draw(scheme, rtl: rtl)
        let whereDrawn = "\(scheme), \(rtl ? "right to left" : "left to right")"
        var problems: [String] = []

        let track = Self.track(in: pixels, scheme)
        let segment = track.flatMap { Self.fill(of: Self.background0(scheme), in: pixels, region: $0) }
        let segmentPixels = segment.map { pixels.count(in: $0, where: DrawnPixels.matches(Self.background0(scheme), tolerance: 4)) } ?? 0
        let blue = pixels.count(in: CGRect(origin: .zero, size: pixels.size), where: DrawnPixels.matches(Self.theme500, tolerance: 6))

        if track == nil {
            problems.append("\(whereDrawn): no background/100 \(Self.describe(Self.background100(scheme))) track is drawn")
        } else if segment == nil || segmentPixels < 400 {
            problems.append("\(whereDrawn): the track holds \(segmentPixels) background/0 \(Self.describe(Self.background0(scheme))) pixels, not a segment")
        }
        if let track, let segment {
            // background/100 shows above, below and at the outer end of the
            // segment: it is inside the track, not the track itself.
            let above = segment.minY - track.minY
            let below = track.maxY - segment.maxY
            let outer = rtl ? track.maxX - segment.maxX : segment.minX - track.minX
            if above < 2 || below < 2 || outer < 2 {
                problems.append("\(whereDrawn): background/100 does not surround the segment (track \(track), segment \(segment): \(above) above, \(below) below, \(outer) at its outer end)")
            }
            // The first tab is selected: its segment is at the track's start.
            let atStart = rtl ? segment.midX > track.midX : segment.midX < track.midX
            if !atStart {
                problems.append("\(whereDrawn): the first tab's segment is not at the track's start (track \(track), segment \(segment))")
            }
            // About half the track: one of two tabs, not the whole list.
            if segment.width > track.width * 0.6 {
                problems.append("\(whereDrawn): the segment is \(segment.width) of the track's \(track.width), more than one of two tabs")
            }
        }
        if blue * 100 > max(segmentPixels, 1) {
            problems.append("\(whereDrawn): \(blue) pixels are theme 500 #135BEC; tabs draw no theme colour")
        }
        return problems
    }

    @MainActor func testTheSelectedTabIsARaisedBackground0SegmentInABackground100TrackWithNoThemeColourInLightAndDark() throws {
        let problems = try [ColorScheme.light, .dark].flatMap { try segmentProblems($0, rtl: false) }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    @MainActor func testRightToLeftTheFirstTabsSegmentIsAtTheTracksRightInLightAndDark() throws {
        let problems = try [ColorScheme.light, .dark].flatMap { try segmentProblems($0, rtl: true) }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// The selected tab's words are foreground/0 on the segment, the other's
    /// foreground/400 on the track, as React's `text-foreground` and
    /// `text-muted-foreground`. Text is anti-aliased, so this counts the
    /// pixels a stem covers whole.
    @MainActor func testTheSelectedWordsAreForeground0AndTheOthersForeground400InLightAndDark() throws {
        var problems: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let pixels = try draw(scheme)
            guard let track = Self.track(in: pixels, scheme) else {
                problems.append("\(scheme): no background/100 track is drawn")
                continue
            }
            let (startHalf, endHalf) = track.divided(atDistance: track.width / 2, from: .minXEdge)
            let selected = pixels.count(in: startHalf, where: DrawnPixels.matches(Self.foreground0(scheme), tolerance: 8))
            let other = pixels.count(in: endHalf, where: DrawnPixels.matches(Self.foreground400(scheme), tolerance: 8))
            if selected < 20 {
                problems.append("\(scheme): the selected tab draws \(selected) foreground/0 \(Self.describe(Self.foreground0(scheme))) word pixels")
            }
            if other < 20 {
                problems.append("\(scheme): the other tab draws \(other) foreground/400 \(Self.describe(Self.foreground400(scheme))) word pixels")
            }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// The segment is raised: just below it the track is darker than the
    /// same row beside it, where no shadow falls.
    @MainActor func testTheSegmentCastsTheRaisedShadowOnTheTrackInLightAndDark() throws {
        var problems: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let pixels = try draw(scheme)
            guard let track = Self.track(in: pixels, scheme),
                  let segment = Self.fill(of: Self.background0(scheme), in: pixels, region: track) else {
                problems.append("\(scheme): no segment in a track to cast a shadow")
                continue
            }
            let y = segment.maxY + 1
            let under = pixels.pixel(at: CGPoint(x: segment.midX, y: y))
            let beside = pixels.pixel(at: CGPoint(x: (segment.maxX + track.maxX) / 2, y: y))
            let lightness = { (p: Pixel) in Int(p.r) + Int(p.g) + Int(p.b) }
            if y >= track.maxY || lightness(under) > lightness(beside) - 3 {
                problems.append("\(scheme): under the segment the track is \(Self.describe(under)), beside it \(Self.describe(beside)): no shadow")
            }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// A disabled tab is drawn at half, as React's `disabled:opacity-50`: the
    /// selected segment shows the track through it, half and half — not at
    /// full strength, and not dimmed twice.
    @MainActor func testADisabledTabIsDrawnAtHalfInLightAndDark() throws {
        var problems: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let enabled = try draw(scheme)
            guard let track = Self.track(in: enabled, scheme),
                  let segment = Self.fill(of: Self.background0(scheme), in: enabled, region: track) else {
                problems.append("\(scheme): no segment in a track to dim")
                continue
            }
            let disabled = try draw(scheme, disabled: true)
            // In the segment's own padding, clear of its words and corners;
            // and the track in the 4pt at its far end, clear of the shadow.
            let point = CGPoint(x: segment.minX + 4, y: segment.midY)
            let ground = CGPoint(x: track.maxX - 2, y: segment.midY)
            let segmentColour = enabled.pixel(at: point), trackColour = enabled.pixel(at: ground)
            let half: Pixel = (
                UInt8((Int(segmentColour.r) + Int(trackColour.r)) / 2),
                UInt8((Int(segmentColour.g) + Int(trackColour.g)) / 2),
                UInt8((Int(segmentColour.b) + Int(trackColour.b)) / 2),
                255
            )
            let p = disabled.pixel(at: point)
            if !DrawnPixels.matches(half, tolerance: 4)(p.r, p.g, p.b, p.a) {
                problems.append("\(scheme): disabled, the selected segment is \(Self.describe(p)) at \(point); half the segment \(Self.describe(segmentColour)) over the track \(Self.describe(trackColour)) is \(Self.describe(half))")
            }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }
}
