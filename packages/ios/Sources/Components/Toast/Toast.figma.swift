import SwiftUI
import Figma

// Tone is KozmosToast's `tone` (GAP-167), as React's and Compose's: a mark
// at the start in the tone's colour, or none for Neutral.
//
// Close Always Visible (GAP-268) is not mapped: SwiftUI has no hover, so its
// close shows the whole time the toast does, which is the property on.
struct KozmosToastBasicConnect: FigmaConnect {
    let component = KozmosToast.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8189"
    var variant = ["Content": "Basic"]

    @FigmaEnum(
        "Tone",
        mapping: [
            "Neutral": KozmosToastTone.neutral,
            "Success": KozmosToastTone.success,
            "Info": KozmosToastTone.info,
            "Warning": KozmosToastTone.warning,
            "Critical": KozmosToastTone.critical
        ]
    )
    var tone: KozmosToastTone = .neutral

    @FigmaString("Title Text")
    var title: String = "Notification"

    @FigmaString("Description Text")
    var description: String = "Your changes have been saved."

    var body: some View {
        KozmosToast(
            isPresented: .constant(true),
            title: self.title,
            description: self.description,
            autoDismissAfter: nil,
            tone: self.tone
        )
    }
}

struct KozmosToastActionConnect: FigmaConnect {
    let component = KozmosToast.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8189"
    var variant = ["Content": "Action"]

    @FigmaEnum(
        "Tone",
        mapping: [
            "Neutral": KozmosToastTone.neutral,
            "Success": KozmosToastTone.success,
            "Info": KozmosToastTone.info,
            "Warning": KozmosToastTone.warning,
            "Critical": KozmosToastTone.critical
        ]
    )
    var tone: KozmosToastTone = .neutral

    @FigmaString("Title Text")
    var title: String = "Notification"

    @FigmaString("Description Text")
    var description: String = "Your changes have been saved."

    @FigmaString("Action Text")
    var actionTitle: String = "Undo"

    var body: some View {
        KozmosToast(
            isPresented: .constant(true),
            title: self.title,
            description: self.description,
            actionTitle: self.actionTitle,
            autoDismissAfter: nil,
            tone: self.tone,
            onAction: {}
        )
    }
}
