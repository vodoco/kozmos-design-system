import SwiftUI
import Figma

// GAP-216, decision 225: Overflow=Wrap is wrap, the default; Scroll is
// wrap: false. Copy is copyable. The label names the block and is the
// product's.
struct KozmosCodeBlockConnect: FigmaConnect {
    let component = KozmosCodeBlock.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68538"

    @FigmaString("Code Text")
    var code: String = "{ \"fid\": \"f-1209\" }"

    @FigmaBoolean("Copy")
    var copyable: Bool = false

    @FigmaEnum(
        "Overflow",
        mapping: [
            "Wrap": true,
            "Scroll": false
        ]
    )
    var wrap: Bool = true

    var body: some View {
        KozmosCodeBlock(self.code, label: "Merged unit", wrap: self.wrap, copyable: self.copyable)
    }
}
