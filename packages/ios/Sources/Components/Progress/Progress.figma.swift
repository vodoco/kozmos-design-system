import SwiftUI
import Figma

// The bar: the set's Shape=Linear variants with a value, in the flow or at
// the top (GAP-159's Placement).
struct KozmosProgressConnect: FigmaConnect {
    let component = KozmosProgress.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252"
    var variant = ["Shape": "Linear"]

    @FigmaEnum(
        "Placement",
        mapping: [
            "Inline": KozmosProgressPlacement.inline,
            "Top": KozmosProgressPlacement.top
        ]
    )
    var placement: KozmosProgressPlacement = .inline

    @FigmaEnum(
        "Value",
        mapping: [
            "0": "0",
            "25": "25",
            "50": "50",
            "75": "75",
            "100": "100"
        ]
    )
    var value: String = "0"

    var body: some View {
        KozmosProgress(value: self.progressValue, placement: self.placement)
    }

    private var progressValue: Double {
        (Double(self.value) ?? 0) / 100
    }
}

// The indeterminate bar (GAP-159): Value=Indeterminate, in the flow or at
// the top. It says "Loading" once when it appears.
struct KozmosProgressIndeterminateConnect: FigmaConnect {
    let component = KozmosProgress.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252"
    var variant = ["Shape": "Linear", "Value": "Indeterminate"]

    @FigmaEnum(
        "Placement",
        mapping: [
            "Inline": KozmosProgressPlacement.inline,
            "Top": KozmosProgressPlacement.top
        ]
    )
    var placement: KozmosProgressPlacement = .inline

    var body: some View {
        KozmosProgress(placement: self.placement)
    }
}

// The ring (decision 131): the Shape=Circular variants, with their Size,
// Tone and Label, in the hole or beside the dial (Label Beside). The value
// is mapped straight to the fraction, so the snippet reads as code a product
// can paste; Show Label is not mapped, and the label is always shown.
struct KozmosProgressCircularConnect: FigmaConnect {
    let component = KozmosProgress.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252"
    var variant = ["Shape": "Circular"]

    @FigmaEnum(
        "Value",
        mapping: [
            "0": 0.0,
            "25": 0.25,
            "50": 0.5,
            "75": 0.75,
            "100": 1.0
        ]
    )
    var value: Double = 0

    @FigmaEnum(
        "Size",
        mapping: [
            "Small": KozmosProgressSize.sm,
            "Medium": KozmosProgressSize.md,
            "Large": KozmosProgressSize.lg
        ]
    )
    var size: KozmosProgressSize = .md

    @FigmaEnum(
        "Tone",
        mapping: [
            "Themed": KozmosEmotion.themed,
            "Neutral": KozmosEmotion.neutral,
            "Success": KozmosEmotion.success,
            "Danger": KozmosEmotion.danger,
            "Informative": KozmosEmotion.informative,
            "Alert": KozmosEmotion.alert
        ]
    )
    var tone: KozmosEmotion = .themed

    @FigmaBoolean(
        "Label Beside",
        mapping: [
            true: KozmosProgressLabelPlacement.end,
            false: KozmosProgressLabelPlacement.center
        ]
    )
    var labelPlacement: KozmosProgressLabelPlacement = .center

    @FigmaString("Label")
    var label: String = "Label"

    var body: some View {
        KozmosProgress(
            value: self.value,
            shape: .circular,
            size: self.size,
            tone: self.tone,
            labelPlacement: self.labelPlacement
        ) {
            Text(self.label)
        }
    }
}
