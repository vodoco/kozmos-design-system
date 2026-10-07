import SwiftUI

/// How much room an empty state takes.
///
/// `default` pads itself and fills its region, which is right when the empty
/// state IS the screen. `compact` is for a slot that already draws a box round
/// it — a result list's empty slot, a card, a panel section. Measured on the
/// web, the same content came to 258pt in a result list and about 128 compact
/// (GAP-009).
public enum KozmosEmptyStateSize: Sendable, Hashable, CaseIterable {
    case `default`
    case compact

    var padding: CGFloat { self == .compact ? 16 : 24 }
    var stackSpacing: CGFloat { self == .compact ? 8 : 16 }
}

/// A long wait the empty state is explaining, such as a download, and how
/// far it has got (GAP-115).
public struct KozmosEmptyStateProgress: Hashable, Sendable {
    /// How far it has got, from 0 to 1. Outside that it is clamped, and NaN is 0.
    public let value: Double
    /// What is in progress, shown above the bar and naming it: "Downloading the assistant".
    public let label: String
    /// How far, in words, shown beside the label and said as the bar's value: "40%", "12 of 30 MB".
    public let valueText: String?

    public init(value: Double, label: String, valueText: String? = nil) {
        self.value = value
        self.label = label
        self.valueText = valueText
    }

    /// The value drawn and said. NaN is none done, as on React: `min` and
    /// `max` keep a NaN, and turning it into an Int for the percentage trapped.
    var clampedValue: Double {
        value.isNaN ? 0 : min(max(value, 0), 1)
    }

    /// What VoiceOver says for the value: the words, or the percentage.
    var spokenValue: String {
        valueText ?? "\(Int((clampedValue * 100).rounded()))%"
    }
}

public struct KozmosEmptyState<Icon: View, Action: View>: View {
    public let title: String
    public let description: String?
    public let icon: Icon?
    public let action: Action?
    public let size: KozmosEmptyStateSize
    /// A wait it explains, drawn under the description and above the action.
    public let progress: KozmosEmptyStateProgress?

    public init(
        title: String,
        description: String? = nil,
        size: KozmosEmptyStateSize = .default,
        progress: KozmosEmptyStateProgress? = nil,
        @ViewBuilder icon: () -> Icon,
        @ViewBuilder action: () -> Action
    ) {
        self.title = title
        self.description = description
        self.size = size
        self.progress = progress
        self.icon = icon()
        self.action = action()
    }

    public var body: some View {
        VStack(spacing: size.stackSpacing) {
            if let icon = icon {
                icon
                    .foregroundColor(KozmosColors.primitivesColorsForeground300)
            }
            
            VStack(spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(KozmosColors.primitivesColorsForeground100)
                    .multilineTextAlignment(.center)
                
                if let description = description {
                    Text(description)
                        .font(.system(size: 14))
                        .foregroundColor(KozmosColors.primitivesColorsForeground300)
                        .multilineTextAlignment(.center)
                }
            }
            
            if let progress {
                VStack(spacing: 4) {
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text(progress.label)
                            .foregroundColor(KozmosColors.primitivesColorsForeground100)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        if let valueText = progress.valueText {
                            Text(valueText)
                                .foregroundColor(KozmosColors.primitivesColorsForeground300)
                        }
                    }
                    .font(KozmosTypography.subheadline)
                    KozmosProgress(value: progress.clampedValue)
                }
                .frame(maxWidth: 280)
                // One element: what is in progress, and how far it has got.
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(progress.label)
                .accessibilityValue(progress.spokenValue)
                .accessibilityAddTraits(.updatesFrequently)
            }

            if let action = action {
                action
            }
        }
        .padding(size.padding)
        .frame(maxWidth: .infinity)
    }
}

// Convenience init for no views
public extension KozmosEmptyState where Icon == EmptyView, Action == EmptyView {
    init(
        title: String, description: String? = nil, size: KozmosEmptyStateSize = .default,
        progress: KozmosEmptyStateProgress? = nil
    ) {
        self.title = title
        self.description = description
        self.size = size
        self.progress = progress
        self.icon = nil
        self.action = nil
    }
}
