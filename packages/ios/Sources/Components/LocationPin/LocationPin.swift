import SwiftUI

/// Colour role of a map marker, mirroring the React `LocationPin.variant` prop.
public enum KozmosLocationPinVariant: String, CaseIterable, Sendable {
    case `default`
    case primary
    case secondary
    case accent
}

/// Marker footprint, mirroring the React `LocationPin.size` prop.
public enum KozmosLocationPinSize: String, CaseIterable, Sendable {
    case sm
    case md
    case lg

    var diameter: CGFloat {
        switch self {
        case .sm: return 24
        case .md: return 32
        case .lg: return 40
        }
    }
}

/// Where the marker's label sits relative to the marker.
public enum KozmosLocationPinLabelPlacement: String, CaseIterable, Sendable {
    case top
    case right
    case bottom
    case left
}

/// A map marker for a point of interest.
///
/// Mirrors the React `LocationPin` API. Selection, featured, off-floor, and
/// disabled are independent flags rather than one state axis, matching React,
/// so a pin can be both featured and selected. Placement on the map and
/// collision handling stay with the renderer.
public struct KozmosLocationPin: View {
    private let variant: KozmosLocationPinVariant
    private let size: KozmosLocationPinSize
    private let label: String?
    private let number: Int?
    private let labelPlacement: KozmosLocationPinLabelPlacement
    private let selected: Bool
    private let featured: Bool
    private let offFloor: Bool
    private let isDisabled: Bool
    private let onSelect: (() -> Void)?
    /// A category's colours for the marker — its fill, with its ink for the
    /// number — over the variant's; a featured pin keeps the alert colour.
    private let tint: KozmosCategoryTint?

    public init(
        variant: KozmosLocationPinVariant = .primary,
        size: KozmosLocationPinSize = .md,
        label: String? = nil,
        number: Int? = nil,
        labelPlacement: KozmosLocationPinLabelPlacement = .bottom,
        selected: Bool = false,
        featured: Bool = false,
        offFloor: Bool = false,
        isDisabled: Bool = false,
        onSelect: (() -> Void)? = nil,
        tint: KozmosCategoryTint? = nil
    ) {
        self.variant = variant
        self.size = size
        self.label = label
        self.number = number
        self.labelPlacement = labelPlacement
        self.selected = selected
        self.featured = featured
        self.offFloor = offFloor
        self.isDisabled = isDisabled
        self.onSelect = onSelect
        self.tint = tint
    }

    private var markerColor: Color {
        if featured { return KozmosColors.primitivesColorsEmotionalAlert500 }
        if let tint { return tint.fill.fill }
        switch variant {
        case .default: return KozmosColors.primitivesColorsForeground100
        // Decision 59: a filled primary pin is a prominent fill, the theme
        // fill. `accent` is an open parity question and stays.
        case .primary: return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
        case .secondary: return KozmosColors.primitivesColorsForeground400
        case .accent: return KozmosColors.primitivesColorsThemeVariant1500
        }
    }

    /// Selected pins grow as well as recolor, so selection is not colour-only.
    private var diameter: CGFloat {
        selected ? size.diameter + 8 : size.diameter
    }

    /// Decision 55 (Olcay, 2026-09-29): a numbered pin on this floor is quiet
    /// at rest — the surface, a ring and the number in its colour — and filled
    /// only when selected, as the result card's number tab is. A featured pin
    /// (its logo on the map) and a pin with no number keep their fill.
    private var isQuiet: Bool {
        number != nil && !selected && !featured && !offFloor
    }

    /// Quiet and off the floor both draw the outlined marker; off the floor
    /// its ring is dashed, so the two never read alike.
    private var isOutlined: Bool { isQuiet || offFloor }

    /// The marker's colour as a ring and a number on the surface, where it
    /// must read at 4.5:1 in both themes. The theme's 500 is one blue in
    /// both, 3.74:1 on the dark surface, so the primary takes the theme's
    /// text role (theme/600), and the accent its 700 (theme variant 1's 600
    /// reads 4.21:1 in the dark). The others are inks already.
    private var outlineColor: Color {
        if featured { return KozmosColors.primitivesColorsEmotionalAlert500 }
        if let tint { return tint.fill.fill }
        switch variant {
        case .default: return KozmosColors.primitivesColorsForeground100
        case .primary: return KozmosColors.semanticsEmotionThemedText
        case .secondary: return KozmosColors.primitivesColorsForeground400
        case .accent: return KozmosColors.primitivesColorsThemeVariant1700
        }
    }

    /// The number: in the fill's ink when filled; in the ring's colour when
    /// quiet, except a tint's (six of the eight fills fail 4.5:1 as text on
    /// the surface), which takes the foreground, as it does off the floor.
    /// On the featured amber, #FAB735, it is the alert's on-fill, black, the
    /// dark words decision 55 gives Featured, whatever the tint: foreground/1000
    /// was white in light, 1.77:1. On the primary's theme fill and the
    /// accent's theme variant 1, #4134F1, it is the theme foreground, white in
    /// both themes (decision 59): foreground/1000 is black in the dark, 2.99:1
    /// on the accent, where white reads 7.03:1. As Compose draws them.
    private var numberColor: Color {
        if offFloor || (isQuiet && tint != nil) { return KozmosColors.primitivesColorsForeground0 }
        if isQuiet { return outlineColor }
        if featured { return KozmosColors.semanticsEmotionAlertOnfill }
        if let tint { return tint.fill.ink }
        if variant == .primary || variant == .accent { return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle }
        return KozmosColors.primitivesColorsForeground1000
    }

    /// Off the floor the ring is dashed: eight dashes, sized to close evenly
    /// around the ring at every diameter.
    private func ringStyle(width: CGFloat) -> StrokeStyle {
        guard offFloor else { return StrokeStyle(lineWidth: width) }
        let segment = CGFloat.pi * (diameter - width) / 8
        // Round caps add half the width at each end of a dash.
        return StrokeStyle(lineWidth: width, lineCap: .round, dash: [segment * 0.62 - width, segment * 0.38 + width])
    }

    private var accessibilityDescription: String {
        [
            label,
            number.map { "\($0)" },
            featured ? "Featured" : nil,
            offFloor ? "On another floor" : nil
        ]
        .compactMap { $0 }
        .joined(separator: ", ")
    }

    public var body: some View {
        content
            .opacity(isDisabled ? 0.5 : 1)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(accessibilityDescription)
            .accessibilityAddTraits(accessibilityTraits)
            .accessibilityAction { if !isDisabled { onSelect?() } }
    }

    /// Selected whether or not the pin can be pressed, as React's
    /// `aria-current` and Compose's `selected` say it: a pin drawn with no
    /// `onSelect`, or a disabled one, still marks the selected place. A button
    /// only when it can be pressed.
    private var accessibilityTraits: AccessibilityTraits {
        var traits: AccessibilityTraits = []
        if !isDisabled, onSelect != nil { traits.insert(.isButton) }
        if selected { traits.insert(.isSelected) }
        return traits
    }

    @ViewBuilder
    private var content: some View {
        switch labelPlacement {
        case .top:
            VStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                labelView
                marker
            }
        case .bottom:
            VStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                marker
                labelView
            }
        case .left:
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                labelView
                marker
            }
        case .right:
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                marker
                labelView
            }
        }
    }

    private var marker: some View {
        ZStack {
            // Outlined — quiet at rest, or off the floor — the fill drops out
            // and the marker colour moves to the ring. Off the floor the ring
            // is dashed (eight long dashes, which read as a dashed ring, not
            // the cogwheel short ones made), so shape carries the floor, never
            // colour alone, and a quiet pin at rest is never taken for one on
            // another floor.
            Circle()
                .fill(isOutlined ? KozmosColors.primitivesColorsBackground0 : markerColor)
                .frame(width: diameter, height: diameter)

            Circle()
                .strokeBorder(
                    isOutlined ? outlineColor : KozmosColors.primitivesColorsForeground1000,
                    style: ringStyle(width: isOutlined ? 3 : 2)
                )
                .frame(width: diameter, height: diameter)

            // Off the floor the number sits on the background in the
            // foreground: the marker colour on white failed 4.5:1 for six
            // tints (Olcay, 2026-09-21); the ring keeps the colour.
            if let number {
                Text("\(number)")
                    .font(.system(size: diameter * 0.44, weight: .bold))
                    .foregroundColor(numberColor)
            }
        }
        .shadow(color: KozmosColors.primitivesColorsForeground900.opacity(0.24), radius: 4, y: 2)
    }

    @ViewBuilder
    private var labelView: some View {
        if let label {
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundColor(KozmosColors.primitivesColorsForeground100)
                .lineLimit(1)
        }
    }
}
