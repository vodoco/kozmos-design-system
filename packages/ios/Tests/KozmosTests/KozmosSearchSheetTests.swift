import XCTest
import SwiftUI
@testable import Kozmos

/// The search sheet's parts on the prototype's geometry, measured: the
/// tile's icon square, the result row, the search field, the marker, the
/// AI search's ring.
final class KozmosSearchSheetTests: XCTestCase {
    #if os(iOS)
    private static func isBlue(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { b > 120 && Int(b) > Int(r) + 40 && Int(b) > Int(g) + 20 }
    /// A colour with a hue: far from white and from grey.
    private static func isSaturated(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { Int(max(r, g, b)) - Int(min(r, g, b)) > 70 }

    /// The tile: a 64 square holding the icon, the label under it.
    @MainActor func testTheTileIsASquareWithTheLabelUnderIt() async throws {
        let view = KozmosCategoryTile(
            category: KozmosCategoryPresentation(id: "food", label: "Food and drink", selected: false),
            onSelect: { _ in }
        ) { Image(systemName: "fork.knife").font(.system(size: 24)) }
        .frame(width: 96)
        .padding(16)
        .background(Color.white)
        let pixels = try await RenderedPixels.render(view, size: CGSize(width: 128, height: 140))
        let icon = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: 0, width: 128, height: 140), where: RenderedPixels.isTheme), "no icon")
        XCTAssertLessThan(icon.width, 30, "the icon is not 24: \(icon)")
        let label = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: icon.maxY + 4, width: 128, height: 140 - icon.maxY - 4), where: RenderedPixels.isDarkText), "no label under the icon")
        XCTAssertGreaterThan(label.minY, icon.maxY + 8, "the label is not under the square")
    }

    /// The tile's count: the system's counter, brand tone, at the square's
    /// top-right, four beyond its edges, the icon left clear. The spoken
    /// form is the presentation's label; no caption is drawn.
    @MainActor func testTheTilesCountIsACounterAtTheSquaresTopRight() async throws {
        let view = KozmosCategoryTile(
            category: KozmosCategoryPresentation(id: "gates", label: "Gates", resultCount: 12, resultCountLabel: "12 places"),
            onSelect: { _ in }
        ) { Image(systemName: "airplane").font(.system(size: 24)) }
        .frame(width: 96)
        .padding(16)
        .background(Color.white)
        // Pinned to the top, so the square is 64 at x 32–96, y 20–84: the 16 padding and the tile's own 4.
        let pixels = try await RenderedPixels.render(VStack(spacing: 0) { view; Spacer(minLength: 0) }.background(Color.white), size: CGSize(width: 128, height: 140))
        let counter = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 70, y: 0, width: 58, height: 40), where: RenderedPixels.isTheme), "no counter at the square's top-right")
        XCTAssertEqual(counter.height, 20, accuracy: 2, "the counter is not the system's 20 counter: \(counter)")
        XCTAssertEqual(counter.maxX, 100, accuracy: 2, "the counter does not overhang the square's right edge (96) by 4: \(counter)")
        XCTAssertEqual(counter.minY, 16, accuracy: 2, "the counter does not overhang the square's top edge (20) by 4: \(counter)")
        XCTAssertNotNil(pixels.boundingBox(in: counter, where: { r, g, b in r > 240 && g > 240 && b > 240 }), "no white digits in the counter")
        let icon = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: 40, width: 128, height: 44), where: RenderedPixels.isTheme), "no icon")
        XCTAssertGreaterThanOrEqual(icon.minY, counter.maxY, "the counter runs into the icon: \(counter) over \(icon)")
        // No caption under the label: one line of dark text and nothing more.
        let label = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: 86, width: 128, height: 54), where: RenderedPixels.isDarkText), "no label")
        XCTAssertLessThan(label.height, 18, "a caption is drawn under the label: \(label)")
    }

    /// A tile in its category's colour: the icon and the counter take the
    /// tint, the square stays neutral — as the chosen-category field does.
    @MainActor func testTheTileTakesItsCategorysColour() async throws {
        let view = KozmosCategoryTile(
            category: KozmosCategoryPresentation(id: "dining", label: "Dining", resultCount: 3, resultCountLabel: "3 places"),
            tint: KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentRed, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillRed, ink: KozmosColors.semanticsCategoryOnfillRed)),
            onSelect: { _ in }
        ) { Image(systemName: "fork.knife").font(.system(size: 24)) }
        .frame(width: 96)
        .padding(16)
        .background(Color.white)
        let pixels = try await RenderedPixels.render(VStack(spacing: 0) { view; Spacer(minLength: 0) }.background(Color.white), size: CGSize(width: 128, height: 140))
        let icon = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 32, y: 40, width: 64, height: 44), where: Self.isRedTint), "no icon in the tint")
        XCTAssertLessThan(icon.width, 30, "the icon is not 24: \(icon)")
        // Right of the icon's glyph, whose ascender can reach above the square's centre.
        let counter = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 78, y: 0, width: 50, height: 40), where: Self.isRedTint), "no counter in the tint")
        XCTAssertEqual(counter.height, 20, accuracy: 2, "the counter is not the 20 counter: \(counter)")
        XCTAssertNotNil(pixels.boundingBox(in: counter, where: { r, g, b in r > 240 && g > 240 && b > 240 }), "no white digits on the red fill: its ink is white")
        XCTAssertNil(pixels.boundingBox(in: CGRect(x: 0, y: 0, width: 128, height: 100), where: RenderedPixels.isTheme), "the theme colour is still drawn on a tinted tile")
    }

    /// A pin in a category's colour: the marker takes the tint.
    @MainActor func testThePinTakesItsTint() async throws {
        let view = KozmosLocationPin(size: .md, tint: KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentRed, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillRed, ink: KozmosColors.semanticsCategoryOnfillRed))).padding(14).background(Color.white)
        let size = CGSize(width: 60, height: 60)
        let pixels = try await RenderedPixels.render(view, size: size)
        let marker = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: Self.isRedTint), "no marker in the tint")
        // The 32 medium pin's fill, inside its 2 white stroke: 28, as the Compose golden measures it.
        XCTAssertEqual(marker.width, 28, accuracy: 2, "the marker is not the 32 medium pin's 28 fill: \(marker)")
        XCTAssertNil(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isTheme), "the theme colour is still drawn on a tinted pin")
    }

    /// Off the floor the pin is a hollow ring in its colour on white, and its
    /// number is dark on the disc (Olcay, 2026-09-21): the yellow fill as
    /// the number's colour read 1.92:1 on white.
    @MainActor func testAnOffFloorPinsNumberIsDarkOnTheWhiteDisc() async throws {
        let view = KozmosLocationPin(size: .lg, number: 4, offFloor: true, tint: KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentYellow, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillYellow, ink: KozmosColors.semanticsCategoryOnfillYellow))).padding(14).background(Color.white)
        let size = CGSize(width: 68, height: 68)
        let pixels = try await RenderedPixels.render(view, size: size)
        let isYellow: (UInt8, UInt8, UInt8) -> Bool = { r, g, b in r > 220 && g > 140 && g < 200 && b < 80 }
        let ring = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: isYellow), "no ring in the colour")
        XCTAssertEqual(ring.width, 40, accuracy: 2, "the ring is not the 40 large pin: \(ring)")
        let inside = ring.insetBy(dx: 10, dy: 10)
        XCTAssertNotNil(pixels.boundingBox(in: inside, where: { r, g, b in r < 70 && g < 70 && b < 70 }), "the number is not dark on the white disc")
        XCTAssertNil(pixels.boundingBox(in: inside, where: isYellow), "the number is still in the colour")
    }

    /// A counter filled with a category's colour takes that colour's ink:
    /// the dark ink on the taxonomy's yellow, where white would not read.
    @MainActor func testTheCountersFillBringsItsOwnInk() async throws {
        let view = KozmosCounter("12", fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillYellow, ink: KozmosColors.semanticsCategoryOnfillYellow))
            .padding(10).background(Color.white)
        let size = CGSize(width: 60, height: 40)
        let pixels = try await RenderedPixels.render(view, size: size)
        let pill = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: { r, g, b in r > 230 && g > 150 && g < 190 && b < 60 }), "no yellow fill")
        XCTAssertEqual(pill.height, 20, accuracy: 2, "the pill is not 20: \(pill)")
        // Inside the capsule, clear of its rounded corners, where the background shows.
        let inside = pill.insetBy(dx: 6, dy: 5)
        XCTAssertNotNil(pixels.boundingBox(in: inside, where: { r, g, b in r < 60 && g < 60 && b < 70 }), "no dark ink on the yellow fill")
        XCTAssertNil(pixels.boundingBox(in: inside, where: { r, g, b in r > 240 && g > 240 && b > 240 }), "white digits on the yellow fill")
    }

    private static func isRedTint(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 150 && Int(r) > Int(g) + 60 && Int(r) > Int(b) + 60 }

    /// The row: 80 tall; a dot before the floor when it is the current one.
    /// Two tiles in one row, a one-line and a two-line label: the squares
    /// share a top edge. The grid aligns its cells at the top, so a short
    /// label does not drop its square by half a line.
    @MainActor func testTilesInARowShareATopEdgeWhateverTheirLabelsLength() async throws {
        let size = CGSize(width: 402, height: 200)
        let panel = KozmosBrowseCategoriesPanel(
            categories: [
                KozmosCategoryPresentation(id: "gates", label: "Gates"),
                KozmosCategoryPresentation(id: "entrances", label: "Entrances & Exits"),
            ],
            presentation: .sheet,
            onSelect: { _ in },
            renderIcon: { _ in Image(systemName: "square.fill").resizable() },
            emptyState: { EmptyView() }
        )
        .background(Color.white)
        let pixels = try await RenderedPixels.render(panel, size: size)
        let first = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: 0, width: 110, height: 200), where: Self.isBlue), "no icon in the first tile")
        let second = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 110, y: 0, width: 100, height: 200), where: Self.isBlue), "no icon in the second tile")
        XCTAssertEqual(first.minY, second.minY, accuracy: 1, "the squares do not share a top edge: \(first.minY) vs \(second.minY)")
    }

    /// The panel's rule under its search row is the container edge's role,
    /// Border/Subtle (199, 202, 209 in light), as React's `border-b` draws it
    /// and as the prototype draws every rule — a light grey. It was
    /// foreground/300 (70, 74, 83), a text colour, until 2026-09-22.
    @MainActor func testThePanelsRuleIsTheBorderRole() async throws {
        let size = CGSize(width: 402, height: 220)
        let panel = KozmosBrowseCategoriesPanel(
            categories: [KozmosCategoryPresentation(id: "gates", label: "Gates")],
            presentation: .panel,
            onSelect: { _ in },
            renderIcon: { _ in Image(systemName: "square.fill").resizable() },
            search: { Color.red.frame(height: 20) },
            actions: { EmptyView() },
            emptyState: { EmptyView() }
        )
        .environment(\.colorScheme, .light)
        let pixels = try await RenderedPixels.render(panel, size: size)
        let search = try XCTUnwrap(
            // The system red, which renders near (255, 59, 62).
            pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: { r, g, b in r > 200 && g < 100 && b < 100 }),
            "no search row"
        )
        // The darkest pixel row between the search row and the grid is the rule.
        var darkest: (r: UInt8, g: UInt8, b: UInt8) = (255, 255, 255)
        var y = search.maxY + 1
        while y < search.maxY + 40 {
            let colour = pixels.color(at: CGPoint(x: size.width / 2, y: y))
            if colour.r < darkest.r { darkest = colour }
            y += 1 / pixels.scale
        }
        XCTAssertLessThan(darkest.r, 245, "no rule under the search row")
        XCTAssertGreaterThan(darkest.r, 180, "the rule is darker than the border role: \(darkest)")
        XCTAssertGreaterThan(Int(darkest.b), Int(darkest.r), "the rule is not the border role's cool grey: \(darkest)")
    }

    /// The empty state's dashed edge is the same role as the rule, as React's
    /// `border-border` is.
    @MainActor func testTheEmptyStatesEdgeIsTheBorderRole() async throws {
        let size = CGSize(width: 402, height: 160)
        let panel = KozmosBrowseCategoriesPanel(
            categories: [],
            presentation: .panel,
            onSelect: { _ in },
            renderIcon: { _ in EmptyView() },
            search: { EmptyView() },
            actions: { EmptyView() },
            emptyState: { Color.clear.frame(height: 40) }
        )
        .environment(\.colorScheme, .light)
        let pixels = try await RenderedPixels.render(panel, size: size)
        var darkest: UInt8 = 255
        var y: CGFloat = 0
        while y < size.height {
            var x: CGFloat = 0
            while x < size.width {
                darkest = min(darkest, pixels.color(at: CGPoint(x: x, y: y)).r)
                x += 1 / pixels.scale
            }
            y += 1 / pixels.scale
        }
        XCTAssertLessThan(darkest, 240, "no edge around the empty state")
        XCTAssertGreaterThan(darkest, 180, "the empty state's edge is darker than the border role: \(darkest)")
    }

    @MainActor func testTheRowIsEightyTallWithADotOnTheCurrentFloor() async throws {
        func row(currentFloorId: String?) -> some View {
            KozmosPOIResultCard(
                poi: KozmosPOIPresentation(id: "p", name: "Dunkin'", floorId: "b:2", floorLabel: "Second Floor", buildingLabel: "Terminal B"),
                result: KozmosPOIResultPresentation(poiId: "p", resultIndex: 1, selected: false, featured: false, floorId: "b:2"),
                currentFloorId: currentFloorId,
                onSelect: { _ in }
            )
            .padding(16)
            .background(Color.white)
        }
        let size = CGSize(width: 360, height: 140)
        let on = try await RenderedPixels.render(row(currentFloorId: "b:2"), size: size)
        let card = try XCTUnwrap(on.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isInk), "no row")
        XCTAssertEqual(card.height, 80, accuracy: 2, "the row is not 80 tall")
        XCTAssertNotNil(on.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isTheme), "no dot on the current floor")
        let off = try await RenderedPixels.render(row(currentFloorId: "b:1"), size: size)
        XCTAssertNil(off.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isTheme), "a dot on another floor")
    }

    /// The field: 44 tall, with the 24 clear circle when filled.
    @MainActor func testTheFieldIsFortyFourTall() async throws {
        let view = KozmosSearchBar(text: .constant("sta"), placeholder: "Search")
            .padding(16)
            .background(Color.white)
        let size = CGSize(width: 320, height: 100)
        let pixels = try await RenderedPixels.render(view, size: size)
        // The field's shadow is faint; the clear circle's grey is not.
        let clear = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 240, y: 0, width: 80, height: 100), where: { r, g, b in r < 235 && r > 150 && abs(Int(r) - Int(b)) < 20 }), "no clear circle")
        XCTAssertEqual(clear.width, 24, accuracy: 2, "the clear circle is not 24: \(clear)")
        XCTAssertEqual(clear.midY, 50, accuracy: 2, "the clear circle is not centred in a 44 field")
    }

    /// The system's loading arc: three quarters of a circle at the size asked
    /// for, in the theme's ink, and still when less motion is asked for.
    ///
    /// Android has goldens for this and iOS had nothing — the asymmetry is the
    /// reason for this test. A quarter missing is what reads as motion, so it
    /// is measured: the drawn box is the size, and the gap in the ring is real.
    @MainActor func testTheSpinnerIsThreeQuartersOfACircle() async throws {
        let view = KozmosSpinner(size: .xl)
            .padding(16)
            .background(Color.white)
        let size = CGSize(width: 80, height: 80)
        let pixels = try await RenderedPixels.render(view, size: size)
        let ring = try XCTUnwrap(
            pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isDarkText),
            "no arc drawn"
        )
        XCTAssertEqual(ring.width, 40, accuracy: 3, "the arc is not radius 9 in a 48 box: \(ring)")
        XCTAssertEqual(ring.height, 40, accuracy: 3, "the arc is not radius 9 in a 48 box: \(ring)")
        // The gap: a full ring would paint on both sides of the centre line at
        // every angle. Three quarters leaves one quadrant empty — here the
        // upper-left, before the turn starts.
        let quadrant = CGRect(x: 16, y: 16, width: 20, height: 20)
        XCTAssertNil(
            pixels.boundingBox(in: quadrant, where: RenderedPixels.isDarkText),
            "the arc has no gap: it is a full ring, not three quarters"
        )
    }

    /// The search row through the field's own trailing slot: the field and the
    /// assistant on one line, the assistant's 48 at the end, eight between
    /// them. The row is the component's — composed by hand on the web the pair
    /// landed on two lines, because the field is as wide as its container.
    @MainActor func testTheTrailingSlotKeepsTheAssistantBesideTheField() async throws {
        let view = KozmosSearchBar(text: .constant(""), placeholder: "Search") {
            KozmosAISearchButton(action: {})
        }
        .frame(width: 320)
        .padding(16)
        .background(Color.white)
        let size = CGSize(width: 352, height: 96)
        let pixels = try await RenderedPixels.render(view, size: size)
        // The ring is the only saturated thing here; the field is white on white.
        let ring = try XCTUnwrap(
            pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: Self.isSaturated),
            "no assistant in the row"
        )
        XCTAssertEqual(ring.width, 48, accuracy: 2, "the assistant is not 48: \(ring)")
        XCTAssertEqual(ring.maxX, 336, accuracy: 2, "the assistant is not at the end of the 320 row: \(ring)")
        XCTAssertEqual(ring.midY, 48, accuracy: 2, "the assistant is not centred on the field's line: \(ring)")
        // One line: the row is the assistant's 48, not a field stacked on it.
        let drawn = try XCTUnwrap(
            pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: { r, g, b in r < 250 || g < 250 || b < 250 }),
            "nothing drawn"
        )
        XCTAssertLessThan(drawn.height, 60, "the row is more than one control tall: \(drawn)")
    }

    /// The marker: an 18 dot inside a 64 halo.
    @MainActor func testTheMarkerIsAnEighteenDotInASixtyFourHalo() async throws {
        let view = KozmosUserLocationMarker(showHeading: false).padding(8).background(Color.white)
        let size = CGSize(width: 80, height: 80)
        let pixels = try await RenderedPixels.render(view, size: size)
        let halo = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isInk), "no halo")
        XCTAssertEqual(halo.width, 64, accuracy: 2, "the halo is not 64: \(halo)")
        let dot = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: { r, g, b in b > 150 && r < 90 && g < 120 }), "no dot")
        XCTAssertEqual(dot.width, 18 - 3, accuracy: 2, "the dot's blue is not 18 less its 3 border: \(dot)")
    }

    /// The AI search, the prototype's: a 48 circle whose gradient ring is a
    /// band two and a half wide around a 43 white disc — minimal, not a
    /// collar — with the 16 icon in the theme's colour at the centre.
    @MainActor func testTheAISearchIsAThinRingAroundAWhiteDisc() async throws {
        let size = CGSize(width: 80, height: 80)
        let view = KozmosAISearchButton(action: {}).frame(width: 80, height: 80).background(Color.white)
        let pixels = try await RenderedPixels.render(view, size: size)
        // The band is the rainbow: any saturated colour, not one hue.
        let ring = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: Self.isSaturated), "no ring")
        XCTAssertEqual(ring.width, 48, accuracy: 2, "the ring is not the button's 48: \(ring)")
        // Along a radius, past the icon at the centre: the white disc, then
        // the band, then the white background.
        let centre = CGPoint(x: 40, y: 40)
        var band = 0
        var firstBlue: CGFloat?
        for offset in stride(from: 12, through: 30, by: 0.5) {
            let colour = pixels.color(at: CGPoint(x: centre.x + CGFloat(offset), y: centre.y))
            if Self.isSaturated(colour.r, colour.g, colour.b) {
                if firstBlue == nil { firstBlue = CGFloat(offset) }
                band += 1
            }
        }
        let bandWidth = CGFloat(band) * 0.5
        XCTAssertEqual(bandWidth, 2.5, accuracy: 1.25, "the ring's band is not two and a half wide: \(bandWidth)")
        XCTAssertEqual(try XCTUnwrap(firstBlue), 21.5, accuracy: 1.5, "the band does not start at the 43 disc's edge: \(String(describing: firstBlue))")
        let disc = pixels.color(at: CGPoint(x: 40, y: 28))
        XCTAssertGreaterThan(disc.g, 240, "the disc is not white: \(disc)")
    }
    #endif
}

/// The category field: the search field's form with a category chosen, the
/// prototype's geometry in the category's colour.
final class KozmosCategoryFieldTests: XCTestCase {
    #if os(iOS)
    private static func isOrange(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 200 && g > 60 && g < 140 && b < 60 }

    /// 48 tall; the pill and the border in the colour, the fill the colour's tint.
    @MainActor func testTheFieldIsFortyEightTallWithThePillAndBorderInTheColour() async throws {
        let view = KozmosCategoryField(label: "Dining", count: 19, tint: KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentOrange, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillOrange, ink: KozmosColors.semanticsCategoryOnfillOrange)), onClear: {}) {
            Image(systemName: "fork.knife").font(.system(size: 20))
        }
        .frame(width: 254)
        .padding(16)
        .background(Color.white)
        let pixels = try await RenderedPixels.render(view, size: CGSize(width: 286, height: 80))
        let whole = CGRect(x: 0, y: 0, width: 286, height: 80)
        let coloured = try XCTUnwrap(pixels.boundingBox(in: whole, where: Self.isOrange), "nothing in the category's colour")
        XCTAssertEqual(coloured.height, 48, accuracy: 1.5, "the field is not 48 tall: \(coloured)")
        XCTAssertEqual(coloured.width, 254, accuracy: 1.5, "the border does not span the field: \(coloured)")
        // Inside the border the fill is the tint, not the colour: light, warm, not white.
        let fill = pixels.color(at: CGPoint(x: 200, y: 40))
        XCTAssertGreaterThan(fill.r, 235, "the fill is not a light tint: \(fill)")
        XCTAssertLessThan(fill.b, 240, "the fill is white, not the colour's tint: \(fill)")
        XCTAssertGreaterThan(Int(fill.r) - Int(fill.b), 8, "the fill carries no warmth of the colour: \(fill)")
        // The count pill: a solid run of the colour 22 tall, right of the label.
        let pill = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 100, y: 20, width: 80, height: 40), where: Self.isOrange), "no count pill")
        XCTAssertEqual(pill.height, 22, accuracy: 1.5, "the pill is not 22 tall: \(pill)")
    }

    /// The name and the clear's cross in the foreground, the icon in the
    /// colour (Olcay, 2026-09-21): the orange name on its own 12 % wash read
    /// 2.51:1.
    @MainActor func testTheNameAndTheClearAreInTheForegroundAndTheIconInTheColour() async throws {
        let view = KozmosCategoryField(label: "Dining", tint: KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentOrange, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillOrange, ink: KozmosColors.semanticsCategoryOnfillOrange)), onClear: {}) {
            Image(systemName: "fork.knife").font(.system(size: 20))
        }
        .frame(width: 254)
        .padding(16)
        .background(Color.white)
        let pixels = try await RenderedPixels.render(view, size: CGSize(width: 286, height: 80))
        let isDark: (UInt8, UInt8, UInt8) -> Bool = { r, g, b in r < 70 && g < 70 && b < 70 }
        // The name: after the 12 padding, the 28 icon and the 8 gap.
        let name = CGRect(x: 66, y: 28, width: 40, height: 24)
        XCTAssertNotNil(pixels.boundingBox(in: name, where: isDark), "the name is not in the foreground")
        XCTAssertNil(pixels.boundingBox(in: name, where: Self.isOrange), "the name is still in the category's colour")
        // The clear's cross, centred in the 32 at the trailing edge.
        let cross = CGRect(x: 234, y: 30, width: 24, height: 20)
        XCTAssertNotNil(pixels.boundingBox(in: cross, where: isDark), "the clear's cross is not in the foreground")
        XCTAssertNil(pixels.boundingBox(in: cross, where: Self.isOrange), "the clear's cross is still in the category's colour")
        // The cross stays centred where the 32 circle was measured, 8 from the
        // field's edge: the 44 target around it (Olcay, 2026-09-21) moved
        // nothing. The field spans 16 to 270; 270 - 8 - 16 = 246.
        let crossBox = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 200, y: 20, width: 80, height: 40), where: isDark), "no cross at the trailing edge")
        XCTAssertEqual(crossBox.midX, 246, accuracy: 1.5, "the clear's cross moved: \(crossBox)")
        XCTAssertEqual(crossBox.midY, 40, accuracy: 1.5, "the clear's cross is off the field's centre: \(crossBox)")
        // The icon keeps the colour: decorative, the name says what it shows.
        XCTAssertNotNil(pixels.boundingBox(in: CGRect(x: 28, y: 26, width: 28, height: 28), where: Self.isOrange), "the icon lost the category's colour")
    }
    #endif
}
