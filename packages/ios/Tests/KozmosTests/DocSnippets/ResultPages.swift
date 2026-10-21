// Pagination.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Each page is a button, not a link: there is no href, and where a press goes
// is yours. The current page is drawn, not told to VoiceOver, and Previous and
// Next take no words of yours.
struct ResultPages: View {
    let page: Int
    let goTo: (Int) -> Void

    var body: some View {
        KozmosPagination {
            KozmosPaginationLink(text: "1", isActive: page == 1) { goTo(1) }
            KozmosPaginationLink(text: "2", isActive: page == 2) { goTo(2) }
            KozmosPaginationNext { goTo(page + 1) }
        }
    }
}
