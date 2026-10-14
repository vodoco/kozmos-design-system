#if os(iOS)
import SwiftUI
import UIKit
import XCTest
@testable import Kozmos

/// GAP-085, its other end (MAP-474): the shell's panel ends its content 16
/// above its bottom edge, as it starts it 16 below its top. In a side panel
/// that is 16 above the panel's bottom edge; in a docked sheet, 16 above the
/// device's bottom safe area, with the sheet's surface still reaching the
/// screen's edge and scrolling content still running under it to that
/// inset. The content ran to the edge: a two-result list ended against the
/// panel's bottom edge. Each case is drawn and the last child found where it
/// was drawn: magenta, which nothing else here is.
final class KozmosMapShellPanelBottomTests: XCTestCase {
    private let phone = CGSize(width: 390, height: 800)
    private let wide = CGSize(width: 1024, height: 700)

    private static let magenta = Color(red: 1, green: 0, blue: 1)
    private static func isMagenta(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 200 && g < 80 && b > 200 }
    private static func isLight(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 150 && g > 150 && b > 150 }

    /// Renders `view` and keeps the picture in the result bundle.
    @MainActor private func render<V: View>(_ view: V, size: CGSize, _ name: String) async throws -> RenderedPixels {
        let pixels = try await RenderedPixels.render(view, size: size)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        return pixels
    }

    /// How far the light panel reaches down the column through `point`,
    /// which is inside it: the map around it is red.
    private func panelBottom(in pixels: RenderedPixels, height: CGFloat, through point: CGPoint) throws -> CGFloat {
        try XCTUnwrap(pixels.boundingBox(in: CGRect(x: point.x, y: 0, width: 1, height: height), where: Self.isLight),
                      "no panel drawn down x = \(point.x)").maxY
    }

    private func lastChild(in pixels: RenderedPixels, _ size: CGSize) throws -> CGRect {
        try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: Self.isMagenta), "the content is not drawn")
    }

    // MARK: A side panel

    /// A side panel fits its content and ends it 16 above its bottom edge,
    /// with or without a header, the content plain or in the panel's scroll
    /// view, left to right and right to left. It ended at the edge.
    @MainActor func testInASidePanelTheContentEndsSixteenAboveThePanelsBottomEdge() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            for hasHeader in [false, true] {
                for scrolls in [false, true] {
                    let name = "\(direction), header \(hasHeader), scrolls \(scrolls)"
                    let content = Group {
                        if scrolls {
                            KozmosPanelScrollView { Self.magenta.frame(height: 100) }
                        } else {
                            Self.magenta.frame(height: 100)
                        }
                    }
                    let view = Group {
                        if hasHeader {
                            KozmosAdaptiveMapShell(map: { Color.red }, panel: { content },
                                                   panelHeader: { Color.green.frame(height: 44) })
                        } else {
                            KozmosAdaptiveMapShell(map: { Color.red }, panel: { content })
                        }
                    }
                    .environment(\.horizontalSizeClass, .regular)
                    .environment(\.layoutDirection, direction)
                    .environment(\.colorScheme, .light)
                    let pixels = try await render(view, size: wide, "gap-085-side-\(name)")
                    let child = try lastChild(in: pixels, wide)
                    XCTAssertEqual(child.height, 100, accuracy: 1, "\(name): the content is cut: \(child)")
                    let bottom = try panelBottom(in: pixels, height: wide.height, through: CGPoint(x: child.midX, y: child.midY))
                    XCTAssertEqual(bottom - child.maxY, 16, accuracy: 1,
                                   "\(name): the content ends \(bottom - child.maxY) above the panel's bottom edge")
                }
            }
        }
    }

    // MARK: A docked sheet

    /// The shell on a phone with `panel` in its sheet, over a device whose
    /// home indicator takes `safeBottom`.
    private func sheet<Panel: View>(
        detents: [KozmosMapPanelDetent], detent: KozmosMapPanelDetent, safeBottom: CGFloat,
        @ViewBuilder panel: () -> Panel
    ) -> some View {
        KozmosAdaptiveMapShell(panelDetent: .constant(detent), panelDetents: detents, map: { Color.red }, panel: panel)
            .environment(\.horizontalSizeClass, .compact)
            .environment(\.layoutDirection, .leftToRight)
            .environment(\.colorScheme, .light)
            .safeAreaInset(edge: .bottom, spacing: 0) { Color.clear.frame(height: safeBottom) }
    }

    /// Fitted to its content, or at a detent the content fills, the sheet
    /// ends its content 16 above the home indicator, or above its edge on a
    /// device with none; its surface still reaches the screen's edge. It
    /// ended on the home indicator.
    @MainActor func testInASheetTheContentEndsSixteenAboveTheSafeArea() async throws {
        for safeBottom: CGFloat in [0, 34] {
            let cases: [(String, AnyView)] = [
                ("fitted", AnyView(sheet(detents: [.collapsed, .content, .large], detent: .content, safeBottom: safeBottom) {
                    Self.magenta.frame(height: 100)
                })),
                ("filled", AnyView(sheet(detents: [.collapsed, .medium, .large], detent: .medium, safeBottom: safeBottom) {
                    Self.magenta
                })),
            ]
            for (kind, view) in cases {
                let name = "\(kind), safe area \(safeBottom)"
                let pixels = try await render(view, size: phone, "gap-085-sheet-\(name)")
                let child = try lastChild(in: pixels, phone)
                XCTAssertEqual(phone.height - child.maxY, safeBottom + 16, accuracy: 1,
                               "\(name): the content ends \(phone.height - child.maxY) above the screen's edge")
                if kind == "fitted" {
                    XCTAssertEqual(child.height, 100, accuracy: 1, "\(name): the content is cut: \(child)")
                }
                let edge = pixels.color(at: CGPoint(x: 40, y: phone.height - 4))
                XCTAssertTrue(Self.isLight(edge.r, edge.g, edge.b), "\(name): the sheet's surface does not reach the edge: \(edge)")
            }
        }
    }

    // MARK: Scrolled to its end

    /// No safe areas, as the snapshot strategy's own window has none: the
    /// simulator's would move the sheet.
    private final class Window: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    @MainActor private func host<V: View>(_ view: V, size: CGSize) async -> UIWindow {
        let window = Window(frame: CGRect(origin: .zero, size: size))
        window.rootViewController = UIHostingController(rootView: view.frame(width: size.width, height: size.height))
        window.makeKeyAndVisible()
        await settle()
        return window
    }

    @MainActor private func settle() async {
        for _ in 0..<10 {
            RunLoop.main.run(until: Date().addingTimeInterval(0.03))
            await Task.yield()
        }
    }

    private func descendants(of view: UIView) -> [UIView] {
        view.subviews + view.subviews.flatMap(descendants(of:))
    }

    /// Draws the window, and keeps the picture in the result bundle.
    @MainActor private func draw(_ window: UIWindow, _ name: String) throws -> RenderedPixels {
        let image = UIGraphicsImageRenderer(bounds: window.bounds).image { window.layer.render(in: $0.cgContext) }
        let pixels = try RenderedPixels(image, pointWidth: window.bounds.width)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = "gap-085-\(name)"
        attachment.lifetime = .keepAlways
        add(attachment)
        return pixels
    }

    /// Scrolls the panel's scroll view to its end and draws the window.
    @MainActor private func scrolledToTheEnd(_ window: UIWindow, _ name: String) async throws -> RenderedPixels {
        let scroll = try XCTUnwrap(
            descendants(of: window).compactMap { $0 as? UIScrollView }.first { $0.contentSize.height > $0.bounds.height },
            "\(name): the content has no scroll view")
        let end = scroll.contentSize.height + scroll.adjustedContentInset.bottom - scroll.bounds.height
        scroll.setContentOffset(CGPoint(x: 0, y: max(end, 0)), animated: false)
        await settle()
        return try draw(window, "scrolled-\(name)")
    }

    private static func isGreen(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { g > 150 && r < 120 && b < 140 }

    /// A list longer than the panel: green, then its last row, magenta.
    private var longList: some View {
        KozmosPanelScrollView {
            VStack(spacing: 0) {
                Color.green.frame(height: 1400)
                Self.magenta.frame(height: 40)
            }
        }
    }

    /// Scrolled to its end, a long list's last row stops 16 above the side
    /// panel's bottom edge, and 16 above the home indicator in the sheet.
    /// On its way there it runs under both to the edge, as the web's
    /// scroller does under its padding. It stopped at the panel's edge, and
    /// on the indicator.
    @MainActor func testScrolledToItsEndALongListStopsSixteenAboveTheEdge() async throws {
        let sheetView = sheet(detents: [.collapsed, .medium, .large], detent: .large, safeBottom: 34) { longList }
        let sheetWindow = await host(sheetView, size: phone)
        defer { sheetWindow.isHidden = true }
        let sheetAtRest = try draw(sheetWindow, "sheet-at-rest")
        let underIndicator = sheetAtRest.color(at: CGPoint(x: 40, y: phone.height - 4))
        XCTAssertTrue(Self.isGreen(underIndicator.r, underIndicator.g, underIndicator.b),
                      "sheet: the list does not run under the home indicator: \(underIndicator)")
        let inSheet = try await scrolledToTheEnd(sheetWindow, "sheet")
        let sheetRow = try lastChild(in: inSheet, phone)
        XCTAssertEqual(sheetRow.height, 40, accuracy: 1, "sheet: the last row is cut: \(sheetRow)")
        XCTAssertEqual(phone.height - sheetRow.maxY, 34 + 16, accuracy: 1,
                       "sheet: the last row stops \(phone.height - sheetRow.maxY) above the screen's edge")

        let sideView = KozmosAdaptiveMapShell(map: { Color.red }, panel: { longList })
            .environment(\.horizontalSizeClass, .regular)
            .environment(\.colorScheme, .light)
        let sideWindow = await host(sideView, size: wide)
        defer { sideWindow.isHidden = true }
        // The panel ends 16 above the map's bottom; the list runs to it.
        let sideAtRest = try draw(sideWindow, "side-at-rest")
        let underInset = sideAtRest.color(at: CGPoint(x: wide.width - 16 - 416 + 40, y: wide.height - 16 - 4))
        XCTAssertTrue(Self.isGreen(underInset.r, underInset.g, underInset.b),
                      "side: the list does not run to the panel's edge: \(underInset)")
        let inSide = try await scrolledToTheEnd(sideWindow, "side")
        let sideRow = try lastChild(in: inSide, wide)
        XCTAssertEqual(sideRow.height, 40, accuracy: 1, "side: the last row is cut: \(sideRow)")
        let bottom = try panelBottom(in: inSide, height: wide.height, through: CGPoint(x: sideRow.midX, y: sideRow.midY))
        XCTAssertEqual(bottom - sideRow.maxY, 16, accuracy: 1,
                       "side: the last row stops \(bottom - sideRow.maxY) above the panel's bottom edge")
    }

    // MARK: Told, so a part's own padding is not doubled

    /// What the shell told its content.
    private final class Seen { var insetBottom: CGFloat? }

    private struct Probe: View {
        let seen: Seen
        @Environment(\.kozmosPanelInsetBottom) private var insetBottom
        var body: some View {
            seen.insetBottom = insetBottom
            return Color.clear.frame(width: 10, height: 10)
        }
    }

    /// The content is told the 16 the panel leaves below it, in a sheet and
    /// beside the map; outside a shell, nothing.
    @MainActor func testTheContentIsToldWhatThePanelLeavesBelowIt() async throws {
        let cases: [(String, CGSize, (Seen) -> AnyView, CGFloat)] = [
            ("sheet", phone, { seen in AnyView(self.sheet(detents: [.collapsed, .medium, .large], detent: .medium, safeBottom: 34) {
                Probe(seen: seen) }) }, 16),
            ("side", wide, { seen in AnyView(KozmosAdaptiveMapShell(map: { Color.red }, panel: { Probe(seen: seen) })
                .environment(\.horizontalSizeClass, .regular)) }, 16),
            ("alone", phone, { seen in AnyView(Probe(seen: seen)) }, 0),
        ]
        for (name, size, view, expected) in cases {
            let seen = Seen()
            _ = try await RenderedPixels.render(view(seen), size: size)
            XCTAssertEqual(seen.insetBottom, expected, "\(name)")
        }
    }

    private static func isTheme(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { RenderedPixels.isTheme(r, g, b) }

    /// The route preview's action row ends 16 above the sheet's safe area,
    /// as it did on its own 16: it tops its padding up to the panel's 16
    /// rather than adding to it, 32.
    @MainActor func testAHostedRoutePreviewEndsItsActionsSixteenAboveTheSafeArea() async throws {
        let options = [
            KozmosRouteOptionPresentation(id: "quickest", label: "Quickest", durationSeconds: 240, durationLabel: "4 min",
                                          distanceMetres: 150, distanceLabel: "150 m", preference: .quickest, selected: true),
        ]
        for safeBottom: CGFloat in [0, 34] {
            let view = sheet(detents: [.collapsed, .medium, .large], detent: .large, safeBottom: safeBottom) {
                KozmosRoutePreviewPanel(destinationName: "Harbour Coffee Co.", options: options, status: .ready,
                                        backLabel: "Back", continueLabel: "Start",
                                        onOptionSelect: { _ in }, onBack: {}, onContinue: { _ in })
            }
            let pixels = try await render(view, size: phone, "gap-085-route-\(safeBottom)")
            let start = try XCTUnwrap(
                pixels.boundingBox(in: CGRect(x: 0, y: phone.height - 120, width: phone.width, height: 120), where: Self.isTheme),
                "safe area \(safeBottom): no Start drawn")
            XCTAssertEqual(phone.height - start.maxY, safeBottom + 16, accuracy: 1,
                           "safe area \(safeBottom): Start ends \(phone.height - start.maxY) above the screen's edge")
        }
    }

    /// The category browser and the details card, each the side panel's
    /// whole content: told the panel leaves 16 below them, they drop their
    /// own 16 there, so what they draw last ends 16 nearer the panel's edge
    /// than when a product tells them the panel leaves nothing.
    @MainActor func testHostedPartsTopTheirBottomPaddingUpToThePanels() async throws {
        let categories = ["Gates", "Check-in", "Security", "Dining", "Shopping"].map {
            KozmosCategoryPresentation(id: $0.lowercased(), label: $0)
        }
        func part(_ kind: String) -> AnyView {
            switch kind {
            case "browser":
                return AnyView(KozmosBrowseCategoriesPanel(categories: categories, presentation: .sheet, onSelect: { _ in },
                                                           renderIcon: { _ in Color.clear }, emptyState: { EmptyView() }))
            default:
                return AnyView(KozmosPOIDetailPanel(
                    poi: KozmosPOIPresentation(id: "cafe", name: "Harbour Coffee", floorLabel: "Level 2",
                                               description: "Coffee and pastries by the harbour windows."),
                    actionLabels: [:], onAction: { _, _ in }, presentation: .sheet))
            }
        }
        for kind in ["browser", "details"] {
            func gap(insetBottom: CGFloat?) async throws -> CGFloat {
                let content = Group {
                    if let insetBottom {
                        part(kind).environment(\.kozmosPanelInsetBottom, insetBottom)
                    } else {
                        part(kind)
                    }
                }
                let view = KozmosAdaptiveMapShell(map: { Color.red }, panel: { content })
                    .environment(\.horizontalSizeClass, .regular)
                    .environment(\.layoutDirection, .leftToRight)
                    .environment(\.colorScheme, .light)
                let pixels = try await render(view, size: wide, "gap-085-\(kind)-\(insetBottom.map { "\($0)" } ?? "told")")
                // The panel's end, 416 wide and 16 in: its column clear of
                // its rounded corners, and the ink across its middle.
                let column = CGPoint(x: wide.width - 16 - 416 + 40, y: 100)
                let bottom = try panelBottom(in: pixels, height: wide.height, through: column)
                let ink = try XCTUnwrap(
                    pixels.boundingBox(in: CGRect(x: wide.width - 16 - 416 + 20, y: 20, width: 376, height: bottom - 2 - 20),
                                       where: { r, g, b in !Self.isLight(r, g, b) }),
                    "\(kind): nothing drawn in the panel")
                return bottom - ink.maxY
            }
            let told = try await gap(insetBottom: nil)
            let untold = try await gap(insetBottom: 0)
            XCTAssertEqual(untold - told, 16, accuracy: 1,
                           "\(kind): told the panel's 16, it ends \(told) above the edge; told nothing, \(untold)")
        }
    }
}
#endif
