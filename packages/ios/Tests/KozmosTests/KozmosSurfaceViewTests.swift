import XCTest
import SwiftUI
@testable import Kozmos

/// GAP-207, decision 70's ninth item: `KozmosSurface` is a view, placed as
/// React's `<Surface variant>` is, `KozmosSurface(variant:) { … }`, beside
/// the `kozmosSurface(_:style:)` modifier: the same variants, the same glass,
/// solid when transparency is reduced, and it says its variant to what it
/// holds (decision 48).
final class KozmosSurfaceViewTests: XCTestCase {
    func testItIsSolidByDefaultOnTheContainerRadius() {
        let surface = KozmosSurface { Text("Over the map") }
        XCTAssertEqual(surface.variant, .solid)
        XCTAssertEqual(surface.shape.cornerSize.width, KozmosDimensions.semanticsRadiusContainer)
        XCTAssertEqual(KozmosSurface(variant: .glass) { EmptyView() }.variant, .glass)
        _ = KozmosSurface(variant: .glass, shape: Capsule()) { Text("Pill") }
    }

    #if os(iOS)
    @MainActor private func render(_ variant: KozmosSurfaceStyle, reduceTransparency: Bool = false) async throws -> RenderedPixels {
        let view = ZStack {
            Color.red
            KozmosSurface(variant: variant, reduceTransparency: reduceTransparency) {
                Color.clear.frame(width: 120, height: 60)
            }
        }
        return try await RenderedPixels.render(view, size: CGSize(width: 200, height: 120))
    }

    /// Solid: the background colour whole, whatever is behind it.
    @MainActor func testSolidIsTheBackgroundColourWhole() async throws {
        let pixels = try await render(.solid)
        let centre = pixels.color(at: CGPoint(x: 100, y: 60))
        XCTAssertGreaterThan(centre.g, 250, "solid lets the red through: \(centre)")
        XCTAssertGreaterThan(centre.b, 250, "solid lets the red through: \(centre)")
        // The container radius: the box's very corner is outside the shape.
        let corner = pixels.color(at: CGPoint(x: 41, y: 31))
        XCTAssertLessThan(corner.g, 80, "the corner is not rounded: \(corner)")
    }

    /// Glass: the tint at the token's opacity over what shows through.
    @MainActor func testGlassIsTranslucentOverWhatIsBehindIt() async throws {
        let centre = try await render(.glass).color(at: CGPoint(x: 100, y: 60))
        XCTAssertGreaterThan(centre.r, 200, "the red behind glass does not show through: \(centre)")
        XCTAssertGreaterThan(centre.g, 100, "glass is not tinted at all: \(centre)")
        XCTAssertLessThan(centre.g, 250, "glass is opaque: \(centre)")
    }

    /// With Reduce Transparency, glass is solid.
    @MainActor func testReducedTransparencyMakesGlassSolid() async throws {
        let centre = try await render(.glass, reduceTransparency: true).color(at: CGPoint(x: 100, y: 60))
        XCTAssertGreaterThan(centre.g, 250, "glass still lets the red through: \(centre)")
    }

    /// What it holds reads the surface it is on: muted text on glass takes
    /// the foreground colour (decision 48), as under the modifier.
    @MainActor func testItSaysItsVariantToWhatItHolds() async throws {
        final class Seen { var style: KozmosSurfaceStyle?? }
        struct Probe: View {
            let seen: Seen
            @Environment(\.kozmosSurfaceStyle) private var style
            var body: some View {
                seen.style = style
                return Color.clear.frame(width: 10, height: 10)
            }
        }
        let seen = Seen()
        _ = try await RenderedPixels.render(KozmosSurface(variant: .glass) { Probe(seen: seen) }, size: CGSize(width: 40, height: 40))
        XCTAssertEqual(seen.style, .some(.glass))
    }
    #endif
}
