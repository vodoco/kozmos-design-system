import SwiftUI

public enum KozmosSegmentedControlSize {
    case sm
    case `default`
    case lg
}

/// A choice of one option from a few, drawn as segments in a track.
///
/// Its options keep their width, 97, 117 or 137pt by `size`, when there is
/// room, and shrink toward their words when the space is short, never past
/// them (GAP-267, decision 201): no word is cut short or runs into the next
/// option's. Only when the words alone are wider than the space does the
/// track run past it.
///
/// `mixed` (decisions 188 and 191): the control stands for several values
/// that differ, a property of a multi-selection whose features chose
/// different options. No option is selected, and `mixedLabel` is drawn
/// under the track and read after the options: a segment has no mixed state
/// to say. Choosing an option writes `selection`, and the product clears
/// `mixed`. `onResetMixed` offers `resetMixedLabel` under the track once it
/// is no longer mixed, never while disabled; pressed, VoiceOver goes back to
/// the chosen option, and the product sets `mixed` again.
public struct KozmosSegmentedControl: View {
    @Binding private var selection: Int
    private let disabled: Bool
    private let fullWidth: Bool
    private let items: [String]
    private let size: KozmosSegmentedControlSize
    let mixed: Bool
    private let mixedLabel: String
    private let onResetMixed: (() -> Void)?
    private let resetMixedLabel: String
    @AccessibilityFocusState private var chosenFocused: Bool

    public init(
        selection: Binding<Int>,
        items: [String],
        size: KozmosSegmentedControlSize = .default,
        disabled: Bool = false,
        fullWidth: Bool = false,
        mixed: Bool = false,
        mixedLabel: String = KozmosMixedValue.label,
        onResetMixed: (() -> Void)? = nil,
        resetMixedLabel: String = KozmosMixedValue.resetLabel
    ) {
        self._selection = selection
        self.items = items
        self.size = size
        self.disabled = disabled
        self.fullWidth = fullWidth
        self.mixed = mixed
        self.mixedLabel = mixedLabel
        self.onResetMixed = onResetMixed
        self.resetMixedLabel = resetMixedLabel
    }

    private var showsReset: Bool {
        KozmosMixedValue.showsReset(mixed: mixed, onReset: onResetMixed, disabled: disabled)
    }

    public var body: some View {
        if mixed || showsReset {
            // A line under the track, as a field draws its reset. Only a
            // control with one is a stack: the track alone is the view it
            // always was.
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
                track(resetFocus: true)
                if mixed {
                    KozmosMixedGroupLabel(mixedLabel)
                } else {
                    KozmosMixedReset(label: resetMixedLabel) {
                        // The reset goes as the control turns mixed again:
                        // VoiceOver goes to the option chosen.
                        chosenFocused = true
                        onResetMixed?()
                    }
                }
            }
        } else {
            track(resetFocus: false)
        }
    }

    /// Whether an option shows as chosen: none does while mixed (decision 191).
    func isSelected(_ index: Int) -> Bool {
        !mixed && index == selection
    }

    private func track(resetFocus: Bool) -> some View {
        KozmosSegmentedLayout(minimum: fullWidth ? 0 : metrics.itemMinWidth, share: fullWidth) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                Button {
                    guard !disabled else { return }
                    selection = index
                } label: {
                    Text(item)
                        .font(.system(size: metrics.fontSize, weight: .medium))
                        .lineLimit(1)
                        .foregroundColor(isSelected(index) ? selectedForeground : idleForeground)
                        .padding(.horizontal, metrics.horizontalPadding)
                        // The width the track gives it: its minimum, its
                        // words, or between them when the space is short.
                        .frame(maxWidth: .infinity, minHeight: metrics.itemHeight)
                        .background(isSelected(index) ? selectedBackground : Color.clear)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        // The whole segment takes a tap: on its clear fill an
                        // unselected segment took one only on its word.
                        .contentShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(disabled)
                .accessibilityAddTraits(isSelected(index) ? .isSelected : [])
                .modifier(KozmosSegmentResetFocus(focus: resetFocus && index == selection ? $chosenFocused : nil))
            }
        }
        .padding(4)
        .frame(maxWidth: fullWidth ? .infinity : nil)
        .frame(minHeight: metrics.containerHeight)
        // Disabled, each part of the control is drawn at half, as a disabled
        // part is: the plain style draws each segment at half, and the track
        // is drawn at half here. An opacity round the whole control dimmed
        // the segments and their words twice, to a quarter.
        .background(KozmosColors.primitivesColorsBackground100.opacity(trackOpacity))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(KozmosColors.primitivesColorsBackground200.opacity(trackOpacity), lineWidth: 1)
        )
        .accessibilityElement(children: .contain)
    }

    private var metrics: Metrics {
        switch size {
        case .sm:
            return Metrics(
                containerHeight: 52,
                itemMinWidth: 97,
                itemHeight: 44,
                horizontalPadding: 12,
                fontSize: 12
            )
        case .default:
            return Metrics(
                containerHeight: 52,
                itemMinWidth: 117,
                itemHeight: 44,
                horizontalPadding: 16,
                fontSize: 14
            )
        case .lg:
            return Metrics(
                containerHeight: 56,
                itemMinWidth: 137,
                itemHeight: 48,
                horizontalPadding: 20,
                fontSize: 14
            )
        }
    }

    private var trackOpacity: Double {
        disabled ? 0.5 : 1
    }

    private var selectedBackground: Color {
        KozmosColors.primitivesColorsBackground0
    }

    private var selectedForeground: Color {
        KozmosColors.primitivesColorsForeground0
    }

    private var idleForeground: Color {
        KozmosColors.primitivesColorsForeground400
    }

    private struct Metrics {
        let containerHeight: CGFloat
        let itemMinWidth: CGFloat
        let itemHeight: CGFloat
        let horizontalPadding: CGFloat
        let fontSize: CGFloat
    }
}

/// Where VoiceOver goes back to after a reset: the chosen option. Set only
/// on a control offering one, so a control without one is the view it
/// always was (an accessibility focus binding keeps `ImageRenderer` from
/// drawing a view at all).
private struct KozmosSegmentResetFocus: ViewModifier {
    let focus: AccessibilityFocusState<Bool>.Binding?

    func body(content: Content) -> some View {
        if let focus {
            content.accessibilityFocused(focus)
        } else {
            content
        }
    }
}

/// The options in a row, each `kozmosSegmentWidths` wide, centred on the
/// row's height (GAP-267). An option's words are its ideal width.
struct KozmosSegmentedLayout: Layout {
    let minimum: CGFloat
    let share: Bool

    private func widths(_ subviews: Subviews, in width: CGFloat?) -> [CGFloat] {
        let words = subviews.map { $0.sizeThatFits(.unspecified).width }
        let available = width.flatMap { $0.isFinite ? $0 : nil }
        return kozmosSegmentWidths(words: words, minimum: minimum, available: available, share: share)
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let widths = widths(subviews, in: proposal.width)
        let height = zip(subviews, widths)
            .map { $0.sizeThatFits(ProposedViewSize(width: $1, height: proposal.height)).height }
            .max() ?? 0
        return CGSize(width: widths.reduce(0, +), height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        for (subview, width) in zip(subviews, widths(subviews, in: bounds.width)) {
            subview.place(
                at: CGPoint(x: x, y: bounds.midY),
                anchor: .leading,
                proposal: ProposedViewSize(width: width, height: bounds.height)
            )
            x += width
        }
    }
}

/// Each option's width in `available` (nil when unbounded): GAP-267's rule,
/// as React's options lay out (CSS flexbox). Not `share`d, an option takes
/// its minimum or its `words`, whichever is wider; short of room, each gives
/// up width in proportion to that width, never past its words, as a flex
/// item shrinks. `share`d (full width), the options split the space equally,
/// none narrower than its words. Past what the words need, they keep their
/// words and the track runs past `available`: never cut short.
func kozmosSegmentWidths(words: [CGFloat], minimum: CGFloat, available: CGFloat?, share: Bool) -> [CGFloat] {
    if words.isEmpty { return [] }
    let preferred = words.map { max($0, minimum) }
    guard let available else { return share ? words : preferred }
    var target = share ? Array(repeating: CGFloat(0), count: words.count) : preferred
    if !share && preferred.reduce(0, +) <= available { return preferred }
    var frozen = share ? Array(repeating: false, count: words.count) : preferred.indices.map { preferred[$0] <= words[$0] }
    while true {
        let open = target.indices.filter { !frozen[$0] }
        if open.isEmpty { break }
        let taken = target.indices.filter { frozen[$0] }.reduce(CGFloat(0)) { $0 + target[$1] }
        var violated = false
        if share {
            let each = (available - taken) / CGFloat(open.count)
            for i in open { target[i] = each }
        } else {
            let base = open.reduce(CGFloat(0)) { $0 + preferred[$1] }
            let free = available - taken - base
            for i in open { target[i] = preferred[i] + free * preferred[i] / base }
        }
        for i in open where target[i] < words[i] {
            target[i] = words[i]
            frozen[i] = true
            violated = true
        }
        if !violated { break }
    }
    return target
}
