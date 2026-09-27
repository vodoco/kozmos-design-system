import SwiftUI

public enum KozmosButtonVariant {
    case `default`
    case destructive
    case outline
    case secondary
    case ghost
    case link
    case glass
}

public enum KozmosButtonSize {
    case `default`
    case sm
    case lg
    case icon
}

public enum KozmosButtonEmotion {
    case themed
    case neutral
    case success
    case danger
    case informative
    case alert
}

/// Which token tier a variant's shape belongs to. Primary is filled,
/// Secondary is bordered or text; `glass` is an effect and takes no emotion.
enum KozmosButtonTier {
    case primary
    case secondary
}

public struct KozmosButton: View {
    let label: String
    let variant: KozmosButtonVariant
    let emotion: KozmosButtonEmotion?
    let size: KozmosButtonSize
    let isDisabled: Bool
    let isLoading: Bool
    let action: () -> Void
    
    public init(
        _ label: String,
        variant: KozmosButtonVariant = .default,
        emotion: KozmosButtonEmotion? = nil,
        size: KozmosButtonSize = .default,
        isDisabled: Bool = false,
        isLoading: Bool = false,
        action: @escaping () -> Void
    ) {
        self.label = label
        self.variant = variant
        self.emotion = emotion
        self.size = size
        self.isDisabled = isDisabled
        self.isLoading = isLoading
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                if isLoading {
                    // The system's arc at the small size, not `ProgressView`:
                    // one drawing on all four platforms (2026-09-22). Hidden
                    // from assistive technology — the button is already
                    // disabled and named, and a second live region for one
                    // wait is a defect.
                    KozmosSpinner(size: .sm, color: foregroundColor)
                        .accessibilityHidden(true)
                }
                Text(label)
                    .font(KozmosTypography.subheadline)
                    .fontWeight(.medium)
            }
            .padding(padding)
            .foregroundColor(foregroundColor)
            .frame(
                minWidth: size == .icon ? 44 : nil,
                minHeight: 44
            )
            .kozmosButtonSurface(
                variant == .glass ? .glass : nil,
                fill: backgroundColor,
                stroke: borderColor,
                strokeWidth: variant == .outline ? 1 : 0,
                // The corner the button always had; a continuous one would move every baseline.
                shape: RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
            )
        }
        .disabled(isDisabled || isLoading)
        .opacity(isDisabled ? 0.5 : 1)
    }
    

    

    /// The tier this variant reads, or nil when the variant is an effect.
    private var tier: KozmosButtonTier? {
        switch variant {
        case .default, .secondary, .destructive: return .primary
        case .outline, .ghost, .link: return .secondary
        case .glass: return nil
        }
    }

    private static func emotionBackground(_ tier: KozmosButtonTier, _ emotion: KozmosButtonEmotion) -> Color {
        switch (tier, emotion) {
        case (.primary, .themed): return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
        case (.primary, .neutral): return KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundIdle
        case (.primary, .success): return KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundIdle
        case (.primary, .danger): return KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundIdle
        case (.primary, .informative): return KozmosColors.componentsPrimaryButtonsInformativeButtonBackgroundIdle
        case (.primary, .alert): return KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundIdle
        case (.secondary, .themed): return KozmosColors.componentsSecondaryButtonsThemedButtonBackgroundIdle
        case (.secondary, .neutral): return KozmosColors.componentsSecondaryButtonsNeutralButtonBackgroundIdle
        case (.secondary, .success): return KozmosColors.componentsSecondaryButtonsSuccessButtonBackgroundIdle
        case (.secondary, .danger): return KozmosColors.componentsSecondaryButtonsDangerButtonBackgroundIdle
        case (.secondary, .informative): return KozmosColors.componentsSecondaryButtonsInformativeButtonBackgroundIdle
        case (.secondary, .alert): return KozmosColors.componentsSecondaryButtonsAlertButtonBackgroundIdle
        }
    }

    private static func emotionForeground(_ tier: KozmosButtonTier, _ emotion: KozmosButtonEmotion) -> Color {
        switch (tier, emotion) {
        case (.primary, .themed): return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
        case (.primary, .neutral): return KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentIdle
        case (.primary, .success): return KozmosColors.componentsPrimaryButtonsSuccessButtonForegroundContentIdle
        case (.primary, .danger): return KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentIdle
        case (.primary, .informative): return KozmosColors.componentsPrimaryButtonsInformativeButtonForegroundContentIdle
        case (.primary, .alert): return KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentIdle
        case (.secondary, .themed): return KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentIdle
        case (.secondary, .neutral): return KozmosColors.componentsSecondaryButtonsNeutralButtonForegroundContentIdle
        case (.secondary, .success): return KozmosColors.componentsSecondaryButtonsSuccessButtonForegroundContentIdle
        case (.secondary, .danger): return KozmosColors.componentsSecondaryButtonsDangerButtonForegroundContentIdle
        case (.secondary, .informative): return KozmosColors.componentsSecondaryButtonsInformativeButtonForegroundContentIdle
        case (.secondary, .alert): return KozmosColors.componentsSecondaryButtonsAlertButtonForegroundContentIdle
        }
    }

    private var padding: EdgeInsets {
        switch size {
        case .default: return EdgeInsets(top: 0, leading: KozmosDimensions.primitivesLayoutSpacing200, bottom: 0, trailing: KozmosDimensions.primitivesLayoutSpacing200)
        case .sm: return EdgeInsets(top: 0, leading: KozmosDimensions.primitivesLayoutSpacing150, bottom: 0, trailing: KozmosDimensions.primitivesLayoutSpacing150)
        case .lg: return EdgeInsets(top: 0, leading: KozmosDimensions.primitivesLayoutSpacing400, bottom: 0, trailing: KozmosDimensions.primitivesLayoutSpacing400)
        case .icon: return EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 0)
        }
    }
    
    private var backgroundColor: Color {
        if let emotion, let tier {
            // A bordered or text button keeps its transparent ground; only a
            // filled one takes the emotion's background.
            switch variant {
            case .outline, .ghost, .link: return Color.clear
            default: return Self.emotionBackground(tier, emotion)
            }
        }
        switch variant {
        case .default: return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle // Used specific component token
        case .destructive: return KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundIdle
        case .outline, .ghost: return Color.clear
        case .secondary: return KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundIdle
        case .link: return Color.clear
        // The glass variant is the glass surface; the fill is the surface's.
        case .glass: return Color.clear
        }
    }
    
    private var foregroundColor: Color {
        if let emotion, let tier {
            return Self.emotionForeground(tier, emotion)
        }
        switch variant {
        case .default: return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle // Semantic Token
        case .destructive: return KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentIdle
        case .outline, .ghost, .link: return KozmosColors.primitivesColorsTheme500
        case .secondary: return KozmosColors.primitivesColorsForeground100
        case .glass: return KozmosColors.primitivesColorsForeground100
        }
    }
    
    private var borderColor: Color {
        if let emotion, let tier, variant == .outline {
            return Self.emotionForeground(tier, emotion)
        }
        switch variant {
        case .outline: return KozmosColors.primitivesColorsForeground300
        default: return Color.clear
        }
    }
}

extension View {
    /// A button's surface: the glass surface role for the glass variant —
    /// composed from `Semantics.Effect.glass`, as every glass surface is —
    /// or the variant's own fill and edge.
    @ViewBuilder
    func kozmosButtonSurface<S: InsettableShape>(
        _ style: KozmosSurfaceStyle?,
        fill: Color,
        stroke: Color,
        strokeWidth: CGFloat,
        shape: S
    ) -> some View {
        if let style {
            kozmosSurface(shape, style: style)
        } else {
            background(fill)
                .clipShape(shape)
                .overlay(shape.stroke(stroke, lineWidth: strokeWidth))
        }
    }
}
