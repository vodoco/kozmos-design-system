import SwiftUI

/// What a tag means, as opposed to how it is drawn.
///
/// The product drives this axis on 33,988 tag instances across ten surfaces.
/// The colours come from `Semantics.Emotion`, which exists so a tag does not
/// have to borrow a button's tokens.
public enum KozmosEmotion {
    case neutral, themed, success, danger, informative, alert

    var surface: Color {
        switch self {
        case .neutral: return KozmosColors.semanticsEmotionNeutralSurface
        case .themed: return KozmosColors.semanticsEmotionThemedSurface
        case .success: return KozmosColors.semanticsEmotionSuccessSurface
        case .danger: return KozmosColors.semanticsEmotionDangerSurface
        case .informative: return KozmosColors.semanticsEmotionInformativeSurface
        case .alert: return KozmosColors.semanticsEmotionAlertSurface
        }
    }

    var onSurface: Color {
        switch self {
        case .neutral: return KozmosColors.semanticsEmotionNeutralOnsurface
        case .themed: return KozmosColors.semanticsEmotionThemedOnsurface
        case .success: return KozmosColors.semanticsEmotionSuccessOnsurface
        case .danger: return KozmosColors.semanticsEmotionDangerOnsurface
        case .informative: return KozmosColors.semanticsEmotionInformativeOnsurface
        case .alert: return KozmosColors.semanticsEmotionAlertOnsurface
        }
    }

    /// The emotion on the page itself, at the first step of each ramp that
    /// reaches 4.5:1 — which is not the same step for every emotion.
    var text: Color {
        switch self {
        case .neutral: return KozmosColors.semanticsEmotionNeutralText
        case .themed: return KozmosColors.semanticsEmotionThemedText
        case .success: return KozmosColors.semanticsEmotionSuccessText
        case .danger: return KozmosColors.semanticsEmotionDangerText
        case .informative: return KozmosColors.semanticsEmotionInformativeText
        case .alert: return KozmosColors.semanticsEmotionAlertText
        }
    }
}

public struct KozmosTag: View {
    let text: String
    let variant: KozmosTagVariant
    /// Unset and the variant draws as it always has; set and the emotion
    /// decides the colour, whatever the variant.
    let emotion: KozmosEmotion?
    let onRemove: (() -> Void)?
    
    public enum KozmosTagVariant {
        case `default`, secondary, destructive, outline, success
        
        var backgroundColor: Color {
            switch self {
            // Decision 59: a prominent fill, the theme fill.
            case .default: return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
            case .secondary: return KozmosColors.primitivesColorsBackground100
            case .destructive: return KozmosColors.semanticsDataRed
            case .outline: return Color.clear
            case .success: return KozmosColors.semanticsDataTeal
            }
        }
        
        var foregroundColor: Color {
            switch self {
            // The theme foreground on the theme fill, white in both themes:
            // background/0 turned black on it in the dark (3.74:1).
            case .default: return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
            case .destructive, .success: return KozmosColors.primitivesColorsBackground0
            case .secondary, .outline: return KozmosColors.primitivesColorsForeground900
            }
        }
    }
    
    public init(
        _ text: String,
        variant: KozmosTagVariant = .default,
        emotion: KozmosEmotion? = nil,
        onRemove: (() -> Void)? = nil
    ) {
        self.text = text
        self.variant = variant
        self.emotion = emotion
        self.onRemove = onRemove
    }

    private var resolvedBackground: Color {
        guard let emotion else { return variant.backgroundColor }
        return variant == .outline ? Color.clear : emotion.surface
    }

    private var resolvedForeground: Color {
        guard let emotion else { return variant.foregroundColor }
        return variant == .outline ? emotion.text : emotion.onSurface
    }
    
    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            Text(text)
                .font(KozmosTypography.caption)
                .bold()
                .foregroundColor(resolvedForeground)
            
            if let onRemove = onRemove {
                Button(action: onRemove) {
                    Image(systemName: "xmark")
                        .font(KozmosTypography.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(resolvedForeground)
                }
            }
        }
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
        .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing50)
        .background(resolvedBackground)
        .cornerRadius(KozmosDimensions.primitivesLayoutSpacing150)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.primitivesLayoutSpacing150)
                .stroke(variant == .outline ? resolvedForeground.opacity(emotion == nil ? 0.3 : 1) : Color.clear, lineWidth: variant == .outline ? 1 : 0)
        )
    }
}
