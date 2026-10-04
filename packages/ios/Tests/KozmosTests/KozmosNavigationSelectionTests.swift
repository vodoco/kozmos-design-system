import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

final class KozmosNavigationSelectionTests: XCTestCase {
    func testPickerActionsRequireUnambiguousStableIDs() {
        let actions = [KozmosPickerAction(id: "dup", label: "First") {},
            KozmosPickerAction(id: "dup", label: "Second") {}, KozmosPickerAction(id: " ", label: "Blank") {},
            KozmosPickerAction(id: "valid", label: "Map") {}]
        XCTAssertEqual(validPickerActions(actions).map(\.id), ["valid"])
    }

    #if os(iOS)
    // Picker command traits and locked-state visibility are asserted by the real
    // XCUITest host. This local UIKit traversal cannot inspect those lazy/disabled
    // field children reliably; absence from that traversal is not proof of hiding.
    @MainActor func testMapChoiceIsNotAnExternalRouteButton() async throws {
        try await inspect(KozmosRouteLocationField(label: "From", location: nil, query: "", options: [],
            onQueryChange: { _ in }, onSelect: { _ in }, onClear: {}, onChooseMap: {})) { tree in
            XCTAssertTrue(tree.contains { $0.accessibilityLabel == "From" }, "Must inspect a real route field")
            XCTAssertFalse(tree.contains { $0.accessibilityLabel == "Select from the map" })
        }
    }

    @MainActor func testRoutingActionsHaveReal44PointTargets() async throws {
        let points = [KozmosRoutePoint(id: "a", value: "Lobby"), KozmosRoutePoint(id: "b", value: "Gallery")]
        let group = KozmosRoutingInputGroup(points: points, onPointChange: { _, _ in }, onSwap: {}, onAddPoint: {})
        try await inspect(group) { tree in
            for name in ["Swap route points", "Add route point"] {
                let button = try XCTUnwrap(tree.first { $0.accessibilityLabel == name })
                XCTAssertGreaterThanOrEqual(button.accessibilityFrame.width, 44, name)
                XCTAssertGreaterThanOrEqual(button.accessibilityFrame.height, 44, name)
            }
        }
        let row = KozmosWayfindingInputRow(originValue: .constant("Lobby"), destinationValue: .constant("Gallery"), onSwap: {})
        try await inspect(row) { tree in
            let button = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Swap origin and destination" })
            XCTAssertGreaterThanOrEqual(button.accessibilityFrame.width, 44)
            XCTAssertGreaterThanOrEqual(button.accessibilityFrame.height, 44)
        }
        try await inspect(KozmosWayfindingCard(onClose: {}) { Text("Route") }) { tree in
            let button = try XCTUnwrap(tree.first { $0.accessibilityTraits.contains(.button) })
            XCTAssertGreaterThanOrEqual(button.accessibilityFrame.width, 44)
            XCTAssertGreaterThanOrEqual(button.accessibilityFrame.height, 44)
        }
        let stops = [points[0], KozmosRoutePoint(id: "stop", value: "Cafe", label: "Stop"), points[1]]
        try await inspect(KozmosRoutingInputGroup(points: stops, onPointChange: { _, _ in }, onRemovePoint: { _ in })) { tree in
            let button = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Remove Stop" })
            XCTAssertGreaterThanOrEqual(button.accessibilityFrame.width, 44)
            XCTAssertGreaterThanOrEqual(button.accessibilityFrame.height, 44)
        }
    }

    @MainActor func testAmbiguousRouteSnapshotsDisableContinuation() async throws {
        func option(_ id: String, selected: Bool) -> KozmosRouteOptionPresentation {
            .init(id: id, label: id, durationSeconds: 60, durationLabel: "1 min", distanceMetres: 10, distanceLabel: "10 m", preference: .quickest, selected: selected)
        }
        for options in [[option("a", selected: true), option("b", selected: true)], [option("a", selected: true), option("a", selected: false)]] {
            let view = KozmosRoutePreviewPanel(destinationName: "Gallery", options: options, status: .ready,
                backLabel: "Back", continueLabel: "Continue", onOptionSelect: { _ in }, onBack: {}, onContinue: { _ in })
            try await inspect(view) { tree in
                let button = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Continue" })
                XCTAssertTrue(button.accessibilityTraits.contains(.notEnabled))
            }
        }
    }

    @MainActor func testMultipleCurrentStepsAreNotChosen() async throws {
        let view = KozmosItinerary(origin: "A", steps: [
            KozmosItineraryStep(id: "a", instruction: "Left", type: .left, isCurrent: true),
            KozmosItineraryStep(id: "b", instruction: "Right", type: .right, isCurrent: true)
        ], destination: "B")
        try await inspect(view) { tree in
            for label in ["Left", "Right"] {
                let step = try XCTUnwrap(tree.first { $0.accessibilityLabel == label })
                XCTAssertFalse(step.accessibilityTraits.contains(.selected))
            }
        }
    }

    @MainActor private func inspect<V: View>(_ view: V, check: ([NSObject]) throws -> Void) async throws {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get(); set(1); defer { set(old) }
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 200_000_000)
        try check(elements(window))
    }

    @MainActor private func elements(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        let children: [NSObject]
        if let values = node.accessibilityElements as? [NSObject], !values.isEmpty { children = values }
        else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        } else { children = (node as? UIView)?.subviews ?? [] }
        return children.flatMap { elements($0) }
    }
    #endif
}
