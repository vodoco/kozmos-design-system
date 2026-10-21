// Draws ClientAppBanner.mdx's SwiftUI snippet, DocSnippets/AppBanner.swift,
// which check-native-snippet-parity holds to the page word for word.
import SwiftUI
import Kozmos
import XCTest

// MARK: - The snippet draws

final class KozmosClientAppBannerDocSnippetTests: XCTestCase {
    private let settings = AppBannerSettings(
        promotionText: "Get the app",
        appName: "Northfield Airport",
        description: "Live gate changes, step-free routes and your boarding pass.",
        appIconURL: nil,
        buttonText: "Open",
        storeURL: URL(string: "https://apps.apple.com/app/id000000000")!
    )

    /// Compiling is most of the point; drawing it shows a banner that lays
    /// out, and draws nothing once dismissed.
    @MainActor func testTheDocsSnippetDraws() throws {
        let shown = try DrawnPixels.draw(AppBanner(settings: settings, isDismissed: .constant(false)).frame(width: 358))
        XCTAssertGreaterThan(shown.size.height, 76, "the banner is \(shown.size.height) tall")
        let dismissed = try DrawnPixels.draw(
            AppBanner(settings: settings, isDismissed: .constant(true)).frame(width: 358, height: 1)
        )
        XCTAssertNil(dismissed.boundingBox(where: { _, _, _, alpha in alpha > 0 }), "a dismissed banner still draws")
    }
}
