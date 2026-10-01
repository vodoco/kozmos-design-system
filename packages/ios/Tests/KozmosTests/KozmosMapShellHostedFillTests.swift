#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 43 (2026-09-28): in the map shell's panel, a sheet or a side
/// panel, the panel's surface, solid or glass, is the one surface: a hosted
/// part paints no fill of its own. A part standing alone keeps its fill. The
/// category browser's sheet presentation paints none already. The route
/// preview filled its box with the background colour wherever it was: an
/// opaque block on a glass sheet, and a square one, poking past the panel's
/// rounded corners over the map. Each case reads what is drawn at a point
/// inside the part clear of its text, and the same point with the panel
/// hosting nothing: a part that paints no fill leaves the panel's own colour.
final class KozmosMapShellHostedFillTests: XCTestCase {
    private let phone = CGSize(width: 390, height: 800)
    private let wide = CGSize(width: 1024, height: 700)

    /// The panel as against the red map: light, whether solid, glass over
    /// red, or a part's fill.
    private static func isLight(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 150 && g > 150 && b > 150 }

    private let options = [
        KozmosRouteOptionPresentation(
            id: "quickest", label: "Quickest", durationSeconds: 240, durationLabel: "4 min",
            distanceMetres: 150, distanceLabel: "150 m", preference: .quickest, selected: true
        ),
        KozmosRouteOptionPresentation(
            id: "step-free", label: "Step-free", durationSeconds: 360, durationLabel: "6 min",
            distanceMetres: 173, distanceLabel: "173 m", preference: .stepFree
        ),
    ]

    /// Eight tiles, two rows of four, as a venue's quick access has them.
    private let categories = ["Gates", "Check-in", "Security", "Dining", "Shopping", "Toilets", "Parking", "Help"].map {
        KozmosCategoryPresentation(id: $0.lowercased(), label: $0)
    }

    private func route() -> some View {
        KozmosRoutePreviewPanel(
            destinationName: "Harbour Coffee Co.", options: options, status: .ready,
            backLabel: "Back", continueLabel: "Start",
            onOptionSelect: { _ in }, onBack: {}, onContinue: { _ in }
        )
    }

    /// The tiles alone, in the sheet presentation, as a product hosts them
    /// under a panel header's search; or in the panel presentation, the
    /// default, as a product that did not pass one hosts them.
    private func browser(_ presentation: KozmosBrowseCategoriesPanel<Color, EmptyView, EmptyView, EmptyView>.Presentation = .sheet) -> some View {
        KozmosBrowseCategoriesPanel(
            categories: categories, presentation: presentation, onSelect: { _ in },
            renderIcon: { _ in Color.clear }, emptyState: { EmptyView() }
        )
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

    /// The shell over a red map with `panel` as its panel, left to right and
    /// in the light theme: a phone's sheet resting at medium, or beside the
    /// map on a wide screen.
    private func shell<Panel: View>(
        _ surface: KozmosSurfaceStyle, side: Bool = false, @ViewBuilder panel: () -> Panel
    ) -> some View {
        KozmosAdaptiveMapShell(
            panelDetent: .constant(.medium), panelSurface: surface,
            map: { Color.red }, panel: panel
        )
        .environment(\.horizontalSizeClass, side ? .regular : .compact)
        .environment(\.layoutDirection, .leftToRight)
        .environment(\.colorScheme, .light)
    }

    /// The panel as drawn: how far the light pixels reach across a row and
    /// down a column through `point`, which is inside it.
    private func panel(in pixels: RenderedPixels, size: CGSize, through point: CGPoint) throws -> CGRect {
        let row = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: point.y, width: size.width, height: 1), where: Self.isLight),
                                "no panel drawn across y = \(point.y)")
        let column = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: point.x, y: 0, width: 1, height: size.height), where: Self.isLight),
                                   "no panel drawn down x = \(point.x)")
        return CGRect(x: row.minX, y: column.minY, width: row.width, height: column.maxY - column.minY)
    }

    private func sheetPanel(in pixels: RenderedPixels) throws -> CGRect {
        let panel = try panel(in: pixels, size: phone, through: CGPoint(x: 40, y: phone.height - 10))
        XCTAssertEqual(panel.width, phone.width, accuracy: 1, "not the docked sheet: \(panel)")
        return panel
    }

    private func sidePanel(in pixels: RenderedPixels) throws -> CGRect {
        let panel = try panel(in: pixels, size: wide, through: CGPoint(x: 800, y: 350))
        XCTAssertEqual(panel.width, 416, accuracy: 1.5, "not the side panel: \(panel)")
        return panel
    }

    /// A point inside the part where it draws nothing of its own but its
    /// fill: 6 points in from the panel's end edge, inside the part's 16 of
    /// end padding, and 40 down from the panel's top, beside the route
    /// preview's destination or the browser's first tiles.
    private func insidePart(of panel: CGRect) -> CGPoint { CGPoint(x: panel.maxX - 6, y: panel.minY + 40) }

    private func describe(_ c: (r: UInt8, g: UInt8, b: UInt8)) -> String { "(\(c.r), \(c.g), \(c.b))" }

    private func same(_ a: (r: UInt8, g: UInt8, b: UInt8), _ b: (r: UInt8, g: UInt8, b: UInt8)) -> Bool {
        abs(Int(a.r) - Int(b.r)) <= 3 && abs(Int(a.g) - Int(b.g)) <= 3 && abs(Int(a.b) - Int(b.b)) <= 3
    }

    private func isWhite(_ c: (r: UInt8, g: UInt8, b: UInt8)) -> Bool { c.r > 250 && c.g > 250 && c.b > 250 }

    /// What the part leaves at its point, against the panel's own colour
    /// there with nothing hosted. On glass that colour is not white, or the
    /// case could not tell a fill from none.
    @MainActor private func assertNoFillOfItsOwn<Part: View>(
        _ name: String, _ surface: KozmosSurfaceStyle, side: Bool = false, @ViewBuilder part: () -> Part
    ) async throws {
        let size = side ? wide : phone
        let where_ = side ? "side-panel" : "sheet"
        let hosted = try await render(shell(surface, side: side, panel: part), size: size, "decision-43-\(name)-\(surface)-\(where_)")
        let panel = side ? try sidePanel(in: hosted) : try sheetPanel(in: hosted)
        let point = insidePart(of: panel)
        let withPart = hosted.color(at: point)
        let empty = try await render(shell(surface, side: side) { Color.clear }, size: size, "decision-43-nothing-\(surface)-\(where_)")
            .color(at: point)
        print("Decision 43 iOS, \(name) on \(surface) (\(where_)): \(describe(withPart)) inside it, \(describe(empty)) with nothing hosted")
        if surface == .glass {
            XCTAssertFalse(isWhite(empty), "\(name): the glass panel draws white there, so it is not seen through")
        }
        XCTAssertTrue(same(withPart, empty),
                      "\(name) on \(surface) (\(where_)): drew \(describe(withPart)) where the panel alone draws \(describe(empty))")
    }

    // MARK: A sheet

    /// The route preview painted the background colour over the glass:
    /// white on the red, not the glass's pink.
    @MainActor func testOnAGlassSheetTheRoutePreviewPaintsNoFillOfItsOwn() async throws {
        try await assertNoFillOfItsOwn("route-preview", .glass) { route() }
    }

    /// The browser's sheet presentation paints no fill: the glass shows
    /// through it.
    @MainActor func testOnAGlassSheetTheBrowsersSheetPresentationPaintsNoFillOfItsOwn() async throws {
        try await assertNoFillOfItsOwn("category-browser", .glass) { browser() }
    }

    /// Hosted, the browser's panel presentation follows the panel's signal as
    /// the web's browser does: it painted the background colour over the
    /// glass, a prop the product had to remember to change.
    @MainActor func testOnAGlassSheetTheBrowsersPanelPresentationPaintsNoFillOfItsOwn() async throws {
        try await assertNoFillOfItsOwn("category-browser-panel", .glass) { browser(.panel) }
    }

    /// And its first row tops up under the grabber as the sheet
    /// presentation's does (decision 14): its first tiles sit where the
    /// sheet presentation's sit, not 16 lower.
    @MainActor func testUnderTheGrabberTheBrowsersPanelPresentationTopsUpItsFirstRow() async throws {
        func firstTileTop(_ pixels: RenderedPixels) throws -> CGFloat {
            let panel = try sheetPanel(in: pixels)
            // The first thing drawn on the white sheet down the first tile's
            // column, below the sheet's edge and clear of the grabber, which
            // is centred.
            let tile = try XCTUnwrap(pixels.boundingBox(
                in: CGRect(x: panel.minX + 40, y: panel.minY + 20, width: 1, height: 200),
                where: { r, g, b in r < 245 || g < 245 || b < 245 }
            ), "no tile under the grabber")
            return tile.minY - panel.minY
        }
        let sheet = try firstTileTop(try await render(shell(.solid) { browser(.sheet) }, size: phone, "decision-14-browser-sheet"))
        let panel = try firstTileTop(try await render(shell(.solid) { browser(.panel) }, size: phone, "decision-14-browser-panel"))
        print("Decision 14 iOS, the browser's first tile under the grabber: \(sheet) in the sheet presentation, \(panel) in the panel presentation")
        XCTAssertEqual(panel, sheet, accuracy: 1, "the panel presentation's first tile sits \(panel) below the panel's top, the sheet presentation's \(sheet)")
    }

    /// On a solid sheet a part that paints no fill looks as it did: the
    /// sheet's fill is the background colour the route preview painted.
    @MainActor func testOnASolidSheetTheRoutePreviewLooksAsItDid() async throws {
        try await assertNoFillOfItsOwn("route-preview", .solid) { route() }
        let pixels = try await render(shell(.solid) { route() }, size: phone, "decision-43-route-preview-solid-sheet-colour")
        let point = insidePart(of: try sheetPanel(in: pixels))
        XCTAssertTrue(isWhite(pixels.color(at: point)), "the route preview on a solid sheet drew \(describe(pixels.color(at: point)))")
    }

    // MARK: A side panel

    /// A side panel can be glass too, and the same block stood in it.
    @MainActor func testInAGlassSidePanelTheRoutePreviewPaintsNoFillOfItsOwn() async throws {
        try await assertNoFillOfItsOwn("route-preview", .glass, side: true) { route() }
    }

    /// Its fill was square: in a solid side panel it covered the panel's
    /// rounded top corner, so the map did not show there. The panel's
    /// rounded surface under it keeps the corner now.
    @MainActor func testInASolidSidePanelTheRoutePreviewNoLongerSquaresThePanelsCorner() async throws {
        let pixels = try await render(shell(.solid, side: true) { route() }, size: wide, "decision-43-route-preview-side-panel-corner")
        let panel = try sidePanel(in: pixels)
        let corner = pixels.color(at: CGPoint(x: panel.minX + 1.5, y: panel.minY + 1.5))
        print("Decision 43 iOS, route preview in a solid side panel: the panel's top corner draws \(describe(corner))")
        XCTAssertTrue(corner.r > 150 && corner.g < 120 && corner.b < 120,
                      "the side panel's rounded top corner draws \(describe(corner)), not the map behind it")
    }

    // MARK: A route option

    /// The chosen route option is a card of its own: its 5% tint lay over
    /// nothing, so on glass the map showed through it while the other
    /// options stood opaque. Read 6 points inside its leading edge, halfway
    /// down, clear of its text and its edge: on glass it draws what it draws
    /// on a solid sheet, the tint on the background colour.
    @MainActor func testOnAGlassSheetTheChosenRouteOptionIsAsOpaqueAsOnASolidOne() async throws {
        let chosen = KozmosRouteOptionCard(option: options[0], onSelect: { _ in })
        func sample(_ surface: KozmosSurfaceStyle) async throws -> (r: UInt8, g: UInt8, b: UInt8) {
            let pixels = try await render(
                shell(surface) { chosen.padding(16) }, size: phone, "route-option-chosen-\(surface)")
            let panel = try sheetPanel(in: pixels)
            // The option's top edge: its theme-coloured stroke, down a column
            // inside it.
            let stroke = try XCTUnwrap(pixels.boundingBox(
                in: CGRect(x: panel.minX + 60, y: panel.minY, width: 1, height: 200),
                where: RenderedPixels.isTheme), "no chosen option drawn")
            return pixels.color(at: CGPoint(x: panel.minX + 16 + 6, y: stroke.minY + 48))
        }
        let solid = try await sample(.solid)
        let glass = try await sample(.glass)
        print("Route option iOS, the chosen option: \(describe(glass)) on glass, \(describe(solid)) on a solid sheet")
        XCTAssertTrue(same(glass, solid), "the chosen option drew \(describe(glass)) on glass, \(describe(solid)) on a solid sheet")
    }

    // MARK: Standing alone

    /// The guard: outside a shell nothing says a surface is there, and the
    /// browser's panel presentation keeps its fill.
    @MainActor func testStandingAloneTheBrowsersPanelPresentationKeepsItsFill() async throws {
        let size = CGSize(width: 390, height: 500)
        let view = ZStack { Color.red; browser(.panel) }
            .frame(width: size.width, height: size.height)
            .environment(\.layoutDirection, .leftToRight)
            .environment(\.colorScheme, .light)
        let pixels = try await render(view, size: size, "decision-43-browser-panel-standing-alone")
        let point = insidePart(of: CGRect(origin: .zero, size: size))
        print("Decision 43 iOS, the browser's panel presentation standing alone: \(describe(pixels.color(at: point)))")
        XCTAssertTrue(isWhite(pixels.color(at: point)),
                      "standing alone, the browser's panel presentation drew \(describe(pixels.color(at: point))), not its fill")
    }

    /// The sheet presentation standing alone keeps its fill too, as the web's
    /// browser and Android's do: the presentation says only whether a rule
    /// runs under the search row, and the fill follows the host. It painted
    /// none wherever it was, so outside a shell the map showed through it.
    @MainActor func testStandingAloneTheBrowsersSheetPresentationKeepsItsFill() async throws {
        let size = CGSize(width: 390, height: 500)
        let view = ZStack { Color.red; browser(.sheet) }
            .frame(width: size.width, height: size.height)
            .environment(\.layoutDirection, .leftToRight)
            .environment(\.colorScheme, .light)
        let pixels = try await render(view, size: size, "s12-browser-sheet-standing-alone")
        let point = insidePart(of: CGRect(origin: .zero, size: size))
        print("S12 iOS, the browser's sheet presentation standing alone: \(describe(pixels.color(at: point)))")
        XCTAssertTrue(isWhite(pixels.color(at: point)),
                      "standing alone, the browser's sheet presentation drew \(describe(pixels.color(at: point))), not its fill")
    }

    /// The guard: outside a shell nothing says a surface is there, and the
    /// preview keeps its fill.
    @MainActor func testStandingAloneTheRoutePreviewKeepsItsFill() async throws {
        let size = CGSize(width: 390, height: 500)
        let view = ZStack { Color.red; route() }
            .frame(width: size.width, height: size.height)
            .environment(\.layoutDirection, .leftToRight)
            .environment(\.colorScheme, .light)
        let pixels = try await render(view, size: size, "decision-43-route-preview-standing-alone")
        let point = insidePart(of: CGRect(origin: .zero, size: size))
        print("Decision 43 iOS, route preview standing alone: \(describe(pixels.color(at: point)))")
        XCTAssertTrue(isWhite(pixels.color(at: point)),
                      "standing alone, the route preview drew \(describe(pixels.color(at: point))), not its fill")
    }
}
#endif
