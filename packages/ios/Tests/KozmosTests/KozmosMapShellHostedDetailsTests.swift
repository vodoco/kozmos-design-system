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

    /// The card as a product hosts it: favourite and save, or `toggles`,
    /// beside its close button.
    private func card(_ presentation: KozmosPOIDetailPanel.Presentation,
                      toggles: [KozmosPOIAction] = [.favourite, .bookmark],
                      name: String? = nil) -> KozmosPOIDetailPanel {
        KozmosPOIDetailPanel(
            poi: KozmosPOIPresentation(id: poi.id, name: name ?? poi.name, floorId: poi.floorId,
                                       floorLabel: poi.floorLabel, actions: toggles),
            actionLabels: [.favourite: "Favourite", .bookmark: "Save"],
            onAction: { _, _ in }, onClose: {}, presentation: presentation
        )
    }

    /// The shell on a phone with the card as its panel, left to right unless
    /// told otherwise, at the default text size unless told otherwise, and
    /// in the light theme whatever the simulator's own settings.
    private func sheet<Header: View>(
        detent: KozmosMapPanelDetent = .medium,
        detents: [KozmosMapPanelDetent] = [.collapsed, .medium, .large],
        presentation: KozmosPOIDetailPanel.Presentation = .sheet,
        toggles: [KozmosPOIAction] = [.favourite, .bookmark],
        name: String? = nil,
        direction: LayoutDirection = .leftToRight,
        textSize: DynamicTypeSize = .large,
        @ViewBuilder header: () -> Header = { EmptyView() }
    ) -> some View {
        KozmosAdaptiveMapShell(
            panelDetent: .constant(detent), panelDetents: detents,
            map: { Color.red }, panel: { card(presentation, toggles: toggles, name: name) }, panelHeader: header
        )
        .environment(\.horizontalSizeClass, .compact)
        .environment(\.layoutDirection, direction)
        .environment(\.colorScheme, .light)
        .environment(\.dynamicTypeSize, textSize)
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

    /// Where a bordered card's top edge is drawn under the grabber's row: its
    /// 1-point border, down a column clear of its rounded corners, where
    /// nothing else is drawn between the row and the card's header.
    private func cardTopBorder(in pixels: RenderedPixels, on panel: CGRect) throws -> CGFloat {
        let border = try XCTUnwrap(
            pixels.boundingBox(in: CGRect(x: 40, y: panel.minY + 2, width: 1, height: 16), where: RenderedPixels.isInk),
            "no card border drawn under the grabber's row")
        return border.midY
    }

    /// The close button's frame: everything drawn in the panel's top trailing
    /// corner, from `top` down, is its outline and its cross. The outline is
    /// a 1-point border inside the frame, as the web's is.
    /// Callers start 10 below the panel's top edge — or 2 below a card's own
    /// top border — and the search stops 12 short of the end edge: that clears
    /// the edge's border and the rounded corners of the panel, where the map
    /// shows through, and of a bordered card.
    private func closeButton(in pixels: RenderedPixels, from top: CGFloat, end: CGFloat,
                             rightToLeft: Bool = false) throws -> CGRect {
        let region = CGRect(x: rightToLeft ? end + 12 : end - 62, y: top, width: 50, height: 70)
        let frame = try XCTUnwrap(pixels.boundingBox(in: region, where: RenderedPixels.isInk),
                                  "nothing drawn in the panel's top \(rightToLeft ? "left" : "right") corner")
        XCTAssertEqual(frame.width, 44, accuracy: 1, "not the close button's 44-point outline: \(frame)")
        XCTAssertEqual(frame.height, 44, accuracy: 1, "not the close button's 44-point outline: \(frame)")
        return frame
    }

    // MARK: A sheet

    /// Under a grabber: the button sat 32 from the sheet's top — the
    /// grabber's 16-point row and the header's own 16 — and 16 from its side.
    /// The card then topped its header up to 16 instead of adding 16 to the
    /// row, and kept the grabber's 4-point clearance too: 20 and 16.
    /// Decision 51: the header takes the 4 back wherever its buttons stay
    /// clear of the grabber's target anyway (the next cases), and on a phone
    /// they do: 16 and 16 — the web's 17 and 17, whose panel has a 1px border
    /// inside it. At medium, and fitted to the content, which the shell lays
    /// out apart.
    @MainActor func testUnderAGrabberOnAPhoneTheCloseButtonSitsAsFarDownAsIn() async throws {
        for width in [390, 430] as [CGFloat] {
            let size = CGSize(width: width, height: 800)
            for detent in [KozmosMapPanelDetent.medium, .content] {
                let pixels = try await RenderedPixels.render(sheet(detent: detent, detents: [.collapsed, detent, .large]), size: size)
                let attachment = XCTAttachment(image: pixels.image)
                attachment.name = "decision-51-sheet-with-grabber-\(Int(width))-\(detent)"
                attachment.lifetime = .keepAlways
                add(attachment)
                let panel = try sheetPanel(in: pixels, size: size)
                XCTAssertTrue(drawsInGrabberRow(pixels, on: panel), "\(width), \(detent): the sheet draws no grabber")
                let close = try closeButton(in: pixels, from: panel.minY + 10, end: panel.maxX)
                let down = close.minY - panel.minY, inward = panel.maxX - close.maxX
                print("Decision 51 iOS, \(width) wide, sheet with a grabber at \(detent): the close button \(down) from the top, \(inward) from the side")
                XCTAssertEqual(down, 16, accuracy: 1,
                               "\(width), \(detent): the close button is \(down) from the sheet's top and \(inward) from its side")
                XCTAssertEqual(inward, 16, accuracy: 1, "\(width), \(detent): the close button is \(inward) from the sheet's side")
                // Flush against the top of the sheet's scroll view, the
                // outline is whole: its top edge as thick as its bottom edge,
                // one pixel column down the middle, clear of the cross. Drawn
                // on the frame's edge, its outer half was cut off there.
                let topEdge = pixels.count(in: CGRect(x: close.midX, y: close.minY - 2, width: 0.34, height: 4), where: RenderedPixels.isInk)
                let bottomEdge = pixels.count(in: CGRect(x: close.midX, y: close.maxY - 2, width: 0.34, height: 4), where: RenderedPixels.isInk)
                XCTAssertEqual(topEdge, bottomEdge, "\(width), \(detent): the outline's top edge is \(topEdge) pixels thick, its bottom \(bottomEdge)")
            }
        }
    }

    /// The header's `count` buttons as drawn, close first: 44-point outlines
    /// 6 apart, the last 16 in from the panel's end edge (the left, right to
    /// left), each found in its own slot from `top` down, so the name beside
    /// them — which stops 8 short — is never taken for one. The outline is a
    /// 1-point border inside the frame.
    private func headerButtons(in pixels: RenderedPixels, on panel: CGRect, count: Int, from top: CGFloat,
                               rightToLeft: Bool = false) throws -> [CGRect] {
        try (0..<count).map { slot in
            let offset = 16 + CGFloat(slot) * 50
            let minX = rightToLeft ? panel.minX + offset : panel.maxX - offset - 44
            let region = CGRect(x: minX - 3, y: top, width: 50, height: 70)
            let frame = try XCTUnwrap(pixels.boundingBox(in: region, where: RenderedPixels.isInk),
                                      "no header button drawn in slot \(slot) from the end, \(region)")
            XCTAssertEqual(frame.width, 44, accuracy: 1, "slot \(slot): not a 44-point button outline: \(frame)")
            XCTAssertEqual(frame.height, 44, accuracy: 1, "slot \(slot): not a 44-point button outline: \(frame)")
            return frame
        }
    }

    /// How far a drawn box is from the grabber's centre, the middle of the
    /// sheet's top 16-point row; with `flush`, how far it would be with its
    /// top edge on the row's bottom edge. Where a box sits across the sheet
    /// does not depend on the header's top padding, so both are read off one
    /// drawing.
    private func fromGrabber(_ box: CGRect, on panel: CGRect, flush: Bool = false) -> CGFloat {
        let centre = CGPoint(x: panel.midX, y: panel.minY + 8)
        let dx = max(box.minX - centre.x, 0, centre.x - box.maxX)
        let dy = flush ? 8 : max(box.minY - centre.y, 0, centre.y - box.maxY)
        return (dx * dx + dy * dy).squareRoot()
    }

    /// Decision 51's rule, from what is drawn at each width rather than from
    /// the widths it gives: the header sits flush under the grabber's row —
    /// the close button 16 from the top — wherever its buttons would then
    /// stay out of the grabber's 24-point circle, and keeps the grabber's
    /// 4-point clearance — 20 — wherever they would not; and at every width
    /// no button meets the circle. Flush, the buttons' top edge is 8 under
    /// the grabber's centre, so the favourite, the first of three 44-point
    /// buttons 6 apart 16 in from the end, must start √(12² − 8²) ≈ 8.9 past
    /// the middle: from 338 wide. Below, it meets the circle at a tangent at
    /// most: at 320 it starts at the sheet's middle.
    @MainActor func testTheHeaderKeepsTheGrabbersClearanceOnlyWhereItsButtonsWouldMeetItsCircle() async throws {
        let expected: [(width: CGFloat, down: CGFloat)] = [
            (320, 20), (330, 20), (337, 20), (338, 16), (339, 16), (350, 16), (375, 16), (402, 16), (440, 16),
        ]
        for (width, down) in expected {
            let size = CGSize(width: width, height: 800)
            let pixels = try await RenderedPixels.render(sheet(), size: size)
            let panel = try sheetPanel(in: pixels, size: size)
            XCTAssertTrue(drawsInGrabberRow(pixels, on: panel), "\(width): the sheet draws no grabber")
            let buttons = try headerButtons(in: pixels, on: panel, count: 3, from: panel.minY + 12)
            let drawn = buttons.map { fromGrabber($0, on: panel) }
            let flush = buttons.map { fromGrabber($0, on: panel, flush: true) }
            let at = buttons[0].minY - panel.minY
            print("Decision 51 iOS, \(width) wide: the close button \(at) from the top; from the grabber's centre \(drawn), flush \(flush)")
            XCTAssertEqual(at, down, accuracy: 1, "\(width) wide: the close button is \(at) from the sheet's top")
            XCTAssertEqual(panel.maxX - buttons[0].maxX, 16, accuracy: 1, "\(width) wide: the close button's side")
            // The rule's own reading of the drawing, half a point either way
            // for where the outline's pixels fall: flush would clear the
            // circle, so the header is flush; flush would not, so it is not.
            if flush.min()! > 12.5 { XCTAssertEqual(at, 16, accuracy: 1, "\(width): flush would clear the circle, \(flush)") }
            if flush.min()! < 11.5 { XCTAssertEqual(at, 20, accuracy: 1, "\(width): flush would meet the circle, \(flush)") }
            for (slot, distance) in drawn.enumerated() {
                XCTAssertGreaterThanOrEqual(distance, 12 - 0.5,
                                            "\(width) wide: button \(slot) from the end is \(distance) from the grabber's centre, inside its 24-point circle")
            }
        }
    }

    /// Fewer buttons reach the circle only on narrower sheets: a toggle and
    /// close under 238 wide, close alone under 138. The header follows its
    /// own buttons, not a phone's width.
    @MainActor func testWithFewerButtonsTheHeaderKeepsEqualInsetsOnNarrowerSheets() async throws {
        let cases: [(toggles: [KozmosPOIAction], width: CGFloat, down: CGFloat)] = [
            ([.favourite], 237, 20), ([.favourite], 238, 16), ([], 137, 20), ([], 138, 16),
        ]
        for (toggles, width, down) in cases {
            let size = CGSize(width: width, height: 800)
            let name = "\(toggles.isEmpty ? "close alone" : "\(toggles.count + 1) buttons"), \(width) wide"
            let pixels = try await RenderedPixels.render(sheet(toggles: toggles, name: "Spa"), size: size)
            let panel = try sheetPanel(in: pixels, size: size)
            XCTAssertTrue(drawsInGrabberRow(pixels, on: panel), "\(name): the sheet draws no grabber")
            let buttons = try headerButtons(in: pixels, on: panel, count: toggles.count + 1, from: panel.minY + 12)
            let drawn = buttons.map { fromGrabber($0, on: panel) }
            let at = buttons[0].minY - panel.minY
            print("Decision 51 iOS, \(name): the close button \(at) from the top; from the grabber's centre \(drawn)")
            XCTAssertEqual(at, down, accuracy: 1, "\(name): the close button is \(at) from the sheet's top")
            for (slot, distance) in drawn.enumerated() {
                XCTAssertGreaterThanOrEqual(distance, 12 - 0.5, "\(name): button \(slot) is \(distance) from the grabber's centre")
            }
        }
    }

    /// Right to left the buttons stand at the header's left end; the circle
    /// is the same either way.
    @MainActor func testRightToLeftUnderAGrabberTheCloseButtonSitsAsFarDownAsFromTheLeft() async throws {
        for (width, down) in [(390, 16), (338, 16), (337, 20), (320, 20)] as [(CGFloat, CGFloat)] {
            let size = CGSize(width: width, height: 800)
            let pixels = try await RenderedPixels.render(sheet(direction: .rightToLeft), size: size)
            let panel = try sheetPanel(in: pixels, size: size)
            XCTAssertTrue(drawsInGrabberRow(pixels, on: panel), "\(width): the sheet draws no grabber")
            let buttons = try headerButtons(in: pixels, on: panel, count: 3, from: panel.minY + 12, rightToLeft: true)
            let at = buttons[0].minY - panel.minY, inward = buttons[0].minX - panel.minX
            print("Decision 51 iOS, right to left, \(width) wide: the close button \(at) from the top, \(inward) from the left")
            XCTAssertEqual(at, down, accuracy: 1, "right to left, \(width) wide: the close button is \(at) from the sheet's top")
            XCTAssertEqual(inward, 16, accuracy: 1, "right to left, \(width) wide: the close button is \(inward) from the sheet's left")
            for (slot, box) in buttons.enumerated() {
                let distance = fromGrabber(box, on: panel)
                XCTAssertGreaterThanOrEqual(distance, 12 - 0.5, "right to left, \(width) wide: button \(slot) is \(distance) from the grabber's centre")
            }
        }
    }

    /// At the largest text size the buttons' glyphs outgrow 44 points, so
    /// the buttons reach further in and meet the grabber's circle on wider
    /// sheets than at the default size: the header measures its own buttons
    /// rather than counting them. Each button is found as its outline, the
    /// one shape in the header's end that encloses another (its glyph), with
    /// a one-letter name that stops far from them. They are centred on one
    /// another, so the row's top is the tallest one's.
    @MainActor func testAtTheLargestTextSizeTheHeaderFollowsItsWiderButtons() async throws {
        for width in [338, 360, 375, 390, 402, 430, 440] as [CGFloat] {
            let size = CGSize(width: width, height: 900)
            let pixels = try await RenderedPixels.render(sheet(name: "A", textSize: .accessibility5), size: size)
            let attachment = XCTAttachment(image: pixels.image)
            attachment.name = "decision-51-largest-text-\(Int(width))"
            attachment.lifetime = .keepAlways
            add(attachment)
            let panel = try sheetPanel(in: pixels, size: size)
            XCTAssertTrue(drawsInGrabberRow(pixels, on: panel), "\(width): the sheet draws no grabber")
            let end = CGRect(x: panel.midX - 100, y: panel.minY + 12, width: panel.maxX - 12 - (panel.midX - 100), height: 100)
            let shapes = pixels.shapes(in: end, where: RenderedPixels.isInk).filter { $0.width >= 30 && $0.height >= 30 }
            let buttons = shapes
                .filter { shape in shapes.contains { other in other != shape && other.contains(shape) } == false }
                .sorted { $0.minX < $1.minX }
            XCTAssertEqual(buttons.count, 3, "\(width): not three button outlines: \(buttons)")
            guard let favourite = buttons.first, let close = buttons.last else { continue }
            let at = buttons.map(\.minY).min()! - panel.minY
            let across = close.maxX - favourite.minX
            let flush = fromGrabber(favourite, on: panel, flush: true)
            let drawn = buttons.map { fromGrabber($0, on: panel) }
            print("Decision 51 iOS, largest text, \(width) wide: the buttons \(buttons.map(\.width)) wide, \(across) across, the row \(at) from the top; from the grabber's centre \(drawn), the favourite flush \(flush)")
            XCTAssertGreaterThan(across, 3 * 44 + 2 * 6 + 3, "\(width): the buttons did not grow with the text: \(buttons)")
            XCTAssertEqual(panel.maxX - close.maxX, 16, accuracy: 1, "\(width): the close button's side")
            if flush > 12.5 { XCTAssertEqual(at, 16, accuracy: 1, "\(width): flush would clear the circle (\(flush)), yet the row is \(at) down") }
            if flush < 11.5 { XCTAssertEqual(at, 20, accuracy: 1, "\(width): flush would meet the circle (\(flush)), yet the row is \(at) down") }
            for (index, distance) in drawn.enumerated() {
                XCTAssertGreaterThanOrEqual(distance, 12 - 0.5,
                                            "\(width) wide: button \(index) is \(distance) from the grabber's centre, inside its 24-point circle")
            }
        }
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

    /// A card in its panel presentation draws its own bordered surface, so
    /// the grabber's row lies outside its border, not inside it. Topped up
    /// to the row, its header met its own top border — the buttons 4 under
    /// the line; the web's visual review caught the same at 0, in a side
    /// panel. It keeps its 16 inside the border, as the inline card does:
    /// the button 16 under the card's top edge, which is under the row.
    @MainActor func testUnderAGrabberABorderedPanelCardKeepsItsPaddingInsideItsBorder() async throws {
        let pixels = try await RenderedPixels.render(sheet(presentation: .panel), size: phone)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = "gap-083-panel-card-under-grabber"
        attachment.lifetime = .keepAlways
        add(attachment)
        let panel = try sheetPanel(in: pixels, size: phone)
        XCTAssertTrue(drawsInGrabberRow(pixels, on: panel), "the sheet draws no grabber")
        let border = try cardTopBorder(in: pixels, on: panel)
        XCTAssertEqual(border - panel.minY, 16, accuracy: 1, "the card's top border is not under the grabber's row: \(border - panel.minY)")
        let close = try closeButton(in: pixels, from: border + 2, end: panel.maxX)
        let down = close.minY - border, inward = panel.maxX - close.maxX
        print("GAP-083 iOS, panel card under a grabber: the close button \(down) under the card's top border, \(inward) from the side")
        XCTAssertEqual(down, 16, accuracy: 1, "the panel card's close button is \(down) under its own top border")
        XCTAssertEqual(inward, 16, accuracy: 1, "the panel card's close button is \(inward) from the sheet's side")
    }

    // MARK: Beside the map

    /// A native side panel leaves nothing above its content — the web's
    /// keeps 16 there — so the card keeps its own 16: the button 16 from the
    /// panel's top and 16 from its end, the left right to left. Both the
    /// bordered card and the surfaceless one, which products host there too.
    @MainActor func testInASidePanelTheCloseButtonSitsAsFarDownAsIn() async throws {
        let wide = CGSize(width: 1024, height: 700)
        for presentation in [KozmosPOIDetailPanel.Presentation.panel, .sheet] {
            for direction in [LayoutDirection.leftToRight, .rightToLeft] {
                let view = KozmosAdaptiveMapShell(map: { Color.red }, panel: { card(presentation) })
                    .environment(\.horizontalSizeClass, .regular)
                    .environment(\.layoutDirection, direction)
                    .environment(\.colorScheme, .light)
                let pixels = try await RenderedPixels.render(view, size: wide)
                let rightToLeft = direction == .rightToLeft
                let name = "\(presentation) card, \(direction)"
                // Somewhere inside the 416-point panel on the shell's end.
                let panel = try panel(in: pixels, size: wide, through: CGPoint(x: rightToLeft ? 224 : 800, y: 350))
                XCTAssertEqual(panel.width, 416, accuracy: 1.5, "\(name): not the side panel: \(panel)")
                let close = try closeButton(in: pixels, from: panel.minY + 10, end: rightToLeft ? panel.minX : panel.maxX,
                                            rightToLeft: rightToLeft)
                let down = close.minY - panel.minY
                let inward = rightToLeft ? close.minX - panel.minX : panel.maxX - close.maxX
                print("GAP-083 iOS, side panel, \(name): the close button \(down) from the top, \(inward) from the end")
                XCTAssertEqual(down, inward, accuracy: 1, "\(name): the close button is \(down) from the panel's top and \(inward) from its end")
                XCTAssertEqual(inward, 16, accuracy: 1, "\(name): the close button is \(inward) from the panel's end")
            }
        }
    }
}
#endif
