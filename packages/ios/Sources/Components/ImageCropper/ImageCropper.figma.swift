import SwiftUI
import Figma

// GAP-273: the ImageCropper set, built by the importer in the live file.
// Ratio is the frame's shape: Square is 1, Landscape 16:9.
struct KozmosImageCropperConnect: FigmaConnect {
    let component = KozmosImageCropper.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2516-15104"

    @FigmaEnum(
        "Ratio",
        mapping: [
            "Square": 1.0,
            "Landscape": 16.0 / 9.0
        ]
    )
    var aspectRatio: Double = 1.0

    @FigmaBoolean("Zoom Controls")
    var showZoomControls: Bool = true

    var body: some View {
        KozmosImageCropper(
            image: Image("ClientLogo"),
            imageSize: CGSize(width: 1600, height: 1200),
            crop: .constant(nil),
            aspectRatio: self.aspectRatio,
            showZoomControls: self.showZoomControls
        )
    }
}
