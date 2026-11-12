import SwiftUI

public struct KozmosRadioGroup<Content: View>: View {
    let content: Content
    
    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            content
        }
    }
}

/// How a radio option is drawn (GAP-158, decision 132): the ring and its
/// label, a card with an image or icon, a title and a description, or a tile,
/// an icon over a short title, for a grid of choices.
public enum KozmosRadioGroupItemVariant: Sendable {
    case `default`
    case card
    case tile
}

public struct KozmosRadioGroupItem<Media: View>: View {
    let value: String
    let label: String?
    let description: String?
    let variant: KozmosRadioGroupItemVariant
    let disabled: Bool
    let error: Bool
    let media: Media?
    @Binding var selection: String
    @Environment(\.kozmosAnalytics) var trackEvent

    /// A card or tile with media: an image (a card's, drawn across its top)
    /// or an icon (a tile's, drawn over its title). The media is decoration:
    /// VoiceOver hears the title, then the description.
    public init(
        value: String,
        label: String? = nil,
        description: String? = nil,
        variant: KozmosRadioGroupItemVariant = .default,
        selection: Binding<String>,
        disabled: Bool = false,
        error: Bool = false,
        @ViewBuilder media: () -> Media
    ) {
        self.value = value
        self.label = label
        self.description = description
        self.variant = variant
        self._selection = selection
        self.disabled = disabled
        self.error = error
        self.media = media()
    }

    public var body: some View {
        Button(action: {
            trackEvent(KozmosAnalyticsEvent(eventName: "radio_selection_changed", component: "RadioGroup", properties: ["value": value]))
            selection = value
        }) {
            switch variant {
            case .default: defaultBody
            case .card: cardBody
            case .tile: tileBody
            }
        }
        .buttonStyle(PlainButtonStyle())
        // The chosen radio is selected, as React's `aria-checked`: VoiceOver
        // heard only the name, and the state only the dot showed.
        .accessibilityAddTraits(isSelected ? .isSelected : [])
        // A card or tile is one radio with one name, its title, whatever
        // its media and description say; the description is read after it
        // as custom content, as React's is its `aria-describedby`. With no
        // title it has no name: an icon-only tile takes the caller's
        // .accessibilityLabel(_:).
        .kozmosControlDescription(label: label, description: description, nameFromLabel: variant != .default)
        .disabled(disabled)
        // An untitled card or tile says so once in a debug build (GAP-158).
        .onAppear { KozmosUntitledOption.log(variant: variant, label: label) }
    }

    private var defaultBody: some View {
        HStack(alignment: description == nil ? .center : .top, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            mark
            KozmosControlText(label: label, description: description, labelColor: labelColor, disabled: disabled)
        }
        // A 44pt target, all of it hittable, with a label or without
        // one: a plain button's frame adds nothing without a content
        // shape, and the radio took a tap only on its ring and its
        // label's words. Without a label the mark stays at the leading
        // edge of its 44pt square.
        .frame(minWidth: 44, minHeight: 44, alignment: .leading)
        .contentShape(Rectangle())
    }

    /// The ring, and its dot when chosen.
    private var mark: some View {
        ZStack {
            Circle()
                .stroke(controlColor, lineWidth: 1)
                .frame(width: 20, height: 20)

            if isSelected {
                Circle()
                    .fill(dotColor)
                    .frame(width: 10, height: 10)
            }
        }
    }

    /// A card: its media across the top, then the ring beside the title and
    /// the description. Chosen, the edge turns theme 600 and 2pt and the dot
    /// shows, so the choice is never told by colour alone.
    private var cardBody: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            if let media = media {
                media
                    // An icon given no colour of its own takes the theme's
                    // full ink, foreground/0, as a tile's and React's do.
                    // Left to the platform it was the system label colour,
                    // which on macOS is a translucent white, not Kozmos's.
                    .foregroundColor(titleColor)
                    .environment(\.kozmosIconHostInk, titleColor)
                    .frame(maxWidth: .infinity)
                    // Concentric with the card: its radius less its 12
                    // inset (docs/nested-radius.md), 20 - 12 = 8.
                    .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer - KozmosDimensions.primitivesLayoutSpacing150, style: .continuous))
                    .accessibilityHidden(true)
            }
            HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                mark
                titleAndDescription(alignment: .leading)
                    .padding(.top, 1)
                Spacer(minLength: 0)
            }
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing150)
        .frame(maxWidth: .infinity, minHeight: 44, alignment: .topLeading)
        .overlay(edge)
        .contentShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer, style: .continuous))
    }

    /// A tile: the icon over the title, centred. Chosen, the edge turns
    /// theme 600 and 2pt and a check badge shows at the top trailing corner.
    private var tileBody: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            if let media = media {
                media
                    .foregroundColor(iconColor)
                    .environment(\.kozmosIconHostInk, iconColor)
                    .accessibilityHidden(true)
            }
            titleAndDescription(alignment: .center)
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing150)
        // At least 96, as React's min-h-24 and Figma's tile.
        .frame(maxWidth: .infinity, minHeight: 96)
        .overlay(edge)
        .overlay(alignment: .topTrailing) {
            if isSelected {
                checkBadge
                    .padding(KozmosDimensions.primitivesLayoutSpacing100)
            }
        }
        .contentShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer, style: .continuous))
    }

    private func titleAndDescription(alignment: HorizontalAlignment) -> some View {
        let textAlignment: TextAlignment = alignment == .center ? .center : .leading
        return VStack(alignment: alignment, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            if let label = label {
                Text(label)
                    .font(KozmosTypography.subheadline.weight(.medium))
                    .foregroundColor(titleColor)
                    .multilineTextAlignment(textAlignment)
            }
            if let description = description {
                KozmosControlDescriptionText(description, disabled: disabled, alignment: textAlignment)
            }
        }
        .fixedSize(horizontal: false, vertical: true)
    }

    /// The card's and tile's edge: the subtle border, or chosen theme 600
    /// at 2pt, drawn inside the box so the choice moves nothing.
    private var edge: some View {
        RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer, style: .continuous)
            .strokeBorder(edgeColor, lineWidth: isSelected ? 2 : 1)
    }

    private var checkBadge: some View {
        ZStack {
            Circle()
                .fill(badgeColor)
            Image(systemName: "checkmark")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(disabled ? KozmosColors.primitivesColorsBackground0 : KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle)
        }
        .frame(width: 20, height: 20)
        .accessibilityHidden(true)
    }

    private var edgeColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        if isSelected { return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsTheme600 }
        return KozmosColors.semanticsBorderSubtle
    }

    private var badgeColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
    }

    private var iconColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        return isSelected ? KozmosColors.primitivesColorsTheme600 : KozmosColors.primitivesColorsForeground0
    }

    private var titleColor: Color {
        disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground0
    }

    private var isSelected: Bool {
        selection == value
    }

    /// Decision 59: the ring is a border on the surface, theme 600, as
    /// React's; the dot is a fill, the theme fill, theme 500 in both themes.
    private var controlColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        if isSelected { return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsTheme600 }
        return KozmosColors.primitivesColorsForeground500
    }

    private var dotColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
    }

    private var labelColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        // Full ink, foreground/0, as React's text-foreground label is: every
        // control's label is the same colour on every platform (11 Nov).
        return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground0
    }
}


public extension KozmosRadioGroupItem where Media == EmptyView {
    /// An option with no media: the ring and its label, or a card or tile
    /// of words only.
    init(
        value: String,
        label: String? = nil,
        description: String? = nil,
        variant: KozmosRadioGroupItemVariant = .default,
        selection: Binding<String>,
        disabled: Bool = false,
        error: Bool = false
    ) {
        self.value = value
        self.label = label
        self.description = description
        self.variant = variant
        self._selection = selection
        self.disabled = disabled
        self.error = error
        self.media = nil
    }
}
