import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-115: an empty state says how far a long wait has got, under its description.
final class KozmosEmptyStateProgressTests: XCTestCase {
    func testTheSpokenValueIsTheWordsOrThePercentage() {
        XCTAssertEqual(KozmosEmptyStateProgress(value: 0.4, label: "Downloading", valueText: "12 of 30 MB").spokenValue, "12 of 30 MB")
        XCTAssertEqual(KozmosEmptyStateProgress(value: 0.4, label: "Downloading").spokenValue, "40%")
        XCTAssertEqual(KozmosEmptyStateProgress(value: 1.7, label: "Downloading").spokenValue, "100%")
        XCTAssertEqual(KozmosEmptyStateProgress(value: 0.999, label: "Downloading").spokenValue, "100%")
    }

    // As on React: NaN is none done. Clamped with min and max it stayed NaN,
    // and turning it into an Int for the percentage trapped.
    func testAValueThatIsNotANumberIsNoneDone() {
        XCTAssertEqual(KozmosEmptyStateProgress(value: .nan, label: "Downloading").spokenValue, "0%")
        XCTAssertEqual(KozmosEmptyStateProgress(value: -.infinity, label: "Downloading").spokenValue, "0%")
        XCTAssertEqual(KozmosEmptyStateProgress(value: .infinity, label: "Downloading").spokenValue, "100%")
    }

    #if os(iOS)
    @MainActor func testTheBarIsOneElementNamedByItsLabelWithItsValue() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        for withProgress in [true, false] {
            let view = KozmosEmptyState(
                title: "The assistant isn't downloaded yet",
                description: "It works offline once it's on this device.",
                progress: withProgress
                    ? .init(value: 0.4, label: "Downloading the assistant", valueText: "12 of 30 MB") : nil
            )
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 500))
            window.rootViewController = UIHostingController(rootView: view)
            window.makeKeyAndVisible()
            defer { window.isHidden = true }
            try await Task.sleep(nanoseconds: 300_000_000)
            let bar = elements(in: window).first { $0.accessibilityLabel == "Downloading the assistant" }
            XCTAssertEqual(bar != nil, withProgress, "\(elements(in: window).compactMap(\.accessibilityLabel))")
            if let bar {
                XCTAssertEqual(bar.accessibilityValue, "12 of 30 MB")
                XCTAssertTrue(bar.accessibilityTraits.contains(.updatesFrequently))
            }
        }
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
    #endif
}
