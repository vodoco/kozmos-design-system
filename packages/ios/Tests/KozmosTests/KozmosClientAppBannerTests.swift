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
/// side by side, the action goes under the icon and the words.
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

    /// The initial stands in for the icon only until it has loaded: under a
    /// loaded icon nothing is drawn, so a transparent one shows the banner's
    /// surface, as on the web, where the fallback goes once the image loads.
    /// Before, the muted fill and the initial were drawn under every icon.
    @MainActor func testTheInitialIsDrawnOnlyUntilTheIconHasLoaded() throws {
        let clear = try XCTUnwrap(CGContext(
            data: nil, width: 96, height: 96, bitsPerComponent: 8, bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        )?.makeImage())
        let inside = CGRect(x: 6, y: 6, width: 36, height: 36)
        let loading = try DrawnPixels.draw(
            KozmosClientAppBannerIconFace(image: nil, initial: "N", size: 48).environment(\.colorScheme, .light))
        XCTAssertEqual(loading.size, CGSize(width: 48, height: 48))
        XCTAssertEqual(loading.count(in: inside) { _, _, _, a in a > 200 }, Int(inside.width * inside.height * 4),
                       "until it loads, the initial's fill does not cover the square")
        let fill = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground100, in: .light)
        XCTAssertNotNil(loading.boundingBox(in: inside) { r, g, b, a in
            a > 200 && Int(r) + Int(g) + Int(b) < Int(fill.r) + Int(fill.g) + Int(fill.b) - 150
        }, "until it loads, no initial is drawn on the fill")

        let loaded = try DrawnPixels.draw(
            KozmosClientAppBannerIconFace(image: Image(decorative: clear, scale: 2), initial: "N", size: 48)
                .environment(\.colorScheme, .light))
        XCTAssertEqual(loaded.count(in: inside) { _, _, _, a in a > 8 }, 0,
                       "under a loaded, transparent icon the initial or its fill shows through")
        // The edge is the icon's own, loaded or not.
        XCTAssertTrue(loaded.isDrawn(at: CGPoint(x: 24, y: 0.25)), "a loaded icon loses its edge")
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
        _ view: V, width: CGFloat = 358, direction: LayoutDirection = .leftToRight,
        textSize: DynamicTypeSize = .large
    ) async throws -> UIWindow {
        let content = view
            .frame(width: width)
            .environment(\.layoutDirection, direction)
            .environment(\.colorScheme, .light)
            .environment(\.dynamicTypeSize, textSize)
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: max(430, width + 40), height: 844))
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
            // A container holding the five, each read on its own, rather
            // than one element that reads them all at once.
            XCTAssertEqual(elements(region).compactMap(\.accessibilityLabel),
                           ["Get the app", "Northfield Airport", Self.words, "Open", "Dismiss"],
                           "the container named by the app does not hold the banner's five elements")
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

    /// At 320 the action goes under the icon and the words and spans them
    /// both, so the words keep the width beside the icon; at a top bar's
    /// widest it stays beside them.
    @MainActor func testTheActionGoesUnderTheIconAndTheWordsOnlyWhereTheyWouldNotFitBesideIt() async throws {
        try await withAutomation {
            for (width, stacked) in [(CGFloat(320), true), (CGFloat(560), false)] {
                let window = try await host(banner(), width: width)
                defer { window.isHidden = true }
                let tree = elements(window)
                let banner = try XCTUnwrap(containers(window).first { $0.accessibilityLabel == "Northfield Airport" })
                    .accessibilityFrame
                let name = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Northfield Airport" }).accessibilityFrame
                let words = try XCTUnwrap(tree.first { $0.accessibilityLabel == Self.words }).accessibilityFrame
                let action = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Open" }).accessibilityFrame
                // The words start after the 16 inside, the 48 icon and the 12 beside it.
                XCTAssertEqual(name.minX - banner.minX, 76, accuracy: 1, "at \(width) the words do not follow the icon")
                if stacked {
                    XCTAssertGreaterThanOrEqual(action.minY, words.maxY, "at \(width) the action is not under the words")
                    XCTAssertGreaterThanOrEqual(action.minY, banner.minY + 16 + 48, "at \(width) the action is not under the icon")
                    XCTAssertEqual(action.minX - banner.minX, 16, accuracy: 1, "at \(width) the action does not start under the icon")
                    // Dismiss's 44, the 4 beside it and the 12 before the words.
                    XCTAssertEqual(banner.maxX - action.maxX, 60, accuracy: 1, "at \(width) the action does not end with the words")
                } else {
                    XCTAssertLessThan(action.minY, words.maxY, "at \(width) the action is not beside the words")
                    XCTAssertGreaterThan(action.minX, name.maxX, "at \(width) the action is not after the words")
                }
            }
        }
    }

    /// The words keep 160 beside the icon at the default text size, and
    /// more as Dynamic Type grows, as the web's 10rem grows with the
    /// browser's text. At 460 and accessibility text, a fixed 160 left the
    /// action beside words of about 200; scaled, it goes under them.
    @MainActor func testTheWordsWidthTheActionWaitsForGrowsWithDynamicType() async throws {
        try await withAutomation {
            for (textSize, stacked) in [(DynamicTypeSize.large, false), (.accessibility1, true)] {
                let window = try await host(banner(), width: 460, textSize: textSize)
                defer { window.isHidden = true }
                let tree = elements(window)
                let words = try XCTUnwrap(tree.first { $0.accessibilityLabel == Self.words }).accessibilityFrame
                let action = try XCTUnwrap(tree.first { $0.accessibilityLabel == "Open" }).accessibilityFrame
                XCTAssertEqual(action.minY >= words.maxY, stacked,
                               "at 460 and \(textSize) the action is \(action.minY >= words.maxY ? "under" : "beside") words \(words.width) wide")
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
