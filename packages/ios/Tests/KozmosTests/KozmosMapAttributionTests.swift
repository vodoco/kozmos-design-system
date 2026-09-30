import SwiftUI
import XCTest
import SnapshotTesting
@testable import Kozmos

final class KozmosMapAttributionTests: XCTestCase {
    func testCreditHeightDoesNotOscillateByOneDevicePixel() {
        var height: CGFloat = 18
        for measured: CGFloat in [17.333333333333332, 17, 17.333333333333332, 17] {
            height = AttributionRowHeight.stabilized(current: height, measured: measured, scale: 3)
            XCTAssertEqual(height, 52.0 / 3.0, accuracy: 0.0001)
        }
        height = AttributionRowHeight.stabilized(current: height, measured: 30.666666666666664, scale: 3)
        XCTAssertEqual(height, 92.0 / 3.0, accuracy: 0.0001)
        height = AttributionRowHeight.stabilized(current: height, measured: 15.333333333333332, scale: 3)
        XCTAssertEqual(height, 46.0 / 3.0, accuracy: 0.0001)
    }
    func testOnlyWebDestinationsBecomeLinks() {
        for href in ["javascript:alert(1)", "file:///private/file", "/relative", "https://"] {
            XCTAssertNil(KozmosMapAttributionCredit(id: "x", label: "Credit", href: href).destination)
        }
        XCTAssertEqual(KozmosMapAttributionCredit(id: "x", label: "Credit", href: "https://example.com/credits").destination?.host, "example.com")
    }

    #if os(iOS)
    @MainActor func testMapAndSurfaceRendering() {
        let credits: [KozmosMapAttributionCredit] = [
            .init(id: "owner", label: "© Example indoor data"),
            .init(id: "outdoor", label: "Outdoor contributors", href: "https://example.com")
        ]
        let view = VStack(spacing: 0) {
            KozmosMapAttribution(credits: credits).frame(maxWidth: .infinity).background(Color.white)
            KozmosMapAttribution(credits: credits).frame(maxWidth: .infinity).background(Color.gray)
            KozmosMapAttribution(credits: credits).frame(maxWidth: .infinity).background(Color.black)
            KozmosMapAttribution(credits: credits, appearance: .surface).frame(maxWidth: .infinity)
            KozmosMapAttribution(credits: credits, showBrand: false)
                .frame(width: 200).background(Color.gray)
                .environment(\.dynamicTypeSize, .accessibility2)
        }
        assertSnapshot(of: UIHostingController(rootView: view), as: .image(on: .iPhone13))
    }
    @MainActor func testCreditsUseTextHeightInsteadOfButtonHeight() {
        let host = UIHostingController(rootView: KozmosMapAttribution(credits: [
            .init(id: "a", label: "Indoor"),
            .init(id: "b", label: "Outdoor", href: "https://example.com")
        ], showBrand: false))
        let size = host.sizeThatFits(in: CGSize(width: 240, height: 1000))
        XCTAssertLessThanOrEqual(size.height, 40, "One text row plus padding must not reserve a 48pt button row")
    }

    private static let accessibility = dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW)
    @MainActor func testBundledBrandCanBeReplacedOrHidden() async throws {
        let image = try XCTUnwrap(UIImage(named: "PointrLogo", in: Bundle.module, compatibleWith: nil))
        XCTAssertEqual(image.size.width / image.size.height, 98.0 / 34.0, accuracy: 0.01)
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        for mode in 0...2 {
            var bounds = CGRect.zero
            let content = KozmosMapAttribution(
                credits: [.init(id: "a", label: "Indoor")],
                brand: mode == 1 ? AnyView(Text("Custom venue")) : nil,
                showBrand: mode != 2
            ).frame(width: 240)
            .background(GeometryReader { proxy in
                Color.clear.preference(key: CreditBounds.self, value: proxy.frame(in: .global))
            })
            .onPreferenceChange(CreditBounds.self) { bounds = $0 }
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 280, height: 300))
            window.rootViewController = UIHostingController(rootView: content)
            window.makeKeyAndVisible()
            defer { window.isHidden = true }
            try await Task.sleep(nanoseconds: 300_000_000)
            let labels = elements(in: window).compactMap(\.accessibilityLabel)
            XCTAssertEqual(labels.contains("Pointr"), mode == 0, "\(labels)")
            XCTAssertEqual(labels.contains("Custom venue"), mode == 1, "\(labels)")
            let scroll = try XCTUnwrap(scrollView(in: window))
            XCTAssertGreaterThan(scroll.bounds.height, 0)
            XCTAssertGreaterThan(scroll.contentSize.width, 0)
            XCTAssertEqual(scroll.convert(scroll.bounds, to: window).maxY, bounds.maxY, accuracy: 1,
                           "The credit viewport ends at the slot edge, not above another bottom inset")
        }
    }
    private struct CreditBounds: PreferenceKey {
        static var defaultValue = CGRect.zero
        static func reduce(value: inout CGRect, nextValue: () -> CGRect) {
            let next = nextValue()
            if !next.isEmpty { value = next }
        }
    }
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
    @MainActor func testWhiteLabelCreditsScrollAtLargeTextInBothDirections() async throws {
        // Same test-only accessibility activation as KozmosManoeuvreCardTests.
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
          for appearance in KozmosMapAttributionAppearance.allCases {
            let content = KozmosMapAttribution(
                credits: [
                    .init(id: "owner", label: "© Example indoor data"),
                    .init(id: "provider", label: "Outdoor contributors", href: "https://example.com")
                ],
                brand: AnyView(Text("Hidden brand")),
                showBrand: false,
                appearance: appearance
            )
            .frame(width: 240)
            .environment(\.layoutDirection, direction)
            .environment(\.dynamicTypeSize, .accessibility2)
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 280, height: 700))
            window.rootViewController = UIHostingController(rootView: content)
            window.makeKeyAndVisible()
            try await Task.sleep(nanoseconds: 300_000_000)
            defer { window.isHidden = true }
            let elements = elements(in: window)
            let labels = elements.compactMap(\.accessibilityLabel)
            XCTAssertFalse(labels.contains("Hidden brand"))
            // An in-process AX walk cannot see SwiftUI ScrollView children on
            // iOS 26.5 (also documented by KozmosManoeuvreCardTests). Verify the
            // real native viewport here; individual VoiceOver links need XCUITest.
            let scroll = try XCTUnwrap(scrollView(in: window))
            XCTAssertGreaterThan(scroll.bounds.height, 20)
            XCTAssertLessThan(scroll.bounds.height, 60, "One scaled line, not wrapped credits")
            XCTAssertGreaterThan(scroll.contentSize.width, scroll.bounds.width)
            XCTAssertLessThanOrEqual(scroll.contentSize.height, scroll.bounds.height + 1)
            let end = scroll.contentSize.width - scroll.bounds.width
            scroll.setContentOffset(CGPoint(x: end, y: 0), animated: false)
            XCTAssertEqual(scroll.contentOffset.x, end, accuracy: 1)
          }
        }
    }

    @MainActor private func elements(in node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        let children: [NSObject]
        if let items = node.accessibilityElements as? [NSObject], !items.isEmpty {
            children = items
        } else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        } else if let view = node as? UIView {
            children = view.subviews
        } else { children = [] }
        return children.flatMap { elements(in: $0) }
    }
    @MainActor private func scrollView(in view: UIView) -> UIScrollView? {
        if let scroll = view as? UIScrollView { return scroll }
        return view.subviews.compactMap { scrollView(in: $0) }.first
    }
    #endif
}
