import SwiftUI
import Figma

// GAP-206, GAP-207: Variant is variant, Solid or Glass. Content Slot is the
// view's content.
struct KozmosSurfaceConnect: FigmaConnect {
    let component = KozmosSurface<RoundedRectangle, EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-18490"

    @FigmaEnum(
        "Variant",
        mapping: [
            "Solid": KozmosSurfaceStyle.solid,
            "Glass": KozmosSurfaceStyle.glass
        ]
    )
    var style: KozmosSurfaceStyle = .solid

    var body: some View {
        KozmosSurface(variant: self.style) {
            Text("Content")
        }
    }
}
