import SwiftUI
import Figma

struct KozmosLocationPinConnect: FigmaConnect {
    let component = KozmosLocationPin.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6847"

    @FigmaString("Label Text")
    var label: String = "Cafe"

    @FigmaEnum(
        "Size",
        mapping: [
            "Sm": KozmosLocationPinSize.sm,
            "Md": KozmosLocationPinSize.md,
            "Lg": KozmosLocationPinSize.lg
        ]
    )
    var size: KozmosLocationPinSize = .md

    @FigmaEnum(
        "State",
        mapping: ["Default": false, "Selected": true, "Featured": false, "OffFloor": false, "Disabled": false]
    )
    var selected: Bool = false

    @FigmaEnum(
        "State",
        mapping: ["Default": false, "Selected": false, "Featured": true, "OffFloor": false, "Disabled": false]
    )
    var featured: Bool = false

    @FigmaEnum(
        "State",
        mapping: ["Default": false, "Selected": false, "Featured": false, "OffFloor": true, "Disabled": false]
    )
    var offFloor: Bool = false

    @FigmaEnum(
        "State",
        mapping: ["Default": false, "Selected": false, "Featured": false, "OffFloor": false, "Disabled": true]
    )
    var isDisabled: Bool = false

    // The Tint axis: Theme is a pin with no tint; the eight are the
    // taxonomy's quick-access colours as the Semantics.Category tokens — the
    // fill is the marker, its ink the number; a featured pin keeps the
    // accent.
    @FigmaEnum(
        "Tint",
        mapping: [
            "Theme": nil,
            "Yellow": KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentYellow, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillYellow, ink: KozmosColors.semanticsCategoryOnfillYellow)),
            "Orange": KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentOrange, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillOrange, ink: KozmosColors.semanticsCategoryOnfillOrange)),
            "Turquoise": KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentTurquoise, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillTurquoise, ink: KozmosColors.semanticsCategoryOnfillTurquoise)),
            "Red": KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentRed, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillRed, ink: KozmosColors.semanticsCategoryOnfillRed)),
            "Blue": KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentBlue, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillBlue, ink: KozmosColors.semanticsCategoryOnfillBlue)),
            "Navy": KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentNavy, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillNavy, ink: KozmosColors.semanticsCategoryOnfillNavy)),
            "Green": KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentGreen, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillGreen, ink: KozmosColors.semanticsCategoryOnfillGreen)),
            "Pink": KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentPink, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillPink, ink: KozmosColors.semanticsCategoryOnfillPink))
        ]
    )
    var tint: KozmosCategoryTint? = nil

    // variant is a per-venue colour role and labelPlacement belongs to the map
    // renderer, so neither is a Figma variant axis.
    var body: some View {
        KozmosLocationPin(
            size: self.size,
            label: self.label,
            selected: self.selected,
            featured: self.featured,
            offFloor: self.offFloor,
            isDisabled: self.isDisabled,
            tint: self.tint
        )
    }
}
