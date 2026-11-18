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
    let counter: Int?
    let counterLabel: (Int) -> String
    let action: () -> Void
    /// False under a `.disabled` set round the button: drawn as `isDisabled` is.
    @Environment(\.isEnabled) private var isEnabled

    /// - Parameters:
    ///   - counter: A count at the button's top-end corner (GAP-197): the tours
    ///     left on a help button, unread notices. Drawn as `KozmosCounter` is,
    ///     small, in the theme fill (`.brand`), not a `KozmosBadge`, which is a
    ///     status (decision 93). Its bottom edge is on the button's centre line
    ///     and its leading edge 2 past it, so it covers the icon's top-trailing
    ///     corner, and the top-left right to left. VoiceOver reads the count
    ///     as the button's value, after its name: "Help, 3". The number drawn
    ///     is hidden, so it is not read twice. `nil`, the default, draws no
    ///     counter: pass `nil` rather than 0 to hide it.
    ///   - counterLabel: What the count is read as, in the product's language:
    ///     `{ "\($0) tours left" }`. The number alone by default. React's
    ///     `counterSeparator` has no counterpart: VoiceOver pauses between a
    ///     name and a value itself.
    public init(
        iconName: String,
        variant: KozmosIconButtonVariant = .ghost,
        size: KozmosIconButtonSize = .default,
        isDisabled: Bool = false,
        isLoading: Bool = false,
        counter: Int? = nil,
        counterLabel: @escaping (Int) -> String = { String($0) },
        action: @escaping () -> Void
    ) {
        self.iconName = iconName
        self.variant = variant
        self.size = size
        self.isDisabled = isDisabled
        self.isLoading = isLoading
        self.counter = counter
        self.counterLabel = counterLabel
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            KozmosButtonInteractionReader { isPressed, isFocused in
                let foregroundColor = self.foregroundColor(isPressed: isPressed, isFocused: isFocused)
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
                .frame(width: side, height: side)
                .kozmosButtonSurface(
                    variant == .glass ? .glass : nil,
                    fill: backgroundColor(isPressed: isPressed, isFocused: isFocused),
                    stroke: borderColor,
                    strokeWidth: variant == .outline ? 1 : 0,
                    shape: Circle()
                )
                .overlay(alignment: .topLeading) { counterMark }
            }
        }
        .disabled(isDisabled || isLoading)
        // The count is the button's value: VoiceOver says the name a caller
        // gives with `accessibilityLabel`, then the count, as React's name
        // reads "Help, 3".
        // An empty value is no value: a button with no counter reads as it
        // did, and one whose count comes and goes keeps its identity.
        .accessibilityValue(Text(verbatim: counter.map(counterLabel) ?? ""))
        // Disabled, it is drawn from the disabled pair (decision 197), not at
        // half. Loading, it takes no touch but keeps its variant's look.
        .kozmosFillButtonStyle(fillEmotion, hoverShape: Circle())
    }

    private var side: CGFloat { size == .lg ? 48 : 44 }

    /// The counter (GAP-197), as React's `.kozmos-icon-button-counter`: its
    /// bottom edge on the button's centre line and its leading edge 2 past
    /// it, at every size. On a disabled button it is the disabled pair
    /// inverted (decision 197): its pill the disabled foreground and its
    /// digits the disabled fill, 4.80:1 in light and 6.51:1 in dark. It
    /// takes no tap and VoiceOver skips it.
    @ViewBuilder private var counterMark: some View {
        if let counter {
            KozmosCounter(String(counter), tone: .brand, size: .sm,
                          fill: drawsDisabled ? KozmosInkedFill(fill: KozmosColors.semanticsDisabledForeground,
                                                                ink: KozmosColors.semanticsDisabledFill) : nil)
                .fixedSize()
                // From the top-leading corner: half the button and 2 across,
                // and down to where its 18 ends on the centre line. Leading
                // padding is mirrored right to left, as React's inset-inline is.
                .padding(.leading, side / 2 + 2)
                .padding(.top, side / 2 - 18)
                .allowsHitTesting(false)
                .accessibilityHidden(true)
        }
    }

    /// The emotion whose Primary Buttons tokens fill the button at rest,
    /// pressed and focused: the default variant is the theme fill, the
    /// destructive the danger and the secondary the neutral, as in Compose.
    /// The others keep SwiftUI's own press.
    var fillEmotion: KozmosButtonEmotion? {
        switch variant {
        case .default: return .themed
        case .destructive: return .danger
        case .secondary: return .neutral
        case .outline, .ghost, .link, .glass: return nil
        }
    }

    /// Disabled, or disabled from outside: drawn from the disabled pair
    /// (decision 197, GAP-218), as Button is. Loading alone keeps the
    /// variant's look; disabled and loading draws the pair.
    var drawsDisabled: Bool { isDisabled || !isEnabled }

    private func backgroundColor(isPressed: Bool, isFocused: Bool) -> Color {
        // A filled variant takes the pair's fill, and so does ghost, the
        // icon-only default, so it never reads as an enabled grey ghost.
        // Outline, link and glass gain none.
        if drawsDisabled {
            return fillEmotion != nil || variant == .ghost ? KozmosColors.semanticsDisabledFill : backgroundColor
        }
        guard let fillEmotion else { return backgroundColor }
        return KozmosFillStates.background(fillEmotion, isPressed: isPressed, isFocused: isFocused)
    }

    /// The fill's own ink in each state: the secondary variant is the
    /// neutral fill and draws the neutral ink, black in light and white in
    /// dark, as React and Compose do (decision 61; Olcay, 2026-10-08). It
    /// drew foreground/100, #17191C and #E8E6E3.
    private func foregroundColor(isPressed: Bool, isFocused: Bool) -> Color {
        if drawsDisabled { return KozmosColors.semanticsDisabledForeground }
        guard let fillEmotion else { return foregroundColor }
        return KozmosFillStates.foreground(fillEmotion, isPressed: isPressed, isFocused: isFocused)
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
        // Decision 61: the neutral fill's own ink.
        case .secondary: return KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentIdle
        // Decision 59: the secondary tier's words, as React and Compose draw them.
        case .outline, .ghost, .link: return KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentIdle
        case .glass: return KozmosColors.primitivesColorsForeground100
        }
    }

    private var borderColor: Color {
        if drawsDisabled, variant == .outline { return KozmosColors.semanticsDisabledForeground }
        switch variant {
        case .outline: return KozmosColors.primitivesColorsForeground300
        default: return Color.clear
        }
    }
}

