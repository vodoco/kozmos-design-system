// The SwiftUI snippet of ClientAppBanner.mdx, character for character between
// the markers, so it compiles with the package and a renamed or removed
// parameter fails here rather than in a reader's project. Change one, change
// the other.
import SwiftUI
import Kozmos
import XCTest

// MARK: - ClientAppBanner.mdx

// The customer's banner, as Pointr Cloud returns it, in the visitor's language.
struct AppBannerSettings {
    var promotionText: String?
    var appName: String
    var description: String?
    var appIconURL: URL?
    var buttonText: String
    var storeURL: URL
}

// Shown in the map shell's top bar until the visitor dismisses it.
struct AppBanner: View {
    let settings: AppBannerSettings
    @Binding var isDismissed: Bool
    @Environment(\.openURL) private var openURL

    var body: some View {
        if !isDismissed {
            KozmosClientAppBanner(
                appName: settings.appName,
                actionLabel: settings.buttonText,
                promotionText: settings.promotionText,
                description: settings.description,
                appIconURL: settings.appIconURL,
                dismissLabel: String(localized: "Dismiss"),
                onAction: { openURL(settings.storeURL) },
                onDismiss: { isDismissed = true }
            )
        }
    }
}

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
