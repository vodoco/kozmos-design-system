import SwiftUI
import XCTest
@testable import Kozmos

/// D6 (2026-10-04): the manoeuvre card is theme-filled by default, and a
/// caller that names a surface and no appearance gets the background
/// appearance on that surface, as a 0.5.0 call that passed glass did. An
/// appearance the caller names wins over the surface.
///
/// The itinerary reports the surface and guidance colour the card hands it,
/// and the drawn card is searched for the theme fill. On a Mac, `swift test`
/// draws it with `DrawnPixels`; on iOS it is hosted, because `ImageRenderer`
/// cannot draw the UIKit-backed scroll view the card measures it in.
final class KozmosManoeuvreAppearanceTests: XCTestCase {
    /// What the card told its itinerary.
    private final class Seen {
        var surface: KozmosSurfaceStyle?
        var themed = false
    }

    private struct Probe: View {
        let seen: Seen
        @Environment(\.kozmosSurfaceStyle) private var surface
        @Environment(\.kozmosGuidanceForeground) private var guidance
        var body: some View {
            seen.surface = surface
            seen.themed = guidance != nil
            return Color.clear.frame(width: 10, height: 10)
        }
    }

    /// The card, drawn open: what its itinerary was told, and how much of it is the theme fill.
    @MainActor private func draw(_ card: (Seen) -> some View) async throws -> (seen: Seen, themeFill: Int) {
        let seen = Seen()
        let view = card(seen).frame(width: 320).environment(\.colorScheme, .light)
        let theme = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        #if os(iOS)
        let size = CGSize(width: 320, height: 240)
        let pixels = try await RenderedPixels.render(view.background(Color.white), size: size)
        let fill = pixels.count(in: CGRect(origin: .zero, size: size)) { r, g, b in
            abs(Int(r) - Int(theme.r)) <= 3 && abs(Int(g) - Int(theme.g)) <= 3 && abs(Int(b) - Int(theme.b)) <= 3
        }
        #else
        let pixels = try DrawnPixels.draw(view)
        let fill = pixels.count(in: CGRect(origin: .zero, size: pixels.size), where: DrawnPixels.matches(theme, tolerance: 3))
        #endif
        return (seen, fill)
    }

    @MainActor func testTheDefaultIsTheThemeFill() async throws {
        let (seen, fill) = try await draw { seen in
            KozmosManoeuvreCard(type: .right, instruction: "Turn right", isExpanded: true, onToggle: {}) { Probe(seen: seen) }
        }
        XCTAssertTrue(seen.themed, "the default card does not hand its itinerary the guidance colour")
        XCTAssertEqual(seen.surface, .solid)
        XCTAssertGreaterThan(fill, 5000, "the default card is not theme-filled")
    }

    /// A 0.5.0 call that passed glass gets glass: the background appearance,
    /// with no theme fill and no guidance colour.
    @MainActor func testAReleasedCallThatPassesGlassGetsGlass() async throws {
        let (seen, fill) = try await draw { seen in
            KozmosManoeuvreCard(type: .right, instruction: "Turn right", detail: "40 m", isExpanded: true, onToggle: {},
                                surface: .glass) { Probe(seen: seen) }
        }
        XCTAssertFalse(seen.themed, "the glass card hands its itinerary the theme's guidance colour")
        XCTAssertEqual(seen.surface, .glass, "the itinerary is not told it is on glass")
        XCTAssertEqual(fill, 0, "the glass card is theme-filled")
    }

    /// Solid named is the solid surface too, not the theme fill.
    @MainActor func testAnExplicitSolidSurfaceIsTheBackgroundAppearance() async throws {
        let (seen, fill) = try await draw { seen in
            KozmosManoeuvreCard(type: .right, instruction: "Turn right", isExpanded: true, onToggle: {},
                                surface: .solid) { Probe(seen: seen) }
        }
        XCTAssertFalse(seen.themed)
        XCTAssertEqual(seen.surface, .solid)
        XCTAssertEqual(fill, 0, "the solid card is theme-filled")
    }

    /// An appearance named wins over a surface named.
    @MainActor func testAnExplicitAppearanceWins() async throws {
        let theme = try await draw { seen in
            KozmosManoeuvreCard(type: .right, instruction: "Turn right", isExpanded: true, onToggle: {},
                                surface: .glass, appearance: .theme) { Probe(seen: seen) }
        }
        XCTAssertTrue(theme.seen.themed, "theme named with glass is not the theme fill")
        XCTAssertGreaterThan(theme.themeFill, 5000)

        let background = try await draw { seen in
            KozmosManoeuvreCard(type: .right, instruction: "Turn right", isExpanded: true, onToggle: {},
                                appearance: .background) { Probe(seen: seen) }
        }
        XCTAssertFalse(background.seen.themed)
        XCTAssertEqual(background.seen.surface, .solid, "background named alone is not the solid surface")
        XCTAssertEqual(background.themeFill, 0)
    }
}
