import SwiftUI
import Figma

struct KozmosSpinnerConnect: FigmaConnect {
    let component = KozmosSpinner.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-261"

    @FigmaEnum(
        "Size",
        mapping: [
            "Small": "sm",
            "Medium": "md",
            "Large": "lg",
            "XLarge": "xl"
        ]
    )
    var size: String = "md"

    var body: some View {
        // The size is the component's own now, not a frame around it: until
        // 2026-09-22 `KozmosSpinner` took none and Dev Mode showed a spinner
        // wrapped in a `.frame`, which is not how a caller should write one.
        KozmosSpinner(size: KozmosSpinnerSize(rawValue: self.size) ?? .md)
    }
}
