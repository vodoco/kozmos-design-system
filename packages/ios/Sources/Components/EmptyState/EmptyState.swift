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

    /// React's `p-8` and `p-4`, and Figma's 32 and 16: it was 24 and 16.
    var padding: CGFloat { self == .compact ? 16 : 32 }
    var stackSpacing: CGFloat { self == .compact ? 8 : 16 }
    /// The muted circle the icon sits on: React's `w-16 h-16`, `h-10 w-10`
    /// compact.
    var iconCircle: CGFloat { self == .compact ? 40 : 64 }
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
    /// A list under the description (GAP-165): what to try, or what is to
    /// come, one item a line, bulleted and read in order. Empty, it draws
    /// nothing.
    public let list: [String]
    /// The list's name, said as VoiceOver enters it.
    public let listLabel: String?

    public init(
        title: String,
        description: String? = nil,
        size: KozmosEmptyStateSize = .default,
        progress: KozmosEmptyStateProgress? = nil,
        list: [String] = [],
        listLabel: String? = nil,
        @ViewBuilder icon: () -> Icon,
        @ViewBuilder action: () -> Action
    ) {
        self.title = title
        self.description = description
        self.size = size
        self.progress = progress
        self.list = list
        self.listLabel = listLabel
        self.icon = icon()
        self.action = action()
    }

    public var body: some View {
        VStack(spacing: size.stackSpacing) {
            if let icon = icon {
                // In the muted foreground on a muted circle, as React's
                // `text-muted-foreground` on `bg-muted` and Figma's are: it was
                // foreground/300, with no circle. A KozmosIcon takes the
                // colour too, as React's icon is currentColor.
                icon
                    .foregroundColor(KozmosColors.primitivesColorsForeground400)
                    .environment(\.kozmosIconHostInk, KozmosColors.primitivesColorsForeground400)
                    .frame(width: size.iconCircle, height: size.iconCircle)
                    .background(Circle().fill(KozmosColors.primitivesColorsBackground100))
            }
            
            VStack(spacing: 4) {
                // The foreground, React's `text-foreground` and Figma's
                // Colors/foreground/0: it was foreground/100.
                Text(title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(KozmosColors.primitivesColorsForeground0)
                    .multilineTextAlignment(.center)
                
                if let description = description {
                    // The muted foreground, React's `text-muted-foreground`.
                    Text(description)
                        .font(.system(size: 14))
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                        .multilineTextAlignment(.center)
                }
            }
            
            if !list.isEmpty {
                KozmosEmptyStateList(items: list, label: listLabel)
            }

            if let progress {
                VStack(spacing: 4) {
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        // What is in progress in the foreground, and how far in
                        // the muted foreground, as React's `text-foreground` and
                        // `text-muted-foreground`: they were foreground/100 and 300.
                        Text(progress.label)
                            .foregroundColor(KozmosColors.primitivesColorsForeground0)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        if let valueText = progress.valueText {
                            Text(valueText)
                                .foregroundColor(KozmosColors.primitivesColorsForeground400)
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
        progress: KozmosEmptyStateProgress? = nil, list: [String] = [], listLabel: String? = nil
    ) {
        self.title = title
        self.description = description
        self.size = size
        self.progress = progress
        self.list = list
        self.listLabel = listLabel
        self.icon = nil
        self.action = nil
    }
}

/// EmptyState's list (GAP-165), as React draws it: in the 280 column, from
/// the leading edge, each item a bullet and its words in the muted
/// foreground, 4 between items. The bullets are drawn, not said: VoiceOver
/// reads the items in order, inside a container named by `label`.
struct KozmosEmptyStateList: View {
    let items: [String]
    let label: String?

    var body: some View {
        if let label {
            column.accessibilityElement(children: .contain).accessibilityLabel(label)
        } else {
            column.accessibilityElement(children: .contain)
        }
    }

    private var column: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("\u{2022}")
                        .accessibilityHidden(true)
                    Text(item)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .font(KozmosTypography.subheadline)
        .foregroundColor(KozmosColors.primitivesColorsForeground400)
        .frame(maxWidth: 280, alignment: .leading)
    }
}
