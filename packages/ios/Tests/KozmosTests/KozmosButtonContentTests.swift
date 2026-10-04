#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

final class KozmosButtonContentTests: XCTestCase {
    private struct AllocatedSize: PreferenceKey {
        static var defaultValue = CGSize.zero
        static func reduce(value: inout CGSize, nextValue: () -> CGSize) {
            let next = nextValue()
            if next != .zero { value = next }
        }
    }

    @MainActor func testGhostEndpointActionAllocatesAtLeast44PointsAtFractionalPositions() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            for large in [false, true] {
                var allocated = CGSize.zero
                let button = KozmosButton("Ändern", variant: .ghost, action: {})
                    .background(GeometryReader { proxy in
                        Color.clear.preference(key: AllocatedSize.self, value: proxy.size)
                    })
                    .onPreferenceChange(AllocatedSize.self) { allocated = $0 }
                let content = HStack { Text("From\nNorth Terminal · Ground floor").frame(maxWidth: .infinity); button }
                        .environment(\.layoutDirection, direction)
                        .environment(\.sizeCategory, large ? .accessibilityExtraExtraExtraLarge : .large)
                let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 320, height: 151 + 1.0 / 3))
                // Preference geometry requires a live hosted layout, not the
                // detached snapshot strategy used by the pixel tests below.
                window.rootViewController = UIHostingController(rootView: content)
                window.makeKeyAndVisible()
                defer { window.isHidden = true }
                try await Task.sleep(nanoseconds: 300_000_000)
                XCTAssertGreaterThanOrEqual(allocated.height, 44, "Layout minimum must not rely on accessibility-frame rounding")
                XCTAssertGreaterThanOrEqual(allocated.width, 44)
            }
        }
    }

    @MainActor
    private func paint(_ button: KozmosButton, direction: LayoutDirection = .leftToRight,
                       large: Bool = false, width: CGFloat = 200) async throws -> CGRect {
        let pixels = try await RenderedPixels.render(
            button.environment(\.layoutDirection, direction)
                .environment(\.sizeCategory, large ? .accessibilityExtraExtraExtraLarge : .large),
            size: CGSize(width: width, height: 600))
        return try XCTUnwrap(pixels.boundingBox(
            in: CGRect(x: 0, y: 0, width: width, height: 600), where: RenderedPixels.isTheme))
    }

    @MainActor func testDecorativeIconAddsSpaceAndLoadingReplacesIt() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let plain = try await paint(KozmosButton("Go", action: {}), direction: direction)
            let icon = try await paint(KozmosButton("Go", leadingIconName: "navigation-pointer-01", action: {}), direction: direction)
            XCTAssertGreaterThan(icon.width, plain.width + 8)
            XCTAssertEqual(icon.height, 44, accuracy: 1)
            let loading = try await paint(KozmosButton("Go", isLoading: true, action: {}), direction: direction)
            let loadingIcon = try await paint(KozmosButton("Go", isLoading: true, leadingIconName: "navigation-pointer-01", action: {}), direction: direction)
            XCTAssertEqual(loading.width, loadingIcon.width, accuracy: 1)
        }
    }

    @MainActor func testTranslatedIconLabelGrowsWithoutWideningItsContainer() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let frame = try await paint(KozmosButton("Wegbeschreibung zu diesem Ziel anzeigen",
                leadingIconName: "navigation-pointer-01", action: {}), direction: direction, large: true)
            XCTAssertGreaterThan(frame.height, 44)
            XCTAssertLessThanOrEqual(frame.width, 200)
            XCTAssertGreaterThanOrEqual(frame.minX, 0)
        }
    }
}
#endif
