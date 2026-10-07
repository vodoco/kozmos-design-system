import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// GAP-127: Express's Client App Banner, as React's `ClientAppBanner` draws
/// it. A container named by the app, which VoiceOver reads as the promotion,
/// the name and the description, then the action, then dismiss; its icon is
/// decoration beside the name. Where the words and the action do not fit
/// side by side, the action goes under the words.
///
/// The accessibility tree is read in process, on the simulator, with
/// accessibility automation switched on for the test, as
/// KozmosArrivalPanelTests reads it.
final class KozmosClientAppBannerTests: XCTestCase {
    /// The app's first letter stands in for a missing icon, whole even when
    /// it is two code units, and upper case in the visitor's language.
    func testTheInitialIsTheAppsFirstLetter() {
        XCTAssertEqual(KozmosClientAppBanner.initial(of: "northfield Airport"), "N")
        XCTAssertEqual(KozmosClientAppBanner.initial(of: "  île de Nantes"), "Î")
        XCTAssertEqual(KozmosClientAppBanner.initial(of: "🛫 Departures"), "🛫")
        XCTAssertEqual(KozmosClientAppBanner.initial(of: ""), "")
    }

    #if os(iOS)
    private static let words = "Live gate changes, step-free routes and your boarding pass."

    private func banner(
        promotion: String? = "Get the app",
        description: String? = KozmosClientAppBannerTests.words,
        actionLabel: String = "Open",
        dismissLabel: String = "Dismiss",
        onAction: @escaping () -> Void = {},
        onDismiss: (() -> Void)? = {}
    ) -> KozmosClientAppBanner {
        KozmosClientAppBanner(
            appName: "Northfield Airport",
            actionLabel: actionLabel,
            promotionText: promotion,
            description: description,
            dismissLabel: dismissLabel,
            onAction: onAction,
            onDismiss: onDismiss
        )
    }

    @MainActor private func withAutomation(_ body: () async throws -> Void) async throws {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get(); set(1); defer { set(old) }
        try await body()
    }

    /// Hosts `view` at `width` in a window, as a top bar would, and returns
    /// the window once SwiftUI has built its accessibility tree.
    @MainActor private func host<V: View>(
        _ view: V, width: CGFloat = 358, direction: LayoutDirection = .leftToRight
    ) async throws -> UIWindow {
        let content = view
            .frame(width: width)
            .environment(\.layoutDirection, direction)
            .environment(\.colorScheme, .light)
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 430, height: 844))
        window.rootViewController = UIHostingController(rootView: content)
        window.makeKeyAndVisible()
        try await Task.sleep(nanoseconds: 300_000_000)
        return window
    }

    @MainActor func testItIsARegionNamedByTheAppReadInOrderWithItsIconHidden() async throws {
        try await withAutomation {
            let window = try await host(banner())
            defer { window.isHidden = true }
            let labels = elements(window).compactMap(\.accessibilityLabel)
            XCTAssertEqual(labels, ["Get the app", "Northfield Airport", Self.words, "Open", "Dismiss"],
                           "VoiceOver reads \(labels)")
            // The app's initial, standing in for its icon, is not read.
            XCTAssertFalse(labels.contains("N"))
            let region = try XCTUnwrap(containers(window).first { $0.accessibilityLabel == "Northfield Airport" },
                                       "no container is named by the app")
            XCTAssertFalse(region.isAccessibilityElement, "the banner is read as one element, not a region of five")
        }
    }

    @MainActor func testTheActionIsNamedByItsWordsAndBothButtonsAskTheProduct() async throws {
        try await withAutomation {
            var actions = 0
            var dismissals = 0
            let window = try await host(banner(actionLabel: "Öffnen", dismissLabel: "Schließen",
                                               onAction: { actions += 1 }, onDismiss: { dismissals += 1 }))
            defer { window.isHidden = true }
            let tree = elements(window)
            let action = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Öffnen" })
            let dismiss = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Schließen" })
            XCTAssertTrue(action.accessibilityTraits.contains(.button))
            XCTAssertTrue(dismiss.accessibilityTraits.contains(.button))
            XCTAssertTrue(action.accessibilityActivate())
            XCTAssertEqual(actions, 1)
            XCTAssertEqual(dismissals, 0)
            XCTAssertTrue(dismiss.accessibilityActivate())
            XCTAssertEqual(dismissals, 1)
            XCTAssertEqual(actions, 1)
            // Every target keeps 44.
            XCTAssertGreaterThanOrEqual(action.accessibilityFrame.height, 44 - 0.5)
            XCTAssertGreaterThanOrEqual(dismiss.accessibilityFrame.width, 44 - 0.5)
            XCTAssertGreaterThanOrEqual(dismiss.accessibilityFrame.height, 44 - 0.5)
        }
    }

    @MainActor func testThereIsNoDismissButtonWhenTheProductCannotDismissIt() async throws {
        try await withAutomation {
            let window = try await host(banner(promotion: nil, description: nil, onDismiss: nil))
            defer { window.isHidden = true }
            let tree = elements(window)
            XCTAssertEqual(tree.compactMap(\.accessibilityLabel), ["Northfield Airport", "Open"])
            XCTAssertEqual(tree.filter { $0.accessibilityTraits.contains(.button) }.count, 1)
        }
    }

    /// At 320 the words keep their width and the action goes under them, as
    /// wide as the words; at a top bar's widest it stays beside them.
    @MainActor func testTheActionGoesUnderTheWordsOnlyWhereTheyWouldNotFitBesideIt() async throws {
        try await withAutomation {
            for (width, stacked) in [(CGFloat(320), true), (CGFloat(560), false)] {
                let window = try await host(banner(), width: width)
                defer { window.isHidden = true }
                let tree = elements(window)
                let name = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Northfield Airport" }).accessibilityFrame
                let words = try XCTUnwrap(tree.first { $0.accessibilityLabel == Self.words }).accessibilityFrame
                let action = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Open" }).accessibilityFrame
                if stacked {
                    XCTAssertGreaterThanOrEqual(action.minY, words.maxY, "at \(width) the action is not under the words")
                    XCTAssertEqual(action.minX, name.minX, accuracy: 1, "at \(width) the action does not start with the words")
                    XCTAssertGreaterThan(action.width, 150, "at \(width) the action does not fill the words' width")
                } else {
                    XCTAssertLessThan(action.minY, words.maxY, "at \(width) the action is not beside the words")
                    XCTAssertGreaterThan(action.minX, name.maxX, "at \(width) the action is not after the words")
                }
            }
        }
    }

    /// Right to left, the banner mirrors: the icon and the words start at
    /// the right, and the action and dismiss end at the left.
    @MainActor func testRightToLeftMirrorsIt() async throws {
        try await withAutomation {
            for direction in [LayoutDirection.leftToRight, .rightToLeft] {
                let window = try await host(banner(), width: 560, direction: direction)
                defer { window.isHidden = true }
                let tree = elements(window)
                let name = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Northfield Airport" }).accessibilityFrame
                let action = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Open" }).accessibilityFrame
                let dismiss = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Dismiss" }).accessibilityFrame
                if direction == .leftToRight {
                    XCTAssertLessThan(name.maxX, action.minX)
                    XCTAssertLessThan(action.maxX, dismiss.minX)
                } else {
                    XCTAssertGreaterThan(name.minX, action.maxX, "right to left, the words are not at the right")
                    XCTAssertGreaterThan(action.minX, dismiss.maxX, "right to left, dismiss is not at the left")
                }
                XCTAssertEqual(tree.compactMap(\.accessibilityLabel),
                               ["Get the app", "Northfield Airport", Self.words, "Open", "Dismiss"],
                               "\(direction) changes what is read, or its order")
            }
        }
    }

    @MainActor private func elements(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        return children(node).flatMap { elements($0) }
    }

    /// Nodes that hold elements rather than being one: where a container's
    /// own name is kept.
    @MainActor private func containers(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden || node.isAccessibilityElement { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        return [node] + children(node).flatMap { containers($0) }
    }

    @MainActor private func children(_ node: NSObject) -> [NSObject] {
        if let values = node.accessibilityElements as? [NSObject], !values.isEmpty { return values }
        if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            return (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        }
        return (node as? UIView)?.subviews ?? []
    }
    #endif
}
