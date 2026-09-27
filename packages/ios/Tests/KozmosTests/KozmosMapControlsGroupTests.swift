import XCTest
import SwiftUI
@testable import Kozmos
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// The map's control cluster, decided without rendering.
///
/// These mirror MapControlsGroup.test.tsx. Row 67 gave every control a name the
/// product can translate. Row 77 gave the location control a mark and a
/// pressed state for each mode, and put a step-free toggle in its place while a
/// route is shown (Olcay, 2026-09-27).
final class KozmosMapControlsGroupTests: XCTestCase {
    typealias Group = KozmosMapControlsGroup

    // MARK: - Row 67: the names

    /// Hard-coded English until row 67: a German device announced "Zoom in"
    /// whatever else the product had translated.
    func testEveryControlTakesTheProductsName() {
        let group = Group(
            onZoomIn: {},
            onZoomOut: {},
            onCompassReset: {},
            onMyLocation: {},
            zoomInLabel: "Vergrößern",
            zoomOutLabel: "Verkleinern",
            compassResetLabel: "Nach Norden ausrichten",
            locationLabel: "Mein Standort"
        )

        XCTAssertEqual(group.zoomInLabel, "Vergrößern")
        XCTAssertEqual(group.zoomOutLabel, "Verkleinern")
        XCTAssertEqual(group.compassResetLabel, "Nach Norden ausrichten")
        XCTAssertEqual(group.modeControl?.label, "Mein Standort")
    }

    /// A design system has no locale of its own, so the defaults stay English —
    /// and stay the words they were, so a product that passes none hears
    /// nothing new.
    func testTheNamesDefaultToTheEnglishTheyWere() {
        let group = Group(onMyLocation: {})

        XCTAssertEqual(group.zoomInLabel, "Zoom in")
        XCTAssertEqual(group.zoomOutLabel, "Zoom out")
        XCTAssertEqual(group.compassResetLabel, "Reset bearing")
        XCTAssertEqual(group.modeControl?.label, "Locate me")
    }

    // MARK: - Row 77: the location control

    /// One mark per mode, in the platform's own symbols — the convention
    /// `KozmosIcon` keeps — standing in for the revamp's artwork: the outline
    /// arrow at rest, the filled arrow while the map follows, the arrow over a
    /// line while the map turns with the visitor, and the arrow struck through
    /// when there is no position to show.
    func testTheLocationControlDrawsAMarkForEachMode() {
        let expected: [KozmosUserLocationState: String] = [
            .off: "location",
            .locating: "location",
            .stale: "location",
            .following: "location.fill",
            .heading: "location.north.line.fill",
            .permissionDenied: "location.slash",
            .unavailable: "location.slash",
        ]
        XCTAssertEqual(Set(expected.keys), Set(KozmosUserLocationState.allCases))

        for (state, symbol) in expected {
            let control = Group(onMyLocation: {}, locationState: state).modeControl
            XCTAssertEqual(control?.kind, .location, "\(state)")
            XCTAssertEqual(control?.icon, Image(systemName: symbol), "\(state)")
        }
    }

    /// A symbol name the system does not have draws nothing, and says nothing
    /// about it.
    func testEveryMarkIsASymbolTheSystemHas() {
        for state in KozmosUserLocationState.allCases {
            let symbol = Group.locationSymbol(for: state)
            XCTAssertTrue(systemHasSymbol(symbol), "\(state) draws \(symbol), which does not exist")
        }
        XCTAssertTrue(systemHasSymbol(Group.stepFreeSymbol))
    }

    /// Pressed only while the map follows the visitor. It was pressed whatever
    /// the state until row 77, so a map that was not following at all drew a
    /// control that said it was.
    func testTheLocationControlIsOnOnlyWhileTheMapFollows() {
        for state in KozmosUserLocationState.allCases {
            let control = Group(onMyLocation: {}, locationState: state).modeControl
            XCTAssertEqual(control?.pressed, state == .following || state == .heading, "\(state)")
        }
        // Off unless told otherwise, as React's is.
        XCTAssertEqual(Group(onMyLocation: {}).modeControl?.pressed, false)
    }

    /// The button's spinner says "locating"; no other mode turns.
    func testOnlyLocatingSpins() {
        for state in KozmosUserLocationState.allCases {
            let control = Group(onMyLocation: {}, locationState: state).modeControl
            XCTAssertEqual(control?.isLoading, state == .locating, "\(state)")
        }
    }

    /// A product with its own artwork for a mode passes that mode alone; the
    /// others keep the group's marks.
    func testTheProductCanDrawItsOwnMarkForAMode() {
        let own = Image(systemName: "safari")

        let heading = Group(onMyLocation: {}, locationState: .heading, locationIcons: [.heading: own])
        XCTAssertEqual(heading.modeControl?.icon, own)

        let following = Group(onMyLocation: {}, locationState: .following, locationIcons: [.heading: own])
        XCTAssertEqual(following.modeControl?.icon, Image(systemName: "location.fill"))
    }

    /// Pressing it still asks the product to locate, and says so in the name
    /// and state the product gave it.
    func testTheLocationControlCarriesItsNameAndStateAndCallsBack() {
        var located = 0
        let control = Group(
            onMyLocation: { located += 1 },
            locationState: .following,
            locationLabel: "Focus",
            locationStateLabel: "On"
        ).modeControl

        XCTAssertEqual(control?.label, "Focus")
        XCTAssertEqual(control?.stateLabel, "On")
        control?.action()
        XCTAssertEqual(located, 1)
    }

    /// How the SDK's control reads: icon-only over the map, "Focus / On" for a
    /// moment when the mode changes. Both are off unless asked for, so a
    /// product that relies on a fixed presentation sees nothing move.
    func testTheLocationControlRevealsAndStacksOnlyWhenAsked() {
        let sdk = Group(onMyLocation: {}, locationRevealOnChange: true, locationLabelPlacement: .stacked).modeControl
        XCTAssertEqual(sdk?.revealOnChange, true)
        XCTAssertEqual(sdk?.labelPlacement, .stacked)

        let plain = Group(onMyLocation: {}).modeControl
        XCTAssertEqual(plain?.revealOnChange, false)
        XCTAssertEqual(plain?.labelPlacement, .inline)
        XCTAssertEqual(plain?.presentation, .iconOnly)
    }

    // MARK: - Step-free, in the location control's place during a route

    /// The same button, in the same place, during wayfinding. Passing the
    /// handler draws it; the location control is not drawn beside it.
    func testStepFreeTakesTheLocationControlsPlaceDuringARoute() {
        var asked: [Bool] = []
        var located = 0
        let control = Group(
            onMyLocation: { located += 1 },
            locationLabel: "Focus",
            onStepFreeChange: { asked.append($0) },
            stepFree: false
        ).modeControl

        XCTAssertEqual(control?.kind, .stepFree)
        XCTAssertEqual(control?.label, "Step-free")
        XCTAssertEqual(control?.stateLabel, "Off")
        XCTAssertEqual(control?.pressed, false)
        XCTAssertEqual(control?.icon, Image(systemName: "figure.roll"))

        // Called with the setting the visitor asked for, and nothing else.
        control?.action()
        XCTAssertEqual(asked, [true])
        XCTAssertEqual(located, 0)
    }

    func testStepFreeSaysItIsOnInTheProductsLanguage() {
        var asked: [Bool] = []
        let control = Group(
            onStepFreeChange: { asked.append($0) },
            stepFree: true,
            stepFreeLabel: "Stufenlos",
            stepFreeOnLabel: "Ein",
            stepFreeOffLabel: "Aus"
        ).modeControl

        XCTAssertEqual(control?.label, "Stufenlos")
        XCTAssertEqual(control?.stateLabel, "Ein")
        XCTAssertEqual(control?.pressed, true)

        control?.action()
        XCTAssertEqual(asked, [false])
    }

    /// It follows the location control's three presentation settings, so the
    /// corner keeps its character between exploring and wayfinding.
    func testStepFreeReadsAsTheLocationControlIsSetTo() {
        let control = Group(
            locationPresentation: .labelled,
            locationRevealOnChange: true,
            locationLabelPlacement: .stacked,
            onStepFreeChange: { _ in }
        ).modeControl

        XCTAssertEqual(control?.presentation, .labelled)
        XCTAssertEqual(control?.revealOnChange, true)
        XCTAssertEqual(control?.labelPlacement, .stacked)
        // A toggle's wait is its own; it never spins.
        XCTAssertEqual(control?.isLoading, false)
    }

    func testTheProductCanDrawItsOwnStepFreeMark() {
        let own = Image(systemName: "figure.walk")
        XCTAssertEqual(Group(onStepFreeChange: { _ in }, stepFreeIcon: own).modeControl?.icon, own)
    }

    /// Leaving the handler out brings the location control back; with neither
    /// handler there is nothing to draw.
    func testWithoutItsHandlerTheControlIsNotDrawn() {
        XCTAssertNil(Group().modeControl)
        XCTAssertEqual(Group(onMyLocation: {}).modeControl?.kind, .location)
    }

    private func systemHasSymbol(_ name: String) -> Bool {
        #if canImport(UIKit)
        return UIImage(systemName: name) != nil
        #elseif canImport(AppKit)
        return NSImage(systemSymbolName: name, accessibilityDescription: nil) != nil
        #else
        return true
        #endif
    }
}
