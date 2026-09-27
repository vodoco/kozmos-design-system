import XCTest
import SwiftUI
@testable import Kozmos

/// The state → appearance decision for a map control, tested without rendering.
///
/// These mirror the React assertions in MapControlButton.test.tsx, so the two
/// platforms are held to the same ruling: tinted keeps the map's surface and
/// colours only the glyph and the edge; filled inverts the surface.
final class KozmosMapControlButtonAppearanceTests: XCTestCase {
    typealias Appearance = KozmosMapControlButtonAppearance

    func testARestingControlKeepsTheMapSurfaceWhateverItsEmphasis() {
        let tinted = Appearance(pressed: false, emphasis: .tinted)
        XCTAssertEqual(tinted.surface, .chrome)
        XCTAssertEqual(tinted.icon, .ink)
        XCTAssertEqual(tinted.edge, .subtle)
        XCTAssertEqual(tinted, Appearance(pressed: false, emphasis: .filled))
    }

    func testTintedPressedColoursOnlyTheGlyphAndTheEdge() {
        let appearance = Appearance(pressed: true, emphasis: .tinted)
        XCTAssertEqual(appearance.surface, .chrome)
        XCTAssertEqual(appearance.icon, .theme)
        XCTAssertEqual(appearance.edge, .theme)
        XCTAssertEqual(appearance.label, .ink)
        XCTAssertEqual(appearance.caption, .muted)
    }

    func testFilledPressedInvertsTheSurfaceAndEveryLineOnIt() {
        let appearance = Appearance(pressed: true, emphasis: .filled)
        XCTAssertEqual(appearance.surface, .filled)
        XCTAssertEqual(appearance.icon, .onFill)
        XCTAssertEqual(appearance.label, .onFill)
        // A muted caption would sit at about 1.9:1 on the theme fill.
        XCTAssertEqual(appearance.caption, .onFill)
    }

    func testTintedIsTheDefaultEmphasis() {
        let view = KozmosMapControlButton(
            label: "Focus",
            systemImage: "location",
            pressed: true,
            action: {}
        )
        XCTAssertEqual(view.appearance, Appearance(pressed: true, emphasis: .tinted))
    }

    /// While it reveals on change the control decides: icon-only at rest,
    /// labelled while it says its new state — whatever `presentation` says.
    func testWhileItRevealsOnChangeTheControlDecidesItsPresentation() {
        typealias Button = KozmosMapControlButton<Image>
        XCTAssertEqual(Button.resolvedPresentation(.labelled, revealOnChange: true, isRevealed: false), .iconOnly)
        XCTAssertEqual(Button.resolvedPresentation(.iconOnly, revealOnChange: true, isRevealed: true), .labelled)
        XCTAssertEqual(Button.resolvedPresentation(.labelled, revealOnChange: false, isRevealed: false), .labelled)
        XCTAssertEqual(Button.resolvedPresentation(.iconOnly, revealOnChange: false, isRevealed: true), .iconOnly)
    }

    /// Either half of the state can be what changed: a toggle flips `pressed`,
    /// while a control that cycles through modes changes only its state label —
    /// following and heading are both pressed.
    func testEitherHalfOfTheStateIsAChangeToReveal() {
        let following = KozmosMapControlButton(label: "Focus", systemImage: "location.fill", stateLabel: "On", pressed: true, action: {})
        let heading = KozmosMapControlButton(label: "Focus", systemImage: "location.north.line.fill", stateLabel: "Heading", pressed: true, action: {})
        let off = KozmosMapControlButton(label: "Focus", systemImage: "location", stateLabel: "On", pressed: false, action: {})

        XCTAssertNotEqual(following.revealValue, heading.revealValue)
        XCTAssertNotEqual(following.revealValue, off.revealValue)

        // The mark is not part of it: a new drawing alone says nothing new.
        let redrawn = KozmosMapControlButton(label: "Focus", systemImage: "location", stateLabel: "On", pressed: true, action: {})
        XCTAssertEqual(following.revealValue, redrawn.revealValue)
    }

    /// Both are off unless asked for, so no existing control starts moving.
    func testRevealingAndLoadingAreOffUnlessAskedFor() {
        let view = KozmosMapControlButton(label: "Focus", systemImage: "location", action: {})
        XCTAssertFalse(view.revealOnChange)
        XCTAssertEqual(view.revealDuration, 2.5)
        XCTAssertEqual(view.revealDelay, 0)
        XCTAssertFalse(view.isLoading)
    }
}
