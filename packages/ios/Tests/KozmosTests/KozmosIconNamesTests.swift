import XCTest
import SwiftUI
@testable import Kozmos

/// The names `KozmosIcon` draws, held to the web's registry, as Compose's
/// `IconNamesTest` holds Compose's. Until 2026-10-17 SwiftUI drew the
/// question-mark stand-in an unknown name gets for 18 of the 80 names on the
/// Icons page, and nothing for compass-01, whose SF Symbol, `compass`, no iOS
/// has: a chip with `iconName: "phone"` drew a phone on the web and on Android
/// and a question mark on iOS.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on a simulator.
final class KozmosIconNamesTests: XCTestCase {
    /// A file of the repository, found by walking up from this file, as the
    /// wayfinding test finds navigation-glyphs.json.
    static func repositoryFile(_ relative: String) throws -> String {
        var directory = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
        var found: URL?
        while directory.path != "/" {
            let candidate = directory.appendingPathComponent(relative)
            if FileManager.default.fileExists(atPath: candidate.path) {
                found = candidate
                break
            }
            directory.deleteLastPathComponent()
        }
        let file = try XCTUnwrap(found, "no \(relative) above \(#filePath)")
        return try String(contentsOf: file, encoding: .utf8)
    }

    /// The lines of a TypeScript source between two markers, each without
    /// its line comment.
    static func lines(of source: String, from start: String, to end: String) throws -> [String] {
        let after = try XCTUnwrap(source.range(of: start), "no \(start) in the source")
        let before = try XCTUnwrap(source.range(of: end, range: after.upperBound..<source.endIndex),
                                   "no \(end) after \(start)")
        return source[after.upperBound..<before.lowerBound]
            .split(separator: "\n")
            .map { $0.components(separatedBy: "//")[0] }
    }

    /// The names the web's registry knows: `kozmosIconNames` in
    /// packages/icons/src/registry.ts, read from its source as text.
    static func webRegistryNames() throws -> [String] {
        let source = try repositoryFile("packages/icons/src/registry.ts")
        return try lines(of: source, from: "export const kozmosIconNames = [", to: "] as const;")
            // Between the quotes: every other piece, from the second.
            .flatMap { $0.components(separatedBy: "\"").enumerated().filter { $0.offset % 2 == 1 }.map(\.element) }
    }

    /// The aliases the web's registry accepts, `kozmosIconAliases`, each with
    /// the name it stands for.
    static func webRegistryAliases() throws -> [(alias: String, name: String)] {
        let source = try repositoryFile("packages/icons/src/registry.ts")
        let unquoted = CharacterSet(charactersIn: "\" ,")
        return try lines(of: source, from: "export const kozmosIconAliases = {", to: "} as const")
            .compactMap { line in
                let parts = line.split(separator: ":", maxSplits: 1)
                guard parts.count == 2 else { return nil }
                return (parts[0].trimmingCharacters(in: unquoted), parts[1].trimmingCharacters(in: unquoted))
            }
    }

    /// Two drawings alike to within a level, as two renders of one view are.
    private func alike(_ drawn: DrawnPixels, _ other: DrawnPixels) -> Bool {
        (drawn.largestDifference(from: other) ?? .max) <= 1
    }

    /// Every name the web's registry knows draws, and every wayfinding
    /// glyph's: the Icons page's 80 `Icon / *` components, none of them the
    /// stand-in and none blank (an SF Symbol name the system does not have
    /// draws nothing). A name added to the web registry without SwiftUI
    /// artwork fails here, as it fails Compose's IconNamesTest.
    @MainActor func testEveryNameTheWebRegistryKnowsSwiftUIDraws() throws {
        let names = try Self.webRegistryNames()
        XCTAssertEqual(names.count, Set(names).count, "the web registry's names are not unique")
        XCTAssertGreaterThanOrEqual(names.count, 57, "the web registry lists \(names.count) names; the list was not read")
        let wayfinding = try KozmosIconTests.wayfindingGlyphs().map { KozmosIconTests.iconName($0.name) }
        let all = names + wayfinding
        XCTAssertEqual(all.count, Set(all).count, "a wayfinding glyph has a registry name")
        XCTAssertGreaterThanOrEqual(all.count, 80, "the Icons page draws 80 names; \(all.count) were read")

        let standIn = try DrawnPixels.draw(KozmosIcon("no-such-kozmos-name", size: .xl), scale: 3)
        XCTAssertNotNil(standIn.boundingBox(where: { _, _, _, a in a > 128 }), "the stand-in draws nothing to tell a name from")
        var standIns: [String] = []
        var blanks: [String] = []
        for name in all {
            let drawn = try DrawnPixels.draw(KozmosIcon(name, size: .xl), scale: 3)
            if alike(drawn, standIn) {
                standIns.append(name)
            } else if drawn.boundingBox(where: { _, _, _, a in a > 128 }) == nil {
                blanks.append(name)
            }
        }
        XCTAssertTrue(standIns.isEmpty, "SwiftUI draws the stand-in for \(standIns.count) of the \(all.count) names: \(standIns)")
        XCTAssertTrue(blanks.isEmpty, "SwiftUI draws nothing for \(blanks.count) of the \(all.count) names: \(blanks)")
    }

    /// Every alias the web's registry accepts draws the name it stands for,
    /// close as x-close and notifications as bell-01, and stands for a name
    /// the registry knows.
    @MainActor func testEveryAliasTheWebRegistryAcceptsDrawsItsName() throws {
        let names = Set(try Self.webRegistryNames())
        let aliases = try Self.webRegistryAliases()
        XCTAssertGreaterThanOrEqual(aliases.count, 17, "the web registry lists \(aliases.count) aliases; the list was not read")
        for (alias, name) in aliases {
            XCTAssertTrue(names.contains(name), "\(alias) stands for \(name), which the registry does not know")
            let drawn = try DrawnPixels.draw(KozmosIcon(alias, size: .xl), scale: 3)
            let expected = try DrawnPixels.draw(KozmosIcon(name, size: .xl), scale: 3)
            XCTAssertTrue(alike(drawn, expected), "\(alias) does not draw \(name)")
        }
    }

    /// The path data `@kozmos-ds/icons` draws an export with, read from
    /// packages/icons/src/pointr/icons.generated.ts as text: each `d`.
    static func pointrPathData(_ exportName: String) throws -> [String] {
        let source = try repositoryFile("packages/icons/src/pointr/icons.generated.ts")
        let start = try XCTUnwrap(source.range(of: "export const \(exportName) = "),
                                  "no \(exportName) in icons.generated.ts")
        let end = source.range(of: "\nexport const ", range: start.upperBound..<source.endIndex)?.lowerBound
            ?? source.endIndex
        let block = source[start.upperBound..<end]
        XCTAssertTrue(block.contains("createPointrIcon("), "\(exportName) is not a Pointr outline")
        return block.components(separatedBy: "d: \"").dropFirst().map { String($0.prefix { $0 != "\"" }) }
    }

    /// The names SwiftUI lacked until 2026-10-17, the 18 Compose lacked until
    /// 2026-10-07 and compass-01, are Pointr's own outlines, generated from
    /// packages/icons by scripts/generate-native-icons.mjs: the paths React
    /// draws, read here from their source, stroked 2 on the 24 grid with round
    /// caps and joins at any size, in the icon's colour, never mirrored, and
    /// never an SF Symbol near-miss.
    @MainActor func testTheNamesSwiftUILackedArePointrsOutlines() throws {
        let pointr = [
            "arrow-down": "ArrowDown", "arrow-up": "ArrowUp", "bookmark": "Bookmark",
            "calendar-check-01": "CalendarCheck01", "clock-plus": "ClockPlus", "eye": "Eye",
            "feather": "Feather", "flip-backward": "FlipBackward", "globe-02": "Globe02",
            "heart": "Heart", "layout-alt-02": "LayoutAlt02", "loading-01": "Loading01",
            "mail-01": "Mail01", "phone": "Phone", "share-01": "Share01",
            "shopping-bag-02": "ShoppingBag02", "stars-01": "Stars01", "switch-vertical-01": "SwitchVertical01",
            "compass-01": "Compass01",
        ]
        XCTAssertEqual(pointr.count, 19)
        for (name, exportName) in pointr.sorted(by: { $0.key < $1.key }) {
            XCTAssertNotNil(KozmosPointrGlyph.named(name), "\(name) is not drawn from Pointr's outline")
            let data = try Self.pointrPathData(exportName)
            XCTAssertFalse(data.isEmpty, "\(exportName) has no path")
            let outline = try XCTUnwrap(KozmosPointrGlyph.outline(data.joined(separator: " ")),
                                        "\(exportName)'s path data does not parse")
            for size in [KozmosIconSize.sm, .xl] {
                let side = size.pointSize
                let expected = try DrawnPixels.draw(
                    outline.stroke(style: StrokeStyle(lineWidth: 2 * side / 24, lineCap: .round, lineJoin: .round))
                        .foregroundColor(KozmosColors.primitivesColorsForeground100)
                        .frame(width: side, height: side), scale: 3)
                let drawn = try DrawnPixels.draw(KozmosIcon(name, size: size), scale: 3)
                XCTAssertTrue(alike(drawn, expected), "\(name) at \(side) is not Pointr's \(exportName), stroked 2 on the grid")
                let rtl = try DrawnPixels.draw(KozmosIcon(name, size: size).environment(\.layoutDirection, .rightToLeft), scale: 3)
                XCTAssertEqual(drawn.largestDifference(from: rtl), 0, "\(name) mirrors right to left")
            }
            let danger = try DrawnPixels.draw(KozmosIcon(name, size: .xl, color: .destructive), scale: 3)
            let red = try DrawnPixels.resolved(KozmosColors.primitivesColorsEmotionalDanger600, in: .light)
            XCTAssertNotNil(danger.boundingBox(where: DrawnPixels.matches(red, tolerance: 12)),
                            "\(name) is not drawn in the icon's colour")
        }
    }

    /// An outline's line is 2 × size / 24 across, measured: arrow-down's
    /// shaft, M12 5V19, at y = 8 on the grid, clear of its head.
    @MainActor func testArrowDownIsStrokedAtTwoOnTheGridAtAnySize() throws {
        for size in [KozmosIconSize.sm, .xl] {
            let side = size.pointSize
            let drawn = try DrawnPixels.draw(KozmosIcon("arrow-down", size: size), scale: 3)
            let row = CGRect(x: 10 * side / 24, y: 8 * side / 24, width: 4 * side / 24, height: 1 / drawn.scale)
            let shaft = try XCTUnwrap(drawn.boundingBox(in: row, where: { _, _, _, a in a > 128 }), "no shaft at \(side)")
            XCTAssertEqual(shaft.width, 2 * side / 24, accuracy: 0.5, "the shaft is \(shaft.width) across at \(side)")
            XCTAssertEqual(shaft.midX, 12 * side / 24, accuracy: 0.5, "the shaft is off x = 12 at \(side)")
        }
    }
}
