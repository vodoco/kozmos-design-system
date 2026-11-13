import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-036, decision 135: PageHeader, the top of a page, on a theme 0 band,
/// its content in a container with the block inset (GAP-116), 32 above and
/// 24 below, as React's PageHeader draws it.
///
/// The drawn tests use `DrawnPixels`, so they run in `swift test` on a Mac as
/// well as on the simulator; the VoiceOver tests are iOS only.
final class KozmosPageHeaderTests: XCTestCase {
    private static let width: CGFloat = 800

    @MainActor private func draw(_ view: some View, scheme: ColorScheme = .light, width: CGFloat = width) throws -> DrawnPixels {
        try DrawnPixels.draw(view.frame(width: width).environment(\.colorScheme, scheme), scale: 1)
    }

    @MainActor func testTheBandIsThemeZeroAcrossTheWholeHeaderByDefault() throws {
        for scheme in [ColorScheme.light, .dark] {
            let drawn = try draw(KozmosPageHeader("Settings"), scheme: scheme)
            let tint = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme0, in: scheme)
            let box = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(tint, tolerance: 3)), "\(scheme): no band")
            XCTAssertEqual(box.minX, 0, accuracy: 0.5, "\(scheme)")
            XCTAssertEqual(box.maxX, Self.width, accuracy: 0.5, "\(scheme)")
            XCTAssertEqual(box.minY, 0, accuracy: 0.5, "\(scheme)")
            XCTAssertEqual(box.maxY, drawn.size.height, accuracy: 0.5, "\(scheme)")
        }
    }

    @MainActor func testTheDefaultTonePaintsNoBand() throws {
        let drawn = try draw(KozmosPageHeader("Settings", tone: .default))
        let tint = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme0, in: .light)
        XCTAssertNil(drawn.boundingBox(where: DrawnPixels.matches(tint, tolerance: 3)), "a default header is tinted")
    }

    /// The content starts 32 down, at the container's side, and the header
    /// ends 24 under its last line.
    @MainActor func testTheContentIsThirtyTwoBelowTheTopAndTwentyFourAboveTheEnd() throws {
        let drawn = try draw(KozmosPageHeader("Settings", tone: .default, breadcrumb: {
            Color.black.frame(width: 120, height: 10)
        }))
        let crumb = try XCTUnwrap(drawn.boundingBox { r, g, b, a in a > 200 && r < 10 && g < 10 && b < 10 && true },
                                  "no breadcrumb drawn")
        XCTAssertEqual(crumb.minY, 32, accuracy: 0.5)
        XCTAssertEqual(crumb.minX, KozmosContainerInset.padding(.window, width: Self.width), accuracy: 0.5)

        let header = try draw(KozmosPageHeader("Settings", tone: .default)).size.height
        let title = try DrawnPixels.draw(
            Text("Settings").font(.system(size: 24, weight: .bold)).fixedSize(), scale: 1).size.height
        XCTAssertEqual(header, 32 + title + 24, accuracy: 0.5, "the header is not 32 + the title + 24")
    }

    @MainActor func testTheBreadcrumbIsEightAboveTheTitleAndALeftOutOneTakesNoSpace() throws {
        let bare = try draw(KozmosPageHeader("Settings")).size.height
        let crumbed = try draw(KozmosPageHeader("Settings", breadcrumb: { Color.black.frame(height: 10) })).size.height
        XCTAssertEqual(crumbed - bare, 10 + 8, accuracy: 0.5)
        let shown = false
        let hidden = try draw(KozmosPageHeader("Settings", breadcrumb: {
            if shown { Color.black.frame(height: 10) }
        })).size.height
        XCTAssertEqual(hidden, bare, accuracy: 0.5, "an empty breadcrumb takes space")
    }

    @MainActor func testTheDescriptionIsUnderTheTitleOnlyWhenGiven() throws {
        let bare = try draw(KozmosPageHeader("Settings")).size.height
        let described = try draw(KozmosPageHeader("Settings", description: "Manage the site.")).size.height
        XCTAssertGreaterThan(described - bare, 4 + 10, "no description line under the title")
    }

    @MainActor func testTheLargeTitleIsTallerThanTheDefault() throws {
        let md = try draw(KozmosPageHeader("Home")).size.height
        let explicitMd = try draw(KozmosPageHeader("Home", size: .md)).size.height
        let lg = try draw(KozmosPageHeader("Home", size: .lg)).size.height
        XCTAssertEqual(md, explicitMd, accuracy: 0.5, "unset is not md")
        XCTAssertGreaterThan(lg, md + 4, "lg's 30 is not taller than md's 24 (\(lg), \(md))")
    }

    /// The actions sit at the trailing end, the container's side from the
    /// edge, centred on the title's line, and make the header no taller;
    /// right to left they are at the left.
    @MainActor func testTheActionsAreAtTheTrailingEndAndMakeItNoTaller() throws {
        let side = KozmosContainerInset.padding(.window, width: Self.width)
        let bare = try draw(KozmosPageHeader("Settings", tone: .default)).size.height
        for (direction, atStart): (LayoutDirection, Bool) in [(.leftToRight, false), (.rightToLeft, true)] {
            let header = KozmosPageHeader("Settings", tone: .default, actions: {
                Color(red: 1, green: 0, blue: 0).frame(width: 40, height: 44)
            }).environment(\.layoutDirection, direction)
            let drawn = try draw(header)
            let box = try XCTUnwrap(drawn.boundingBox { r, g, b, a in a > 200 && r > 200 && g < 60 && b < 60 },
                                    "\(direction): no actions drawn")
            XCTAssertEqual(drawn.size.height, bare, accuracy: 0.5, "\(direction): the actions grew the header")
            if atStart {
                XCTAssertEqual(box.minX, side, accuracy: 0.5, "\(direction)")
            } else {
                XCTAssertEqual(Self.width - box.maxX, side, accuracy: 0.5, "\(direction)")
            }
            // Centred on the title's first line: inside the 32 above it.
            XCTAssertGreaterThan(box.minY, 16, "\(direction): the actions start at \(box.minY)")
            XCTAssertLessThan(box.minY, 32, "\(direction): the actions start at \(box.minY)")
        }
    }

    private static func isRed(_ r: UInt8, _ g: UInt8, _ b: UInt8, _ a: UInt8) -> Bool {
        a > 200 && r > 200 && g < 60 && b < 60
    }

    private static func redAction(width: CGFloat) -> some View {
        Color(red: 1, green: 0, blue: 0).frame(width: width, height: 44)
    }

    /// An actions slot that draws nothing (an `if` that leaves its button
    /// out) reserves nothing: no 16 at the row's end. A title as wide as the
    /// text column less 8 fits on one line with no actions slot; with 16
    /// reserved, it would wrap and the header would grow.
    @MainActor func testAnActionsSlotThatDrawsNothingReservesNothing() throws {
        let titleText = "Map content and levels"
        let title = try DrawnPixels.draw(
            Text(titleText).font(.system(size: 24, weight: .bold)).fixedSize(), scale: 1).size
        let side = KozmosContainerInset.padding(.panel, width: 0)
        let width = (title.width + 8 + 2 * side).rounded(.up)
        let bare = try draw(KozmosPageHeader(titleText, tone: .default, inset: .panel), width: width).size.height
        let shown = false
        let emptied = try draw(KozmosPageHeader(titleText, tone: .default, inset: .panel, actions: {
            if shown { KozmosButton("Save changes") {} }
        }), width: width).size.height
        XCTAssertEqual(emptied, bare, accuracy: 0.5,
                       "an empty actions slot narrowed the text and the title wrapped (\(emptied) against \(bare))")
    }

    /// React's row wraps (`flex-wrap`, the text's basis 256): where the text's
    /// 256, the 16 and the actions don't fit, the actions go under the text,
    /// 16 below it, at its start, and the header grows by them. In a 320
    /// window (288 inside) two buttons wrap; right to left they start at the
    /// right.
    @MainActor func testActionsThatDoNotFitWrapUnderTheText() throws {
        let width: CGFloat = 320
        let side = KozmosContainerInset.padding(.window, width: width)
        let titleText = "Map content for Terminal A"
        let bare = try draw(KozmosPageHeader(titleText, tone: .default), width: width).size.height
        // The text column's height: the header less its 32 above and 24 below.
        let textHeight = bare - 32 - 24
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let header = KozmosPageHeader(titleText, tone: .default, actions: {
                Self.redAction(width: 100)
                Self.redAction(width: 100)
            }).environment(\.layoutDirection, direction)
            let drawn = try draw(header, width: width)
            let box = try XCTUnwrap(drawn.boundingBox(where: Self.isRed), "\(direction): no actions drawn")
            XCTAssertEqual(box.minY, 32 + textHeight + 16, accuracy: 0.5,
                           "\(direction): the actions are not 16 under the text (\(box.minY))")
            XCTAssertEqual(drawn.size.height, bare + 16 + 44, accuracy: 0.5,
                           "\(direction): the header did not grow by the 16 and the actions")
            if direction == .leftToRight {
                XCTAssertEqual(box.minX, side, accuracy: 0.5, "the wrapped actions are not at the text's start")
            } else {
                XCTAssertEqual(width - box.maxX, side, accuracy: 0.5, "the wrapped actions are not at the right")
            }
        }
    }

    /// Where the text's 256, the 16 and the action fit, the action stays on
    /// the title's line, at the end, centred on it, and the header is no
    /// taller than with no action.
    @MainActor func testActionsThatFitStayOnTheTitlesLine() throws {
        let width: CGFloat = 600
        let side = KozmosContainerInset.padding(.window, width: width)
        let bare = try draw(KozmosPageHeader("Settings", tone: .default), width: width).size.height
        let drawn = try draw(KozmosPageHeader("Settings", tone: .default, actions: {
            Self.redAction(width: 100)
        }), width: width)
        let box = try XCTUnwrap(drawn.boundingBox(where: Self.isRed), "no action drawn")
        XCTAssertEqual(drawn.size.height, bare, accuracy: 0.5, "the action grew the header")
        XCTAssertEqual(width - box.maxX, side, accuracy: 0.5, "the action is not at the end")
        XCTAssertGreaterThan(box.minY, 16)
        XCTAssertLessThan(box.minY, 32)
    }

    /// The info button is 8 after the title, on its line.
    @MainActor func testTheInfoButtonIsAfterTheTitle() throws {
        let drawn = try draw(KozmosPageHeader("Settings", tone: .default, info: {
            Color(red: 1, green: 0, blue: 0).frame(width: 20, height: 20)
        }))
        let info = try XCTUnwrap(drawn.boundingBox { r, g, b, a in a > 200 && r > 200 && g < 60 && b < 60 }, "no info drawn")
        let side = KozmosContainerInset.padding(.window, width: Self.width)
        let title = try DrawnPixels.draw(
            Text("Settings").font(.system(size: 24, weight: .bold)).fixedSize(), scale: 1).size
        XCTAssertEqual(info.minX, side + title.width + 8, accuracy: 1)
        XCTAssertGreaterThan(info.midY, 32)
        XCTAssertLessThan(info.midY, 32 + title.height)
    }

    #if os(iOS)
    /// The title is the screen's heading and nothing else is; VoiceOver reads
    /// the breadcrumb, the title, the description, then the actions.
    @MainActor func testTheTitleIsTheHeadingAndTheOrderIsTheReadingOrder() async throws {
        let header = KozmosPageHeader(
            "Settings",
            description: "Manage the site.",
            breadcrumb: { Text("Boston Logan Airport") },
            actions: { KozmosButton("Save changes") {} }
        )
        try await inspectAccessibility(header) { window in
            let title = try self.accessibilityElement(named: "Settings", in: window)
            XCTAssertTrue(title.accessibilityTraits.contains(.header), self.describeAccessibility(window))
            let labels = self.accessibilityElements(window).compactMap(\.accessibilityLabel)
            let order = ["Boston Logan Airport", "Settings", "Manage the site.", "Save changes"]
            XCTAssertEqual(labels.filter { order.contains($0) }, order, self.describeAccessibility(window))
            let headings = self.accessibilityElements(window).filter { $0.accessibilityTraits.contains(.header) }
            XCTAssertEqual(headings.compactMap(\.accessibilityLabel), ["Settings"])
        }
    }

    /// PageHeader.mdx's SwiftUI snippet (DocSnippets/SettingsHeader.swift),
    /// as a reader copies it: its title is a heading.
    @MainActor func testTheDocSnippetsTitleIsAHeading() async throws {
        try await inspectAccessibility(SettingsHeader()) { window in
            let title = try self.accessibilityElement(named: "Settings", in: window)
            XCTAssertTrue(title.accessibilityTraits.contains(.header), self.describeAccessibility(window))
        }
    }
    #endif
}
