import SwiftUI

/// A selectable route option.
///
/// Mirrors the React `RouteOptionCard`. The card never changes its own selected
/// state — it reports selection and re-renders from the supplied presentation.
public struct KozmosRouteOptionCard<Icon: View>: View {
    private let option: KozmosRouteOptionPresentation
    private let isDisabled: Bool
    private let onSelect: (String) -> Void
    private let icon: Icon?

    public init(
        option: KozmosRouteOptionPresentation,
        isDisabled: Bool = false,
        onSelect: @escaping (String) -> Void,
        @ViewBuilder icon: () -> Icon
    ) {
        self.option = option
        self.isDisabled = isDisabled
        self.onSelect = onSelect
        self.icon = icon()
    }

    private var disabled: Bool { !option.available || isDisabled }

    private var accessibilityDescription: String {
        [option.label, option.durationLabel, option.distanceLabel, option.warning]
            .compactMap { $0 }
            .joined(separator: ", ")
    }

    public var body: some View {
        Button {
            onSelect(option.id)
        } label: {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    if let icon {
                        // Theme 600 on a surface (decision 59).
                        icon
                            .foregroundColor(KozmosColors.primitivesColorsTheme600)
                            .accessibilityHidden(true)
                    }

                    Text(option.label)
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                        .truncationMode(.tail)
                }

                HStack(alignment: .bottom) {
                    Text(option.durationLabel)
                        .font(.title3.weight(.semibold))

                    Spacer(minLength: KozmosDimensions.primitivesLayoutSpacing150)

                    Text(option.distanceLabel)
                        .font(KozmosTypography.caption)
                        .foregroundColor(KozmosColors.primitivesColorsForeground500)
                }
                .padding(.top, KozmosDimensions.primitivesLayoutSpacing150)

                if let warning = option.warning {
                    Text(warning)
                        .font(KozmosTypography.caption)
                        .foregroundColor(KozmosColors.primitivesColorsEmotionalAlert600)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, KozmosDimensions.primitivesLayoutSpacing100)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 96, alignment: .leading)
            .foregroundColor(KozmosColors.primitivesColorsForeground100)
            .padding(KozmosDimensions.primitivesLayoutSpacing150)
            // A card of its own: the background colour, and the chosen one
            // the theme's 5% tint on it. The tint lay over nothing, so on a
            // glass sheet the map showed through the chosen option while the
            // others stood opaque.
            .background(
                KozmosColors.primitivesColorsBackground0
                    .overlay(option.selected ? KozmosColors.primitivesColorsTheme600.opacity(0.05) : Color.clear)
            )
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous)
                    .stroke(
                        option.selected
                            ? KozmosColors.primitivesColorsTheme600
                            : KozmosColors.semanticsBorderSubtle,
                        lineWidth: option.selected ? 2 : 1
                    )
            )
        }
        // The plain style draws a disabled option at half, as React's
        // `disabled:opacity-50`; a second opacity here dimmed it twice, to a
        // quarter.
        .buttonStyle(.plain)
        .disabled(disabled)
        .accessibilityLabel(accessibilityDescription)
        .accessibilityAddTraits(option.selected ? [.isButton, .isSelected] : .isButton)
    }
}

public extension KozmosRouteOptionCard where Icon == Image {
    /// Uses the SF Symbol that matches the option's routing preference.
    init(
        option: KozmosRouteOptionPresentation,
        isDisabled: Bool = false,
        onSelect: @escaping (String) -> Void
    ) {
        let systemImage: String
        switch option.preference {
        case .quickest: systemImage = "clock"
        case .stepFree: systemImage = "figure.roll"
        case .custom: systemImage = "slider.horizontal.3"
        }

        self.init(option: option, isDisabled: isDisabled, onSelect: onSelect) {
            Image(systemName: systemImage)
        }
    }
}
