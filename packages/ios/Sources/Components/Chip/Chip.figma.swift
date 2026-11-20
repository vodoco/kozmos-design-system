import SwiftUI
import Figma

struct KozmosChipConnect: FigmaConnect {
    let component = KozmosChip<EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=227-1329"

    @FigmaString("Label Text")
    var label: String = "Chip"

    @FigmaEnum(
        "Variant",
        mapping: [
            "Neutral": KozmosChipVariant.neutral,
            "Brand": KozmosChipVariant.brand,
            "Destructive": KozmosChipVariant.destructive
        ]
    )
    var chipVariant: KozmosChipVariant = .neutral

    // GAP-170, decision 200: one of Tag's six emotions, deciding the colour
    // whatever the Variant. None is a chip in its variant's colours.
    @FigmaEnum(
        "Emotion",
        mapping: [
            "None": nil,
            "Themed": KozmosEmotion.themed,
            "Neutral": KozmosEmotion.neutral,
            "Success": KozmosEmotion.success,
            "Danger": KozmosEmotion.danger,
            "Informative": KozmosEmotion.informative,
            "Alert": KozmosEmotion.alert
        ]
    )
    var emotion: KozmosEmotion? = nil

    @FigmaEnum(
        "Size",
        mapping: [
            "Small": KozmosChipSize.sm,
            "Default": KozmosChipSize.`default`,
            "Large": KozmosChipSize.lg
        ]
    )
    var size: KozmosChipSize = .default

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Selected": "selected",
            "Disabled": "disabled"
        ]
    )
    var state: String = "default"

    @FigmaEnum(
        "Removable",
        mapping: [
            "False": false,
            "True": true
        ]
    )
    var removable: Bool = false

    var body: some View {
        KozmosChip(
            text: self.label,
            variant: self.chipVariant,
            emotion: self.emotion,
            size: self.size,
            selected: self.state == "selected",
            disabled: self.state == "disabled",
            onRemove: self.removable ? {} : nil
        )
    }
}
