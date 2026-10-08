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
    let fillsWidth: Bool
    let leadingIconName: String?
    let action: () -> Void
    @Environment(\.kozmosButtonFillsCell) private var fillsCell
    
    /// A labelled action. `leadingIconName` is a decorative KozmosIcon name; loading
    /// replaces it with the spinner. Existing label-only calls are unchanged.
    public init(
        _ label: String,
        variant: KozmosButtonVariant = .default,
        emotion: KozmosButtonEmotion? = nil,
        size: KozmosButtonSize = .default,
        isDisabled: Bool = false,
        isLoading: Bool = false,
        fillsWidth: Bool = false,
        leadingIconName: String? = nil,
        action: @escaping () -> Void
    ) {
        self.label = label
        self.variant = variant
        self.emotion = emotion
        self.size = size
        self.isDisabled = isDisabled
        self.isLoading = isLoading
        self.fillsWidth = fillsWidth
        self.leadingIconName = leadingIconName
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            KozmosButtonInteractionReader { isPressed, isFocused in
                let foregroundColor = self.foregroundColor(isPressed: isPressed, isFocused: isFocused)
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    if isLoading {
                        // The system's arc at the small size, not `ProgressView`:
                        // one drawing on all four platforms (2026-09-22). Hidden
                        // from assistive technology — the button is already
                        // disabled and named, and a second live region for one
                        // wait is a defect.
                        KozmosSpinner(size: .sm, color: foregroundColor)
                            .accessibilityHidden(true)
                    } else if let leadingIconName {
                        KozmosIcon(leadingIconName)
                            .environment(\.kozmosIconHostInk, foregroundColor)
                            .fixedSize()
                            .accessibilityHidden(true)
                    }
                    Text(label)
                        .font(KozmosTypography.subheadline)
                        .fontWeight(.medium)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(padding)
                .padding(.vertical, size == .icon ? 0 : KozmosDimensions.primitivesLayoutSpacing100)
                .foregroundColor(foregroundColor)
                .frame(
                    minWidth: size == .icon ? 44 : nil,
                    maxWidth: fillsWidth || fillsCell && size != .icon ? .infinity : nil,
                    minHeight: 44,
                    maxHeight: fillsCell && size != .icon ? .infinity : nil
                )
                .kozmosButtonSurface(
                    variant == .glass ? .glass : nil,
                    fill: backgroundColor(isPressed: isPressed, isFocused: isFocused),
                    stroke: borderColor,
                    strokeWidth: variant == .outline ? 1 : 0,
                    // The corner the button always had; a continuous one would move every baseline.
                    shape: RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                )
            }
        }
        .disabled(isDisabled || isLoading)
        // Loading, it is disabled, and drawn at half as a disabled part is.
        .opacity(isDisabled || isLoading ? 0.5 : 1)
        .kozmosFillButtonStyle(fillEmotion, hoverShape: RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
    }

    /// The emotion whose Primary Buttons tokens fill the button at rest,
    /// pressed and focused, or nil when it is not a fill. A filled variant
    /// takes its emotion; unset, the default variant is the theme fill, the
    /// destructive the danger and the secondary the neutral, as React and
    /// Compose read them. Outline, ghost, link and glass keep SwiftUI's press.
    var fillEmotion: KozmosButtonEmotion? {
        switch variant {
        case .default: return emotion ?? .themed
        case .destructive: return emotion ?? .danger
        case .secondary: return emotion ?? .neutral
        case .outline, .ghost, .link, .glass: return nil
        }
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
    
    private func backgroundColor(isPressed: Bool, isFocused: Bool) -> Color {
        guard let fillEmotion else { return backgroundColor }
        return KozmosFillStates.background(fillEmotion, isPressed: isPressed, isFocused: isFocused)
    }

    /// The fill's own ink in each state: the secondary variant with no
    /// emotion is the neutral fill and draws the neutral ink, black in light
    /// and white in dark, as React and Compose do (decision 61; Olcay,
    /// 2026-10-08). It drew foreground/100, #17191C and #E8E6E3.
    private func foregroundColor(isPressed: Bool, isFocused: Bool) -> Color {
        guard let fillEmotion else { return foregroundColor }
        return KozmosFillStates.foreground(fillEmotion, isPressed: isPressed, isFocused: isFocused)
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
        // Decision 59: the secondary tier's words, as React and Compose draw them.
        case .outline, .ghost, .link: return KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentIdle
        // Decision 61: the neutral fill's own ink.
        case .secondary: return KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentIdle
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

private struct KozmosButtonFillsCellKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    /// Set by a Kozmos layout that owns its buttons' cells — RouteSummary's
    /// actions, in `KozmosEqualColumnsLayout` — so a labelled KozmosButton
    /// fills the cell it is offered, across and down, as the web's grid
    /// stretches it. An icon button keeps its 44 square.
    var kozmosButtonFillsCell: Bool {
        get { self[KozmosButtonFillsCellKey.self] }
        set { self[KozmosButtonFillsCellKey.self] = newValue }
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
