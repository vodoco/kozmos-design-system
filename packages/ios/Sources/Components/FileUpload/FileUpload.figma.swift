import SwiftUI
import Figma

struct KozmosFileUploadConnect: FigmaConnect {
    let component = KozmosFileUpload.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=444-12724"

    var body: some View {
        KozmosFileUpload(onFileSelected: { _ in })
    }
}

// Content=Preview: one image, shown with Change and Remove (GAP-270).
struct KozmosFileUploadPreviewConnect: FigmaConnect {
    let component = KozmosFileUpload.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=444-12724"
    var variant = ["Content": "Preview"]

    @FigmaString("Change Text")
    var changeLabel: String = "Change"

    var body: some View {
        KozmosFileUpload(onFileSelected: { _ in }, preview: .image, changeLabel: self.changeLabel)
    }
}
