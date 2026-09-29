import XCTest
import SwiftUI
@testable import Kozmos

#if os(iOS)
/// Review finding N4: a chip that can be chosen tells VoiceOver whether it is
/// chosen, as React's `aria-pressed` does. Selection used to change only the
/// colours. Read from the tree VoiceOver walks, and activated as its
/// double-tap activates it:
///
/// - an interactive chip is a button, selected while it is;
/// - its double-tap is its own action — a removable chip's double-tap
///   removed it, because its remove button had been folded into it;
/// - remove is a button of its own, named by the chip;
/// - a disabled chip is heard as dimmed, and nothing it offers runs;
/// - a tag with no action is text, never a button or a selection.
final class KozmosChipAccessibilityTests: HostedAccessibilityTestCase {
    /// A filter chip whose selection the parent holds, as a product holds it.
    private struct Filter: View {
        @State var on = false
        var disabled = false
        var ran: (String) -> Void = { _ in }
        var onRemove: (() -> Void)?

        var body: some View {
            KozmosChip(text: "Vegan", selected: on, disabled: disabled, onRemove: onRemove, action: {
                ran("Vegan")
                on.toggle()
            })
        }
    }

    @MainActor func testAnInteractiveChipIsAButtonThatSaysWhetherItIsSelected() async throws {
        let window = await host(VStack(spacing: 16) {
            KozmosChip(text: "Vegan", selected: true, action: {})
            KozmosChip(text: "Halal", selected: false, action: {})
            // A tag says what a place is; it is not a choice, so it is text
            // whatever its colours say.
            KozmosChip(text: "Step-free", selected: true)
        })
        defer { window.isHidden = true }

        let chosen = try element(named: "Vegan", in: window)
        XCTAssertTrue(chosen.accessibilityTraits.contains(.button), "an interactive chip is not a button")
        XCTAssertTrue(chosen.accessibilityTraits.contains(.selected), "a selected chip does not say it is selected")

        let open = try element(named: "Halal", in: window)
        XCTAssertTrue(open.accessibilityTraits.contains(.button))
        XCTAssertFalse(open.accessibilityTraits.contains(.selected), "an unselected chip says it is selected")

        let tag = try element(named: "Step-free", in: window)
        XCTAssertFalse(tag.accessibilityTraits.contains(.button), "a tag with no action is announced as a button")
        XCTAssertFalse(tag.accessibilityTraits.contains(.selected), "a tag with no action is announced as selected")
        XCTAssertFalse(tag.accessibilityActivate(), "a tag with no action can be activated")
    }

    /// The double-tap runs the chip's action, and what VoiceOver hears
    /// follows the state the parent keeps.
    @MainActor func testTheSelectionFollowsTheParentsState() async throws {
        var ran: [String] = []
        let window = await host(Filter(ran: { ran.append($0) }))
        defer { window.isHidden = true }

        XCTAssertFalse(try element(named: "Vegan", in: window).accessibilityTraits.contains(.selected))
        XCTAssertTrue(try element(named: "Vegan", in: window).accessibilityActivate(), "the double-tap does nothing")
        await settle()
        XCTAssertEqual(ran, ["Vegan"])
        XCTAssertTrue(try element(named: "Vegan", in: window).accessibilityTraits.contains(.selected),
                      "the chip the parent selected is not heard as selected")

        XCTAssertTrue(try element(named: "Vegan", in: window).accessibilityActivate())
        await settle()
        XCTAssertEqual(ran, ["Vegan", "Vegan"])
        XCTAssertFalse(try element(named: "Vegan", in: window).accessibilityTraits.contains(.selected),
                       "the chip the parent cleared is still heard as selected")
    }

    /// A removable chip is two controls, as on the web: the chip, whose
    /// double-tap is its action, and remove, a button named by the chip.
    @MainActor func testRemoveIsItsOwnButtonAndTheChipsDoubleTapIsTheChips() async throws {
        var ran: [String] = []
        let window = await host(VStack(spacing: 16) {
            KozmosChip(text: "Coffee", selected: true, onRemove: { ran.append("remove Coffee") },
                       action: { ran.append("Coffee") })
            // A filter the visitor can only take away: the tag is text and
            // remove is the one control.
            KozmosChip(text: "Open now", onRemove: { ran.append("remove Open now") })
        })
        defer { window.isHidden = true }

        let chip = try element(named: "Coffee", in: window)
        XCTAssertTrue(chip.accessibilityTraits.contains(.selected))
        XCTAssertTrue(chip.accessibilityActivate(), "the chip's double-tap does nothing")
        XCTAssertEqual(ran, ["Coffee"], "the chip's double-tap ran something other than its action")

        let remove = try element(named: "Remove Coffee", in: window)
        XCTAssertTrue(remove.accessibilityTraits.contains(.button), "remove is not a button of its own")
        XCTAssertFalse(remove.accessibilityTraits.contains(.selected), "remove took the chip's selection")
        XCTAssertTrue(remove.accessibilityActivate())
        XCTAssertEqual(ran, ["Coffee", "remove Coffee"])

        let tag = try element(named: "Open now", in: window)
        XCTAssertFalse(tag.accessibilityTraits.contains(.button), "a tag with only remove is announced as a button")
        XCTAssertFalse(tag.accessibilityActivate(), "a tag with only remove can be activated")
        XCTAssertTrue(try element(named: "Remove Open now", in: window).accessibilityActivate())
        XCTAssertEqual(ran, ["Coffee", "remove Coffee", "remove Open now"])
    }

    /// The docs' example, as Chip.mdx writes it (DocSnippets), with the
    /// parent's state: the chosen category is heard as selected, and "Open
    /// now" is taken away by its own button.
    private struct Filters: View {
        @State var category = "all"
        @State var openNow = true

        var body: some View {
            CategoryFilters(category: $category, openNow: $openNow)
        }
    }

    @MainActor func testTheDocsExampleSaysWhichCategoryIsSelected() async throws {
        let window = await host(Filters())
        defer { window.isHidden = true }

        XCTAssertTrue(try element(named: "All", in: window).accessibilityTraits.contains(.selected))
        XCTAssertFalse(try element(named: "Coffee", in: window).accessibilityTraits.contains(.selected))
        XCTAssertTrue(try element(named: "Coffee", in: window).accessibilityActivate())
        await settle()
        XCTAssertTrue(try element(named: "Coffee", in: window).accessibilityTraits.contains(.selected))
        XCTAssertFalse(try element(named: "All", in: window).accessibilityTraits.contains(.selected))

        XCTAssertFalse(try element(named: "Open now", in: window).accessibilityTraits.contains(.button))
        XCTAssertTrue(try element(named: "Remove Open now", in: window).accessibilityActivate())
        await settle()
        XCTAssertFalse(labels(in: window).contains("Open now"), "removing the filter left it: \(labels(in: window))")
    }

    /// Disabled is heard, not only drawn at half strength: the chip and its
    /// remove are dimmed to VoiceOver, keep their selection, and run nothing.
    @MainActor func testADisabledChipIsHeardAsDimmedAndRunsNothing() async throws {
        var ran: [String] = []
        let window = await host(VStack(spacing: 16) {
            KozmosChip(text: "Vegan", selected: true, disabled: true, onRemove: { ran.append("remove") },
                       action: { ran.append("Vegan") })
            KozmosChip(text: "Halal", disabled: true, action: { ran.append("Halal") })
        })
        defer { window.isHidden = true }

        let chosen = try element(named: "Vegan", in: window)
        XCTAssertTrue(chosen.accessibilityTraits.contains(.notEnabled), "a disabled chip is not heard as dimmed")
        XCTAssertTrue(chosen.accessibilityTraits.contains(.selected), "a disabled chip lost its selection")
        _ = chosen.accessibilityActivate()

        let remove = try element(named: "Remove Vegan", in: window)
        XCTAssertTrue(remove.accessibilityTraits.contains(.notEnabled), "a disabled chip's remove is not heard as dimmed")
        _ = remove.accessibilityActivate()

        let open = try element(named: "Halal", in: window)
        XCTAssertTrue(open.accessibilityTraits.contains(.notEnabled))
        XCTAssertFalse(open.accessibilityTraits.contains(.selected))
        _ = open.accessibilityActivate()

        await settle()
        XCTAssertEqual(ran, [], "a disabled chip ran something")
    }
}
#endif
