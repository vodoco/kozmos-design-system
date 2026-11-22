import SwiftUI
import Figma

// GAP-206, GAP-127: Promotion Text, App Name Text and Description Text are
// promotionText, appName and description (Show Promotion, Show
// Description); Show Dismiss is onDismiss. Layout is how the width falls,
// not a parameter. Initial Text stands in for the icon until appIconURL
// loads, and is drawn from appName.
struct KozmosClientAppBannerConnect: FigmaConnect {
    let component = KozmosClientAppBanner.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-19192"

    @FigmaString("Promotion Text")
    var promotionText: String = "Get the app"

    @FigmaBoolean("Show Promotion")
    var showPromotion: Bool = true

    @FigmaString("App Name Text")
    var appName: String = "Northfield Airport"

    @FigmaString("Description Text")
    var appDescription: String = "Live gate changes, step-free routes and your boarding pass, on your phone."

    @FigmaBoolean("Show Description")
    var showDescription: Bool = true

    @FigmaBoolean("Show Dismiss")
    var showDismiss: Bool = true

    var body: some View {
        KozmosClientAppBanner(
            appName: self.appName,
            actionLabel: "Open",
            promotionText: self.showPromotion ? self.promotionText : nil,
            description: self.showDescription ? self.appDescription : nil,
            onAction: {},
            onDismiss: self.showDismiss ? {} : nil
        )
    }
}
