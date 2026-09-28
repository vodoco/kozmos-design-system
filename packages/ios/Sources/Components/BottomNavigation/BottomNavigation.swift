import SwiftUI

public struct KozmosBottomNavigation: View {
    @Binding var selection: Int
    let items: [(icon: String, title: String)]
    let onSelect: (Int) -> Void

    public init(
        selection: Binding<Int>,
        items: [(icon: String, title: String)],
        onSelect: @escaping (Int) -> Void = { _ in }
    ) {
        self._selection = selection
        self.items = items
        self.onSelect = onSelect
    }

    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            ForEach(items.indices, id: \.self) { index in
                KozmosBottomNavigationTile(
                    title: items[index].title,
                    icon: items[index].icon,
                    selected: selection == index,
                    action: {
                        selection = index
                        onSelect(index)
                    }
                )
                .frame(maxWidth: .infinity)
                .accessibilityAddTraits(selection == index ? .isSelected : [])
            }
        }
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
        .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing50)
        .background(KozmosColors.primitivesColorsBackground0)
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(KozmosColors.primitivesColorsBackground300),
            alignment: .top
        )
    }
}

/// The bar's own tile (decision 42). It was KozmosNavigationItem's compact
/// rail tile until the rail took the dashboard side menu's design; the bar
/// keeps the tile it had: 64pt by 64, an icon 4pt above a caption2 label on
/// 14pt lines, a selected one on the muted fill.
private struct KozmosBottomNavigationTile: View {
    let title: String
    let icon: String
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                Image(systemName: icon)
                    .frame(width: 24, height: 24)

                Text(title)
                    .font(KozmosTypography.caption2)
                    .fontWeight(.semibold)
                    .lineSpacing(KozmosTypography.caption2On14ptLineSpacing)
                    .lineLimit(2)
                    .truncationMode(.tail)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(8)
            .frame(width: 64)
            .frame(minHeight: 64)
            .background(selected ? KozmosColors.primitivesColorsBackground100 : Color.clear)
            .foregroundColor(selected ? KozmosColors.primitivesColorsTheme500 : KozmosColors.primitivesColorsForeground100)
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityValue(selected ? "Selected" : "")
    }
}
