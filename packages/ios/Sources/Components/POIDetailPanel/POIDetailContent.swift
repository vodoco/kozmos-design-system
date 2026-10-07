import SwiftUI

/// Optional remote taxonomy artwork. Missing/failed artwork leaves the label
/// intact; text-only values do not receive an invented fallback icon.
struct POIDetailIcon: View {
    let systemImage: String?
    let url: String?
    let monochrome: Bool
    var size: CGFloat = 16

    static func remoteURL(_ raw: String?) -> URL? {
        guard let raw, let url = URL(string: raw),
              url.scheme?.lowercased() == "https", url.host != nil,
              url.user == nil, url.password == nil else { return nil }
        return url
    }

    var body: some View {
        Group {
            if let url = Self.remoteURL(url) {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable()
                            .renderingMode(monochrome ? .template : .original)
                            .scaledToFit()
                            .frame(width: size, height: size)
                    }
                }
            } else if let systemImage {
                Image(systemName: systemImage)
                    .font(.system(size: size))
                    .frame(width: size, height: size)
            }
        }
        .accessibilityHidden(true)
    }
}

struct POIDetailTags: View {
    let items: [KozmosPOIDetailTag]

    var body: some View {
        FlowLayout(spacing: 8) {
            ForEach(items) { item in
                HStack(spacing: 4) {
                    POIDetailIcon(systemImage: item.systemImage, url: item.iconUrl,
                                  monochrome: item.iconMonochrome == true)
                    Text(item.label).fixedSize(horizontal: false, vertical: true)
                }
                .font(KozmosTypography.footnote)
                .foregroundColor(KozmosColors.primitivesColorsForeground100)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .overlay(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
                    .strokeBorder(KozmosColors.semanticsBorderSubtle, lineWidth: 1))
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(item.label)
            }
        }
    }
}

/// Equal columns, shared measured height, no scroll and no second row. Keeping
/// the intrinsic icon/text cluster centered avoids the web's flex-wrap gap.
struct POIDetailSummary: View {
    let items: [KozmosPOIDetailSummary]
    /// On glass its muted text takes the foreground colour (decision 48);
    /// the card says which surface it sits on.
    @Environment(\.kozmosSurfaceStyle) private var surfaceStyle

    var body: some View {
        POISummaryLayout {
            ForEach(Array(items.prefix(3).enumerated()), id: \.element.id) { index, item in
                Group {
                    if item.systemImage != nil || item.iconUrl != nil {
                        POIFactLayout {
                            icon(item).frame(width: 20, height: 20)
                            text(item)
                        }
                    } else {
                        text(item)
                    }
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .overlay(alignment: .leading) {
                    if index > 0 {
                        Rectangle().fill(KozmosColors.semanticsBorderSubtle).frame(width: 1)
                    }
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(item.label)
                .accessibilityValue([item.value, item.detail].compactMap { $0 }.joined(separator: ", "))
                .accessibilityIdentifier("poi-summary-\(item.id)")
            }
        }
        .overlay(alignment: .top) { Divider().overlay(KozmosColors.semanticsBorderSubtle) }
        .overlay(alignment: .bottom) { Divider().overlay(KozmosColors.semanticsBorderSubtle) }
    }

    private func icon(_ item: KozmosPOIDetailSummary) -> some View {
        POIDetailIcon(systemImage: item.systemImage, url: item.iconUrl,
                      monochrome: item.iconMonochrome == true, size: 20)
            .foregroundColor(Self.color(item.tone))
    }

    private func text(_ item: KozmosPOIDetailSummary) -> some View {
        ViewThatFits(in: .horizontal) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                value(item); detail(item)
            }
            VStack(alignment: .leading, spacing: 2) {
                value(item); detail(item)
            }
        }
        .font(KozmosTypography.footnote)
        .fixedSize(horizontal: false, vertical: true)
    }

    @ViewBuilder private func detail(_ item: KozmosPOIDetailSummary) -> some View {
        if let detail = item.detail {
            Text(detail).font(KozmosTypography.caption)
                .foregroundColor(kozmosMutedForeground(on: surfaceStyle))
        }
    }

    @ViewBuilder private func value(_ item: KozmosPOIDetailSummary) -> some View {
        if let price = item.priceLevel, (1...4).contains(price) {
            (Text(String(repeating: "$", count: price))
                .foregroundColor(KozmosColors.primitivesColorsForeground100)
             + Text(String(repeating: "$", count: 4 - price))
                .foregroundColor(kozmosMutedForeground(on: surfaceStyle)))
                .font(KozmosTypography.body.weight(.semibold))
        } else {
            Text(item.value).foregroundColor(Self.color(item.tone))
        }
    }

    /// A tone as text on the card's white or the sheet's grey, in either
    /// scheme: the emotion's text role, which reads at 4.5:1 on every neutral
    /// surface, and the theme's 600 for brand — the roles the web's summary
    /// names (`text-success-text`, `text-warning-text`,
    /// `text-destructive-text`, `text-primary`). A fill colour is one step
    /// too light: the alert fill read at 1.6:1 on the sheet, and the theme's
    /// 500 at 3.7:1 on black.
    static func color(_ tone: KozmosPOIDetailTone?) -> Color {
        switch tone {
        case .success: return KozmosColors.semanticsEmotionSuccessText
        case .warning: return KozmosColors.semanticsEmotionAlertText
        case .danger: return KozmosColors.semanticsEmotionDangerText
        case .brand: return KozmosColors.primitivesColorsTheme600
        default: return KozmosColors.primitivesColorsForeground100
        }
    }
}

/// Measures the text using only the space beside the icon, then centers their
/// combined intrinsic bounds. Nested ViewThatFits/HStacks otherwise choose a
/// vertical icon before considering the narrower, two-line text alternative.
struct POIFactLayout: Layout {

    private func sizes(_ proposal: ProposedViewSize, _ subviews: Subviews) -> (CGSize, CGSize) {
        let icon = subviews[0].sizeThatFits(.unspecified)
        let width = proposal.width.map { max(1, $0 - icon.width - 6) }
        return (icon, subviews[1].sizeThatFits(.init(width: width, height: nil)))
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let (icon, text) = sizes(proposal, subviews)
        return CGSize(width: icon.width + 6 + text.width, height: max(icon.height, text.height))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let (icon, text) = sizes(.init(width: bounds.width, height: bounds.height), subviews)
        // Layout positions are logical: SwiftUI mirrors them for RTL.
        subviews[0].place(at: CGPoint(x: bounds.minX, y: bounds.midY - icon.height / 2), proposal: .init(icon))
        subviews[1].place(at: CGPoint(x: bounds.minX + icon.width + 6, y: bounds.midY - text.height / 2), proposal: .init(text))
    }
}

struct POISummaryLayout: Layout {

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        guard !subviews.isEmpty else { return .zero }
        let width = proposal.width ?? subviews.map { $0.sizeThatFits(.unspecified).width }.max()! * CGFloat(subviews.count)
        let cell = width / CGFloat(subviews.count)
        let height = subviews.map { $0.sizeThatFits(.init(width: cell, height: nil)).height }.max() ?? 0
        return CGSize(width: width, height: max(64, height))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        guard !subviews.isEmpty else { return }
        let width = bounds.width / CGFloat(subviews.count)
        for index in subviews.indices {
            subviews[index].place(at: CGPoint(x: bounds.minX + CGFloat(index) * width, y: bounds.minY),
                                 proposal: .init(width: width, height: bounds.height))
        }
    }
}

struct POIDetailExtendedContent: View {
    let details: KozmosPOIDetailsPresentation
    let readMoreLabel: String
    let readLessLabel: String
    let tagsLabel: String
    @State private var expanded = false
    /// On glass its headings and the opening hours' note take the foreground
    /// colour (decision 48); the card says which surface it sits on.
    @Environment(\.kozmosSurfaceStyle) private var surfaceStyle

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            ForEach(details.groups.filter { !$0.items.isEmpty }) { group in
                VStack(alignment: .leading, spacing: 8) {
                    Text(group.heading).font(KozmosTypography.footnote)
                        .foregroundColor(kozmosMutedForeground(on: surfaceStyle))
                        .accessibilityAddTraits(.isHeader)
                    POIDetailTags(items: group.items)
                }
            }
            if let hours = details.openingHours {
                DisclosureGroup {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(hours.rows) { row in
                            ViewThatFits(in: .horizontal) {
                                HStack { Text(row.day); Spacer(); Text(row.hours) }
                                VStack(alignment: .leading) { Text(row.day); Text(row.hours) }
                            }
                        }
                        if let note = hours.note {
                            Text(note).foregroundColor(kozmosMutedForeground(on: surfaceStyle, muted: .secondary))
                        }
                    }
                    .font(KozmosTypography.footnote).padding(.top, 8)
                } label: {
                    Text(hours.summary).font(KozmosTypography.footnote)
                        .foregroundColor(KozmosColors.primitivesColorsForeground100)
                        .frame(minHeight: 20)
                }
                .padding(12)
                .overlay(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1))
                .accessibilityLabel(hours.label + ", " + hours.summary)
            }
            if let description = details.description {
                VStack(alignment: .leading, spacing: 4) {
                    Text(expanded ? description.full : description.preview)
                        .font(KozmosTypography.subheadline)
                        .fixedSize(horizontal: false, vertical: true)
                    if description.full != description.preview {
                        Button { expanded.toggle() } label: {
                            Text(expanded ? readLessLabel : readMoreLabel)
                                .font(KozmosTypography.footnote)
                                .frame(minHeight: 44)
                                .contentShape(Rectangle())
                        }
                    }
                }
            }
            if !details.tags.isEmpty {
                POIDetailTags(items: details.tags)
                    .accessibilityElement(children: .contain).accessibilityLabel(tagsLabel)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
