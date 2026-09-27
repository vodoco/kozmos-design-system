import SwiftUI

public enum KozmosIconButtonVariant {
    case `default`
    case destructive
    case outline
    case secondary
    case ghost
    case link
    case glass
}

public enum KozmosIconButtonSize {
    case `default`
    case sm
    case lg
}

public struct KozmosIconButton: View {
    let iconName: String
    let variant: KozmosIconButtonVariant
    let size: KozmosIconButtonSize
    let isDisabled: Bool
    let isLoading: Bool
    let action: () -> Void
    
    public init(
        iconName: String,
        variant: KozmosIconButtonVariant = .ghost,
        size: KozmosIconButtonSize = .default,
        isDisabled: Bool = false,
        isLoading: Bool = false,
        action: @escaping () -> Void
    ) {
        self.iconName = iconName
        self.variant = variant
        self.size = size
        self.isDisabled = isDisabled
        self.isLoading = isLoading
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            Group {
                if isLoading {
                    // The system's arc at the small size, taking the control's
                    // own foreground — one drawing on all four platforms
                    // (2026-09-22). Hidden from assistive technology: the
                    // control is disabled and already named.
                    KozmosSpinner(size: .sm, color: foregroundColor)
                        .accessibilityHidden(true)
                } else {
                    Image(systemName: iconName)
                        .font(iconFont)
                }
            }
            .foregroundColor(foregroundColor)
            // The large size is the prototype's 48: Filters and the AI search beside a 44 field.
            .frame(width: size == .lg ? 48 : 44, height: size == .lg ? 48 : 44)
            .kozmosButtonSurface(
                variant == .glass ? .glass : nil,
                fill: backgroundColor,
                stroke: borderColor,
                strokeWidth: variant == .outline ? 1 : 0,
                shape: Circle()
            )
        }
        .disabled(isDisabled || isLoading)
        .opacity(isDisabled ? 0.5 : 1)
    }

    private var iconFont: Font {
        switch size {
        case .sm: return .system(size: 14, weight: .medium)
        case .lg: return .system(size: 20, weight: .medium)
        case .default: return .system(size: 16, weight: .medium)
        }
    }

    private var backgroundColor: Color {
        switch variant {
        case .default: return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
        case .destructive: return KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundIdle
        case .secondary: return KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundIdle
        case .outline, .ghost, .link: return Color.clear
        // The glass variant is the glass surface; the fill is the surface's.
        case .glass: return Color.clear
        }
    }

    private var foregroundColor: Color {
        switch variant {
        case .default: return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
        case .destructive: return KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentIdle
        case .secondary: return KozmosColors.primitivesColorsForeground100
        case .outline, .ghost, .link: return KozmosColors.primitivesColorsTheme500
        case .glass: return KozmosColors.primitivesColorsForeground100
        }
    }

    private var borderColor: Color {
        switch variant {
        case .outline: return KozmosColors.primitivesColorsForeground300
        default: return Color.clear
        }
    }
}
