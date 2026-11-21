import SwiftUI
import Figma

struct KozmosAvatarConnect: FigmaConnect {
    let component = KozmosAvatar.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-272"

    @FigmaString("Image URL")
    var imageURL: String = ""

    @FigmaString("Fallback")
    var fallback: String = "KO"

    // Decision 221: Sm is 24, for a row that keeps its own height, such as
    // an option's media.
    @FigmaEnum(
        "Size",
        mapping: [
            "Default": KozmosAvatarSize.default,
            "Sm": KozmosAvatarSize.sm
        ]
    )
    var size: KozmosAvatarSize = .default

    var body: some View {
        KozmosAvatar(
            imageURL: URL(string: self.imageURL),
            fallbackText: self.fallback,
            size: self.size
        )
    }
}
