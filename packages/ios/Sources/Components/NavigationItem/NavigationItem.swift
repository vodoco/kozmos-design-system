import SwiftUI
#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif

public enum KozmosNavigationItemPlacement {
    case top
    case side
    case rail
}

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
            .frame(width: fixedWidth)
            .frame(minHeight: minHeight)
            .background(backgroundColor)
            .foregroundColor(foregroundColor)
            .clipShape(shape)
            .overlay(
                shape.stroke(focusRingColor, lineWidth: isFocusVisible ? 2 : 0)
            )
        }
        .buttonStyle(.plain)
        .disabled(isDisabled)
        .opacity(isDisabled ? 0.5 : 1)
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

    // Every rail tile's label is caption2, 11pt at the default text size, on
    // 14pt lines and up to two of them, as React's is 11px on 14px (decision
    // 36): one size for every tile. Two lines keep the tile 72pt tall.
    private var railContent: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            if shouldRenderIcon, let icon = icon {
                icon
                    .frame(width: 24, height: 24)
            }

            if shouldRenderLabel, let label = label {
                Text(label)
                    .font(KozmosTypography.caption2)
                    .fontWeight(.semibold)
                    .lineSpacing(Self.railLabelLineSpacing)
                    .lineLimit(2)
                    .truncationMode(.tail)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
    }

    /// What SwiftUI adds between a rail label's lines to set them 14pt apart
    /// at the default text size: 14 less caption2's own line, 13.1pt of SF
    /// Pro at 11pt. From the next size up, caption2's own line height is
    /// taller than that (18pt for its 13pt) and SwiftUI sets the lines by it,
    /// so the line grows with the text without this growing too.
    static let railLabelLineSpacing: CGFloat = {
        #if canImport(UIKit)
        let caption2 = UIFont.preferredFont(
            forTextStyle: .caption2,
            compatibleWith: UITraitCollection(preferredContentSizeCategory: .large)
        )
        return max(0, 14 - caption2.lineHeight)
        #else
        let caption2 = NSFont.preferredFont(forTextStyle: .caption2)
        return max(0, 14 - (caption2.ascender - caption2.descender + caption2.leading))
        #endif
    }()

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

    private var minHeight: CGFloat {
        if placement == .rail {
            return density == .compact ? 64 : 72
        }
        return 44
    }

    private var fixedWidth: CGFloat? {
        switch placement {
        case .rail:
            return density == .compact ? 64 : 72
        case .side:
            return nil
        case .top:
            return nil
        }
    }

    private var contentPadding: EdgeInsets {
        if placement == .rail {
            return EdgeInsets(top: 8, leading: 8, bottom: 8, trailing: 8)
        }

        let horizontal = density == .compact ? 10.0 : 12.0
        return EdgeInsets(top: 8, leading: horizontal, bottom: 8, trailing: horizontal)
    }

    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
    }

    private var backgroundColor: Color {
        if isSelected || state == .hover || state == .focus {
            return KozmosColors.primitivesColorsBackground100
        }
        return Color.clear
    }

    private var foregroundColor: Color {
        if isDisabled {
            return KozmosColors.primitivesColorsForeground500
        }
        if isSelected {
            return KozmosColors.primitivesColorsTheme500
        }
        return KozmosColors.primitivesColorsForeground100
    }

    private var focusRingColor: Color {
        isFocusVisible ? KozmosColors.primitivesColorsTheme500 : Color.clear
    }
}
