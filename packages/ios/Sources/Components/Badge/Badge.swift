import SwiftUI

public struct KozmosBadge: View {
    let text: String
    let variant: KozmosBadgeVariant
    let size: KozmosBadgeSize
    let counter: String?
    let showCounter: Bool
    
    public enum KozmosBadgeVariant {
        case `default`
        case secondary
        case destructive
        case outline
        case ghost
        case link
        case success
    }

    public enum KozmosBadgeSize {
        case `default`
        case sm
        case lg
        case icon
    }
    
    public init(
        _ text: String,
        variant: KozmosBadgeVariant = .default,
        size: KozmosBadgeSize = .default,
        counter: String? = nil,
        showCounter: Bool = false
    ) {
        self.text = text
        self.variant = variant
        self.size = size
        self.counter = counter
        self.showCounter = showCounter
    }
    
    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            Text(text)
                .font(KozmosTypography.subheadline)
                .fontWeight(.medium)
                .underline(variant == .link)

            if hasCounter, let counter {
                KozmosCounter(counter, tone: counterTone, fill: counterFill)
            }
        }
            .padding(.horizontal, horizontalPadding)
            .padding(.vertical, 0)
            .frame(minWidth: size == .icon ? 44 : nil, minHeight: 44)
            .background(backgroundColor)
            .foregroundColor(foregroundColor)
            .cornerRadius(KozmosDimensions.semanticsRadiusMarker)
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusMarker)
                    .stroke(borderColor, lineWidth: variant == .outline ? 1 : 0)
            )
    }

    private var horizontalPadding: CGFloat {
        switch size {
        case .sm: return KozmosDimensions.primitivesLayoutSpacing150
        case .default: return KozmosDimensions.primitivesLayoutSpacing200
        case .lg: return KozmosDimensions.primitivesLayoutSpacing400
        case .icon: return 0
        }
    }

    private var backgroundColor: Color {
        switch variant {
        case .default:
            return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
        case .secondary:
            return KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundIdle
        case .destructive:
            return KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundIdle
        case .success:
            return KozmosColors.semanticsDataTeal
        case .outline, .ghost, .link:
            return Color.clear
        }
    }

    private var foregroundColor: Color {
        switch variant {
        case .default:
            return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
        case .secondary:
            return KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentIdle
        case .destructive:
            return KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentIdle
        case .success:
            return KozmosColors.primitivesColorsForeground1000
        case .outline, .ghost, .link:
            return KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentIdle
        }
    }

    private var borderColor: Color {
        variant == .outline ? KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentIdle : Color.clear
    }

    private var hasCounter: Bool {
        size != .icon && showCounter && counter != nil
    }

    /// On a default Badge, itself the theme fill, the counter inverts — the
    /// theme foreground with its number in the fill, white in both
    /// appearances — as FloorSelector's count does on its selected level
    /// (Olcay, 2026-10-07). The inverse tone was background/0, a black pill
    /// on the fill in the dark. Every other variant keeps its tone.
    private var counterFill: KozmosInkedFill? {
        guard variant == .default else { return nil }
        return KozmosInkedFill(
            fill: KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle,
            ink: KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
        )
    }

    private var counterTone: KozmosCounterTone {
        switch variant {
        case .default, .destructive, .success:
            return .inverse
        case .secondary, .outline, .ghost, .link:
            return .neutral
        }
    }
}
