// PageHeader.mdx's SwiftUI snippet ("A title addon"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct MapContentHeader: View {
    var body: some View {
        KozmosPageHeader("Map Content")
            .titleAddon {
                KozmosTag("Changes Awaiting Publish", emotion: .alert)
            }
    }
}
