#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// The estimate layout's two words a product translates, as React takes
/// them: `endRouteLabel` names the End icon button, `startNavigationLabel`
/// is Start's label, and both keep today's English when left out. Read from
/// the accessibility tree VoiceOver walks, in a window on the simulator.
final class KozmosRouteSummaryEstimateLabelTests: XCTestCase {
    private final class TestWindow: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    @MainActor func testCustomLabelsNameEndAndStart() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let translated = try await names {
            VStack {
                KozmosRouteSummary(etaText: "4 min", distanceText: "201 m", onEndRoute: {},
                                   endRouteLabel: "Route beenden")
                KozmosRouteSummary(etaText: "4 min", distanceText: "201 m", state: .preview, onEndRoute: {},
                                   onStartNavigation: {}, startNavigationLabel: "Navigation starten") {
                    Image(systemName: "figure.walk")
                }
            }
        }
        XCTAssertTrue(translated.contains("Route beenden"), "End is not named by endRouteLabel: \(translated)")
        XCTAssertTrue(translated.contains("Navigation starten"), "Start is not named by startNavigationLabel: \(translated)")
        XCTAssertFalse(translated.contains("End route"), "\(translated)")
        XCTAssertFalse(translated.contains("Start Navigation"), "\(translated)")
        // Left out, the words are today's.
        let english = try await names {
            VStack {
                KozmosRouteSummary(etaText: "4 min", distanceText: "201 m", onEndRoute: {})
                KozmosRouteSummary(etaText: "4 min", distanceText: "201 m", state: .preview, onEndRoute: {},
                                   onStartNavigation: {})
            }
        }
        XCTAssertTrue(english.contains("End route"), "\(english)")
        XCTAssertTrue(english.contains("Start Navigation"), "\(english)")
    }

    /// The labels of the accessibility elements `content` draws, in a phone-sized window.
    @MainActor private func names<Content: View>(@ViewBuilder _ content: () -> Content) async throws -> [String] {
        let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 600))
        window.rootViewController = UIHostingController(rootView: content().environment(\.colorScheme, .light))
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 350_000_000)
        return elements(in: window).compactMap(\.accessibilityLabel)
    }

    @MainActor private func elements(in node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        let children: [NSObject]
        if let items = node.accessibilityElements as? [NSObject], !items.isEmpty { children = items }
        else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        } else if let view = node as? UIView { children = view.subviews }
        else { children = [] }
        return children.flatMap { elements(in: $0) }
    }

    // Activate the simulator accessibility tree, as the other hosted AX tests do.
    // This test-only hook is never linked into the library.
    private static let accessibility = dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW)
    private func setAutomation(_ on: Int32) -> Int32? {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        guard let library = Self.accessibility,
              let get = dlsym(library, "_AXSAutomationEnabled"),
              let set = dlsym(library, "_AXSSetAutomationEnabled") else { return nil }
        let old = unsafeBitCast(get, to: Get.self)()
        unsafeBitCast(set, to: Set.self)(on)
        return old
    }
}
#endif
