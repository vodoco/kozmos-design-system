import SwiftUI
import XCTest
@testable import Kozmos

/// Where the shell's panel header starts, by the rule itself (decision 14):
/// under a grabber, the grabber's clearance below its row. Runs in
/// `swift test`, where every shell would float its panel beside the map, so
/// the width class is an argument.
final class KozmosMapShellPanelHeaderTopTests: XCTestCase {
    private func shell<Header: View>(
        detents: [KozmosMapPanelDetent] = [.collapsed, .medium, .large],
        @ViewBuilder header: () -> Header = { EmptyView() }
    ) -> KozmosAdaptiveMapShell<Color, EmptyView, EmptyView, Color, EmptyView> {
        KozmosAdaptiveMapShell(panelDetents: detents, map: { Color.red }, panel: { Color.green }, panelHeader: header)
    }

    /// Under a grabber the header starts 4 below the grabber's row: half of
    /// what the row falls short of a 24-point target, the clearance the
    /// panel's content keeps when no header sits there.
    func testUnderAGrabberTheHeaderKeepsTheGrabbersClearance() {
        let header = shell { Color.blue.frame(height: 44) }
        XCTAssertTrue(header.drawsGrabber(isRegularWidth: false), "three detents draw no grabber")
        XCTAssertEqual(header.panelHeaderTop(isRegularWidth: false), 4, accuracy: 0.001)
    }

    /// No grabber — a single detent — beside the map, where the header is the
    /// panel's first row, or no header at all: nothing.
    func testWithNoGrabberBesideTheMapOrWithNoHeaderNothing() {
        let cases: [(String, CGFloat)] = [
            ("a single detent", shell(detents: [.medium]) { Color.blue.frame(height: 44) }.panelHeaderTop(isRegularWidth: false)),
            ("beside the map", shell { Color.blue.frame(height: 44) }.panelHeaderTop(isRegularWidth: true)),
            ("no header", shell().panelHeaderTop(isRegularWidth: false)),
        ]
        for (name, top) in cases {
            XCTAssertEqual(top, 0, accuracy: 0.001, "\(name): the header starts \(top) below the top")
        }
    }
}

#if os(iOS)
/// Decision 14 (2026-09-27): every part at the top of the map shell's panel
/// keeps the grabber's 4 points, not only the details card, so no first
/// control sits in the grabber's 24-point circle — and, as GAP-083 did for
/// the card, tops its own 16 up to what the panel leaves above it rather
/// than adding to it. The category browser was first: in its sheet
/// presentation its first row padded 16 on every side under the grabber's
/// 16-point row, 32 down and 16 in. The panel header, where products put the
/// search field, sat flush under the grabber. Each case is drawn, and what it
/// measures is found where it was drawn.
final class KozmosMapShellHostedBrowseTests: XCTestCase {
    private let phone = CGSize(width: 390, height: 800)

    private static func isLight(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 150 && g > 150 && b > 150 }
    /// The stand-in for a search field or a product's row: nothing else here
    /// is magenta — not the red map, the grey grabber, nor the theme's blue.
    private static let magenta = Color(red: 1, green: 0, blue: 1)
    private static func isMagenta(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 200 && g < 80 && b > 200 }
    private static func isGreen(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { g > 150 && r < 120 && b < 140 }

    /// Eight tiles, two rows of four, as a venue's quick access has them.
    private let categories = ["Gates", "Check-in", "Security", "Dining", "Shopping", "Toilets", "Parking", "Help"].map {
        KozmosCategoryPresentation(id: $0.lowercased(), label: $0)
    }

    /// The browser as a product hosts it: the panel's whole content, in its
    /// sheet presentation — or, with `ownSurface`, its panel presentation —
    /// with a 44-point search field, a magenta stand-in found where it is
    /// drawn, or with `search` false the tiles alone. Each tile's icon is
    /// clear, so the first thing drawn in a tile is its square's border. (An
    /// `EmptyView` icon takes the whole square with it.)
    @ViewBuilder
    private func browser(ownSurface: Bool = false, search: Bool = true) -> some View {
        if search {
            KozmosBrowseCategoriesPanel(
                categories: categories, presentation: ownSurface ? .panel : .sheet, onSelect: { _ in },
                renderIcon: { _ in Color.clear },
                search: { Self.magenta.frame(height: 44) }, actions: { EmptyView() }, emptyState: { EmptyView() }
            )
        } else {
            KozmosBrowseCategoriesPanel(
                categories: categories, presentation: ownSurface ? .panel : .sheet, onSelect: { _ in },
                renderIcon: { _ in Color.clear }, emptyState: { EmptyView() }
            )
        }
    }

    /// Renders `view` and keeps the picture in the result bundle.
    @MainActor private func render<V: View>(_ view: V, size: CGSize, _ name: String) async throws -> RenderedPixels {
        let pixels = try await RenderedPixels.render(view, size: size)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        return pixels
    }

    /// The shell on a phone with `panel` as its panel, left to right and in
    /// the light theme whatever the simulator's own settings.
    private func sheet<Panel: View, Header: View>(
        detents: [KozmosMapPanelDetent] = [.collapsed, .medium, .large],
        detent: KozmosMapPanelDetent = .medium,
        @ViewBuilder panel: () -> Panel,
        @ViewBuilder header: () -> Header = { EmptyView() }
    ) -> some View {
        KozmosAdaptiveMapShell(
            panelDetent: .constant(detent), panelDetents: detents,
            map: { Color.red }, panel: panel, panelHeader: header
        )
        .environment(\.horizontalSizeClass, .compact)
        .environment(\.layoutDirection, .leftToRight)
        .environment(\.colorScheme, .light)
    }

    /// The panel as drawn: how far the light pixels reach across a row and
    /// down a column through `point`, which is inside it. The map around it
    /// is red, so nothing else there is light.
    private func panel(in pixels: RenderedPixels, size: CGSize, through point: CGPoint) throws -> CGRect {
        let row = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: point.y, width: size.width, height: 1), where: Self.isLight),
                                "no panel drawn across y = \(point.y)")
        let column = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: point.x, y: 0, width: 1, height: size.height), where: Self.isLight),
                                   "no panel drawn down x = \(point.x)")
        return CGRect(x: row.minX, y: column.minY, width: row.width, height: column.maxY - column.minY)
    }

    /// The docked sheet as drawn: the phone's whole width, its top where the
    /// light starts down a column clear of its rounded corners.
    private func sheetPanel(in pixels: RenderedPixels, size: CGSize) throws -> CGRect {
        let panel = try panel(in: pixels, size: size, through: CGPoint(x: 40, y: size.height - 10))
        XCTAssertEqual(panel.width, size.width, accuracy: 1, "not the docked sheet: \(panel)")
        return panel
    }

    /// Whether the sheet draws its grabber: anything drawn in the grabber's
    /// row at the sheet's middle.
    private func drawsGrabber(_ pixels: RenderedPixels, on panel: CGRect) -> Bool {
        pixels.boundingBox(in: CGRect(x: panel.midX - 30, y: panel.minY + 2, width: 60, height: 12), where: RenderedPixels.isInk) != nil
    }

    /// The top edge of the first thing drawn from `top` down — the tiles'
    /// squares' 1-point borders, a result card's — across the sheet clear of
    /// its rounded corners. Callers start under the grabber's row, or under
    /// the search field.
    private func firstDrawn(in pixels: RenderedPixels, on panel: CGRect, from top: CGFloat) throws -> CGFloat {
        try XCTUnwrap(
            pixels.boundingBox(in: CGRect(x: panel.minX + 30, y: top, width: panel.width - 60, height: 120), where: RenderedPixels.isInk),
            "nothing drawn under y = \(top)").minY
    }

    /// The top edge of the first row of tiles. Each tile pads its square by
    /// 4, so the tile — the target — starts 4 above its square.
    private func firstTilesTop(in pixels: RenderedPixels, on panel: CGRect, from top: CGFloat) throws -> CGFloat {
        try firstDrawn(in: pixels, on: panel, from: top) - 4
    }


    // MARK: Under a grabber

    /// The search row padded 16 under the grabber's 16-point row: the field
    /// 32 down and 16 in. The row tops its padding up to 16 instead of adding
    /// 16 to the row, and keeps the grabber's clearance: 20 and 16, the web's
    /// 21 and 17 (its panel has a 1px border inside it).
    @MainActor func testUnderAGrabberTheSearchFieldSitsAsFarDownAsInPlusTheGrabbersClearance() async throws {
        let pixels = try await render(sheet { browser() }, size: phone, "decision-14-browser-under-grabber")
        let panel = try sheetPanel(in: pixels, size: phone)
        XCTAssertTrue(drawsGrabber(pixels, on: panel), "the sheet draws no grabber")
        let field = try XCTUnwrap(pixels.boundingBox(in: panel, where: Self.isMagenta), "the search field is not drawn")
        let down = field.minY - panel.minY, inward = field.minX - panel.minX
        print("Decision 14 iOS, browser under a grabber: the search field \(down) from the top, \(inward) from the side")
        XCTAssertEqual(inward, 16, accuracy: 1, "the search field is \(inward) from the sheet's side")
        XCTAssertEqual(down, inward + 4, accuracy: 1, "the search field is \(down) from the sheet's top and \(inward) from its side")
    }

    /// With no search row the tiles are the first row, and the same rule
    /// holds: the tiles started 32 down, and start 20 — the grabber's centre
    /// 8 and the 12 of its 24-point circle, which they span and must not
    /// enter. Each tile starts 16 from the sheet's side.
    @MainActor func testUnderAGrabberWithNoSearchRowTheTilesSitAsFarDownAsInPlusTheGrabbersClearance() async throws {
        let pixels = try await render(sheet { browser(search: false) }, size: phone, "decision-14-tiles-under-grabber")
        let panel = try sheetPanel(in: pixels, size: phone)
        XCTAssertTrue(drawsGrabber(pixels, on: panel), "the sheet draws no grabber")
        let down = try firstTilesTop(in: pixels, on: panel, from: panel.minY + 16) - panel.minY
        print("Decision 14 iOS, tiles under a grabber: the first tiles \(down) from the top")
        XCTAssertEqual(down, 16 + 4, accuracy: 1, "the first tiles are \(down) from the sheet's top")
    }

    /// Only the first row tops up: the tiles under the search row sit under
    /// that row, not under the grabber — the row's 16 under the field, then
    /// the tiles' own 16.
    @MainActor func testTheTilesUnderTheSearchRowKeepTheir16() async throws {
        let pixels = try await render(sheet { browser() }, size: phone, "decision-14-tiles-under-search-row")
        let panel = try sheetPanel(in: pixels, size: phone)
        let field = try XCTUnwrap(pixels.boundingBox(in: panel, where: Self.isMagenta), "the search field is not drawn")
        let under = try firstTilesTop(in: pixels, on: panel, from: field.maxY + 1) - field.maxY
        print("Decision 14 iOS, tiles under the search row: \(under) below the field")
        XCTAssertEqual(under, 16 + 16, accuracy: 1, "the tiles are \(under) below the search field")
    }

    /// Hosted, the panel presentation follows the panel's signal as the web's
    /// browser does (2026-09-28): it paints no surface of its own there, so
    /// the space the panel leaves is its own top, and its search field sits
    /// where the sheet presentation's does, 16 plus the grabber's 4. It kept
    /// its own 16, 32 from the sheet's top, a prop the product had to change.
    @MainActor func testHostedThePanelPresentationTopsUpUnderAGrabberAsTheSheetPresentationDoes() async throws {
        let pixels = try await render(sheet { browser(ownSurface: true) }, size: phone, "decision-14-panel-presentation-under-grabber")
        let panel = try sheetPanel(in: pixels, size: phone)
        let field = try XCTUnwrap(pixels.boundingBox(in: panel, where: Self.isMagenta), "the search field is not drawn")
        let down = field.minY - panel.minY
        print("Decision 14 iOS, panel presentation under a grabber: the search field \(down) from the top")
        XCTAssertEqual(down, 16 + 4, accuracy: 1, "the panel presentation's search field is \(down) from the sheet's top")
    }

    // MARK: No grabber, a panel header, beside the map

    /// A single detent draws no grabber, so the sheet leaves nothing above
    /// the browser and its row keeps its own 16: 16 and 16, as before.
    @MainActor func testASingleDetentSheetDrawsNoGrabberAndTheBrowserKeepsItsOwnPadding() async throws {
        let pixels = try await render(sheet(detents: [.medium]) { browser() }, size: phone, "decision-14-browser-single-detent")
        let panel = try sheetPanel(in: pixels, size: phone)
        XCTAssertFalse(drawsGrabber(pixels, on: panel), "something is drawn in the grabber's row")
        let field = try XCTUnwrap(pixels.boundingBox(in: panel, where: Self.isMagenta), "the search field is not drawn")
        let down = field.minY - panel.minY, inward = field.minX - panel.minX
        print("Decision 14 iOS, browser in a single-detent sheet: the search field \(down) from the top, \(inward) from the side")
        XCTAssertEqual(down, inward, accuracy: 1, "the search field is \(down) from the sheet's top and \(inward) from its side")
        XCTAssertEqual(inward, 16, accuracy: 1)
    }

    /// Under a panel header the space above the browser is the header, not
    /// empty: the browser keeps its own 16 under it.
    @MainActor func testUnderAPanelHeaderTheBrowserKeepsItsOwnPadding() async throws {
        let pixels = try await render(
            sheet(detent: .large) { browser() } header: { Color.green.frame(height: 60) },
            size: phone, "decision-14-browser-under-panel-header")
        let panel = try sheetPanel(in: pixels, size: phone)
        let header = try XCTUnwrap(pixels.boundingBox(in: panel, where: Self.isGreen), "the panel header is not drawn")
        let field = try XCTUnwrap(pixels.boundingBox(in: panel, where: Self.isMagenta), "the search field is not drawn")
        let under = field.minY - header.maxY
        print("Decision 14 iOS, browser under a panel header: the search field \(under) under the header")
        XCTAssertEqual(under, 16, accuracy: 1, "the search field is \(under) under the panel header")
    }

    /// A native side panel leaves nothing above its content — the web's
    /// keeps 16 there — so the browser keeps its own 16: the field 16 from
    /// the panel's top and 16 from its start, the right right to left.
    @MainActor func testInASidePanelTheSearchFieldSitsAsFarDownAsIn() async throws {
        let wide = CGSize(width: 1024, height: 700)
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let view = KozmosAdaptiveMapShell(map: { Color.red }, panel: { browser() })
                .environment(\.horizontalSizeClass, .regular)
                .environment(\.layoutDirection, direction)
                .environment(\.colorScheme, .light)
            let pixels = try await render(view, size: wide, "decision-14-browser-side-panel-\(direction)")
            let rightToLeft = direction == .rightToLeft
            let field = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: wide), where: Self.isMagenta), "\(direction): the search field is not drawn")
            // Short side panels no longer reach the screen's midpoint. Probe
            // the actual field's row and centre column, clear of rounded corners.
            let panel = try panel(in: pixels, size: wide, through: CGPoint(x: field.midX, y: field.midY))
            XCTAssertEqual(panel.width, 416, accuracy: 1.5, "\(direction): not the side panel: \(panel)")
            XCTAssertLessThan(panel.height, wide.height / 2, "\(direction): the short browser should hug its content")
            let down = field.minY - panel.minY
            let inward = rightToLeft ? panel.maxX - field.maxX : field.minX - panel.minX
            print("Decision 14 iOS, browser in a side panel, \(direction): the search field \(down) from the top, \(inward) from the start")
            XCTAssertEqual(down, inward, accuracy: 1, "\(direction): the search field is \(down) from the top and \(inward) from the start")
            XCTAssertEqual(inward, 16, accuracy: 1, "\(direction): the search field is \(inward) from the start")
        }
    }

    // MARK: The panel header

    /// Products put the search field in the panel header. Under a grabber it
    /// sat flush under the grabber's row, 16 from the sheet's top and 8 from
    /// the grabber's centre: inside the 24-point circle the grabber's target
    /// keeps clear (WCAG 2.5.8). The header keeps the grabber's clearance, as
    /// the web's has since #109: 20, on the circle's edge.
    @MainActor func testUnderAGrabberThePanelHeadersFirstControlKeepsTheGrabbersClearance() async throws {
        let pixels = try await render(sheet {
            Color.white
        } header: {
            Self.magenta.frame(height: 44).padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
        }, size: phone, "decision-14-panel-header-under-grabber")
        let panel = try sheetPanel(in: pixels, size: phone)
        XCTAssertTrue(drawsGrabber(pixels, on: panel), "the sheet draws no grabber")
        let field = try XCTUnwrap(pixels.boundingBox(in: panel, where: Self.isMagenta), "the header's field is not drawn")
        let down = field.minY - panel.minY
        print("Decision 14 iOS, panel header under a grabber: its field \(down) from the sheet's top, \(down - 8) from the grabber's centre")
        XCTAssertEqual(down, 20, accuracy: 1, "the header's field is \(down) from the sheet's top")
    }

    /// A browser the product puts under its own row is not the panel's top,
    /// and the product says so: told the panel leaves nothing above it, it
    /// keeps its 16 under the row.
    @MainActor func testABrowserUnderAProductsOwnRowToldItIsNotTheTopKeepsItsPadding() async throws {
        let pixels = try await render(sheet {
            VStack(spacing: 0) {
                Color.green.frame(height: 44).padding(.top, 8)
                browser()
                    .environment(\.kozmosPanelInsetTop, 0)
                    .environment(\.kozmosPanelClearanceTop, 0)
            }
        }, size: phone, "decision-14-browser-under-a-products-row")
        let panel = try sheetPanel(in: pixels, size: phone)
        let row = try XCTUnwrap(pixels.boundingBox(in: panel, where: Self.isGreen), "the product's row is not drawn")
        let field = try XCTUnwrap(pixels.boundingBox(in: panel, where: Self.isMagenta), "the search field is not drawn")
        let under = field.minY - row.maxY
        print("Decision 14 iOS, browser under a product's row: the search field \(under) under the row")
        XCTAssertEqual(under, 16, accuracy: 1, "the search field is \(under) under the product's row")
    }

    // MARK: A result list

    /// A result list brings no top padding of its own, yet natively its first
    /// result already starts well under the grabber's row — measured 51 from
    /// the sheet's top on this phone at medium — clear of the grabber's
    /// circle: at least 20 from the top. The web's list started flush under
    /// the grip, and keeps its clearance now.
    @MainActor func testUnderAGrabberAHostedResultListKeepsItsFirstResultClear() async throws {
        let items = (1...4).map { index in
            KozmosPOIResultListItem(
                poi: KozmosPOIPresentation(id: "result-\(index)", name: "Result \(index)", floorId: "1", floorLabel: "Level one"),
                result: KozmosPOIResultPresentation(poiId: "result-\(index)", resultIndex: index, floorId: "1")
            )
        }
        let pixels = try await render(sheet {
            KozmosPOIResultList(items: items, resultCountLabel: "4 results", onSelect: { _ in })
        }, size: phone, "decision-14-result-list-under-grabber")
        let panel = try sheetPanel(in: pixels, size: phone)
        XCTAssertTrue(drawsGrabber(pixels, on: panel), "the sheet draws no grabber")
        let down = try firstDrawn(in: pixels, on: panel, from: panel.minY + 16) - panel.minY
        print("Decision 14 iOS, result list under a grabber: the first result \(down) from the top")
        XCTAssertGreaterThanOrEqual(down, 20 - 0.5, "the first result is \(down) from the sheet's top, inside the grabber's circle")
    }
}
#endif
