import SwiftUI
import Figma

struct KozmosLinkConnect: FigmaConnect {
    let component = KozmosLink.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-1385"

    @FigmaString("Link Text")
    var label: String = "Docs"

    // GAP-202: External shows the new-tab icon.
    @FigmaBoolean("External")
    var external: Bool = false

    var body: some View {
        KozmosLink(
            self.label,
            destination: URL(string: "https://kozmos.design")!,
            external: self.external
        )
    }
}
