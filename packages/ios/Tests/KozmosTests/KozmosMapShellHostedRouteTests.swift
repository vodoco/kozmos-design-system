#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 14 (2026-09-27): every part at the top of the map shell's panel
/// keeps the grabber's 4 points and tops its own 16 up to what the panel
/// leaves above it rather than adding to it, as the details card (GAP-083)
/// and the category browser (#135) do. The route preview's destination row
/// padded 16 on every side under the grabber's 16-point row: its label 32
/// down and 16 in. Each case is drawn, and the label found where it was
/// drawn.
///
/// The label is text, so what is drawn is its glyphs, which start a little
/// inside the label's frame: below its top by the line's ascent less the
/// capitals' height, and in from its start by the first glyph's side
/// bearing. Those two are measured on the label's own style drawn where the
/// test puts it (`inkInset`), and taken off every glyph found, so each case
/// reads where the label's frame is, as the web and Android read it.
final class KozmosMapShellHostedRouteTests: XCTestCase {
    private let phone = CGSize(width: 390, height: 800)

    private static func isLight(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 150 && g > 150 && b > 150 }
    /// The stand-in for a panel header or a product's row: nothing else here
    /// is green — not the red map, the grey grabber, nor the theme's blue.
    private static func isGreen(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { g > 150 && r < 120 && b < 140 }

    private let destination = "Harbour Coffee Co."

    /// Two ways there, the quicker one chosen, as a route preview opens.
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

    /// The route preview as a product hosts it: the panel's whole content.
    private func route() -> some View {
        KozmosRoutePreviewPanel(
            destinationName: destination, options: options, status: .ready,
            backLabel: "Back", continueLabel: "Start",
            onOptionSelect: { _ in }, onBack: {}, onContinue: { _ in }
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

    /// The first glyphs drawn from `top` down in a band along the panel's
    /// start edge — 14 in, where its 24-point corner and the border on it are
    /// less than 4 deep, and short of the grabber at its middle — and only
    /// their first line: the label's capitals, 6 points of them, not the
    /// destination's name under them. Callers start 4 below a panel's top
    /// edge.
    private func glyphs(in pixels: RenderedPixels, on panel: CGRect, from top: CGFloat,
                        _ direction: LayoutDirection = .leftToRight) throws -> CGRect {
        let x = direction == .rightToLeft ? panel.maxX - 150 : panel.minX + 14
        let first = try XCTUnwrap(
            pixels.boundingBox(in: CGRect(x: x, y: top, width: 136, height: 80), where: RenderedPixels.isInk),
            "nothing drawn under y = \(top)")
        return try XCTUnwrap(
            pixels.boundingBox(in: CGRect(x: x, y: first.minY, width: 136, height: 6), where: RenderedPixels.isInk),
            "no glyphs drawn at y = \(first.minY)")
    }

    /// How far the label's capitals start inside its frame, from the top and
    /// from its start: the label's own style — the caption's semibold
    /// capitals, in the preview's secondary grey — drawn 16 from the top and
    /// the start of a white box, and found where it was drawn.
    @MainActor private func inkInset(_ direction: LayoutDirection = .leftToRight) async throws -> (top: CGFloat, side: CGFloat) {
        let size = CGSize(width: 200, height: 60)
        let view = Text("TO")
            .font(.caption.weight(.semibold))
            .foregroundColor(KozmosColors.primitivesColorsForeground500)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .frame(width: size.width, height: size.height, alignment: .top)
            .background(Color.white)
            .environment(\.layoutDirection, direction)
        let pixels = try await render(view, size: size, "decision-14-label-style-\(direction)")
        let ink = try glyphs(in: pixels, on: CGRect(origin: .zero, size: size), from: 0, direction)
        let side = direction == .rightToLeft ? size.width - ink.maxX : ink.minX
        return (ink.minY - 16, side - 16)
    }

    /// In points: where the destination label's frame sits from the panel's
    /// top edge, and from its start edge — the right, right to left.
    private struct Placed { let down: CGFloat; let inward: CGFloat }

    @MainActor private func label(in pixels: RenderedPixels, on panel: CGRect, from top: CGFloat,
                                  _ direction: LayoutDirection = .leftToRight) async throws -> Placed {
        let inset = try await inkInset(direction)
        let ink = try glyphs(in: pixels, on: panel, from: top, direction)
        let side = direction == .rightToLeft ? panel.maxX - ink.maxX : ink.minX - panel.minX
        return Placed(down: ink.minY - panel.minY - inset.top, inward: side - inset.side)
    }

    // MARK: On its own

    /// Outside a shell nothing is left above the preview: its row keeps its
    /// 16 on every side, as before. The guard for the rule reaching a preview
    /// no shell hosts.
    @MainActor func testOnItsOwnTheDestinationRowKeepsItsPadding() async throws {
        let size = CGSize(width: 390, height: 500)
        let view = route()
            .frame(width: size.width, height: size.height)
            .environment(\.layoutDirection, .leftToRight)
            .environment(\.colorScheme, .light)
        let pixels = try await render(view, size: size, "decision-14-route-on-its-own")
        let at = try await label(in: pixels, on: CGRect(origin: .zero, size: size), from: 0)
        print("Decision 14 iOS, route preview on its own: the destination label \(at.down) from the top, \(at.inward) from the side")
        XCTAssertEqual(at.down, 16, accuracy: 1, "the destination label is \(at.down) from the preview's top")
        XCTAssertEqual(at.inward, 16, accuracy: 1, "the destination label is \(at.inward) from the preview's side")
    }

    // MARK: Under a grabber

    /// The docs' snippet (RoutePreviewPanel.mdx), drawn: the route preview as
    /// the sheet's whole content, at the shell's default detents. Its
    /// destination row padded 16 under the grabber's 16-point row: the label
    /// 32 down and 16 in. The row tops its padding up to 16 instead of adding
    /// 16 to the row, and keeps the grabber's clearance: 20 and 16, the web's
    /// 21 and 17 (its panel has a 1px border inside it) and Android's 20 and 16.
    @MainActor func testUnderAGrabberTheDestinationRowSitsAsFarDownAsInPlusTheGrabbersClearance() async throws {
        let snippet = RoutePreviewSheet(
            destination: destination, options: options, status: .ready, map: Color.red,
            onSelect: { _ in }, onBack: {}, onStart: { _ in }
        )
        .environment(\.horizontalSizeClass, .compact)
        .environment(\.layoutDirection, .leftToRight)
        .environment(\.colorScheme, .light)
        let pixels = try await render(snippet, size: phone, "decision-14-route-under-grabber")
        let panel = try sheetPanel(in: pixels, size: phone)
        XCTAssertTrue(drawsGrabber(pixels, on: panel), "the sheet draws no grabber")
        let at = try await label(in: pixels, on: panel, from: panel.minY + 4)
        print("Decision 14 iOS, route preview under a grabber: the destination label \(at.down) from the top, \(at.inward) from the side")
        XCTAssertEqual(at.inward, 16, accuracy: 1, "the destination label is \(at.inward) from the sheet's side")
        XCTAssertEqual(at.down, at.inward + 4, accuracy: 1,
                       "the destination label is \(at.down) from the sheet's top and \(at.inward) from its side")
    }

    /// Only the first row tops up: the options sit under the destination
    /// row's rule, not under the grabber — the rule, then the options' own
    /// 16 above the cards' top edge. The rule is found down a column 8 in
    /// from the sheet's end, where it is all that is drawn (the options
    /// scroll inside the 16 on either side), and the cards' edge down a
    /// column that meets the second card, below the rule.
    @MainActor func testTheOptionsUnderTheDestinationRowKeepTheir16() async throws {
        let pixels = try await render(sheet { route() }, size: phone, "decision-14-route-options-under-row")
        let panel = try sheetPanel(in: pixels, size: phone)
        let rule = try XCTUnwrap(
            pixels.boundingBox(in: CGRect(x: panel.maxX - 8, y: panel.minY + 20, width: 1, height: 200), where: RenderedPixels.isInk),
            "no rule drawn under the destination row")
        let card = try XCTUnwrap(
            pixels.boundingBox(in: CGRect(x: panel.minX + 300, y: rule.maxY, width: 1, height: 100), where: RenderedPixels.isInk),
            "no route option drawn under the rule")
        let under = card.minY - rule.maxY
        print("Decision 14 iOS, options under the destination row: the cards' top edge \(under) under the rule")
        XCTAssertEqual(under, 16, accuracy: 1, "the options are \(under) under the destination row's rule")
    }

    // MARK: No grabber, a panel header, beside the map

    /// A single detent draws no grabber, so the sheet leaves nothing above
    /// the preview and its row keeps its own 16: 16 and 16, as before.
    @MainActor func testASingleDetentSheetDrawsNoGrabberAndTheRouteKeepsItsOwnPadding() async throws {
        let pixels = try await render(sheet(detents: [.medium]) { route() }, size: phone, "decision-14-route-single-detent")
        let panel = try sheetPanel(in: pixels, size: phone)
        XCTAssertFalse(drawsGrabber(pixels, on: panel), "something is drawn in the grabber's row")
        let at = try await label(in: pixels, on: panel, from: panel.minY + 4)
        print("Decision 14 iOS, route preview in a single-detent sheet: the destination label \(at.down) from the top, \(at.inward) from the side")
        XCTAssertEqual(at.down, at.inward, accuracy: 1, "the destination label is \(at.down) from the sheet's top and \(at.inward) from its side")
        XCTAssertEqual(at.inward, 16, accuracy: 1, "the destination label is \(at.inward) from the sheet's side")
    }

    /// Under a panel header the space above the preview is the header, not
    /// empty: the preview keeps its own 16 under it.
    @MainActor func testUnderAPanelHeaderTheRouteKeepsItsOwnPadding() async throws {
        let pixels = try await render(
            sheet(detent: .large) { route() } header: { Color.green.frame(height: 60) },
            size: phone, "decision-14-route-under-panel-header")
        let panel = try sheetPanel(in: pixels, size: phone)
        let header = try XCTUnwrap(pixels.boundingBox(in: panel, where: Self.isGreen), "the panel header is not drawn")
        let at = try await label(in: pixels, on: panel, from: header.maxY + 1)
        let under = at.down - (header.maxY - panel.minY)
        print("Decision 14 iOS, route preview under a panel header: the destination label \(under) under the header")
        XCTAssertEqual(under, 16, accuracy: 1, "the destination label is \(under) under the panel header")
    }

    /// A native side panel leaves nothing above its content — the web's
    /// keeps 16 there — so the preview keeps its own 16: the label 16 from
    /// the panel's top and 16 from its start, the right right to left.
    @MainActor func testInASidePanelTheDestinationRowSitsAsFarDownAsIn() async throws {
        let wide = CGSize(width: 1024, height: 700)
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let view = KozmosAdaptiveMapShell(map: { Color.red }, panel: { route() })
                .environment(\.horizontalSizeClass, .regular)
                .environment(\.layoutDirection, direction)
                .environment(\.colorScheme, .light)
            let pixels = try await render(view, size: wide, "decision-14-route-side-panel-\(direction)")
            let rightToLeft = direction == .rightToLeft
            let panel = try panel(in: pixels, size: wide, through: CGPoint(x: rightToLeft ? 224 : 800, y: 350))
            XCTAssertEqual(panel.width, 416, accuracy: 1.5, "\(direction): not the side panel: \(panel)")
            let at = try await label(in: pixels, on: panel, from: panel.minY + 4, direction)
            print("Decision 14 iOS, route preview in a side panel, \(direction): the destination label \(at.down) from the top, \(at.inward) from the start")
            XCTAssertEqual(at.down, at.inward, accuracy: 1, "\(direction): the destination label is \(at.down) from the top and \(at.inward) from the start")
            XCTAssertEqual(at.inward, 16, accuracy: 1, "\(direction): the destination label is \(at.inward) from the start")
        }
    }

    /// A route preview the product puts under its own row is not the panel's
    /// top, and the product says so: told the panel leaves nothing above it,
    /// it keeps its 16 under the row.
    @MainActor func testARouteUnderAProductsOwnRowToldItIsNotTheTopKeepsItsPadding() async throws {
        let pixels = try await render(sheet {
            VStack(spacing: 0) {
                Color.green.frame(height: 44).padding(.top, 8)
                route()
                    .environment(\.kozmosPanelInsetTop, 0)
                    .environment(\.kozmosPanelClearanceTop, 0)
            }
        }, size: phone, "decision-14-route-under-a-products-row")
        let panel = try sheetPanel(in: pixels, size: phone)
        let row = try XCTUnwrap(pixels.boundingBox(in: panel, where: Self.isGreen), "the product's row is not drawn")
        let at = try await label(in: pixels, on: panel, from: row.maxY + 1)
        let under = at.down - (row.maxY - panel.minY)
        print("Decision 14 iOS, route preview under a product's row: the destination label \(under) under the row")
        XCTAssertEqual(under, 16, accuracy: 1, "the destination label is \(under) under the product's row")
    }
}
#endif
