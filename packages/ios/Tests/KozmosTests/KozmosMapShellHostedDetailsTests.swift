import SwiftUI
import XCTest
@testable import Kozmos

/// What the shell tells its panel's content it leaves above it (GAP-083), by
/// the rule itself. Runs in `swift test`, where every shell would float its
/// panel beside the map, so the width class is an argument.
final class KozmosMapShellPanelContentTopTests: XCTestCase {
    private func shell<Header: View>(
        detents: [KozmosMapPanelDetent] = [.collapsed, .medium, .large],
        @ViewBuilder header: () -> Header = { EmptyView() }
    ) -> KozmosAdaptiveMapShell<Color, EmptyView, EmptyView, Color, EmptyView> {
        KozmosAdaptiveMapShell(panelDetents: detents, map: { Color.red }, panel: { Color.green }, panelHeader: header)
    }

    /// Under a grabber: its 16-point row, and 4 more for its target's spacing.
    func testUnderAGrabberTheContentIsToldTheRowAndItsClearance() {
        let top = shell().panelContentTop(isRegularWidth: false)
        XCTAssertTrue(shell().drawsGrabber(isRegularWidth: false), "three detents draw no grabber")
        XCTAssertEqual(top.inset, 16, accuracy: 0.001)
        XCTAssertEqual(top.clearance, 4, accuracy: 0.001)
    }

    /// No grabber — a single detent — a panel header in the grabber's place,
    /// or a side panel, which starts its content at its top edge: nothing.
    func testWithNoGrabberUnderAHeaderOrBesideTheMapTheContentIsToldNothing() {
        let cases: [(String, (inset: CGFloat, clearance: CGFloat))] = [
            ("a single detent", shell(detents: [.medium]).panelContentTop(isRegularWidth: false)),
            ("under a panel header", shell { Color.blue.frame(height: 60) }.panelContentTop(isRegularWidth: false)),
            ("beside the map", shell().panelContentTop(isRegularWidth: true)),
        ]
        for (name, top) in cases {
            XCTAssertEqual(top.inset, 0, accuracy: 0.001, "\(name): the content is told \(top.inset) is left above it")
            XCTAssertEqual(top.clearance, 0, accuracy: 0.001, "\(name): the content is asked to keep \(top.clearance) clear")
        }
        XCTAssertFalse(shell(detents: [.medium]).drawsGrabber(isRegularWidth: false), "a single detent draws a grabber")
    }
}

#if os(iOS)
/// GAP-083 (row 82), found on the MAP-474 boards: hosted in the map shell's
/// panel, the details card's close button sat further from the panel's top
/// than from its side. The card's header pads 16 on every side, and a sheet
/// that draws a grabber already leaves the grabber's 16-point row above its
/// content: 32 down and 16 in. Each case is drawn, and the button found where
/// it was drawn — the one outline in the panel's top trailing corner — and
/// measured against the panel's edges, themselves found where they were drawn.
final class KozmosMapShellHostedDetailsTests: XCTestCase {
    private let phone = CGSize(width: 390, height: 800)

    private let poi = KozmosPOIPresentation(
        id: "harbour-coffee", name: "Harbour Coffee Co.", floorId: "2", floorLabel: "Level 2",
        actions: [.favourite, .bookmark]
    )

    /// The card as a product hosts it: favourite and save beside its close button.
    private func card(_ presentation: KozmosPOIDetailPanel.Presentation) -> KozmosPOIDetailPanel {
        KozmosPOIDetailPanel(
            poi: poi, actionLabels: [.favourite: "Favourite", .bookmark: "Save"],
            onAction: { _, _ in }, onClose: {}, presentation: presentation
        )
    }

    /// The shell on a phone with the card as its panel, left to right and in
    /// the light theme whatever the simulator's own settings.
    private func sheet<Header: View>(
        detent: KozmosMapPanelDetent = .medium,
        detents: [KozmosMapPanelDetent] = [.collapsed, .medium, .large],
        presentation: KozmosPOIDetailPanel.Presentation = .sheet,
        @ViewBuilder header: () -> Header = { EmptyView() }
    ) -> some View {
        KozmosAdaptiveMapShell(
            panelDetent: .constant(detent), panelDetents: detents,
            map: { Color.red }, panel: { card(presentation) }, panelHeader: header
        )
        .environment(\.horizontalSizeClass, .compact)
        .environment(\.layoutDirection, .leftToRight)
        .environment(\.colorScheme, .light)
    }

    /// The panel's surface and its border, as against the map's red and the
    /// shadow the panel casts on it.
    private static func isLight(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 150 && g > 150 && b > 150 }
    private static func isGreen(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { g > 150 && r < 120 && b < 140 }

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

    /// Whether anything is drawn in the grabber's row at the sheet's middle:
    /// the grabber, where the sheet draws one, and otherwise nothing — unless
    /// the content has been pushed up into the row.
    private func drawsInGrabberRow(_ pixels: RenderedPixels, on panel: CGRect) -> Bool {
        pixels.boundingBox(in: CGRect(x: panel.midX - 30, y: panel.minY + 2, width: 60, height: 12), where: RenderedPixels.isInk) != nil
    }

    /// The close button's frame: everything drawn in the panel's top trailing
    /// corner, from `top` down, is its outline and its cross. The outline is
    /// a 1-point stroke on the frame's edge, so half of it falls outside.
    /// Callers start 10 below the panel's top edge and the search stops 8
    /// short of its end edge: that clears the edge's border and the panel's
    /// rounded corner, where the map shows through.
    private func closeButton(in pixels: RenderedPixels, from top: CGFloat, end: CGFloat,
                             rightToLeft: Bool = false) throws -> CGRect {
        let region = CGRect(x: rightToLeft ? end + 8 : end - 62, y: top, width: 54, height: 70)
        let box = try XCTUnwrap(pixels.boundingBox(in: region, where: RenderedPixels.isInk),
                                "nothing drawn in the panel's top \(rightToLeft ? "left" : "right") corner")
        let frame = box.insetBy(dx: 0.5, dy: 0.5)
        XCTAssertEqual(frame.width, 44, accuracy: 1, "not the close button's 44-point outline: \(box)")
        XCTAssertEqual(frame.height, 44, accuracy: 1, "not the close button's 44-point outline: \(box)")
        return frame
    }

    // MARK: A sheet

    /// Under a grabber: the button sat 32 from the sheet's top — the
    /// grabber's 16-point row and the header's own 16 — and 16 from its side.
    /// The card tops its header up to 16 instead of adding 16 to the row, and
    /// keeps the grabber's clearance: 4 points, so the grabber's 16-point
    /// target keeps its WCAG 2.5.8 spacing (the next case). 20 and 16 — the
    /// web's 21 and 17, whose panel has a 1px border inside it. At medium,
    /// and fitted to the content, which the shell lays out apart.
    @MainActor func testUnderAGrabberTheCloseButtonSitsAsFarDownAsInPlusTheGrabbersClearance() async throws {
        for detent in [KozmosMapPanelDetent.medium, .content] {
            let pixels = try await RenderedPixels.render(sheet(detent: detent, detents: [.collapsed, detent, .large]), size: phone)
            let attachment = XCTAttachment(image: pixels.image)
            attachment.name = "gap-083-sheet-with-grabber-\(detent)"
            attachment.lifetime = .keepAlways
            add(attachment)
            let panel = try sheetPanel(in: pixels, size: phone)
            XCTAssertTrue(drawsInGrabberRow(pixels, on: panel), "\(detent): the sheet draws no grabber")
            let close = try closeButton(in: pixels, from: panel.minY + 10, end: panel.maxX)
            let down = close.minY - panel.minY, inward = panel.maxX - close.maxX
            print("GAP-083 iOS, sheet with a grabber at \(detent): the close button \(down) from the top, \(inward) from the side")
            XCTAssertEqual(down, inward + 4, accuracy: 1,
                           "\(detent): the close button is \(down) from the sheet's top and \(inward) from its side")
            XCTAssertEqual(inward, 16, accuracy: 1, "\(detent): the close button is \(inward) from the sheet's side")
        }
    }

    /// The grabber is a 16-point row: an undersized target, so a 24-point
    /// circle on its centre must meet no other target (WCAG 2.5.8). At 320
    /// wide the card's favourite button starts at the sheet's middle, so a
    /// header flush under the grabber put it inside that circle — what the
    /// web's axe run found, and what the 4 points of clearance are for.
    @MainActor func testAtThreeHundredTwentyWideTheGrabbersTargetKeepsItsSpacing() async throws {
        let narrow = CGSize(width: 320, height: 800)
        let pixels = try await RenderedPixels.render(sheet(), size: narrow)
        let panel = try sheetPanel(in: pixels, size: narrow)
        // The favourite: the first of three 44-point buttons 6 apart, 16 in
        // from the sheet's end — from 160 to 204. The name stops 8 short of it.
        let region = CGRect(x: 155, y: panel.minY + 12, width: 52, height: 70)
        let box = try XCTUnwrap(pixels.boundingBox(in: region, where: RenderedPixels.isInk), "the favourite button is not drawn")
        let favourite = box.insetBy(dx: 0.5, dy: 0.5)
        XCTAssertEqual(favourite.width, 44, accuracy: 1, "not the favourite button's outline: \(box)")
        let centre = CGPoint(x: panel.midX, y: panel.minY + 8)
        let dx = max(favourite.minX - centre.x, 0, centre.x - favourite.maxX)
        let dy = max(favourite.minY - centre.y, 0, centre.y - favourite.maxY)
        let distance = (dx * dx + dy * dy).squareRoot()
        print("GAP-083 iOS, 320 wide: the favourite button \(distance) from the grabber's centre")
        // Half a point for where the outline's pixels fall.
        XCTAssertGreaterThanOrEqual(distance, 12 - 0.5,
                                    "the favourite button is \(distance) from the grabber's centre, inside its 24-point circle: \(favourite)")
    }

    /// A single detent draws no grabber, so the sheet leaves nothing above
    /// the card and its header keeps its own 16: 16 and 16, as before.
    @MainActor func testASingleDetentSheetDrawsNoGrabberAndTheCardKeepsItsOwnPadding() async throws {
        let pixels = try await RenderedPixels.render(sheet(detents: [.medium]), size: phone)
        let panel = try sheetPanel(in: pixels, size: phone)
        XCTAssertFalse(drawsInGrabberRow(pixels, on: panel),
                       "something is drawn in the grabber's row: a grabber, or the card pushed up into its place")
        let close = try closeButton(in: pixels, from: panel.minY + 10, end: panel.maxX)
        let down = close.minY - panel.minY, inward = panel.maxX - close.maxX
        print("GAP-083 iOS, single-detent sheet: the close button \(down) from the top, \(inward) from the side")
        XCTAssertEqual(down, inward, accuracy: 1, "the close button is \(down) from the sheet's top and \(inward) from its side")
        XCTAssertEqual(inward, 16, accuracy: 1, "the close button is \(inward) from the sheet's side")
    }

    /// Under a panel header the space above the card is the header, not
    /// empty, so the card keeps its own 16 under it.
    @MainActor func testUnderAPanelHeaderTheCardKeepsItsOwnPadding() async throws {
        let pixels = try await RenderedPixels.render(sheet(detent: .large) { Color.green.frame(height: 60) }, size: phone)
        let panel = try sheetPanel(in: pixels, size: phone)
        XCTAssertTrue(drawsInGrabberRow(pixels, on: panel), "the sheet draws no grabber")
        let header = try XCTUnwrap(pixels.boundingBox(in: panel, where: Self.isGreen), "the panel header is not drawn")
        let close = try closeButton(in: pixels, from: header.maxY + 4, end: panel.maxX)
        let down = close.minY - header.maxY, inward = panel.maxX - close.maxX
        print("GAP-083 iOS, under a panel header: the close button \(down) under the header, \(inward) from the side")
        XCTAssertEqual(down, 16, accuracy: 1, "the close button is \(down) under the panel header")
        XCTAssertEqual(inward, 16, accuracy: 1, "the close button is \(inward) from the sheet's side")
    }

    /// An inline card keeps its own padding wherever it is placed: in the
    /// sheet, under the grabber, its button still sits 32 down — the
    /// presentation for a card lower in the panel than its top.
    @MainActor func testAnInlineCardKeepsItsOwnPaddingUnderTheGrabber() async throws {
        let pixels = try await RenderedPixels.render(sheet(presentation: .inline), size: phone)
        let panel = try sheetPanel(in: pixels, size: phone)
        XCTAssertTrue(drawsInGrabberRow(pixels, on: panel), "the sheet draws no grabber")
        // Below the inline card's own top border, 16 down.
        let close = try closeButton(in: pixels, from: panel.minY + 20, end: panel.maxX)
        let down = close.minY - panel.minY, inward = panel.maxX - close.maxX
        print("GAP-083 iOS, inline card under a grabber: the close button \(down) from the top, \(inward) from the side")
        XCTAssertEqual(down, 32, accuracy: 1, "the inline card's close button is \(down) from the sheet's top")
        XCTAssertEqual(inward, 16, accuracy: 1, "the inline card's close button is \(inward) from the sheet's side")
    }

    // MARK: Beside the map

    /// A native side panel leaves nothing above its content — the web's
    /// keeps 16 there — so the card keeps its own 16: the button 16 from the
    /// panel's top and 16 from its end, the left right to left.
    @MainActor func testInASidePanelTheCloseButtonSitsAsFarDownAsIn() async throws {
        let wide = CGSize(width: 1024, height: 700)
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let view = KozmosAdaptiveMapShell(map: { Color.red }, panel: { card(.panel) })
                .environment(\.horizontalSizeClass, .regular)
                .environment(\.layoutDirection, direction)
                .environment(\.colorScheme, .light)
            let pixels = try await RenderedPixels.render(view, size: wide)
            let rightToLeft = direction == .rightToLeft
            // Somewhere inside the 416-point panel on the shell's end.
            let panel = try panel(in: pixels, size: wide, through: CGPoint(x: rightToLeft ? 224 : 800, y: 350))
            XCTAssertEqual(panel.width, 416, accuracy: 1.5, "\(direction): not the side panel: \(panel)")
            let close = try closeButton(in: pixels, from: panel.minY + 10, end: rightToLeft ? panel.minX : panel.maxX,
                                        rightToLeft: rightToLeft)
            let down = close.minY - panel.minY
            let inward = rightToLeft ? close.minX - panel.minX : panel.maxX - close.maxX
            print("GAP-083 iOS, side panel \(direction): the close button \(down) from the top, \(inward) from the end")
            XCTAssertEqual(down, inward, accuracy: 1, "\(direction): the close button is \(down) from the panel's top and \(inward) from its end")
            XCTAssertEqual(inward, 16, accuracy: 1, "\(direction): the close button is \(inward) from the panel's end")
        }
    }
}
#endif
