import SwiftUI
import Figma

// The set is new on 2026-09-21: Build CategoryField in the importer, then put
// the node id its log prints here and add this file and CategoryField.swift to
// packages/ios/figma.linked.config.json. Until then the file is not published.
struct KozmosCategoryFieldConnect: FigmaConnect {
    let component = KozmosCategoryField<Image>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1933-9257"

    @FigmaString("Label Text")
    var label: String = "Gates"

    // The Tint axis: Theme is the field with no category, the component's own
    // default (accent theme 600, the count pill the theme fill, decision 59);
    // the eight are the taxonomy's quick-access colours as the
    // Semantics.Category tokens.
    @FigmaEnum(
        "Tint",
        mapping: [
            "Theme": KozmosCategoryTint(accent: KozmosColors.primitivesColorsTheme600, fill: KozmosInkedFill(fill: KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle, ink: KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle)),
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
    var tint: KozmosCategoryTint = KozmosCategoryTint(accent: KozmosColors.primitivesColorsTheme600, fill: KozmosInkedFill(fill: KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle, ink: KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle))

    // Show Count is count being set; Count Text carries the number.
    @FigmaBoolean("Show Count")
    var showCount: Bool = true

    var body: some View {
        KozmosCategoryField(
            label: self.label,
            count: self.showCount ? 12 : nil,
            tint: self.tint,
            onClear: {}
        ) {
            Image(systemName: "bus")
        }
    }
}
