import XCTest
import SwiftUI
@testable import Kozmos

#if os(iOS)
/// A selected pin tells VoiceOver it is selected whether or not it can be
/// pressed, as React's `aria-current` and Compose's `selected` do: a pin the
/// product draws with no `onSelect`, or a disabled one, still marks the
/// selected place. Read from the tree VoiceOver walks.
final class KozmosLocationPinAccessibilityTests: HostedAccessibilityTestCase {
    @MainActor func testASelectedPinSaysSoWhetherOrNotItCanBePressed() async throws {
        let cases: [(name: String, pin: KozmosLocationPin, selected: Bool, pressable: Bool)] = [
            ("selected, no onSelect", KozmosLocationPin(label: "Burger King", number: 2, selected: true), true, false),
            ("selected, disabled", KozmosLocationPin(label: "Burger King", number: 2, selected: true, isDisabled: true, onSelect: {}), true, false),
            ("selected, with onSelect", KozmosLocationPin(label: "Burger King", number: 2, selected: true, onSelect: {}), true, true),
            ("at rest, with onSelect", KozmosLocationPin(label: "Burger King", number: 2, onSelect: {}), false, true),
            ("at rest, no onSelect", KozmosLocationPin(label: "Burger King", number: 2), false, false),
        ]
        for pin in cases {
            let window = await host(pin.pin, size: CGSize(width: 160, height: 160))
            defer { window.isHidden = true }
            // The name is the label and the number, as it has always been.
            let element = try element(named: "Burger King, 2", in: window)
            let traits = element.accessibilityTraits
            XCTAssertEqual(traits.contains(.selected), pin.selected,
                           "\(pin.name): the pin \(pin.selected ? "does not say" : "says") it is selected (traits \(traits.rawValue))")
            // A pin that can be pressed is a button. Whether one that cannot is
            // is not asserted here: SwiftUI makes any element with an action a
            // button, and the pin always carries its action, so the three that
            // cannot be pressed read as buttons too (traits 1, measured on
            // 2026-09-29; raised separately).
            if pin.pressable {
                XCTAssertTrue(traits.contains(.button), "\(pin.name): the pin is not a button (traits \(traits.rawValue))")
            }
        }
    }
}
#endif
