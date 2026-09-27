import SwiftUI
import Figma

struct KozmosSkeletonConnect: FigmaConnect {
    let component = KozmosSkeleton.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-1062"

    // The set's Shape axis is the component's own `shape` since row 56, so the
    // example names the shape instead of drawing it with frames: a line and a
    // circle hold their own size, and a block takes the one the product gives.
    @FigmaEnum(
        "Shape",
        mapping: [
            "Line": KozmosSkeletonShape.line,
            "Block": KozmosSkeletonShape.block,
            "Circle": KozmosSkeletonShape.circle
        ]
    )
    var shape: KozmosSkeletonShape = .line

    var body: some View {
        KozmosSkeleton(shape: self.shape)
    }
}
