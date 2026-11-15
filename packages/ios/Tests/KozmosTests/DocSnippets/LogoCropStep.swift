// ImageCropper.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The client logo's crop step: a square frame. crop starts nil, the
// middle at 100%, and the cropper writes the frame it draws back, as
// fractions of the image: the product crops. VoiceOver reads the frame as
// one element, swipe up or down zooms, and the Move actions move it.
struct LogoCropStep: View {
    let logo: Image
    let logoSize: CGSize
    @State private var crop: KozmosImageCrop?

    var body: some View {
        KozmosImageCropper(
            image: logo,
            imageSize: logoSize,
            crop: $crop,
            aspectRatio: 1
        )
    }
}
