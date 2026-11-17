import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 210 (owner, 17 Nov): PageHeader takes a `titleAddon`, a view
/// beside the title such as a status Tag, as ListItem's. It is 8 after the
/// title, before the info button, centred on the title's line, and makes the
/// header no taller; where the line has no room it wraps under the title, 8
/// below it, at its start. It is not part of the heading.
final class KozmosPageHeaderTitleAddonTests: XCTestCase {
    private static let width: CGFloat = 800

    @MainActor private func draw(_ view: some View, width: CGFloat = width) throws -> DrawnPixels {
        try DrawnPixels.draw(view.frame(width: width).environment(\.colorScheme, .light), scale: 1)
    }

    private static func isRed(_ r: UInt8, _ g: UInt8, _ b: UInt8, _ a: UInt8) -> Bool { a > 200 && r > 200 && g < 60 && b < 60 }
    private static func isBlue(_ r: UInt8, _ g: UInt8, _ b: UInt8, _ a: UInt8) -> Bool { a > 200 && b > 200 && r < 60 && g < 60 }
    private static func isGreen(_ r: UInt8, _ g: UInt8, _ b: UInt8, _ a: UInt8) -> Bool { a > 200 && g > 200 && r < 60 && b < 60 }

    private static func addon() -> some View { Color(red: 1, green: 0, blue: 0).frame(width: 60, height: 20) }

    @MainActor private func titleSize(_ text: String) throws -> CGSize {
        try DrawnPixels.draw(Text(text).font(.system(size: 24, weight: .bold)).fixedSize(), scale: 1).size
    }

    @MainActor func testTheAddonIsEightAfterTheTitleOnItsLineAndMakesItNoTaller() throws {
        let side = KozmosContainerInset.padding(.window, width: Self.width)
        let bare = try draw(KozmosPageHeader("Settings", tone: .default)).size.height
        let drawn = try draw(KozmosPageHeader("Settings", tone: .default).titleAddon { Self.addon() })
        let box = try XCTUnwrap(drawn.boundingBox(where: Self.isRed), "no addon drawn")
        let title = try titleSize("Settings")
        XCTAssertEqual(box.minX, side + title.width + 8, accuracy: 1, "the addon is not 8 after the title")
        XCTAssertGreaterThan(box.midY, 32)
        XCTAssertLessThan(box.midY, 32 + title.height)
        XCTAssertEqual(drawn.size.height, bare, accuracy: 0.5, "the addon grew the header")
    }

    /// Title, addon, info, then the actions at the end, still centred on the
    /// title's line.
    @MainActor func testTheAddonComesBeforeTheInfoButtonAndTheActionsStayOnTheTitlesLine() throws {
        let drawn = try draw(KozmosPageHeader("Settings", tone: .default, info: {
            Color(red: 0, green: 0, blue: 1).frame(width: 20, height: 20)
        }, actions: {
            Color(red: 0, green: 1, blue: 0).frame(width: 40, height: 44)
        }).titleAddon { Self.addon() })
        let addon = try XCTUnwrap(drawn.boundingBox(where: Self.isRed), "no addon drawn")
        let info = try XCTUnwrap(drawn.boundingBox(where: Self.isBlue), "no info drawn")
        let actions = try XCTUnwrap(drawn.boundingBox(where: Self.isGreen), "no actions drawn")
        XCTAssertEqual(info.minX, addon.maxX + 8, accuracy: 1, "the info button is not 8 after the addon")
        XCTAssertEqual(info.midY, addon.midY, accuracy: 1, "the addon and the info button are not on one line")
        XCTAssertGreaterThan(actions.minY, 16, "the actions start at \(actions.minY)")
        XCTAssertLessThan(actions.minY, 32, "the actions start at \(actions.minY)")
    }

    /// In a 320 window the title takes its line and the addon goes under it.
    @MainActor func testAnAddonWithNoRoomWrapsUnderTheTitle() throws {
        let width: CGFloat = 320
        let side = KozmosContainerInset.padding(.window, width: width)
        let text = "Map content for Terminal A"
        let bare = try draw(KozmosPageHeader(text, tone: .default), width: width).size.height
        let titleHeight = bare - 32 - 24
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let drawn = try draw(KozmosPageHeader(text, tone: .default).titleAddon { Self.addon() }
                .environment(\.layoutDirection, direction), width: width)
            let box = try XCTUnwrap(drawn.boundingBox(where: Self.isRed), "\(direction): no addon drawn")
            XCTAssertEqual(box.minY, 32 + titleHeight + 8, accuracy: 0.5, "\(direction): the addon is not 8 under the title")
            XCTAssertEqual(drawn.size.height, bare + 8 + 20, accuracy: 0.5, "\(direction): the header did not grow by the addon")
            if direction == .leftToRight {
                XCTAssertEqual(box.minX, side, accuracy: 0.5, "the wrapped addon is not at the title's start")
            } else {
                XCTAssertEqual(width - box.maxX, side, accuracy: 0.5, "the wrapped addon is not at the right")
            }
        }
    }

    #if os(iOS)
    /// The heading is the title alone: the addon is its own element, read
    /// after the title.
    @MainActor func testTheAddonIsNotPartOfTheHeading() async throws {
        let header = KozmosPageHeader("Map Content").titleAddon {
            KozmosTag("Changes Awaiting Publish", emotion: .alert)
        }
        try await inspectAccessibility(header) { window in
            let headings = self.accessibilityElements(window).filter { $0.accessibilityTraits.contains(.header) }
            XCTAssertEqual(headings.compactMap(\.accessibilityLabel), ["Map Content"], self.describeAccessibility(window))
            let labels = self.accessibilityElements(window).compactMap(\.accessibilityLabel)
            XCTAssertEqual(labels.filter { ["Map Content", "Changes Awaiting Publish"].contains($0) },
                           ["Map Content", "Changes Awaiting Publish"], self.describeAccessibility(window))
        }
    }
    #endif
}
