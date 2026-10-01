import SwiftUI

public enum KozmosChipVariant {
    case neutral
    case brand
    case destructive
}

public enum KozmosChipSize {
    case sm
    case `default`
    case lg
}

public struct KozmosChip<Icon: View>: View {
    public let text: String
    public let variant: KozmosChipVariant
    public let size: KozmosChipSize
    public let selected: Bool
    public let disabled: Bool
    /// Full accessible label for the remove button; defaults to "Remove <text>".
    public let removeLabel: String
    public let icon: Icon?
    public let onRemove: (() -> Void)?
    public let action: (() -> Void)?

    public init(
        text: String,
        variant: KozmosChipVariant = .neutral,
        size: KozmosChipSize = .default,
        selected: Bool = false,
        active: Bool? = nil,
        disabled: Bool = false,
        removeLabel: String? = nil,
        onRemove: (() -> Void)? = nil,
        @ViewBuilder icon: () -> Icon,
        action: (() -> Void)? = nil
    ) {
        self.text = text
        self.variant = variant
        self.size = size
        self.selected = active ?? selected
        self.disabled = disabled
        self.removeLabel = removeLabel ?? "Remove \(text)"
        self.icon = icon()
        self.onRemove = onRemove
        self.action = action
    }

    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            // The chip's own element when remove sits beside it; otherwise
            // the whole chip is (below).
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                if let icon {
                    icon
                        .frame(width: 16, height: 16)
                }

                Text(text)
                    .font(.system(size: fontSize, weight: .medium))
                    .lineLimit(1)
            }
            .modifier(ChipSemantics(text: text, selected: selected, disabled: disabled, action: action,
                                    role: onRemove == nil ? .none : .chip))

            if let onRemove {
                Button {
                    guard !disabled else { return }
                    onRemove()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 10, weight: .bold))
                        .frame(width: 20, height: 20)
                        .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(removeLabel)
            }
        }
        .padding(.horizontal, horizontalPadding)
        .padding(.vertical, verticalPadding)
        .frame(minHeight: minHeight)
        .foregroundColor(foregroundColor)
        .background(backgroundColor)
        .clipShape(Capsule())
        .overlay(
            Capsule().stroke(borderColor, lineWidth: 1)
        )
        .opacity(disabled ? 0.5 : 1)
        .contentShape(Capsule())
        .onTapGesture {
            guard !disabled else { return }
            action?()
        }
        .modifier(ChipSemantics(text: text, selected: selected, disabled: disabled, action: action,
                                role: onRemove == nil ? .chip : .container))
        // Heard as dimmed, not only drawn at half strength: the chip and its
        // remove button both, as React's disabled buttons are. Outside the
        // chip's element, or the element is not the one marked.
        .disabled(disabled)
    }

    private var horizontalPadding: CGFloat {
        switch size {
        case .sm:
            return KozmosDimensions.primitivesLayoutSpacing100
        case .default:
            return KozmosDimensions.primitivesLayoutSpacing150
        case .lg:
            return KozmosDimensions.primitivesLayoutSpacing200
        }
    }

    private var verticalPadding: CGFloat {
        return KozmosDimensions.primitivesLayoutSpacing0
    }

    private var fontSize: CGFloat {
        switch size {
        case .sm:
            return 12
        case .default, .lg:
            return 14
        }
    }

    private var minHeight: CGFloat {
        switch size {
        case .sm:
            return 28
        case .default:
            return 32
        case .lg:
            return 36
        }
    }

    private var backgroundColor: Color {
        if selected {
            switch variant {
            case .destructive:
                return KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundIdle
            case .neutral, .brand:
                return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
            }
        }

        switch variant {
        case .neutral:
            return KozmosColors.primitivesColorsBackground0
        case .brand:
            return KozmosColors.primitivesColorsTheme0
        case .destructive:
            return KozmosColors.primitivesColorsEmotionalDanger0
        }
    }

    private var foregroundColor: Color {
        if selected {
            switch variant {
            case .destructive:
                return KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentIdle
            case .neutral, .brand:
                return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
            }
        }

        switch variant {
        case .neutral:
            return KozmosColors.primitivesColorsForeground100
        case .brand:
            return KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentIdle
        case .destructive:
            return KozmosColors.componentsSecondaryButtonsDangerButtonForegroundContentIdle
        }
    }

    private var borderColor: Color {
        if selected {
            switch variant {
            case .destructive:
                return KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundIdle
            case .neutral, .brand:
                return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
            }
        }

        switch variant {
        case .neutral:
            return KozmosColors.primitivesColorsBackground200
        case .brand:
            return KozmosColors.primitivesColorsTheme200
        case .destructive:
            return KozmosColors.primitivesColorsEmotionalDanger200
        }
    }
}

/// What VoiceOver is given for a chip (review finding N4).
///
/// A chip with an action is a button, and says whether it is selected, as
/// React's `aria-pressed` does: selection used to change only the colours.
/// Its double-tap runs its action. A chip with no action is text — a tag says
/// what a place is, it is not a choice — so it is never a button or a
/// selection, whatever its colours say.
///
/// A removable chip is two controls, as on the web: the chip, and remove, a
/// button of its own named by the chip. They were one element until
/// 2026-09-29, and that element's double-tap was remove's: the only way to
/// choose a removable chip with VoiceOver was to lose it.
private struct ChipSemantics: ViewModifier {
    enum Role {
        /// The chip's element: its name, its traits and its double-tap.
        case chip
        /// Holds the chip's element and its remove button, side by side.
        case container
        /// Part of an element drawn around it.
        case none
    }

    let text: String
    let selected: Bool
    let disabled: Bool
    let action: (() -> Void)?
    let role: Role

    @ViewBuilder
    func body(content: Content) -> some View {
        switch role {
        case .chip:
            if let action {
                content
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(text)
                    .accessibilityAddTraits(selected ? [.isButton, .isSelected] : .isButton)
                    .accessibilityAction {
                        guard !disabled else { return }
                        action()
                    }
            } else {
                content
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(text)
                    .accessibilityAddTraits(.isStaticText)
            }
        case .container:
            content.accessibilityElement(children: .contain)
        case .none:
            content
        }
    }
}

public extension KozmosChip where Icon == EmptyView {
    init(
        text: String,
        variant: KozmosChipVariant = .neutral,
        size: KozmosChipSize = .default,
        selected: Bool = false,
        active: Bool? = nil,
        disabled: Bool = false,
        removeLabel: String? = nil,
        onRemove: (() -> Void)? = nil,
        action: (() -> Void)? = nil
    ) {
        self.text = text
        self.variant = variant
        self.size = size
        self.selected = active ?? selected
        self.disabled = disabled
        self.removeLabel = removeLabel ?? "Remove \(text)"
        self.icon = nil
        self.onRemove = onRemove
        self.action = action
    }
}

public struct KozmosChipGroup<Content: View>: View {
    let spacing: CGFloat
    let content: Content

    public init(
        spacing: CGFloat = KozmosDimensions.primitivesLayoutSpacing100,
        @ViewBuilder content: () -> Content
    ) {
        self.spacing = spacing
        self.content = content()
    }

    public var body: some View {
        if #available(iOS 16.0, macOS 13.0, *) {
            ViewThatFits(in: .horizontal) {
                HStack(spacing: spacing) { content }
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: spacing) { content }
                }
            }
        } else {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: spacing) { content }
            }
        }
    }
}
