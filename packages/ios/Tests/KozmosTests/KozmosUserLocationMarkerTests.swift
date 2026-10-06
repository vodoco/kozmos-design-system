import XCTest
import SwiftUI
@testable import Kozmos

/// The marker's name, for a visitor who cannot see it.
///
/// It had none until row 67: VoiceOver passed over the visitor's own position
/// on the map. React called it "User location" in English whatever the
/// device's language; both platforms now take the product's word for it.
final class KozmosUserLocationMarkerTests: XCTestCase {
    func testTheProductNamesTheMarker() {
        XCTAssertEqual(KozmosUserLocationMarker(label: "Ihr Standort").label, "Ihr Standort")
    }

    func testTheNameDefaultsToEnglish() {
        XCTAssertEqual(KozmosUserLocationMarker().label, "User location")
        XCTAssertEqual(KozmosUserLocationMarker(heading: 90, showHeading: false).label, "User location")
    }

    /// The full marker's white ring sits inside the 18 dot, as Compose's
    /// border, React's and this platform's compact dot draw it: a stroke
    /// centred on the edge drew it 21 across around a 15 blue (2026-10-05,
    /// the marker drawn as native draws it, where the two natives differed).
    @MainActor func testTheRingSitsInsideTheEighteenDot() throws {
        let view = KozmosUserLocationMarker(heading: 0, showHeading: false)
            .frame(width: 64, height: 64)
            .background(Color.black)
            .environment(\.colorScheme, .dark)
        let pixels = try DrawnPixels.draw(view)
        let ring = try XCTUnwrap(
            pixels.boundingBox(where: { r, g, b, a in a > 240 && r > 235 && g > 235 && b > 235 }),
            "no white ring drawn")
        XCTAssertEqual(ring.width, 18, accuracy: 1, "the ring's outer width")
        XCTAssertEqual(ring.height, 18, accuracy: 1, "the ring's outer height")
        let blue = try DrawnPixels.resolved(KozmosColors.semanticsMapMarkerDot, in: .dark)
        let dot = try XCTUnwrap(pixels.boundingBox(where: DrawnPixels.matches(blue)), "no blue dot drawn")
        XCTAssertEqual(dot.width, 12, accuracy: 1.5, "the blue inside the 3 ring")
    }

    /// Under Reduce Motion the pulse holds still at 48 and 30 %, as React's
    /// does (`motion-reduce:animate-none`) and as Figma draws it. Until
    /// 2026-10-06 it ran on whatever the setting, while the docs said it
    /// stopped; Spinner, Skeleton and Progress already stopped.
    func testThePulseHoldsStillUnderReduceMotion() {
        let start = Date(timeIntervalSinceReferenceDate: 0)
        for offset in stride(from: 0.0, to: 3.0, by: 0.25) {
            let pulse = KozmosUserLocationMarker.pulse(at: start.addingTimeInterval(offset), reduceMotion: true)
            XCTAssertEqual(pulse.scale, 1, accuracy: 0.0001, "still at 48, \(offset)s in")
            XCTAssertEqual(pulse.opacity, 0.3, accuracy: 0.0001, "still at 30 %, \(offset)s in")
        }
        let early = KozmosUserLocationMarker.pulse(at: start, reduceMotion: false)
        let later = KozmosUserLocationMarker.pulse(at: start.addingTimeInterval(0.75), reduceMotion: false)
        XCTAssertNotEqual(early.scale, later.scale, "the pulse moves when motion is allowed")
    }
}
