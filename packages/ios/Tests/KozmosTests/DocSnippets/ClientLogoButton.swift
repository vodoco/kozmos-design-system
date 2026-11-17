// FileUpload.mdx's SwiftUI snippet ("A button"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct ClientLogoButton: View {
    var body: some View {
        KozmosFileUpload(
            allowedContentTypes: [.png, .jpeg],
            onFileSelected: { url in print(url.lastPathComponent) },
            browseLabel: "Add logo",
            preview: .image,
            variant: .button
        )
    }
}
