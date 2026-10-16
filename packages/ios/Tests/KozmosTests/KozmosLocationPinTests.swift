import SwiftUI
import XCTest
@testable import Kozmos

/// Decisions 79–81 (Olcay, 15 Oct 2026, GAP-120): LocationPin draws the
/// SDK's map result markers, measured against the boards' references in
/// `.notes/track2/` and read back from what is drawn, in light and in dark.
///
/// - A result is a 32 pill, at least 32 wide and growing with its number
///   (8 from the number to each edge), its 12 × 7 pointer's tip 6 below it;
///   the tip is the anchor. At rest: background/0 inside a theme-600 border,
///   the number theme 600. Selected: theme 600 filled, the number
///   foreground/1000. No number: an 8 dot in the number's colour.
/// - Featured is a 44 tile (52 selected), a 3 foreground/0 rim on
///   background/0, with a 6 foreground/0 dot 4 below; the dot's centre is the
///   anchor.
/// - A place is a 40 teardrop in emotional success 800 with a 20
///   background/0 disc, its 6 dot 6 below; the dot's centre is the anchor. It
///   wins over featured and a number.
///
/// The pin lays itself out with its anchor at the centre of its frame, so
/// `.position(point)` puts the anchor on the point.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on the simulator. Against the pin before these decisions
/// (with `place`, `onOpen` and `openLabel` added and ignored) every test here
/// fails: the record is in the change that added them.
final class KozmosLocationPinTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    /// What the spec writes for each token, so a token that drifts fails
    /// here as well as a pin drawn in the wrong one.
    private static let specHex: [String: (light: String, dark: String)] = [
        "theme 600": ("#1051E8", "#5887F3"),
        "background/0": ("#FFFFFF", "#000000"),
        "foreground/0": ("#000000", "#FFFFFF"),
        "foreground/1000": ("#FFFFFF", "#000000"),
        "emotional success 800": ("#197F4C", "#A0ECC6"),
    ]

    private struct Palette {
        let theme600: Pixel
        let background0: Pixel
        let foreground0: Pixel
        let foreground1000: Pixel
        let success800: Pixel
    }

    private static func hex(_ p: Pixel) -> String { String(format: "#%02X%02X%02X", p.r, p.g, p.b) }

    /// The tokens as they resolve in `scheme`, each checked against the spec.
    @MainActor private func palette(_ scheme: ColorScheme) throws -> Palette {
        let palette = Palette(
            theme600: try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: scheme),
            background0: try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme),
            foreground0: try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground0, in: scheme),
            foreground1000: try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground1000, in: scheme),
            success800: try DrawnPixels.resolved(KozmosColors.primitivesColorsEmotionalSuccess800, in: scheme)
        )
        let drawn: [String: Pixel] = [
            "theme 600": palette.theme600, "background/0": palette.background0, "foreground/0": palette.foreground0,
            "foreground/1000": palette.foreground1000, "emotional success 800": palette.success800,
        ]
        for (name, pixel) in drawn {
            let spec = try XCTUnwrap(Self.specHex[name])
            XCTAssertEqual(Self.hex(pixel), scheme == .dark ? spec.dark : spec.light, "\(scheme): \(name) is not the spec's")
        }
        return palette
    }

    /// The pin alone on nothing, at 3x: where it draws, a pixel is opaque;
    /// its shadow is at most 40% black, so it never is.
    @MainActor private func draw<V: View>(_ view: V, in scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(view.environment(\.colorScheme, scheme), scale: 3)
    }

    private static let opaque: (UInt8, UInt8, UInt8, UInt8) -> Bool = { _, _, _, a in a > 200 }

    private static func near(_ p: Pixel, _ q: Pixel, by tolerance: Int = 8) -> Bool {
        p.a > 240 && abs(Int(p.r) - Int(q.r)) <= tolerance && abs(Int(p.g) - Int(q.g)) <= tolerance
            && abs(Int(p.b) - Int(q.b)) <= tolerance
    }

    /// The number's width as the pin's font sets it, 14 semibold with
    /// tabular figures.
    private static func numberWidth(_ text: String) -> CGFloat {
        #if canImport(UIKit)
        let font = UIFont.monospacedDigitSystemFont(ofSize: 14, weight: .semibold)
        #else
        let font = NSFont.monospacedDigitSystemFont(ofSize: 14, weight: .semibold)
        #endif
        return (text as NSString).size(withAttributes: [.font: font]).width
    }

    // MARK: Geometry

    /// The pill is 32 tall, at least 32 wide, and 8 wider than its number on
    /// each side once the number needs it; the pointer's tip is 6 below the
    /// pill, 38 below its top, centred.
    @MainActor func testAResultIsA32PillThatGrowsWithItsNumberAndItsPointerTipsSixBelowIt() throws {
        for scheme in [ColorScheme.light, .dark] {
            for number in [nil, 1, 12, 128, 20_480] as [Int?] {
                for selected in [false, true] {
                    let name = "\(scheme), number \(number.map(String.init) ?? "none"), selected \(selected)"
                    let rows = try draw(KozmosLocationPin(number: number, selected: selected), in: scheme)
                        .pinRows(where: Self.opaque)
                    guard let top = rows.first?.top, let tip = rows.last?.bottom,
                          let widest = rows.map(\.width).max() else {
                        XCTFail("\(name): nothing drawn")
                        continue
                    }
                    // The pill's vertical middle is where it is widest.
                    let middle = rows.filter { $0.width >= widest - 0.34 }
                    let pillHeight = 2 * ((middle[0].top + middle[middle.count - 1].bottom) / 2 - top)
                    let expectedWidth = max(32, (number.map { Self.numberWidth("\($0)") } ?? 0) + 16)
                    print("Decision 79 iOS, \(name): the pill is \(widest) x \(pillHeight), its tip \(tip - top) below its top")
                    XCTAssertEqual(pillHeight, 32, accuracy: 1, "\(name): the pill is not 32 tall")
                    XCTAssertEqual(widest, expectedWidth, accuracy: 1, "\(name): the pill is not max(32, the number + 16) wide")
                    XCTAssertEqual(tip - top, 38, accuracy: 0.8, "\(name): the pointer's tip is not 6 below the 32 pill")
                    // The pointer, below the pill: at most 12 wide, centred.
                    let pointer = rows.filter { $0.top >= top + 32.3 }
                    XCTAssertFalse(pointer.isEmpty, "\(name): nothing drawn below the pill")
                    for row in pointer {
                        XCTAssertLessThanOrEqual(row.width, 12.4, "\(name): the pointer is wider than 12 at \(row.top - top)")
                        XCTAssertEqual(row.midX, middle[0].midX, accuracy: 0.5, "\(name): the pointer is not centred")
                    }
                }
            }
        }
    }

    /// The featured tile is 44, 52 selected, and its 6 dot's top is 4 below
    /// the tile's bottom.
    @MainActor func testAFeaturedTileIs44Or52SelectedWithItsDotFourBelow() throws {
        for scheme in [ColorScheme.light, .dark] {
            for (selected, side) in [(false, CGFloat(44)), (true, 52)] {
                let name = "\(scheme), selected \(selected)"
                let runs = pinRuns(try draw(KozmosLocationPin(number: 7, selected: selected, featured: true), in: scheme)
                    .pinRows(where: Self.opaque))
                print("Decision 79 iOS, \(name): the featured marker draws \(runs.count) separate parts: \(runs.map { "\($0.height) tall, \($0.width) wide" })")
                XCTAssertEqual(runs.count, 2, "\(name): the featured marker is not a tile and a dot")
                guard runs.count == 2 else { continue }
                let (tile, dot) = (runs[0], runs[1])
                XCTAssertEqual(tile.height, side, accuracy: 0.8, "\(name): the tile is not \(side) tall")
                XCTAssertEqual(tile.width, side, accuracy: 0.8, "\(name): the tile is not \(side) wide")
                XCTAssertEqual(dot.top - tile.bottom, 4, accuracy: 0.8, "\(name): the dot is not 4 below the tile")
                XCTAssertEqual(dot.height, 6, accuracy: 0.8, "\(name): the dot is not 6")
                XCTAssertEqual(dot.width, 6, accuracy: 0.8, "\(name): the dot is not 6")
                XCTAssertEqual(dot.midX, tile.midX, accuracy: 0.5, "\(name): the dot is not under the tile's middle")
            }
        }
    }

    /// The place's teardrop is a circle of 40 coming to a point, and its 6
    /// dot's top is 6 below the circle's bottom. Selected changes nothing.
    @MainActor func testAPlaceIsA40TeardropWithItsDotSixBelowAndSelectedChangesNothing() throws {
        for scheme in [ColorScheme.light, .dark] {
            let pixels = try draw(KozmosLocationPin(place: true), in: scheme)
            let rows = pixels.pinRows(where: Self.opaque)
            guard let top = rows.first?.top, let bottom = rows.last?.bottom, let widest = rows.map(\.width).max() else {
                XCTFail("\(scheme): nothing drawn")
                continue
            }
            let middle = rows.filter { $0.width >= widest - 0.34 }
            let circleBottom = top + 2 * ((middle[0].top + middle[middle.count - 1].bottom) / 2 - top)
            let dotTop = bottom - 6
            print("Decision 79 iOS, \(scheme): the place is \(widest) wide, its circle \(circleBottom - top) tall, \(bottom - top) to the dot's bottom")
            XCTAssertEqual(widest, 40, accuracy: 0.8, "\(scheme): the teardrop's circle is not 40")
            XCTAssertEqual(circleBottom - top, 40, accuracy: 1, "\(scheme): the teardrop's circle is not 40 tall")
            XCTAssertEqual(dotTop - circleBottom, 6, accuracy: 1, "\(scheme): the dot is not 6 below the circle")
            // The last 2.5: the dot alone, 6 wide at most.
            for row in rows where row.top >= bottom - 2.5 {
                XCTAssertLessThanOrEqual(row.width, 6.4, "\(scheme): the dot is wider than 6")
            }
            let selected = try draw(KozmosLocationPin(selected: true, place: true), in: scheme)
            XCTAssertLessThanOrEqual(try XCTUnwrap(selected.largestDifference(from: pixels), "\(scheme): selected changes the size"), 8,
                                     "\(scheme): selected changes a place's marker")
        }
    }

    // MARK: The anchor

    /// `.position(point)` puts the anchor on the point: the pointer's tip, or
    /// the dot's centre.
    @MainActor func testEachMarkersAnchorLandsOnThePointItIsPositionedAt() throws {
        let point = CGPoint(x: 60, y: 90)
        let markers: [(String, KozmosLocationPin, Bool)] = [
            ("result", KozmosLocationPin(number: 3), true),
            ("selected result", KozmosLocationPin(number: 128, selected: true), true),
            ("result with no number", KozmosLocationPin(), true),
            ("featured", KozmosLocationPin(featured: true), false),
            ("selected featured", KozmosLocationPin(selected: true, featured: true), false),
            ("place", KozmosLocationPin(place: true), false),
        ]
        for scheme in [ColorScheme.light, .dark] {
            for (name, pin, tipped) in markers {
                let rows = try draw(ZStack { pin.position(point) }.frame(width: 120, height: 180), in: scheme)
                    .pinRows(where: Self.opaque)
                guard let last = rows.last else {
                    XCTFail("\(scheme), \(name): nothing drawn")
                    continue
                }
                // The tip is the last row drawn; a dot is the last 6.
                let anchor = tipped
                    ? CGPoint(x: last.midX, y: last.bottom)
                    : CGPoint(x: last.midX, y: last.bottom - 3)
                print("Decision 79 iOS, \(scheme), \(name): positioned at \(point), its anchor is drawn at \(anchor)")
                XCTAssertEqual(anchor.x, point.x, accuracy: 0.7, "\(scheme), \(name): the anchor is not on the point")
                XCTAssertEqual(anchor.y, point.y, accuracy: 0.7, "\(scheme), \(name): the anchor is not on the point")
            }
        }
    }

    /// `externalLabel`, the words drawn beside the marker, sits 4 from it —
    /// below the tip or the dot, above the body, or beside it level with the
    /// pill's middle — and never moves the marker: drawn with it at each
    /// placement, the marker's pixels are where they are without it.
    @MainActor func testTheExternalLabelSitsBesideTheMarkerAndNeverMovesIt() throws {
        let point = CGPoint(x: 100, y: 90)
        let frame = CGSize(width: 200, height: 180)
        let place: (KozmosLocationPin) throws -> DrawnPixels = { pin in
            try self.draw(ZStack { pin.position(point) }.frame(width: frame.width, height: frame.height), in: .light)
        }
        // The label is foreground/100, near black; nothing in a light result is.
        let isLabel: (UInt8, UInt8, UInt8, UInt8) -> Bool = { r, g, b, a in a > 200 && r < 90 && g < 90 && b < 90 }
        let bare = try place(KozmosLocationPin(number: 3))
        let marker = try XCTUnwrap(bare.boundingBox(where: Self.opaque), "nothing drawn")
        for placement in KozmosLocationPinLabelPlacement.allCases {
            let labelled = try place(KozmosLocationPin(label: "3, Gate 12", number: 3, externalLabel: "Gate",
                                                       labelPlacement: placement))
            guard let label = labelled.boundingBox(where: isLabel) else {
                XCTFail("\(placement): no label drawn")
                continue
            }
            print("Decision 79 iOS, externalLabel \(placement): the marker is \(marker), the label's glyphs \(label)")
            switch placement {
            case .bottom:
                XCTAssertGreaterThanOrEqual(label.minY, marker.maxY + 3.5, "the label below is not 4 below the tip")
                XCTAssertLessThanOrEqual(label.minY, marker.maxY + 10, "the label below is far from the tip")
                XCTAssertEqual(label.midX, marker.midX, accuracy: 1, "the label below is not centred")
            case .top:
                XCTAssertLessThanOrEqual(label.maxY, marker.minY - 3.5, "the label above is not 4 above the pill")
                XCTAssertGreaterThanOrEqual(label.maxY, marker.minY - 12, "the label above is far from the pill")
                XCTAssertEqual(label.midX, marker.midX, accuracy: 1, "the label above is not centred")
            case .right:
                XCTAssertGreaterThanOrEqual(label.minX, marker.maxX + 3.5, "the label is not 4 to the pill's right")
                XCTAssertLessThanOrEqual(label.minX, marker.maxX + 8, "the label is far to the pill's right")
                XCTAssertEqual(label.midY, marker.minY + 16, accuracy: 2, "the label is not level with the pill")
            case .left:
                XCTAssertLessThanOrEqual(label.maxX, marker.minX - 3.5, "the label is not 4 to the pill's left")
                XCTAssertGreaterThanOrEqual(label.maxX, marker.minX - 8, "the label is far to the pill's left")
                XCTAssertEqual(label.midY, marker.minY + 16, accuracy: 2, "the label is not level with the pill")
            }
            var largest = 0
            var y = marker.minY + 0.5 / bare.scale
            while y < marker.maxY {
                var x = marker.minX + 0.5 / bare.scale
                while x < marker.maxX {
                    let (p, q) = (bare.pixel(at: CGPoint(x: x, y: y)), labelled.pixel(at: CGPoint(x: x, y: y)))
                    largest = max(largest, abs(Int(p.r) - Int(q.r)), abs(Int(p.g) - Int(q.g)),
                                  abs(Int(p.b) - Int(q.b)), abs(Int(p.a) - Int(q.a)))
                    x += 1 / bare.scale
                }
                y += 1 / bare.scale
            }
            XCTAssertLessThanOrEqual(largest, 8, "\(placement): the label moved the marker")
        }
    }

    /// Left and right are the map's, in every language: a map doesn't mirror in
    /// right-to-left, and MapLibre places a symbol's text physically, so the
    /// label drawn on a pin's left stays on its left (Olcay, 16 Oct).
    @MainActor func testSideLabelsAreTheMapsLeftAndRightInRightToLeft() throws {
        // Off centre, so a mirrored position would show.
        let point = CGPoint(x: 70, y: 90)
        let place: (KozmosLocationPin) throws -> DrawnPixels = { pin in
            try self.draw(
                ZStack { pin.kozmosLocationPinAt(point) }
                    .frame(width: 200, height: 180)
                    .environment(\.layoutDirection, .rightToLeft),
                in: .light
            )
        }
        let isLabel: (UInt8, UInt8, UInt8, UInt8) -> Bool = { r, g, b, a in a > 200 && r < 90 && g < 90 && b < 90 }
        let marker = try XCTUnwrap(try place(KozmosLocationPin(number: 3)).boundingBox(where: Self.opaque), "nothing drawn")
        print("Olcay 16 Oct iOS, right-to-left: .kozmosLocationPinAt(\(point)) draws the marker at \(marker), its middle at x \(marker.midX)")
        XCTAssertEqual(marker.midX, point.x, accuracy: 1, "in right-to-left, kozmosLocationPinAt does not put the marker on the map's point")
        for placement in [KozmosLocationPinLabelPlacement.left, .right] {
            let labelled = try place(KozmosLocationPin(label: "3, Gate 12", number: 3, externalLabel: "Gate",
                                                       labelPlacement: placement))
            let label = try XCTUnwrap(labelled.boundingBox(where: isLabel), "\(placement): no label drawn")
            print("Olcay 16 Oct iOS, right-to-left, externalLabel \(placement): the marker is \(marker), the label's glyphs \(label)")
            if placement == .left {
                XCTAssertLessThanOrEqual(label.maxX, marker.minX - 3.5, "in right-to-left, the left label is not on the map's left")
            } else {
                XCTAssertGreaterThanOrEqual(label.minX, marker.maxX + 3.5, "in right-to-left, the right label is not on the map's right")
            }
        }
    }

    /// `label` is the spoken name only: a marker given one draws exactly
    /// what a marker without one does, at every placement.
    @MainActor func testTheLabelIsSpokenOnlyAndNeverDrawn() throws {
        for scheme in [ColorScheme.light, .dark] {
            for placement in KozmosLocationPinLabelPlacement.allCases {
                // Padded, so words drawn outside the marker's frame show.
                let named = try draw(KozmosLocationPin(label: "Result 3, Burger King", number: 3, labelPlacement: placement)
                    .padding(80), in: scheme)
                let bare = try draw(KozmosLocationPin(number: 3, labelPlacement: placement).padding(80), in: scheme)
                let difference = named.largestDifference(from: bare)
                print("Olcay 15 Oct iOS, \(scheme), \(placement): a named marker differs from a bare one by \(difference.map(String.init) ?? "its size")")
                XCTAssertNotNil(difference, "\(scheme), \(placement): the label changes the marker's size")
                XCTAssertLessThanOrEqual(difference ?? .max, 8, "\(scheme), \(placement): the label is drawn")
            }
        }
    }

    // MARK: Colours

    /// At rest: background/0 inside the theme-600 border, the pointer and
    /// the number theme 600. Selected: theme 600 throughout, the number
    /// foreground/1000. An 8 dot stands for a missing number, in its colour.
    @MainActor func testAResultsColoursAtRestAndSelectedInLightAndDark() throws {
        for scheme in [ColorScheme.light, .dark] {
            let colours = try palette(scheme)
            for selected in [false, true] {
                for number in [8, nil] as [Int?] {
                    let name = "\(scheme), selected \(selected), number \(number.map(String.init) ?? "none")"
                    let pixels = try draw(KozmosLocationPin(number: number, selected: selected), in: scheme)
                    let rows = pixels.pinRows(where: Self.opaque)
                    guard let top = rows.first?.top, let widest = rows.map(\.width).max(),
                          let pill = rows.first(where: { $0.width >= widest - 0.34 }) else {
                        XCTFail("\(name): nothing drawn")
                        continue
                    }
                    let midY = top + 16, midX = pill.midX
                    let fill = selected ? colours.theme600 : colours.background0
                    let ink = selected ? colours.foreground1000 : colours.theme600
                    let border = pixels.pixel(at: CGPoint(x: pill.minX + 1, y: midY))
                    let inside = pixels.pixel(at: CGPoint(x: pill.minX + 4, y: midY))
                    let pointer = pixels.pixel(at: CGPoint(x: midX, y: top + 34))
                    print("Decision 79 iOS, \(name): border \(Self.hex(border)), fill \(Self.hex(inside)), pointer \(Self.hex(pointer))")
                    XCTAssertTrue(Self.near(border, colours.theme600), "\(name): the border is \(Self.hex(border)), not theme 600")
                    XCTAssertTrue(Self.near(inside, fill), "\(name): the fill is \(Self.hex(inside)), not \(Self.hex(fill))")
                    XCTAssertTrue(Self.near(pointer, colours.theme600), "\(name): the pointer is \(Self.hex(pointer)), not theme 600")
                    if number != nil {
                        let glyph = CGRect(x: midX - 6, y: midY - 8, width: 12, height: 16)
                        let inked = pixels.count(in: glyph, where: DrawnPixels.matches(ink, tolerance: 8))
                        XCTAssertGreaterThan(inked, 40, "\(name): the number is not \(Self.hex(ink)) (\(inked) pixels)")
                    } else {
                        let dot = pixels.pixel(at: CGPoint(x: midX, y: midY))
                        let beside = pixels.pixel(at: CGPoint(x: midX + 5.5, y: midY))
                        XCTAssertTrue(Self.near(dot, ink), "\(name): the dot is \(Self.hex(dot)), not \(Self.hex(ink))")
                        XCTAssertTrue(Self.near(beside, fill), "\(name): the dot is wider than 8: \(Self.hex(beside)) 5.5 from its centre")
                    }
                }
            }
        }
    }

    /// The tile: a foreground/0 rim on background/0 and a foreground/0 dot,
    /// and no accent anywhere (decision 81).
    @MainActor func testAFeaturedTilesRimFillAndDotInLightAndDark() throws {
        let accent: Pixel = (0xFA, 0xB7, 0x35, 255)
        for scheme in [ColorScheme.light, .dark] {
            let colours = try palette(scheme)
            for selected in [false, true] {
                let name = "\(scheme), selected \(selected)"
                let pixels = try draw(KozmosLocationPin(number: 7, selected: selected, featured: true), in: scheme)
                let runs = pinRuns(pixels.pinRows(where: Self.opaque))
                guard runs.count == 2 else {
                    XCTFail("\(name): the featured marker is not a tile and a dot (\(runs.count) parts)")
                    continue
                }
                let (tile, dot) = (runs[0], runs[1])
                let midY = (tile.top + tile.bottom) / 2
                let rim = pixels.pixel(at: CGPoint(x: tile.minX + 1.5, y: midY))
                let fill = pixels.pixel(at: CGPoint(x: tile.midX, y: midY))
                let dotCentre = pixels.pixel(at: CGPoint(x: dot.midX, y: (dot.top + dot.bottom) / 2))
                let inAccent = pixels.count(in: CGRect(origin: .zero, size: pixels.size), where: DrawnPixels.matches(accent, tolerance: 24))
                print("Decision 81 iOS, \(name): rim \(Self.hex(rim)), fill \(Self.hex(fill)), dot \(Self.hex(dotCentre)), \(inAccent) accent pixels")
                XCTAssertTrue(Self.near(rim, colours.foreground0), "\(name): the rim is \(Self.hex(rim)), not foreground/0")
                XCTAssertTrue(Self.near(fill, colours.background0), "\(name): the tile is \(Self.hex(fill)), not background/0")
                XCTAssertTrue(Self.near(dotCentre, colours.foreground0), "\(name): the dot is \(Self.hex(dotCentre)), not foreground/0")
                XCTAssertEqual(inAccent, 0, "\(name): the tile draws the accent")
                // The rim is 3: 4 in from the edge is the fill.
                let inner = pixels.pixel(at: CGPoint(x: tile.minX + 4, y: midY))
                XCTAssertTrue(Self.near(inner, colours.background0), "\(name): the rim is wider than 3: \(Self.hex(inner)) 4 in")
            }
        }
    }

    /// The place: emotional success 800, a 20 background/0 disc in the
    /// circle's centre, and the dot in the same green.
    @MainActor func testAPlaceIsSuccessGreenWithABackgroundDiscInLightAndDark() throws {
        for scheme in [ColorScheme.light, .dark] {
            let colours = try palette(scheme)
            let pixels = try draw(KozmosLocationPin(place: true), in: scheme)
            let rows = pixels.pinRows(where: Self.opaque)
            guard let top = rows.first?.top, let bottom = rows.last?.bottom, let widest = rows.map(\.width).max(),
                  let middle = rows.first(where: { $0.width >= widest - 0.34 }) else {
                XCTFail("\(scheme): nothing drawn")
                continue
            }
            let centre = CGPoint(x: middle.midX, y: top + 20)
            let samples: [(String, CGPoint, Pixel)] = [
                ("the teardrop's top", CGPoint(x: centre.x, y: top + 4), colours.success800),
                ("the teardrop's side", CGPoint(x: centre.x - 15, y: centre.y), colours.success800),
                ("the teardrop's point", CGPoint(x: centre.x, y: top + 44), colours.success800),
                ("the disc's centre", centre, colours.background0),
                ("8 into the disc", CGPoint(x: centre.x + 8, y: centre.y), colours.background0),
                ("past the 20 disc", CGPoint(x: centre.x + 12, y: centre.y), colours.success800),
                ("the dot", CGPoint(x: centre.x, y: bottom - 3), colours.success800),
            ]
            for (part, point, expected) in samples {
                let drawn = pixels.pixel(at: point)
                XCTAssertTrue(Self.near(drawn, expected), "\(scheme): \(part) is \(Self.hex(drawn)), not \(Self.hex(expected))")
            }
        }
    }

    // MARK: Place wins; the name

    /// `place` is the only marker shown for a place: it wins over `featured`,
    /// a number and a logo, and says no featured word.
    @MainActor func testAPlaceWinsOverFeaturedANumberAndALogo() throws {
        let logo = AnyView(Color(.sRGB, red: 0, green: 1, blue: 0))
        for scheme in [ColorScheme.light, .dark] {
            let everything = try draw(KozmosLocationPin(label: "Gate 12", number: 3, featured: true, place: true,
                                                        markerContent: logo), in: scheme)
            let plain = try draw(KozmosLocationPin(label: "Gate 12", place: true), in: scheme)
            let difference = everything.largestDifference(from: plain)
            print("Decision 79 iOS, \(scheme): a featured, numbered place with a logo differs from a plain place by \(difference.map(String.init) ?? "its size")")
            XCTAssertNotNil(difference, "\(scheme): a featured, numbered place is drawn another size")
            XCTAssertLessThanOrEqual(difference ?? .max, 8, "\(scheme): featured or the number shows on a place")
        }
        XCTAssertEqual(KozmosLocationPin(label: "Gate 12", number: 3, featured: true, place: true).accessibilityDescription,
                       "Gate 12", "a place says a featured word or a number")
    }

    /// What VoiceOver is told (Olcay, 15 Oct 2026): `label` is the marker's
    /// whole name, as the product writes it, its number included ("Result
    /// 3, Burger King"). Kozmos adds nothing to it but `featuredLabel` on a
    /// featured tile; a place says its label alone, whatever else is passed.
    /// Before, a result added its number ("Gate 12, 2").
    func testTheNameIsTheLabelAloneAndOnAFeaturedTileTheFeaturedLabelToo() {
        let cases: [(String, KozmosLocationPin, String)] = [
            ("numbered", KozmosLocationPin(label: "Result 3, Burger King", number: 3), "Result 3, Burger King"),
            ("numbered, the number left out", KozmosLocationPin(label: "Gate 12", number: 2), "Gate 12"),
            ("dot", KozmosLocationPin(label: "Gate 12"), "Gate 12"),
            ("no label", KozmosLocationPin(number: 2), ""),
            ("featured", KozmosLocationPin(label: "Burger King", number: 3, featured: true, featuredLabel: "Destacado"),
             "Burger King, Destacado"),
            ("featured, default word", KozmosLocationPin(label: "Burger King", featured: true), "Burger King, Featured"),
            ("place", KozmosLocationPin(label: "Gate 12", place: true), "Gate 12"),
            ("featured, numbered place", KozmosLocationPin(label: "Gate 12", number: 3, featured: true, place: true,
                                                           featuredLabel: "Destacado"), "Gate 12"),
        ]
        for (name, pin, expected) in cases {
            XCTAssertEqual(pin.accessibilityDescription, expected, name)
        }
    }
}

/// One pixel row's matches, in points: the row's top and bottom, and its
/// leftmost and rightmost match.
struct PinRow {
    let top: CGFloat
    let bottom: CGFloat
    let minX: CGFloat
    let maxX: CGFloat
    var width: CGFloat { maxX - minX }
    var midX: CGFloat { (minX + maxX) / 2 }
}

/// A run of rows with no empty row between them: one separate part of a
/// drawing, top to bottom.
struct PinRun {
    let rows: [PinRow]
    var top: CGFloat { rows[0].top }
    var bottom: CGFloat { rows[rows.count - 1].bottom }
    var height: CGFloat { bottom - top }
    var minX: CGFloat { rows.map(\.minX).min() ?? 0 }
    var maxX: CGFloat { rows.map(\.maxX).max() ?? 0 }
    var width: CGFloat { maxX - minX }
    var midX: CGFloat { (minX + maxX) / 2 }
}

/// Rows split where an empty pixel row lies between them.
func pinRuns(_ rows: [PinRow]) -> [PinRun] {
    var runs: [[PinRow]] = []
    for row in rows {
        if let last = runs.last?.last, abs(last.bottom - row.top) < 0.01 {
            runs[runs.count - 1].append(row)
        } else {
            runs.append([row])
        }
    }
    return runs.map(PinRun.init)
}

extension DrawnPixels {
    /// Each pixel row holding a match, top to bottom.
    func pinRows(where matches: (UInt8, UInt8, UInt8, UInt8) -> Bool) -> [PinRow] {
        var rows: [PinRow] = []
        for y in 0..<height {
            var first = -1, last = -1
            for x in 0..<width {
                let p = pixel(at: CGPoint(x: (CGFloat(x) + 0.5) / scale, y: (CGFloat(y) + 0.5) / scale))
                if matches(p.r, p.g, p.b, p.a) {
                    if first < 0 { first = x }
                    last = x
                }
            }
            if first >= 0 {
                rows.append(PinRow(top: CGFloat(y) / scale, bottom: CGFloat(y + 1) / scale,
                                   minX: CGFloat(first) / scale, maxX: CGFloat(last + 1) / scale))
            }
        }
        return rows
    }
}
