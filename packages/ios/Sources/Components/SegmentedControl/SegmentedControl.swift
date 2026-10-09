import SwiftUI

public enum KozmosSegmentedControlSize {
    case sm
    case `default`
    case lg
}

public struct KozmosSegmentedControl: View {
    @Binding private var selection: Int
    private let disabled: Bool
    private let fullWidth: Bool
    private let items: [String]
    private let size: KozmosSegmentedControlSize

    public init(
        selection: Binding<Int>,
        items: [String],
        size: KozmosSegmentedControlSize = .default,
        disabled: Bool = false,
        fullWidth: Bool = false
    ) {
        self._selection = selection
        self.items = items
        self.size = size
        self.disabled = disabled
        self.fullWidth = fullWidth
    }

    public var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                Button {
                    guard !disabled else { return }
                    selection = index
                } label: {
                    Text(item)
                        .font(.system(size: metrics.fontSize, weight: .medium))
                        .lineLimit(1)
                        .foregroundColor(index == selection ? selectedForeground : idleForeground)
                        .padding(.horizontal, metrics.horizontalPadding)
                        .frame(maxWidth: fullWidth ? .infinity : nil)
                        .frame(
                            minWidth: fullWidth ? nil : metrics.itemMinWidth,
                            minHeight: metrics.itemHeight
                        )
                        .background(index == selection ? selectedBackground : Color.clear)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(disabled)
                .accessibilityAddTraits(index == selection ? .isSelected : [])
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
        KozmosColors.primitivesColorsForeground500
    }

    private struct Metrics {
        let containerHeight: CGFloat
        let itemMinWidth: CGFloat
        let itemHeight: CGFloat
        let horizontalPadding: CGFloat
        let fontSize: CGFloat
    }
}
