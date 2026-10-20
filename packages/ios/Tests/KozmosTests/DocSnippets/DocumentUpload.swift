// FileUpload.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// One file, from the system's importer, of the types allowedContentTypes
// names (any, unless it says otherwise): no drag and drop, no second file, no
// size limit and no message. The part draws no label, so KozmosFieldWrapper
// puts one above it. Picking a file hands you its URL and uploads nothing;
// removing it tells you nothing.
struct DocumentUpload: View {
    let receive: (URL) -> Void

    var body: some View {
        KozmosFieldWrapper(label: "Documents") {
            KozmosFileUpload(onFileSelected: receive)
        }
    }
}
