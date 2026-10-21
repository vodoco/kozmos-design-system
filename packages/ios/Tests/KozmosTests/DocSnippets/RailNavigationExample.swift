// NavigationItem.mdx's SwiftUI snippet ("Long labels"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project, and drawn by
// KozmosNavigationItemTests. Change the two together.
import SwiftUI
import Kozmos

// A rail item colours its icon, theme 600 while selected. A KozmosIcon keeps
// its own ink inside it, so these are the SF Symbols KozmosIcon draws for
// "home-line" and "navigation-pointer-01", as an Image.
struct RailNavigationExample: View {
    var body: some View {
        KozmosSidebar(variant: .rail) {
            VStack(spacing: 0) {
                KozmosNavigationItem(label: "Home", placement: .rail, content: .iconLabel, selected: true) {
                    Image(systemName: "house")
                }
                KozmosNavigationItem(label: "Accessible routes", placement: .rail, content: .iconLabel) {
                    Image(systemName: "location.north")
                }
            }
        }
    }
}
