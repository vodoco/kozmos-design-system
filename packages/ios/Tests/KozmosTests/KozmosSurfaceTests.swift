import XCTest
import SwiftUI
@testable import Kozmos

/// The surface styles, measured: solid is the background colour whole; glass
/// is translucent over what is behind it, and solid when transparency is
/// reduced.
final class KozmosSurfaceTests: XCTestCase {
    func testTheGlassRoleReadsTheToken() {
        let glass = KozmosEffects.semanticsEffectGlass
        XCTAssertEqual(glass.opacity, 0.7, accuracy: 0.001)
        XCTAssertEqual(glass.blur, 20)
        XCTAssertEqual(glass.saturation, 1.8, accuracy: 0.001)
        XCTAssertEqual(glass.borderOpacity, 0.2, accuracy: 0.001)
    }

    #if os(iOS)
    @MainActor private func render(_ style: KozmosSurfaceStyle, reduceTransparency: Bool = false) async throws -> RenderedPixels {
        let view = ZStack {
            Color.red
            Color.clear
                .frame(width: 120, height: 60)
                .modifier(KozmosSurfaceModifier(shape: RoundedRectangle(cornerRadius: 12), style: style, reduceTransparency: reduceTransparency))
        }
        return try await RenderedPixels.render(view, size: CGSize(width: 200, height: 120))
    }

    /// The default: the background colour, whole, whatever is behind it.
    @MainActor func testSolidIsTheBackgroundColourWhole() async throws {
        let centre = try await render(.solid).color(at: CGPoint(x: 100, y: 60))
        XCTAssertGreaterThan(centre.g, 250, "solid lets the red through: \(centre)")
        XCTAssertGreaterThan(centre.b, 250, "solid lets the red through: \(centre)")
    }

    /// Over pure red, glass's middle is neither red nor white: the tint at
    /// the token's opacity over what shows through.
    @MainActor func testGlassIsTranslucentOverWhatIsBehindIt() async throws {
        let pixels = try await render(.glass)
        let centre = pixels.color(at: CGPoint(x: 100, y: 60))
        XCTAssertGreaterThan(centre.r, 200, "the red behind glass does not show through: \(centre)")
        XCTAssertGreaterThan(centre.g, 100, "glass is not tinted at all: \(centre)")
        XCTAssertLessThan(centre.g, 250, "glass is opaque: \(centre)")
        // The system's red is (255, 59, 48).
        let outside = pixels.color(at: CGPoint(x: 10, y: 10))
        XCTAssertLessThan(outside.g, 80, "the backdrop is not red: \(outside)")
        XCTAssertLessThan(outside.b, 80, "the backdrop is not red: \(outside)")
    }

    /// With Reduce Transparency, glass is solid.
    @MainActor func testReducedTransparencyMakesGlassSolid() async throws {
        let centre = try await render(.glass, reduceTransparency: true).color(at: CGPoint(x: 100, y: 60))
        XCTAssertGreaterThan(centre.g, 250, "glass still lets the red through: \(centre)")
        XCTAssertGreaterThan(centre.b, 250, "glass still lets the red through: \(centre)")
    }
    #endif
}
