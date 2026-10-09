import SwiftUI

public enum KozmosNavigationItemPlacement {
    case top
    case side
    case rail
}

/// How roomy a top or side item is. A rail item has one size and draws the
/// same with `.compact` as without it: the 64pt compact tile is retired, and
/// a rail item fills its rail (decision 42).
public enum KozmosNavigationItemDensity {
    case `default`
    case compact
}

public enum KozmosNavigationItemContent {
    case label
    case iconLabel
    case iconOnly
    case badge
    case trailing
}

public enum KozmosNavigationItemState {
    case `default`
    case hover
    case selected
    case focus
    case disabled
}

public struct KozmosNavigationItem: View {
    let label: String?
    let placement: KozmosNavigationItemPlacement
    let density: KozmosNavigationItemDensity
    let content: KozmosNavigationItemContent
    let state: KozmosNavigationItemState
    let selected: Bool
    let disabled: Bool
    let focusVisible: Bool
    let action: () -> Void
    private let icon: AnyView?
    private let badge: AnyView?
    private let trailing: AnyView?

    public init(
        label: String? = nil,
        placement: KozmosNavigationItemPlacement = .side,
        density: KozmosNavigationItemDensity = .default,
        content: KozmosNavigationItemContent = .label,
        state: KozmosNavigationItemState = .default,
        selected: Bool = false,
        disabled: Bool = false,
        focusVisible: Bool = false,
        action: @escaping () -> Void = {}
    ) {
        self.init(
            label: label,
            placement: placement,
            density: density,
            content: content,
            state: state,
            selected: selected,
            disabled: disabled,
            focusVisible: focusVisible,
            icon: nil,
            badge: nil,
            trailing: nil,
            action: action
        )
    }

    public init<Icon: View>(
        label: String? = nil,
        placement: KozmosNavigationItemPlacement = .side,
        density: KozmosNavigationItemDensity = .default,
        content: KozmosNavigationItemContent = .iconLabel,
        state: KozmosNavigationItemState = .default,
        selected: Bool = false,
        disabled: Bool = false,
        focusVisible: Bool = false,
        action: @escaping () -> Void = {},
        @ViewBuilder icon: () -> Icon
    ) {
        self.init(
            label: label,
            placement: placement,
            density: density,
            content: content,
            state: state,
            selected: selected,
            disabled: disabled,
            focusVisible: focusVisible,
            icon: AnyView(icon()),
            badge: nil,
            trailing: nil,
            action: action
        )
    }

    public init<Icon: View, Badge: View>(
        label: String? = nil,
        placement: KozmosNavigationItemPlacement = .side,
        density: KozmosNavigationItemDensity = .default,
        state: KozmosNavigationItemState = .default,
        selected: Bool = false,
        disabled: Bool = false,
        focusVisible: Bool = false,
        action: @escaping () -> Void = {},
        @ViewBuilder icon: () -> Icon,
        @ViewBuilder badge: () -> Badge
    ) {
        self.init(
            label: label,
            placement: placement,
            density: density,
            content: .badge,
            state: state,
            selected: selected,
            disabled: disabled,
            focusVisible: focusVisible,
            icon: AnyView(icon()),
            badge: AnyView(badge()),
            trailing: nil,
            action: action
        )
    }

    public init<Icon: View, Trailing: View>(
        label: String? = nil,
        placement: KozmosNavigationItemPlacement = .side,
        density: KozmosNavigationItemDensity = .default,
        state: KozmosNavigationItemState = .default,
        selected: Bool = false,
        disabled: Bool = false,
        focusVisible: Bool = false,
        action: @escaping () -> Void = {},
        @ViewBuilder icon: () -> Icon,
        @ViewBuilder trailing: () -> Trailing
    ) {
        self.init(
            label: label,
            placement: placement,
            density: density,
            content: .trailing,
            state: state,
            selected: selected,
            disabled: disabled,
            focusVisible: focusVisible,
            icon: AnyView(icon()),
            badge: nil,
            trailing: AnyView(trailing()),
            action: action
        )
    }

    private init(
        label: String?,
        placement: KozmosNavigationItemPlacement,
        density: KozmosNavigationItemDensity,
        content: KozmosNavigationItemContent,
        state: KozmosNavigationItemState,
        selected: Bool,
        disabled: Bool,
        focusVisible: Bool,
        icon: AnyView?,
        badge: AnyView?,
        trailing: AnyView?,
        action: @escaping () -> Void
    ) {
        self.label = label
        self.placement = placement
        self.density = density
        self.content = content
        self.state = state
        self.selected = selected
        self.disabled = disabled
        self.focusVisible = focusVisible
        self.icon = icon
        self.badge = badge
        self.trailing = trailing
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            Group {
                if placement == .rail {
                    railContent
                } else {
                    rowContent
                }
            }
            .padding(contentPadding)
            .frame(minHeight: minHeight)
            .background(backgroundColor)
            .foregroundColor(foregroundColor)
            .clipShape(shape)
            // The selected rail item's 2pt bar, down its trailing edge: the
            // right, and the left in a right-to-left layout.
            .overlay(alignment: .trailing) {
                if placement == .rail && isSelected {
                    Rectangle()
                        .fill(KozmosColors.primitivesColorsTheme600)
                        .frame(width: 2)
                }
            }
            // A rail item rings its focus inside itself: it fills a rail that
            // scrolls, which would clip a ring drawn across its edge.
            .overlay(
                shape.inset(by: placement == .rail ? 1 : 0)
                    .stroke(focusRingColor, lineWidth: isFocusVisible ? 2 : 0)
            )
        }
        // The plain style draws a disabled item at half, as React's
        // `opacity-50`; a second opacity here dimmed it twice, to a quarter.
        .buttonStyle(.plain)
        .disabled(isDisabled)
        .accessibilityLabel(label ?? "")
        .accessibilityValue(isSelected ? "Selected" : "")
    }

    private var rowContent: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            if shouldRenderIcon, let icon = icon {
                icon
                    .frame(width: 20, height: 20)
            }

            if shouldRenderLabel, let label = label {
                Text(label)
                    .font(KozmosTypography.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(1)
                    .truncationMode(.tail)
                    .frame(
                        maxWidth: placement == .side ? .infinity : nil,
                        alignment: .leading
                    )
            }

            if shouldRenderBadge, let badge = badge {
                badge
                    .font(KozmosTypography.caption)
                    .padding(.horizontal, 6)
                    .frame(minHeight: 20)
                    .background(KozmosColors.primitivesColorsBackground0)
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(KozmosColors.primitivesColorsBackground200, lineWidth: 1))
            }

            if shouldRenderTrailing, let trailing = trailing {
                trailing
                    .foregroundColor(KozmosColors.primitivesColorsForeground500)
            }
        }
    }

    // Decision 42: the dashboard side menu's item. It fills its rail, a 96pt
    // one, and grows with its label: a 24pt icon 6pt above a regular caption2
    // label (11pt at the default text size) on 14pt lines, up to two, as
    // React's is 11px on 14px.
    private var railContent: some View {
        VStack(spacing: 6) {
            if shouldRenderIcon, let icon = icon {
                icon
                    .frame(width: 24, height: 24)
            }

            if shouldRenderLabel, let label = label {
                Text(label)
                    .font(KozmosTypography.caption2)
                    .fontWeight(.regular)
                    .lineSpacing(KozmosTypography.caption2On14ptLineSpacing)
                    .lineLimit(2)
                    .truncationMode(.tail)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var isSelected: Bool {
        selected || state == .selected
    }

    private var isDisabled: Bool {
        disabled || state == .disabled
    }

    private var isFocusVisible: Bool {
        focusVisible || state == .focus
    }

    private var shouldRenderIcon: Bool {
        content != .label && icon != nil
    }

    private var shouldRenderLabel: Bool {
        content != .iconOnly
    }

    private var shouldRenderBadge: Bool {
        content == .badge && badge != nil
    }

    private var shouldRenderTrailing: Bool {
        content == .trailing && trailing != nil
    }

    /// A rail item grows with its label; top and side items are 44 at least.
    /// No placement has a width of its own: a rail item fills its rail.
    private var minHeight: CGFloat? {
        placement == .rail ? nil : 44
    }

    private var contentPadding: EdgeInsets {
        if placement == .rail {
            return EdgeInsets(top: 16, leading: 8, bottom: 16, trailing: 8)
        }

        let horizontal = density == .compact ? 10.0 : 12.0
        return EdgeInsets(top: 8, leading: horizontal, bottom: 8, trailing: horizontal)
    }

    /// A rail item is square, so its selected bar runs the whole height of
    /// its trailing edge.
    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: placement == .rail ? 0 : KozmosDimensions.semanticsRadiusControl)
    }

    private var backgroundColor: Color {
        // Selected, a rail item is on theme/0, the lightest theme step: with
        // theme/600 on it, a pair the contrast contract holds at 4.5:1 in
        // both themes. Theme/500 is one colour in both, and on dark theme/0
        // it would be 2.9:1.
        if placement == .rail && isSelected {
            return KozmosColors.primitivesColorsTheme0
        }
        if isSelected || state == .hover || state == .focus {
            return KozmosColors.primitivesColorsBackground100
        }
        return Color.clear
    }

    private var foregroundColor: Color {
        if isDisabled {
            return KozmosColors.primitivesColorsForeground500
        }
        if placement == .rail {
            return isSelected ? KozmosColors.primitivesColorsTheme600 : KozmosColors.primitivesColorsForeground400
        }
        // Theme-coloured text and rings on a surface are theme 600, as
        // React's (decision 59); 500 read 3.13:1 on a dark sheet.
        if isSelected {
            return KozmosColors.primitivesColorsTheme600
        }
        return KozmosColors.primitivesColorsForeground100
    }

    private var focusRingColor: Color {
        isFocusVisible ? KozmosColors.primitivesColorsTheme600 : Color.clear
    }
}
