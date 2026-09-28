import XCTest
import SwiftUI
@testable import Kozmos

/// The state → appearance decision for a map control, tested without rendering.
///
/// These mirror the React assertions in MapControlButton.test.tsx and the
/// browser check, so the platforms are held to the same ruling. Decision 40
/// (2026-09-28): the SDK's Tracking Indicator — a toggle's state is its tone,
/// grey off and navy on with the theme's blue mark, and no edge in any state.
/// Filled inverts the surface.
final class KozmosMapControlButtonAppearanceTests: XCTestCase {
    typealias Appearance = KozmosMapControlButtonAppearance

    /// Zoom, compass, the floor tile: not toggles, so neither off nor on. They
    /// keep the ink, as the SDK's own floor tile does.
    func testAControlThatIsNotAToggleKeepsTheInk() {
        for emphasis in [KozmosMapControlButtonEmphasis.tinted, .filled] {
            let appearance = Appearance(pressed: nil, emphasis: emphasis)
            XCTAssertEqual(appearance.surface, .chrome)
            XCTAssertEqual(appearance.icon, .ink)
            XCTAssertEqual(appearance.label, .ink)
        }
    }

    /// The SDK's "Focus⏎Off": the mark and both lines grey, whatever the
    /// emphasis, on the map's own surface.
    func testAToggleThatIsOffIsGrey() {
        let off = Appearance(pressed: false, emphasis: .tinted)
        XCTAssertEqual(off.surface, .chrome)
        XCTAssertEqual(off.icon, .muted)
        XCTAssertEqual(off.label, .muted)
        XCTAssertEqual(off, Appearance(pressed: false, emphasis: .filled))
    }

    /// The SDK's "Focus On": the mark the theme's blue and the words navy, on
    /// the map's own surface. The words used to stay ink under a primary edge.
    func testATintedToggleThatIsOnIsTheThemesBlueAndNavy() {
        let on = Appearance(pressed: true, emphasis: .tinted)
        XCTAssertEqual(on.surface, .chrome)
        XCTAssertEqual(on.icon, .theme)
        XCTAssertEqual(on.label, .themeText)
    }

    func testFilledPressedInvertsTheSurfaceAndEveryLineOnIt() {
        let appearance = Appearance(pressed: true, emphasis: .filled)
        XCTAssertEqual(appearance.surface, .filled)
        XCTAssertEqual(appearance.icon, .onFill)
        // A grey line would sit at about 1.9:1 on the theme fill.
        XCTAssertEqual(appearance.label, .onFill)
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

    /// Unset unless asked for: a control is not a toggle until it says so.
    func testAControlIsNotAToggleUnlessToldItsState() {
        let view = KozmosMapControlButton(label: "Zoom in", systemImage: "plus", action: {})
        XCTAssertEqual(view.appearance, Appearance(pressed: nil, emphasis: .tinted))
    }

    /// What it draws in its words. Two equal lines, the name over the state;
    /// the state alone when the name is not shown — the SDK's "No Location" —
    /// and the name when there is no state to show.
    func testItDrawsItsStateAloneWhenItsNameIsNotShown() {
        let both = KozmosMapControlButton(label: "Focus", systemImage: "location", stateLabel: "Off", action: {})
        XCTAssertEqual(both.drawnLines, ["Focus", "Off"])

        let alone = KozmosMapControlButton(
            label: "Focus", systemImage: "location.slash", stateLabel: "No Location", showsLabel: false, action: {}
        )
        XCTAssertEqual(alone.drawnLines, ["No Location"])

        let nameOnly = KozmosMapControlButton(label: "Focus", systemImage: "location", showsLabel: false, action: {})
        XCTAssertEqual(nameOnly.drawnLines, ["Focus"])
    }

    /// The name a screen reader hears: the name, the state, and what the words
    /// leave out, in that order, so it still begins with what is shown.
    func testItSaysWhatItsWordsLeaveOutAfterThem() {
        let heading = KozmosMapControlButton(
            label: "Focus", systemImage: "location.north.line.fill", stateLabel: "On",
            stateDescription: "map turns with you", pressed: true, action: {}
        )
        XCTAssertEqual(heading.accessibleLabel, "Focus, On, map turns with you")

        let alone = KozmosMapControlButton(
            label: "Focus", systemImage: "location.slash", stateLabel: "No Location", showsLabel: false, action: {}
        )
        XCTAssertEqual(alone.accessibleLabel, "Focus, No Location")
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
    /// while a control that cycles through modes changes only its state label.
    /// A description is not a change: heading reads "On" as following does, and
    /// only its mark and its spoken name differ.
    func testEitherHalfOfTheStateIsAChangeToRevealAndADescriptionIsNot() {
        let following = KozmosMapControlButton(label: "Focus", systemImage: "location.fill", stateLabel: "On", pressed: true, action: {})
        let stepFree = KozmosMapControlButton(label: "Focus", systemImage: "figure.roll", stateLabel: "Step-free", pressed: true, action: {})
        let off = KozmosMapControlButton(label: "Focus", systemImage: "location", stateLabel: "On", pressed: false, action: {})

        XCTAssertNotEqual(following.revealValue, stepFree.revealValue)
        XCTAssertNotEqual(following.revealValue, off.revealValue)

        // The mark is not part of it: a new drawing alone says nothing new.
        let redrawn = KozmosMapControlButton(label: "Focus", systemImage: "location", stateLabel: "On", pressed: true, action: {})
        XCTAssertEqual(following.revealValue, redrawn.revealValue)

        let heading = KozmosMapControlButton(
            label: "Focus", systemImage: "location.north.line.fill", stateLabel: "On",
            stateDescription: "map turns with you", pressed: true, action: {}
        )
        XCTAssertEqual(following.revealValue, heading.revealValue)
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
