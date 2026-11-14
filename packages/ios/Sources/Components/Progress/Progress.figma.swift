import SwiftUI
import Figma

// The bar: the set's Shape=Linear variants with a value, in the flow or at
// the top (GAP-159's Placement). One connect per Value, so Value=
// Indeterminate matches only the indeterminate bar's connect below and its
// snippet is never the determinate one's.
struct KozmosProgressZeroConnect: FigmaConnect {
    let component = KozmosProgress.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252"
    var variant = ["Shape": "Linear", "Value": "0"]

    @FigmaEnum(
        "Placement",
        mapping: [
            "Inline": KozmosProgressPlacement.inline,
            "Top": KozmosProgressPlacement.top
        ]
    )
    var placement: KozmosProgressPlacement = .inline

    var body: some View {
        KozmosProgress(value: 0, placement: self.placement)
    }
}

struct KozmosProgressQuarterConnect: FigmaConnect {
    let component = KozmosProgress.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252"
    var variant = ["Shape": "Linear", "Value": "25"]

    @FigmaEnum(
        "Placement",
        mapping: [
            "Inline": KozmosProgressPlacement.inline,
            "Top": KozmosProgressPlacement.top
        ]
    )
    var placement: KozmosProgressPlacement = .inline

    var body: some View {
        KozmosProgress(value: 0.25, placement: self.placement)
    }
}

struct KozmosProgressHalfConnect: FigmaConnect {
    let component = KozmosProgress.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252"
    var variant = ["Shape": "Linear", "Value": "50"]

    @FigmaEnum(
        "Placement",
        mapping: [
            "Inline": KozmosProgressPlacement.inline,
            "Top": KozmosProgressPlacement.top
        ]
    )
    var placement: KozmosProgressPlacement = .inline

    var body: some View {
        KozmosProgress(value: 0.5, placement: self.placement)
    }
}

struct KozmosProgressThreeQuartersConnect: FigmaConnect {
    let component = KozmosProgress.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252"
    var variant = ["Shape": "Linear", "Value": "75"]

    @FigmaEnum(
        "Placement",
        mapping: [
            "Inline": KozmosProgressPlacement.inline,
            "Top": KozmosProgressPlacement.top
        ]
    )
    var placement: KozmosProgressPlacement = .inline

    var body: some View {
        KozmosProgress(value: 0.75, placement: self.placement)
    }
}

struct KozmosProgressFullConnect: FigmaConnect {
    let component = KozmosProgress.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=83-252"
    var variant = ["Shape": "Linear", "Value": "100"]

    @FigmaEnum(
        "Placement",
        mapping: [
            "Inline": KozmosProgressPlacement.inline,
            "Top": KozmosProgressPlacement.top
        ]
    )
    var placement: KozmosProgressPlacement = .inline

    var body: some View {
        KozmosProgress(value: 1, placement: self.placement)
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
