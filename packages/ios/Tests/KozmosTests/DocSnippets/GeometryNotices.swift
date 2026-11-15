// Notice.mdx's SwiftUI snippet ("Success, progress and done"), word for word
// below this comment: compiled here, so a renamed or removed parameter fails
// in this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The building editor's geometry notices: a warning with its action under
// the words, the save in progress, then done, which ends in a check.
struct GeometryNotices: View {
    let saving: Bool
    let saved: Bool
    let setBoundary: () -> Void

    var body: some View {
        if saved {
            KozmosNotice("Geometry is set", tone: .success, status: .done)
        } else if saving {
            KozmosNotice("Saving the geometry", tone: .info, status: .progress)
        } else {
            KozmosNotice("Set Geometry", detail: "Draw the building's outline on the map.", tone: .warning, collapsible: false) {
                KozmosButton("Set Building Boundary", variant: .outline, size: .sm, action: setBoundary)
            }
        }
    }
}
