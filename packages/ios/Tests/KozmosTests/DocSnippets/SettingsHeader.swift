// PageHeader.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The band is theme 0, its content 32 below its top and 24 above its end.
// tone: .default paints no band; size: .lg is a landing page's title. The
// title is the screen's heading.
struct SettingsHeader: View {
    var body: some View {
        KozmosPageHeader(
            "Settings",
            description: "Manage the site's map, its levels and who can edit them.",
            breadcrumb: {
                KozmosBreadcrumb(items: ["Boston Logan Airport", "Settings"], onSelect: { _ in })
            },
            actions: {
                KozmosButton("Save changes") {}
            }
        )
    }
}
