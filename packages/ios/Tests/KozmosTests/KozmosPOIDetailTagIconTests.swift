import XCTest
import SwiftUI
@testable import Kozmos

/// A POI detail tag draws its Kozmos icon name as `KozmosIcon` draws it, as
/// React's chip draws `Icon` and Compose's draws the Pointr outline.
///
/// Until 2026-10-17 `KozmosPOIDetailTag(service:)` turned a service's
/// `iconName` into an SF Symbol name, and the tag drew that with
/// `Image(systemName:)`. So a tag drew the `questionmark.circle` stand-in for
/// every name SF Symbols has nothing for — the 19 Pointr outlines
/// `KozmosIcon` draws, bluetooth-off and the wayfinding glyphs — and for a
/// name Kozmos does not know, where the web and Compose draw no icon. A
/// service named `phone` drew a phone on the web and on Android and a
/// question mark on iOS. And a tag a product passed had no Kozmos name to
/// give: the contract's `iconName` was dropped when it decoded.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on a simulator; the last, hosted in a window, on a
/// simulator only.
final class KozmosPOIDetailTagIconTests: XCTestCase {
    /// The names SF Symbols has nothing for that `KozmosIcon` draws from
    /// Pointr's outlines, generated from packages/icons.
    static let pointrOutlines = [
        "arrow-down", "arrow-up", "flip-backward", "stars-01", "switch-vertical-01",
        "bookmark", "calendar-check-01", "clock-plus", "eye", "feather", "globe-02",
        "heart", "layout-alt-02", "loading-01", "mail-01", "phone", "share-01",
        "shopping-bag-02", "compass-01",
    ]

    /// Light and dark, each left to right and right to left.
    static let appearances: [(scheme: ColorScheme, direction: LayoutDirection)] = [
        (.light, .leftToRight), (.dark, .leftToRight), (.light, .rightToLeft), (.dark, .rightToLeft),
    ]

    private static func describe(_ scheme: ColorScheme, _ direction: LayoutDirection) -> String {
        "\(scheme == .dark ? "dark" : "light") \(direction == .rightToLeft ? "rtl" : "ltr")"
    }

    /// One tag, drawn as `KozmosPOIDetailPanel` draws a service or a group's item.
    @MainActor private func draw(_ tag: KozmosPOIDetailTag, _ scheme: ColorScheme,
                                 _ direction: LayoutDirection) throws -> DrawnPixels {
        try DrawnPixels.draw(POIDetailTags(items: [tag])
            .environment(\.colorScheme, scheme)
            .environment(\.layoutDirection, direction), scale: 3)
    }

    /// A service's tag, as the panel builds it from `KozmosPOIPresentation.services`.
    private func serviceTag(_ iconName: String) -> KozmosPOIDetailTag {
        KozmosPOIDetailTag(service: .init(id: iconName, label: "Service", iconName: iconName))
    }

    /// The tag's 16pt icon frame: 12 in from its leading edge, centred on its height.
    private func iconFrame(of tag: DrawnPixels, _ direction: LayoutDirection) -> CGRect {
        let side: CGFloat = 16, inset: CGFloat = 12
        return CGRect(x: direction == .leftToRight ? inset : tag.size.width - inset - side,
                      y: (tag.size.height - side) / 2, width: side, height: side)
    }

    /// Two drawings alike to within a level, as two renders of one view are.
    private func alike(_ drawn: DrawnPixels, _ other: DrawnPixels) -> Bool {
        (drawn.largestDifference(from: other) ?? .max) <= 1
    }

    /// What is wrong with a tag's icon, or nil when it draws `KozmosIcon`'s
    /// artwork for the name: not the stand-in, in the label's colour, and in
    /// its icon frame the pixels `KozmosIcon(name, size: .sm)` draws alone,
    /// so unmirrored right to left as KozmosIcon is.
    @MainActor private func fault(drawing name: String, in tag: KozmosPOIDetailTag,
                                  _ scheme: ColorScheme, _ direction: LayoutDirection) throws -> String? {
        let drawn = try draw(tag, scheme, direction)
        let standIn = try draw(KozmosPOIDetailTag(id: tag.id, label: tag.label, systemImage: "questionmark.circle"),
                               scheme, direction)
        if alike(drawn, standIn) { return "the stand-in" }
        let textOnly = try draw(KozmosPOIDetailTag(id: tag.id, label: tag.label), scheme, direction)
        if alike(drawn, textOnly) { return "no icon" }
        let frame = iconFrame(of: drawn, direction)
        let ink = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground100, in: scheme)
        if drawn.count(in: frame, where: DrawnPixels.matches(ink, tolerance: 12)) == 0 {
            return "no pixel in the label's colour"
        }
        let alone = try DrawnPixels.draw(KozmosIcon(name, size: .sm)
            .environment(\.colorScheme, scheme)
            .environment(\.layoutDirection, direction), scale: 3)
        let difference = drawn.cropped(to: frame).largestDifference(from: alone)
        if (difference ?? .max) > 2 { return "not KozmosIcon's artwork (differs by \(difference.map(String.init) ?? "size"))" }
        return nil
    }

    /// The 19 names SF Symbols lacks draw Pointr's outlines in a tag, as
    /// `KozmosIcon` draws them, in light and dark and in both directions.
    @MainActor func testATagDrawsTheNineteenNamesSFSymbolsLacks() throws {
        XCTAssertEqual(Self.pointrOutlines.count, 19)
        var faults: [String] = []
        for name in Self.pointrOutlines {
            for (scheme, direction) in Self.appearances {
                if let fault = try fault(drawing: name, in: serviceTag(name), scheme, direction) {
                    faults.append("\(name) (\(Self.describe(scheme, direction))): \(fault)")
                }
            }
        }
        XCTAssertTrue(faults.isEmpty, "\(faults.count) of \(Self.pointrOutlines.count * Self.appearances.count) tags do not draw KozmosIcon's artwork:\n" + faults.joined(separator: "\n"))
    }

    /// The rest of the artwork `KozmosIcon` draws itself rather than through
    /// SF Symbols draws in a tag too: bluetooth-off, Go's navigation pointer
    /// (an SF Symbol's `location.north` before) and the 23 wayfinding glyphs.
    @MainActor func testATagDrawsEveryOtherPointrArtworkKozmosIconDraws() throws {
        let wayfinding = try KozmosIconTests.wayfindingGlyphs().map { KozmosIconTests.iconName($0.name) }
        XCTAssertGreaterThanOrEqual(wayfinding.count, 23, "\(wayfinding.count) wayfinding glyphs were read")
        let names = ["bluetooth-off", "navigation-pointer-01"] + wayfinding
        var faults: [String] = []
        for name in names {
            for (scheme, direction) in Self.appearances {
                if let fault = try fault(drawing: name, in: serviceTag(name), scheme, direction) {
                    faults.append("\(name) (\(Self.describe(scheme, direction))): \(fault)")
                }
            }
        }
        XCTAssertTrue(faults.isEmpty, "\(faults.count) of \(names.count * Self.appearances.count) tags do not draw KozmosIcon's artwork:\n" + faults.joined(separator: "\n"))
    }

    /// A name SF Symbols has a symbol for draws exactly as it did when the
    /// tag drew the symbol itself: the same size, weight, colour and place.
    /// Every such name in the web registry, and every alias for one, wifi
    /// among them, in light and dark and in both directions.
    @MainActor func testATagDrawsAnSFSymbolNameExactlyAsBefore() throws {
        let names = try KozmosIconNamesTests.webRegistryNames()
        let aliases = try KozmosIconNamesTests.webRegistryAliases()
        let symbolBacked = (names.map { ($0, $0) } + aliases.map { ($0.alias, $0.name) }).filter { key, name in
            KozmosIcon.symbolName(for: key) != "questionmark.circle"
                && KozmosPointrGlyph.named(name) == nil && KozmosPointrGlyph.navigationArtwork(name) == nil
        }.map(\.0)
        XCTAssertTrue(symbolBacked.contains("wifi"))
        XCTAssertGreaterThanOrEqual(symbolBacked.count, 50, "\(symbolBacked.count) names and aliases draw an SF Symbol")
        var changed: [String] = []
        for key in symbolBacked {
            for (scheme, direction) in Self.appearances {
                let drawn = try draw(serviceTag(key), scheme, direction)
                let before = try draw(KozmosPOIDetailTag(id: key, label: "Service",
                                                         systemImage: KozmosIcon.symbolName(for: key)), scheme, direction)
                if !alike(drawn, before) { changed.append("\(key) (\(Self.describe(scheme, direction)))") }
            }
        }
        XCTAssertTrue(changed.isEmpty, "\(changed.count) of \(symbolBacked.count * Self.appearances.count) tags no longer draw their SF Symbol as before: \(changed)")
    }

    /// A name Kozmos does not know draws no icon, only the label, as the
    /// web's and Compose's chips draw it: never the stand-in.
    @MainActor func testATagDrawsNoIconForANameKozmosDoesNotKnow() throws {
        for (scheme, direction) in Self.appearances {
            let drawn = try draw(serviceTag("no-such-kozmos-name"), scheme, direction)
            let textOnly = try draw(KozmosPOIDetailTag(id: "no-such-kozmos-name", label: "Service"), scheme, direction)
            XCTAssertTrue(alike(drawn, textOnly), "an unknown name draws an icon (\(Self.describe(scheme, direction)))")
        }
    }

    /// A tag in the contract's JSON, as the web and Compose spell a group's
    /// item or a tag (`POIServicePresentation`), keeps its `iconName` and
    /// draws it, and an encoded tag keeps it too.
    @MainActor func testATagDecodedFromTheContractKeepsAndDrawsItsIconName() throws {
        let json = #"{"tags":[{"id":"call","label":"Call ahead","iconName":"phone"}]}"#
        let details = try JSONDecoder().decode(KozmosPOIDetailsPresentation.self, from: Data(json.utf8))
        let tag = try XCTUnwrap(details.tags.first)
        XCTAssertEqual(try JSONDecoder().decode(KozmosPOIDetailsPresentation.self, from: JSONEncoder().encode(details)), details)
        for (scheme, direction) in Self.appearances {
            let fault = try fault(drawing: "phone", in: tag, scheme, direction)
            XCTAssertNil(fault, "a decoded tag named phone draws \(fault ?? "") (\(Self.describe(scheme, direction)))")
        }
    }

    #if os(iOS)
    /// In the panel itself, hosted in a window as a product shows it: a
    /// service's tag draws its own icon, phone and heart two different ones
    /// where both drew the stand-in, and a name Kozmos does not know none.
    @MainActor func testThePanelsServiceTagsDrawTheirOwnIconsHosted() async throws {
        func panel(_ iconName: String?) async throws -> RenderedPixels {
            try await RenderedPixels.render(KozmosPOIDetailPanel(
                poi: KozmosPOIPresentation(id: "cafe", name: "Cafe", floorId: "2", floorLabel: "Level 2",
                                           services: [.init(id: "call", label: "Call ahead", iconName: iconName)]),
                actionLabels: [:], onAction: { _, _ in }, onClose: {}), size: CGSize(width: 320, height: 600))
        }
        let none = try await panel(nil)
        let unknown = try await panel("no-such-kozmos-name")
        let phone = try await panel("phone")
        let heart = try await panel("heart")
        for (name, pixels) in [("none", none), ("phone", phone), ("heart", heart)] {
            let attachment = XCTAttachment(image: pixels.image)
            attachment.name = "poi-card-service-\(name)"
            attachment.lifetime = .keepAlways
            add(attachment)
        }
        XCTAssertEqual(try XCTUnwrap(unknown.differingPixels(from: none)), 0, "an unknown name draws an icon in the panel")
        XCTAssertGreaterThan(try XCTUnwrap(phone.differingPixels(from: none)), 50, "phone draws no icon in the panel")
        XCTAssertGreaterThan(try XCTUnwrap(phone.differingPixels(from: heart)), 50, "phone and heart draw one icon in the panel")
    }
    #endif
}
