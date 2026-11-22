import SwiftUI
import Figma

// Decision 39, GAP-206: Tone is tone, Status Text the words, Show Mark
// showsIcon. live chooses how a change is announced and draws nothing.
struct KozmosMapStatusPillConnect: FigmaConnect {
    let component = KozmosMapStatusPill.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17374"

    @FigmaString("Status Text")
    var text: String = "Preparing Content"

    @FigmaBoolean("Show Mark")
    var showsIcon: Bool = true

    @FigmaEnum(
        "Tone",
        mapping: [
            "Neutral": KozmosMapStatusPillTone.neutral,
            "Progress": KozmosMapStatusPillTone.progress,
            "Success": KozmosMapStatusPillTone.success,
            "Danger": KozmosMapStatusPillTone.danger,
            "Warning": KozmosMapStatusPillTone.warning
        ]
    )
    var tone: KozmosMapStatusPillTone = .neutral

    var body: some View {
        KozmosMapStatusPill(self.text, tone: self.tone, showsIcon: self.showsIcon)
    }
}
