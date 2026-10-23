// NavigationItem.mdx's SwiftUI snippet ("Long labels"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project, and drawn by
// KozmosNavigationItemTests. Change the two together.
import SwiftUI
import Kozmos

// A rail item colours its icon, theme 600 while selected, and a KozmosIcon
// in it takes that colour. The icon's box is 24pt, KozmosIcon's lg size.
struct RailNavigationExample: View {
    var body: some View {
        KozmosSidebar(variant: .rail) {
            VStack(spacing: 0) {
                KozmosNavigationItem(label: "Home", placement: .rail, content: .iconLabel, selected: true) {
                    KozmosIcon("home-line", size: .lg)
                }
                KozmosNavigationItem(label: "Accessible routes", placement: .rail, content: .iconLabel) {
                    KozmosIcon("navigation-pointer-01", size: .lg)
                }
            }
        }
    }
}
