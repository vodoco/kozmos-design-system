import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-168 (decision 209): a split button's menu takes full items, as
/// React's `menuItems`: an action with an icon, a separator, a disabled
/// action and custom content after them. The `(String, () -> Void)` items
/// still compile, each an action.
final class KozmosSplitButtonMenuItemsTests: XCTestCase {
    func testTheTupleItemsAreActions() {
        let button = KozmosSplitButton(label: "Publish", mainAction: {}, menuItems: [("Save draft", {})])
        XCTAssertEqual(button.items.count, 1)
        guard case let .action(words, icon, disabled, _) = button.items[0] else {
            return XCTFail("not an action")
        }
        XCTAssertEqual(words, "Save draft")
        XCTAssertNil(icon)
        XCTAssertFalse(disabled)
        XCTAssertNil(button.menuContent)
    }

    func testFullItemsAndCustomContentAreKept() {
        let button = KozmosSplitButton(
            label: "Publish", mainAction: {},
            items: [
                .action("Publish to staging", icon: Image(systemName: "arrow.down.circle"), action: {}),
                .separator,
                .action("Publish to production", disabled: true, action: {}),
            ]
        ) {
            Button("Publish tonight") {}
        }
        XCTAssertEqual(button.items.count, 3)
        if case .separator = button.items[1] {} else { XCTFail("the second item is not a separator") }
        if case let .action(_, _, disabled, _) = button.items[2] { XCTAssertTrue(disabled) } else { XCTFail() }
        XCTAssertNotNil(button.menuContent)
    }

    #if os(iOS)
    /// The rows as the menu draws them, hosted on their own: each action is
    /// named by its words alone (its icon is not read), the disabled one is
    /// dimmed to VoiceOver and does not run, and the custom content follows.
    @MainActor func testTheRowsAreNamedByTheirWordsAndTheDisabledOneIsDimmed() async throws {
        var ran: [String] = []
        let rows = KozmosSplitButtonMenuRows(
            items: [
                .action("Publish to staging", icon: Image(systemName: "arrow.down.circle"), action: { ran.append("staging") }),
                .separator,
                .action("Publish to production", disabled: true, action: { ran.append("production") }),
            ],
            content: AnyView(Button("Publish tonight") { ran.append("tonight") })
        )
        try await inspectAccessibility(VStack { rows }) { window in
            let names = accessibilityElements(window).compactMap(\.accessibilityLabel)
            XCTAssertEqual(names, ["Publish to staging", "Publish to production", "Publish tonight"])
            let production = try accessibilityElement(named: "Publish to production", in: window)
            XCTAssertTrue(production.accessibilityTraits.contains(.notEnabled))
            let staging = try accessibilityElement(named: "Publish to staging", in: window)
            XCTAssertFalse(staging.accessibilityTraits.contains(.notEnabled))
            _ = production.accessibilityActivate()
            XCTAssertTrue(staging.accessibilityActivate())
            XCTAssertEqual(ran, ["staging"])
        }
    }
    #endif
}
