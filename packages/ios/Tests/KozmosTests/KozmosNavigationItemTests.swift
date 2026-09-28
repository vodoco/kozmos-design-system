import XCTest
import SwiftUI
@testable import Kozmos

/// Decision 42: the rail takes the dashboard side menu's design. A rail item
/// fills its rail and grows with its label: 16pt by 8pt of padding, a 24pt
/// icon 6pt above a regular `caption2` label (11pt at the default text size)
/// on 14pt lines, up to two. At rest it is the muted foreground; selected,
/// theme/600 on theme/0 with a 2pt theme/600 bar down its trailing edge, which
/// is its left in a right-to-left layout. `KozmosSidebar`'s rail is that rail:
/// 96pt on the surface, its 1pt edge at the trailing side. BottomNavigation
/// keeps its own 64pt tile.
///
/// Laid out and drawn without a window, so all but the type's size run in
/// `swift test` on a Mac too: a Mac's caption2 is 10pt, and its text does not
/// scale.
final class KozmosNavigationItemTests: XCTestCase {
    private let rail = CGSize(width: 96, height: 600)

    @MainActor
    private func laidOut<V: View>(_ view: V, in offered: CGSize = CGSize(width: 300, height: 600)) -> CGSize {
        #if canImport(UIKit)
        UIHostingController(rootView: view).sizeThatFits(in: offered)
        #else
        NSHostingController(rootView: view).sizeThatFits(in: offered)
        #endif
    }

    /// A rail item whose icon is `icon` (clear unless a test needs to see it).
    private func item(
        _ label: String,
        selected: Bool = false,
        density: KozmosNavigationItemDensity = .default,
        icon: Color = .clear
    ) -> some View {
        KozmosNavigationItem(label: label, placement: .rail, density: density, content: .iconLabel, selected: selected) {
            icon
        }
    }

    /// `view` drawn `width` wide on white, in the light scheme and `direction`.
    @MainActor
    private func drawn<V: View>(_ view: V, width: CGFloat = 96, direction: LayoutDirection = .leftToRight) throws -> DrawnPixels {
        try DrawnPixels.draw(
            view
                .frame(width: width)
                .background(Color.white)
                .environment(\.colorScheme, .light)
                .environment(\.layoutDirection, direction),
            scale: 3
        )
    }

    /// The lines a view draws: the runs of rows with ink in them.
    @MainActor
    private func drawnLines<V: View>(_ view: V) throws -> [CGRect] {
        try DrawnPixels.draw(view.environment(\.colorScheme, .light), scale: 3).bands { _, _, _, a in a > 64 }
    }

    private static func close(_ a: (r: UInt8, g: UInt8, b: UInt8, a: UInt8)?, to b: (r: UInt8, g: UInt8, b: UInt8, a: UInt8), within tolerance: Int = 8) -> Bool {
        guard let a else { return false }
        return abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance && abs(Int(a.b) - Int(b.b)) <= tolerance
    }

    // MARK: Size

    /// It fills the rail it is given, with no width of its own, and a compact
    /// rail item is the same item: the 72pt and 64pt tiles are retired.
    @MainActor func testARailItemFillsItsRail() {
        XCTAssertEqual(laidOut(item("Home"), in: rail).width, 96, "in a 96pt rail")
        XCTAssertEqual(laidOut(item("Home"), in: CGSize(width: 120, height: 600)).width, 120, "in a wider one")
        XCTAssertEqual(laidOut(item("Home", density: .compact), in: rail), laidOut(item("Home"), in: rail),
                       "a compact rail item is not the default one")
    }

    /// 16pt above the icon, 6pt from the icon to the label and 16pt below it,
    /// 8pt at either side: one line of caption2 makes the item 62pt taller
    /// than its label, and a second line adds 14.
    @MainActor func testARailItemIsPadded16By8AndGrowsWithItsLabel() throws {
        let line = laidOut(Text("Home").font(KozmosTypography.caption2)).height
        let one = laidOut(item("Home"), in: rail).height
        XCTAssertEqual(one, 16 + 24 + 6 + line + 16, accuracy: 0.5, "a one-line item")
        #if os(iOS)
        // The 14pt line is iOS's caption2 at 11pt; a Mac's is 10pt.
        let two = laidOut(item("Accessible routes"), in: rail).height
        XCTAssertEqual(two - one, 14, accuracy: 0.5, "a two-line item is \(two), a one-line one \(one)")
        #endif

        // A green icon, so the label's ink cannot be mistaken for it.
        let icon = try XCTUnwrap(drawn(item("Home", icon: Color(red: 0, green: 1, blue: 0))).boundingBox { r, g, b, a in
            a > 200 && g > 200 && r < 60 && b < 60
        }, "no icon drawn")
        XCTAssertEqual(icon.minY, 16, accuracy: 0.34, "the icon is \(icon.minY) from the top")
        XCTAssertEqual(icon.height, 24, accuracy: 0.34)
        XCTAssertEqual(icon.midX, 48, accuracy: 0.34, "the icon is not centred")

        // A word longer than a line runs from one side's padding to the other.
        let long = try drawnLines(item("Wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww").frame(width: 96))
        let widest = try XCTUnwrap(long.max { $0.width < $1.width })
        XCTAssertEqual(widest.minX, 8, accuracy: 1.5, "the label starts \(widest.minX) in")
        XCTAssertEqual(96 - widest.maxX, 8, accuracy: 1.5, "the label ends \(96 - widest.maxX) from the edge")
    }

    // MARK: Colour

    /// At rest the label is the muted foreground, with no fill behind it.
    @MainActor func testARailItemIsMutedAtRest() throws {
        let muted = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground400, in: .light)
        let pixels = try drawn(item("Settings"))
        let label = pixels.darkest(in: CGRect(x: 8, y: 46, width: 80, height: 20))
        XCTAssertTrue(Self.close(label, to: muted), "the label is \(String(describing: label)), not foreground/400 \(muted)")
        XCTAssertEqual(pixels.pixel(at: CGPoint(x: 4, y: 4)).r, 255, "an item at rest has a fill")
    }

    /// Selected, the label is theme/600 on theme/0, and a 2pt theme/600 bar
    /// runs down the trailing edge: the right, and the left right to left.
    @MainActor func testASelectedRailItemIsPrimaryOnTheTintWithABarDownItsTrailingEdge() throws {
        let tint = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme0, in: .light)
        let primary = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        for (direction, bar, inside) in [(LayoutDirection.leftToRight, 95.0, 93.5), (.rightToLeft, 1.0, 2.5)] {
            let pixels = try drawn(item("Search", selected: true), direction: direction)
            let fill = pixels.pixel(at: CGPoint(x: 20, y: 4))
            XCTAssertTrue(Self.close(fill, to: tint, within: 3), "\(direction): the fill is \(fill), not theme/0 \(tint)")
            let edge = pixels.pixel(at: CGPoint(x: bar, y: 40))
            XCTAssertTrue(Self.close(edge, to: primary, within: 3), "\(direction): at \(bar) it is \(edge), not a theme/600 bar")
            let beside = pixels.pixel(at: CGPoint(x: inside, y: 40))
            XCTAssertTrue(Self.close(beside, to: tint, within: 3), "\(direction): the bar is wider than 2pt: at \(inside) it is \(beside)")
            let label = pixels.darkest(in: CGRect(x: 8, y: 46, width: 80, height: 20))
            XCTAssertTrue(Self.close(label, to: primary), "\(direction): the label is \(String(describing: label)), not theme/600")
        }
    }

    // MARK: The rail and the bar

    #if os(iOS)
    private static func close(_ a: (r: UInt8, g: UInt8, b: UInt8), to b: (r: UInt8, g: UInt8, b: UInt8, a: UInt8), within tolerance: Int = 3) -> Bool {
        close((a.r, a.g, a.b, 255), to: b, within: tolerance)
    }

    /// KozmosSidebar's rail is 96pt on the surface, its 1pt edge at the
    /// trailing side, and its items fill the inside of it: a selected item's
    /// bar ends where the edge begins. Hosted, because the sidebar scrolls
    /// and ImageRenderer does not draw a ScrollView's content.
    @MainActor func testTheSidebarRailIs96WideWithItsEdgeAtTheTrailingSide() async throws {
        let edge = try DrawnPixels.resolved(KozmosColors.semanticsBorderSubtle, in: .light)
        let primary = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        let tint = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme0, in: .light)
        let white = (r: UInt8(255), g: UInt8(255), b: UInt8(255), a: UInt8(255))
        for (direction, edgeX, barX, fillX) in [(LayoutDirection.leftToRight, 95.5, 94.0, 92.5), (.rightToLeft, 0.5, 2.0, 3.5)] {
            let sidebar = KozmosSidebar(variant: .rail) {
                VStack(spacing: 0) { item("Search", selected: true) }
            }
            .background(Color.white)
            .environment(\.colorScheme, .light)
            .environment(\.layoutDirection, direction)
            let pixels = try await RenderedPixels.render(sidebar, size: CGSize(width: 140, height: 200))
            // Right to left, the rail is at the right of the 140pt drawing.
            let offset: CGFloat = direction == .rightToLeft ? 140 - 96 : 0
            let y: CGFloat = 24 + 40
            for (x, expected, what) in [(edgeX, edge, "the rail's edge"), (barX, primary, "the bar"), (fillX, tint, "the tint")] {
                let found = pixels.color(at: CGPoint(x: offset + x, y: y))
                XCTAssertTrue(Self.close(found, to: expected), "\(direction): at \(offset + x) it is \(found), not \(what) \(expected)")
            }
            let outside: CGFloat = direction == .rightToLeft ? 20 : 120
            XCTAssertTrue(Self.close(pixels.color(at: CGPoint(x: outside, y: y)), to: white), "\(direction): the rail is wider than 96pt")
        }
    }
    #endif

    /// BottomNavigation keeps its own tile: 64pt wide in its share of the
    /// bar, a selected one on the muted fill, with none of the rail's tint or
    /// bar. This holds before the change and after it.
    @MainActor func testBottomNavigationKeepsItsOwnTile() throws {
        let muted = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground100, in: .light)
        let tint = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme0, in: .light)
        let bar = KozmosBottomNavigation(
            selection: .constant(0),
            items: [(icon: "house", title: "Home"), (icon: "map", title: "Maps"), (icon: "bell", title: "Alerts")]
        )
        let pixels = try drawn(bar, width: 390)
        // The first item's share of the bar is centred at 8 + 374 / 6; its
        // tile is 64 wide around that, clear of the icon and label at its
        // sides, halfway down.
        let centre: CGFloat = 8 + (390 - 16) / 6, y: CGFloat = 36
        for (x, expected, what) in [
            (centre - 30, muted, "inside the tile's leading edge"),
            (centre + 30, muted, "inside the tile's trailing edge"),
            (centre - 34, (r: UInt8(255), g: UInt8(255), b: UInt8(255), a: UInt8(255)), "outside the tile's leading edge"),
            (centre + 34, (r: UInt8(255), g: UInt8(255), b: UInt8(255), a: UInt8(255)), "outside the tile's trailing edge"),
        ] {
            let found = pixels.pixel(at: CGPoint(x: x, y: y))
            XCTAssertTrue(Self.close(found, to: expected, within: 2), "\(what), at \(x), it is \(found), not \(expected)")
            XCTAssertFalse(Self.close(found, to: tint, within: 2), "\(what), at \(x), it is the rail's tint")
        }
    }

    // MARK: Labels

    #if os(iOS)
    /// At the default text size the label draws as wide as 11pt regular
    /// text, not semibold, and its lines are 14pt apart.
    @MainActor func testTheLabelIsRegularCaption2On14ptLines() throws {
        let label = try XCTUnwrap(drawnLines(item("Settings").frame(width: 96).environment(\.dynamicTypeSize, .large)).last)
        let regular = try XCTUnwrap(drawnLines(Text("Settings").font(.system(size: 11, weight: .regular))).first)
        let semibold = try XCTUnwrap(drawnLines(Text("Settings").font(.system(size: 11, weight: .semibold))).first)
        XCTAssertLessThan(abs(label.width - regular.width), abs(label.width - semibold.width),
                          "the label is \(label.width) wide; 11pt regular is \(regular.width), semibold \(semibold.width)")

        // Neither "Accessible" nor "routes" reaches below its baseline, so
        // their bottoms are one line apart.
        let lines = try drawnLines(item("Accessible routes").frame(width: 96).environment(\.dynamicTypeSize, .large))
        XCTAssertEqual(lines.count, 2, "\"Accessible routes\" took \(lines.count) line(s): \(lines)")
        if lines.count == 2 {
            XCTAssertEqual(lines[1].maxY - lines[0].maxY, 14, accuracy: 0.34, "the lines are \(lines[1].maxY - lines[0].maxY) apart")
        }
    }

    /// The Cloud Dashboard's nine labels fit the rail's 80pt: no word is wider
    /// than a line, so none is split, and none needs a third line, so none
    /// is cut. It measures the type in the rail's line, not the component, so
    /// it holds before the change and after it: it is what makes 96pt enough.
    @MainActor func testTheCloudDashboardsLabelsFitWithoutSplittingAWord() throws {
        let labels = ["Map Content", "Geofences", "Wayfinding Network", "IoT Devices", "Metadata",
                      "SDK Configuration", "User Management", "UI Translation Manager", "System Settings"]
        for label in labels {
            for word in label.split(separator: " ") {
                let width = laidOut(Text(String(word)).font(KozmosTypography.caption2).fixedSize()).width
                XCTAssertLessThanOrEqual(width, 80, "\"\(word)\" is \(width)pt, wider than the rail's 80pt line")
            }
            let lines = try drawnLines(Text(label).font(KozmosTypography.caption2).multilineTextAlignment(.center).frame(width: 80))
            XCTAssertLessThanOrEqual(lines.count, 2, "\"\(label)\" needs \(lines.count) lines")
        }
    }
    #endif

    /// NavigationItem.mdx's SwiftUI rail example, the same code, so that it
    /// compiles somewhere: the docs' native snippets are compiled nowhere
    /// else. Its items fill the Sidebar's 96pt rail.
    @MainActor func testTheDocsRailExampleFillsTheSidebarRail() async throws {
        let example = KozmosSidebar(variant: .rail) {
            VStack(spacing: 0) {
                KozmosNavigationItem(label: "Home", placement: .rail, content: .iconLabel, selected: true) {
                    Image(systemName: "house")
                }
                KozmosNavigationItem(label: "Accessible routes", placement: .rail, content: .iconLabel) {
                    Image(systemName: "figure.roll")
                }
            }
        }
        #if os(iOS)
        let primary = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        let pixels = try await RenderedPixels.render(
            example.background(Color.white).environment(\.colorScheme, .light),
            size: CGSize(width: 140, height: 300)
        )
        let bar = pixels.boundingBox(in: CGRect(x: 80, y: 0, width: 60, height: 300)) { r, g, b in
            Self.close((r, g, b), to: primary)
        }
        XCTAssertEqual(bar?.maxX ?? 0, 95, accuracy: 0.5, "the selected item's bar does not end at the rail's edge")
        #else
        XCTAssertEqual(laidOut(example, in: CGSize(width: 140, height: 300)).width, 140)
        #endif
    }
}
