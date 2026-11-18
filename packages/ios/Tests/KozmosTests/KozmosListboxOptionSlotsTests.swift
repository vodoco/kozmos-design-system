import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-260: a product moves the active option (a search field driving the
/// list with a hardware keyboard), drawn with the hover fill as React's
/// active row; an option shows words at its end. Decision 215 (GAP-282): an
/// option's leading Avatar, its image or its initials, decoration beside the
/// label that names it.
final class KozmosListboxOptionSlotsTests: XCTestCase {
    private let options = [
        KozmosListboxOption(value: "name", label: "Name", trailing: "Text"),
        KozmosListboxOption(value: "floor", label: "Floor", disabled: true, trailing: "Number"),
        KozmosListboxOption(value: "open", label: "Opening hours"),
    ]

    func testAnOptionCarriesItsMediaAndTrailingWords() {
        let logo = URL(string: "https://example.com/acme.png")!
        let option = KozmosListboxOption(value: "acme", label: "Acme", media: KozmosOptionMedia(imageURL: logo), trailing: "Live")
        XCTAssertEqual(option.media, KozmosOptionMedia(imageURL: logo, initials: nil))
        XCTAssertEqual(option.trailing, "Live")
        XCTAssertNil(KozmosListboxOption(value: "plain", label: "Plain").media)
    }

    func testInitialsAreTheLabelsFirstLetters() {
        XCTAssertEqual(KozmosOptionMedia.initials(of: "Pointr Cloud"), "PC")
        XCTAssertEqual(KozmosOptionMedia.initials(of: "  acme "), "A")
        XCTAssertEqual(KozmosOptionMedia.initials(of: "Zürich Flughafen Ost"), "ZF")
    }

    /// What VoiceOver hears of a row: the label names it, with no initials,
    /// and the trailing words are its hint. Read from the functions the row's
    /// modifiers call: the rows sit in a scroll view the hosted accessibility
    /// tree does not reach (KozmosMixedPickerTests says the same).
    func testTheAvatarIsDecorationAndTheTrailingWordsAreTheHint() {
        let pointr = KozmosListboxOption(value: "pointr", label: "Pointr Cloud", media: KozmosOptionMedia(), trailing: "3 sites")
        XCTAssertEqual(KozmosListbox.accessibilityLabel(for: pointr), "Pointr Cloud")
        XCTAssertEqual(KozmosListbox.accessibilityHint(for: pointr), "3 sites")
        let described = KozmosListboxOption(value: "a", label: "Acme", description: "Airport", media: KozmosOptionMedia(initials: "AC"))
        XCTAssertEqual(KozmosListbox.accessibilityLabel(for: described), "Acme, Airport")
        XCTAssertEqual(KozmosListbox.accessibilityHint(for: described), "")
    }

    func testTheActiveRowTakesTheHoverFillAndAChosenRowKeepsItsOwn() {
        let list = KozmosListbox(options: options, selectedValues: .constant(["open"]), activeValue: "name")
        XCTAssertEqual(list.rowFill(for: options[0]), .active)
        XCTAssertEqual(list.rowFill(for: options[2]), .chosen)
        XCTAssertEqual(KozmosListbox(options: options, selectedValues: .constant(["name"]), activeValue: "name").rowFill(for: options[0]), .chosen)
        // A disabled option is never active.
        XCTAssertEqual(KozmosListbox(options: options, activeValue: "floor").rowFill(for: options[1]), .none)
        XCTAssertEqual(KozmosListbox(options: options).rowFill(for: options[0]), .none)
    }
}
