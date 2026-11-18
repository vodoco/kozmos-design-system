// FileUpload.mdx's SwiftUI snippet ("Limits and their messages"), word for
// word below this comment: compiled here, so a renamed or removed parameter
// fails in this target rather than in a reader's project. Change the two
// together.
import SwiftUI
import Kozmos

struct FloorPlans: View {
    var body: some View {
        KozmosFileUpload(
            allowedContentTypes: [.pdf],
            onFileSelected: { url in print(url.lastPathComponent) },
            browseLabel: "Grundrisse hochladen",
            tooManyFilesLabel: { "Höchstens \($0) Dateien." },
            tooLargeLabel: { name, limit in "\(name) ist größer als \(limit)." },
            onFilesChange: { urls in print(urls.count) },
            maxSize: 10 * 1024 * 1024,
            maxFiles: 3
        )
    }
}
