import SwiftUI

public struct KozmosLabel: View {
    let text: String
    let required: Bool
    let optionalText: String?
    let disabled: Bool

    public init(
        _ text: String = "Label",
        required: Bool = false,
        optionalText: String? = nil,
        disabled: Bool = false
    ) {
        self.text = text
        self.required = required
        self.optionalText = optionalText
        self.disabled = disabled
    }
    
    public var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 4) {
            Text(text)
                .font(.subheadline.weight(.medium))
                .foregroundColor(disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground100)

            if required {
                Text("*")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(KozmosColors.primitivesColorsEmotionalDanger600)
                    .accessibilityHidden(true)
            } else if let optionalText {
                Text(optionalText)
                    .font(KozmosTypography.caption)
                    .foregroundColor(KozmosColors.primitivesColorsForeground400)
            }
        }
        .accessibilityElement(children: .combine)
    }
}
