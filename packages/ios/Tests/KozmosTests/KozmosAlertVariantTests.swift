import SwiftUI
import XCTest
@testable import Kozmos

/// React's alert colours its icon, title and description by its variant: they
/// inherit the root's `text-destructive-text` and the like. Figma binds all
/// three to the variant's foreground (`alertConfig` in the Core Library's
/// importer), and SwiftUI's own Code Connect passes it to each. SwiftUI's
/// variant reached none of them: the icon drew the default's info symbol in
/// foreground/0 unless given the variant again, the title foreground/0 and the
/// description foreground/500. Each now takes the alert's variant, and a
/// variant or colour given to it still wins.
///
/// Each part is drawn alone in its alert, light, and read where its ink is
/// darkest, inside the alert's edge: on the plain surface that is the colour
/// the part is drawn in.
final class KozmosAlertVariantTests: XCTestCase {
    private typealias Variant = KozmosAlert<AnyView>.KozmosAlertVariant
    private let variants: [(Variant, String)] = [
        (.default, "default"), (.info, "info"), (.success, "success"), (.warning, "warning"), (.destructive, "destructive")
    ]

    /// The colour the part inside an alert of `variant` is drawn in.
    @MainActor private func ink(_ variant: Variant, _ part: AnyView) throws -> (r: UInt8, g: UInt8, b: UInt8, a: UInt8) {
        // The part fills the alert, so the alert's edge is the drawing's.
        let alert = KozmosAlert<AnyView>(variant: variant) { AnyView(part.frame(maxWidth: .infinity, alignment: .leading)) }
            .frame(width: 320)
            .environment(\.colorScheme, .light)
        let drawn = try DrawnPixels.draw(alert)
        // Clear of the edge, which is the variant's colour too: 4 in from the
        // top and bottom, and past the rounded corners at the sides, where the
        // content's 16 of padding starts.
        let inside = CGRect(x: 14, y: 4, width: CGFloat(drawn.width) / drawn.scale - 28, height: CGFloat(drawn.height) / drawn.scale - 8)
        return try XCTUnwrap(drawn.darkest(in: inside), "nothing drawn inside the alert")
    }

    private func describe(_ c: (r: UInt8, g: UInt8, b: UInt8, a: UInt8)) -> String { String(format: "#%02X%02X%02X", c.r, c.g, c.b) }

    @MainActor func testTheIconTitleAndDescriptionTakeTheAlertsVariant() throws {
        let parts: [(String, AnyView)] = [
            ("icon", AnyView(KozmosAlertIcon())),
            ("title", AnyView(KozmosAlertTitle("Level 2 is closed"))),
            ("description", AnyView(KozmosAlertDescription("Lifts at both ends")))
        ]
        var wrong: [String] = []
        for (variant, name) in variants {
            let expected = try DrawnPixels.resolved(variant.foregroundColor, in: .light)
            for (part, view) in parts {
                let drawn = try ink(variant, view)
                if !DrawnPixels.matches(expected, tolerance: 12)(drawn.r, drawn.g, drawn.b, drawn.a) {
                    wrong.append("\(name) \(part): \(describe(drawn)), not \(describe(expected))")
                }
            }
        }
        XCTAssertEqual(wrong, [], "parts not drawn in their alert's variant")
    }

    /// The icon draws its alert's symbol: a destructive alert's is not the default's.
    @MainActor func testTheIconDrawsItsAlertsSymbol() throws {
        func drawnIcon(_ alert: Variant, _ icon: KozmosAlertIcon) throws -> DrawnPixels {
            try DrawnPixels.draw(KozmosAlert<AnyView>(variant: alert) { AnyView(icon) }.environment(\.colorScheme, .light))
        }
        let inherited = try drawnIcon(.destructive, KozmosAlertIcon())
        let given = try drawnIcon(.destructive, KozmosAlertIcon(variant: .destructive))
        XCTAssertEqual(try XCTUnwrap(inherited.largestDifference(from: given)), 0, accuracy: 4,
                       "the icon in a destructive alert is not the destructive icon")
    }

    /// A variant or a colour given to a part still wins over its alert's.
    @MainActor func testAPartsOwnVariantOrColourWins() throws {
        let theme = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        let success = try DrawnPixels.resolved(Variant.success.foregroundColor, in: .light)
        let title = try ink(.destructive, AnyView(KozmosAlertTitle("Level 2 is closed", color: KozmosColors.primitivesColorsTheme600)))
        let description = try ink(.destructive, AnyView(KozmosAlertDescription("Lifts at both ends", color: KozmosColors.primitivesColorsTheme600)))
        let icon = try ink(.destructive, AnyView(KozmosAlertIcon(variant: .success)))
        XCTAssertTrue(DrawnPixels.matches(theme, tolerance: 12)(title.r, title.g, title.b, title.a), "title \(describe(title))")
        XCTAssertTrue(DrawnPixels.matches(theme, tolerance: 12)(description.r, description.g, description.b, description.a), "description \(describe(description))")
        XCTAssertTrue(DrawnPixels.matches(success, tolerance: 12)(icon.r, icon.g, icon.b, icon.a), "icon \(describe(icon))")
    }
}
