import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// GAP-104: the Web SDK's route card has an action beside From and To. The
/// host passes a callback per endpoint; only a passed one draws, so
/// ManoeuvreCard's list, which passes none, is unchanged. Each action shows
/// RouteLocationField's verb, "Change", and is named for its endpoint with
/// that verb first (WCAG 2.5.3).
final class KozmosItineraryEndpointEditTests: XCTestCase {
    private let steps = [
        KozmosItineraryStep(id: "1", instruction: "Take Elevator down to First Floor", type: .liftDown),
        KozmosItineraryStep(id: "2", instruction: "Take Corridor to Garage B", type: .transition, isCurrent: true),
    ]

    /// Every released form still compiles, and the new parameters come after them.
    func testTheReleasedCallsStillCompileBesideTheNewOnes() {
        _ = KozmosItinerary(origin: "A", steps: steps, destination: "B")
        _ = KozmosItinerary(origin: "A", steps: steps, destination: "B", originLabel: "Von", destinationLabel: "Nach", label: "Route")
        _ = KozmosItinerary(origin: "A", steps: steps, destination: "B", onEditDestination: {})
        _ = KozmosItinerary(origin: "A", steps: steps, destination: "B", originLabel: "Von", destinationLabel: "Nach", label: "Route",
            onEditOrigin: {}, onEditDestination: {}, changeLabel: "Ändern",
            editOriginLabel: "Ändern: Startpunkt", editDestinationLabel: "Ändern: Ziel")
    }

    #if os(iOS)
    @MainActor func testNoActionIsDrawnUnlessItsCallbackIsPassed() async throws {
        try await inspect(KozmosItinerary(origin: "Dunkin'", steps: steps, destination: "Gate 12")) { tree in
            XCTAssertTrue(tree.contains { $0.accessibilityLabel == "From, Dunkin'" }, "Must inspect a real itinerary")
            XCTAssertFalse(tree.contains { $0.accessibilityTraits.contains(.button) })
        }
        try await inspect(KozmosItinerary(origin: "Dunkin'", steps: steps, destination: "Gate 12", onEditDestination: {})) { tree in
            let buttons = tree.filter { $0.accessibilityTraits.contains(.button) }
            XCTAssertEqual(buttons.map(\.accessibilityLabel), ["Change To"])
        }
    }

    @MainActor func testEachActionIsANamedButtonAfterItsEndpointThatCallsItsOwnCallback() async throws {
        var calls: [String] = []
        let view = KozmosItinerary(origin: "Dunkin'", steps: steps, destination: "Gate 12",
            onEditOrigin: { calls.append("origin") }, onEditDestination: { calls.append("destination") })
        try await inspect(view) { tree in
            let labels = tree.compactMap(\.accessibilityLabel)
            // The order VoiceOver reads: each action straight after its endpoint.
            XCTAssertEqual(labels, ["From, Dunkin'", "Change From", "Take Elevator down to First Floor",
                "Take Corridor to Garage B", "To, Gate 12", "Change To"])
            for name in ["Change From", "Change To"] {
                let button = try XCTUnwrap(tree.first { $0.accessibilityLabel == name })
                XCTAssertTrue(button.accessibilityTraits.contains(.button), name)
                XCTAssertFalse(button.accessibilityTraits.contains(.notEnabled), name)
                XCTAssertGreaterThanOrEqual(button.accessibilityFrame.height, 44, name)
                XCTAssertGreaterThanOrEqual(button.accessibilityFrame.width, 44, name)
            }
            XCTAssertTrue(try XCTUnwrap(tree.first { $0.accessibilityLabel == "Change From" }).accessibilityActivate())
            XCTAssertEqual(calls, ["origin"])
            XCTAssertTrue(try XCTUnwrap(tree.first { $0.accessibilityLabel == "Change To" }).accessibilityActivate())
            XCTAssertEqual(calls, ["origin", "destination"])
        }
    }

    /// A translated verb and captions, and no names: each name is the visible
    /// verb and the row's own caption, words the product translates, never a
    /// built-in English word beside a translated one.
    @MainActor func testTheDefaultNamesAreTheVerbAndTheCaptionInOneLanguage() async throws {
        let view = KozmosItinerary(origin: "Dunkin'", steps: steps, destination: "Gate 12",
            originLabel: "Von", destinationLabel: "Nach",
            onEditOrigin: {}, onEditDestination: {}, changeLabel: "Bearbeiten")
        try await inspect(view) { tree in
            let buttons = tree.filter { $0.accessibilityTraits.contains(.button) }
            XCTAssertEqual(buttons.map(\.accessibilityLabel), ["Bearbeiten Von", "Bearbeiten Nach"])
        }
    }

    @MainActor func testTheHostsWordsAndNamesThatFollowAChangedVerb() async throws {
        let localized = KozmosItinerary(origin: "A", steps: [], destination: "B",
            onEditOrigin: {}, onEditDestination: {}, changeLabel: "Ändern",
            editOriginLabel: "Ändern: Startpunkt", editDestinationLabel: "Ändern: Ziel")
        try await inspect(localized) { tree in
            let buttons = tree.filter { $0.accessibilityTraits.contains(.button) }
            XCTAssertEqual(buttons.map(\.accessibilityLabel), ["Ändern: Startpunkt", "Ändern: Ziel"])
        }
        // The SDK's own verb, with no names given: the names follow the verb.
        let edit = KozmosItinerary(origin: "A", steps: [], destination: "B",
            onEditOrigin: {}, onEditDestination: {}, changeLabel: "Edit")
        try await inspect(edit) { tree in
            let buttons = tree.filter { $0.accessibilityTraits.contains(.button) }
            XCTAssertEqual(buttons.map(\.accessibilityLabel), ["Edit From", "Edit To"])
        }
    }

    /// A long name wraps beside the action and keeps at least half the row; a
    /// long verb wraps within its half. The action sits at the row's end, the
    /// trailing edge, the left one in a right-to-left layout, beside the
    /// name's first line.
    @MainActor func testALongNameKeepsHalfTheRowAndTheActionSitsAtItsEnd() async throws {
        let name = "International arrivals reception and passenger assistance desk, North Terminal"
        for (verb, direction) in [("Change", LayoutDirection.leftToRight), ("Change", .rightToLeft),
                                  ("Ausgangspunkt und Ziel noch einmal ändern", .leftToRight)] {
            let view = KozmosItinerary(origin: "Dunkin'", steps: [], destination: name,
                onEditDestination: {}, changeLabel: verb, editDestinationLabel: verb)
                .frame(width: 320)
                .environment(\.layoutDirection, direction)
            try await inspect(view) { tree in
                let text = try XCTUnwrap(tree.first { $0.accessibilityLabel == "To, \(name)" }).accessibilityFrame
                let button = try XCTUnwrap(tree.first { $0.accessibilityLabel == verb }).accessibilityFrame
                let row = text.union(button)
                let context = "\(verb), \(direction)"
                XCTAssertEqual(row.width, 320, accuracy: 1, context)
                // Half of the 320 less the 12 between them.
                XCTAssertLessThanOrEqual(button.width, 154, context)
                XCTAssertGreaterThanOrEqual(text.width, 148, context)
                XCTAssertGreaterThan(text.height, 40, "the name wraps: \(context)")
                if verb == "Change" {
                    // The long name sits under its caption. The action is on
                    // the name's first line, its centre 26 below the
                    // endpoint's top; on the caption's, it was 5.
                    XCTAssertGreaterThan(button.midY - text.minY, 18, context)
                }
                if direction == .leftToRight {
                    XCTAssertEqual(button.maxX, row.maxX, accuracy: 1, context)
                    XCTAssertLessThan(text.maxX, button.minX, context)
                } else {
                    XCTAssertEqual(button.minX, row.minX, accuracy: 1, context)
                    XCTAssertGreaterThan(text.minX, button.maxX, context)
                }
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
