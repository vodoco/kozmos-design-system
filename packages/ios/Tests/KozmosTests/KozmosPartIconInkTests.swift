import XCTest
import SwiftUI
@testable import Kozmos

/// A part's icon is drawn in the colour the part gives it. React's `Icon` is
/// `currentColor` inside the part, and Compose's `KozmosIcon` follows
/// `LocalContentColor`. SwiftUI's `KozmosIcon` sets its own ink, foreground
/// 100, unless the part around it says otherwise (`kozmosIconHostInk`), and
/// these six parts set only `foregroundColor`, which a `KozmosIcon` inside
/// overrides. So a `KozmosIcon` given to them drew near-black whatever the
/// part's colour: on a selected chip's theme fill, in an off map control
/// whose words are grey, in a category tile whose accent is the category's.
///
/// Each reads the icon's ink, the pixel in its frame furthest from the part's
/// own fill there, and compares it with the colour the part gives its icon.
/// Drawn without a window, so these run in `swift test` on a Mac too.
final class KozmosPartIconInkTests: XCTestCase {
    private typealias Ink = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    /// The icon's ink: of the opaque pixels in `region`, the one furthest
    /// from the colour drawn at `background`, the part's fill beside the icon.
    @MainActor private func ink<V: View>(_ view: V, in region: CGRect, against background: CGPoint) throws -> (icon: Ink?, fill: Ink) {
        let drawn = try DrawnPixels.draw(view.background(Color.white).environment(\.colorScheme, .light), scale: 3)
        let fill = drawn.pixel(at: background)
        var found: Ink?
        var furthest = -1
        let x0 = Int(region.minX * 3), x1 = min(drawn.width, Int(region.maxX * 3))
        let y0 = Int(region.minY * 3), y1 = min(drawn.height, Int(region.maxY * 3))
        for y in y0..<y1 {
            for x in x0..<x1 {
                let pixel = drawn.pixel(at: CGPoint(x: (CGFloat(x) + 0.5) / 3, y: (CGFloat(y) + 0.5) / 3))
                guard pixel.a > 240 else { continue }
                let distance = abs(Int(pixel.r) - Int(fill.r)) + abs(Int(pixel.g) - Int(fill.g)) + abs(Int(pixel.b) - Int(fill.b))
                if distance > furthest { furthest = distance; found = pixel }
            }
        }
        return (found, fill)
    }

    private func close(_ a: Ink?, _ b: Ink, within tolerance: Int = 10) -> Bool {
        guard let a else { return false }
        return abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance && abs(Int(a.b) - Int(b.b)) <= tolerance
    }

    private func hex(_ c: Ink?) -> String { c.map { String(format: "#%02X%02X%02X", $0.r, $0.g, $0.b) } ?? "nothing" }

    /// What is wrong with one icon, or nil when it is the colour expected.
    @MainActor private func fault<V: View>(_ name: String, _ view: V, icon region: CGRect, fill point: CGPoint,
                                           expected token: Color) throws -> String? {
        let expected = try DrawnPixels.resolved(token, in: .light)
        let read = try ink(view, in: region, against: point)
        return close(read.icon, expected) ? nil : "\(name): the icon is \(hex(read.icon)), not \(hex(expected)) (on \(hex(read.fill)))"
    }

    /// React's chip draws its icon in the chip's text colour; Compose's
    /// Surface gives its leading icon the chip's content colour.
    @MainActor func testAChipsIconIsTheChipsColour() throws {
        let cases: [(String, KozmosChipVariant, Bool, Color)] = [
            ("brand", .brand, false, KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentIdle),
            ("destructive", .destructive, false, KozmosColors.componentsSecondaryButtonsDangerButtonForegroundContentIdle),
            ("selected", .neutral, true, KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle),
            ("selected destructive", .destructive, true, KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentIdle),
        ]
        var wrong: [String] = []
        for (name, variant, selected, token) in cases {
            let chip = KozmosChip(text: "Coffee", variant: variant, selected: selected) {
                KozmosIcon("home-line", size: .sm)
            } action: {}
            // The 16pt icon, 12pt in from the leading edge of a 32pt chip.
            if let fault = try fault(name, chip.fixedSize(), icon: CGRect(x: 11, y: 7, width: 18, height: 18),
                                     fill: CGPoint(x: 6, y: 16), expected: token) { wrong.append(fault) }
        }
        XCTAssertEqual(wrong, [])
    }

    /// React's tile draws its icon in theme 600, or the tint's accent; so
    /// does Compose's, through LocalContentColor.
    @MainActor func testACategoryTilesIconIsItsAccent() throws {
        let tint = KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentOrange,
                                      fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillOrange, ink: .white))
        var wrong: [String] = []
        for (name, tint, token) in [("no tint, theme/600", nil, KozmosColors.primitivesColorsTheme600),
                                    ("orange tint", tint, KozmosColors.semanticsCategoryAccentOrange)] {
            let tile = KozmosCategoryTile(category: KozmosCategoryPresentation(id: "food", label: "Food"), tint: tint,
                                          onSelect: { _ in }) {
                KozmosIcon("home-line", size: .lg)
            }
            // The 24pt icon, centred in the 64pt square 4pt down a 96pt tile.
            if let fault = try fault(name, tile.frame(width: 96), icon: CGRect(x: 34, y: 22, width: 28, height: 28),
                                     fill: CGPoint(x: 24, y: 36), expected: token) { wrong.append(fault) }
        }
        XCTAssertEqual(wrong, [])
    }

    /// React's field draws its icon in the tint's accent, theme 600 with no
    /// category; so does Compose's, through LocalContentColor.
    @MainActor func testACategoryFieldsIconIsItsAccent() throws {
        let orange = KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentOrange,
                                        fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillOrange, ink: .white))
        var wrong: [String] = []
        let themed = KozmosCategoryField(label: "Food", onClear: {}) { KozmosIcon("home-line", size: .lg) }
        let tinted = KozmosCategoryField(label: "Food", tint: orange, onClear: {}) { KozmosIcon("home-line", size: .lg) }
        // The 28pt icon frame, 12pt in from the leading edge of a 48pt field.
        let region = CGRect(x: 12, y: 10, width: 28, height: 28), fill = CGPoint(x: 6, y: 24)
        if let fault = try fault("no category, theme/600", themed.frame(width: 300), icon: region, fill: fill,
                                 expected: KozmosColors.primitivesColorsTheme600) { wrong.append(fault) }
        if let fault = try fault("orange", tinted.frame(width: 300), icon: region, fill: fill,
                                 expected: KozmosColors.semanticsCategoryAccentOrange) { wrong.append(fault) }
        XCTAssertEqual(wrong, [])
    }

    /// The empty state draws its icon in foreground 400 on its muted circle,
    /// as React's `text-muted-foreground` on `bg-muted` is;
    /// `KozmosEmptyStateAppearanceTests` holds the circle and the description.
    @MainActor func testAnEmptyStatesIconIsItsMutedColour() throws {
        let empty = KozmosEmptyState(title: "No results", description: "Try another word") {
            KozmosIcon("search-md", size: .xl)
        } action: {
            EmptyView()
        }
        // The 32pt icon, centred in the 64pt circle 32pt down; the circle's
        // fill beside it.
        let fault = try fault("empty state", empty.frame(width: 300), icon: CGRect(x: 132, y: 46, width: 36, height: 36),
                              fill: CGPoint(x: 122, y: 64), expected: KozmosColors.primitivesColorsForeground400)
        XCTAssertNil(fault)
    }

    /// React's map control draws its mark in the toggle's tone: off,
    /// foreground 400; on, theme 600; filled and on, the fill's ink. So does
    /// Compose's, through LocalContentColor. A control that is not a toggle
    /// keeps the ink, foreground 100, which KozmosIcon drew anyway.
    @MainActor func testAMapControlsIconIsItsTone() throws {
        let cases: [(String, Bool, KozmosMapControlButtonEmphasis, Color)] = [
            ("off, foreground/400", false, .tinted, KozmosColors.primitivesColorsForeground400),
            ("on, theme/600", true, .tinted, KozmosColors.primitivesColorsTheme600),
            ("filled and on, the fill's ink", true, .filled, KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle),
        ]
        var wrong: [String] = []
        for (name, pressed, emphasis, token) in cases {
            let control = KozmosMapControlButton(label: "Focus", emphasis: emphasis, pressed: pressed, action: {}) {
                KozmosIcon("navigation-pointer-01", size: .lg)
            }
            // The 24pt mark, centred in the 48pt square.
            if let fault = try fault(name, control, icon: CGRect(x: 10, y: 10, width: 28, height: 28),
                                     fill: CGPoint(x: 4, y: 24), expected: token) { wrong.append(fault) }
        }
        XCTAssertEqual(wrong, [])
    }

    /// React's route option draws its icon `text-primary`, theme 600, as the
    /// SF Symbol SwiftUI's draws by default is. Compose's own icon is theme
    /// 600, and an icon the caller gives it takes LocalContentColor.
    @MainActor func testARouteOptionsIconIsTheTheme() throws {
        let option = KozmosRouteOptionPresentation(id: "quick", label: "Quickest", durationSeconds: 300, durationLabel: "5 min",
                                                   distanceMetres: 400, distanceLabel: "400 m", preference: .quickest)
        let card = KozmosRouteOptionCard(option: option, onSelect: { _ in }) {
            KozmosIcon("clock", size: .sm)
        }
        // The 16pt icon, 12pt in from the leading edge of a 120pt card, on
        // the first line of the content it centres: 36pt down.
        let fault = try fault("route option", card.frame(width: 300), icon: CGRect(x: 10, y: 34, width: 20, height: 20),
                              fill: CGPoint(x: 6, y: 60), expected: KozmosColors.primitivesColorsTheme600)
        XCTAssertNil(fault)
    }
}
