// ClientAppBanner.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project, and drawn by
// KozmosClientAppBannerDocSnippetTests. Change the two together.
import SwiftUI
import Kozmos

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
