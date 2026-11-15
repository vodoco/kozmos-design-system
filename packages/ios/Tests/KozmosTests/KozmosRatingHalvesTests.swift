import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 181: a read-only star rating shows a score to the nearest half —
/// the doubled value rounded half up — draws the half as the filled star
/// masked to its leading half over the empty star, and VoiceOver hears the
/// rounded value. The drawing is read back from what SwiftUI paints, without
/// a window, so these run in `swift test` on a Mac too.
final class KozmosRatingHalvesTests: XCTestCase {
    func testAScoreRoundsToTheNearestHalfUpOnItsDouble() {
        XCTAssertEqual(KozmosRating.roundedToHalf(4.3), 4.5)
        XCTAssertEqual(KozmosRating.roundedToHalf(4.2), 4)
        XCTAssertEqual(KozmosRating.roundedToHalf(4.25), 4.5)
        XCTAssertEqual(KozmosRating.roundedToHalf(2.75), 3)
        XCTAssertEqual(KozmosRating.roundedToHalf(0.4), 0.5)
    }

    func testVoiceOverHearsTheRoundedScore() {
        XCTAssertEqual(KozmosRating(rating: 4.3).accessibilityText, "Rated 4.5 out of 5 stars")
        XCTAssertEqual(KozmosRating(rating: 4.2).accessibilityText, "Rated 4 out of 5 stars")
        XCTAssertEqual(KozmosRating(rating: 0.2).accessibilityText, "Not rated")
        var given: Double?
        let custom = KozmosRating(rating: 4.3) { value, max in
            given = value
            return "\(value) / \(max)"
        }
        XCTAssertEqual(custom.accessibilityText, "4.5 / 5")
        XCTAssertEqual(given, 4.5)
    }

    func testTheHalfIsOnlyTheScoresStar() {
        let rating = KozmosRating(rating: 4.3)
        XCTAssertEqual((1...5).map(rating.isHalf), [false, false, false, false, true])
        XCTAssertEqual((1...5).map(KozmosRating(rating: 4.2).isHalf), [false, false, false, false, false])
        // The control stays whole, and reads as it did.
        let control = KozmosRating(value: .constant(4), readOnly: true)
        XCTAssertEqual((1...5).map(control.isHalf), [false, false, false, false, false])
        XCTAssertEqual(control.accessibilityText, "Rated 4 out of 5 stars")
    }

    /// Yellow pixels left of the star's middle and right of it.
    @MainActor private func yellowByHalf(_ direction: LayoutDirection) throws -> (left: Int, right: Int, grey: Int) {
        let yellow = DrawnPixels.matches(try DrawnPixels.resolved(KozmosColors.semanticsDataYellow, in: .light), tolerance: 24)
        let grey = DrawnPixels.matches(try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground400, in: .light), tolerance: 24)
        let drawn = try DrawnPixels.draw(
            KozmosRating(rating: 0.5, max: 1)
                .environment(\.layoutDirection, direction)
                .environment(\.colorScheme, .light),
            scale: 2)
        let size = drawn.size
        // A point either side of the middle is left out: the mask's own edge.
        let left = CGRect(x: 0, y: 0, width: size.width / 2 - 1, height: size.height)
        let right = CGRect(x: size.width / 2 + 1, y: 0, width: size.width / 2 - 1, height: size.height)
        let empty = direction == .leftToRight ? right : left
        return (drawn.count(in: left, where: yellow), drawn.count(in: right, where: yellow), drawn.count(in: empty, where: grey))
    }

    @MainActor func testTheHalfIsTheLeftHalfLeftToRight() throws {
        let (left, right, grey) = try yellowByHalf(.leftToRight)
        XCTAssertGreaterThan(left, 50, "the left half is filled")
        XCTAssertEqual(right, 0, "and the right half is not")
        XCTAssertGreaterThan(grey, 10, "where the empty star's outline shows")
    }

    @MainActor func testTheHalfIsTheRightHalfRightToLeft() throws {
        let (left, right, grey) = try yellowByHalf(.rightToLeft)
        XCTAssertGreaterThan(right, 50, "the right half is filled")
        XCTAssertEqual(left, 0, "and the left half is not")
        XCTAssertGreaterThan(grey, 10, "where the empty star's outline shows")
    }
}
