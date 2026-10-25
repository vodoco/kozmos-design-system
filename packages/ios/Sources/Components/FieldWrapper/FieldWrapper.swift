import SwiftUI

public struct KozmosFieldWrapper<Content: View>: View {
    public let label: String?
    public let description: String?
    public let optionalText: String?
    public let required: Bool
    public let hideLabel: Bool
    public let status: KozmosInputStatus
    public let error: Bool
    public let helperText: String?
    public let errorMessage: String?
    private let content: Content

    public init(
        label: String? = nil,
        description: String? = nil,
        optionalText: String? = nil,
        required: Bool = false,
        hideLabel: Bool = false,
        status: KozmosInputStatus = .default,
        error: Bool = false,
        helperText: String? = nil,
        errorMessage: String? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.label = label
        self.description = description
        self.optionalText = optionalText
        self.required = required
        self.hideLabel = hideLabel
        self.status = status
        self.error = error
        self.helperText = helperText
        self.errorMessage = errorMessage
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if shouldShowLabelRow {
                HStack(alignment: .firstTextBaseline, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        if let label = label {
                            Text(label)
                                .font(.subheadline.weight(.semibold))
                                .foregroundColor(labelColor)
                        }
                        if required {
                            Text("*")
                                .font(.subheadline.weight(.semibold))
                                .foregroundColor(KozmosColors.primitivesColorsEmotionalDanger600)
                        }
                    }

                    Spacer(minLength: KozmosDimensions.primitivesLayoutSpacing150)

                    if let optionalText = optionalDisplayText {
                        Text(optionalText)
                            .font(KozmosTypography.caption)
                            .foregroundColor(metaColor)
                    }
                }
            }

            if let description = description, !description.isEmpty {
                Text(description)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(metaColor)
                    .fixedSize(horizontal: false, vertical: true)
            }

            content
                .frame(maxWidth: .infinity, alignment: .leading)

            if let supportingText = supportingText, !supportingText.isEmpty {
                Text(supportingText)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(supportingTextColor)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var effectiveStatus: KozmosInputStatus {
        error ? .error : status
    }

    private var supportingText: String? {
        errorMessage ?? helperText
    }

    private var shouldShowLabelRow: Bool {
        !hideLabel && (label != nil || optionalDisplayText != nil)
    }

    private var optionalDisplayText: String? {
        guard !required else { return nil }
        guard let optionalText = optionalText, !optionalText.isEmpty else { return nil }
        return optionalText
    }

    private var labelColor: Color {
        switch effectiveStatus {
        case .error:
            return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning:
            return KozmosColors.primitivesColorsEmotionalAlert600
        case .success:
            return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default:
            return KozmosColors.primitivesColorsForeground100
        }
    }

    private var supportingTextColor: Color {
        switch effectiveStatus {
        case .error:
            return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning:
            return KozmosColors.primitivesColorsEmotionalAlert600
        case .success:
            return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default:
            return KozmosColors.primitivesColorsForeground400
        }
    }

    private var metaColor: Color {
        KozmosColors.primitivesColorsForeground400
    }
}

public typealias KozmosFormField<Content: View> = KozmosFieldWrapper<Content>
