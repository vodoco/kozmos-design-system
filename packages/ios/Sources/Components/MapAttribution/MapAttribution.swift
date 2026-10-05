import SwiftUI

public enum KozmosMapAttributionAppearance: String, CaseIterable {
    case map, surface
}

/// Ordered host-supplied presentation data; no provider detection or wording policy.
public struct KozmosMapAttributionCredit: Identifiable, Equatable, Sendable {
    public let id: String
    public let label: String
    public let href: String?

    public init(id: String, label: String, href: String? = nil) {
        self.id = id
        self.label = label
        self.href = href
    }

    var destination: URL? { KozmosSafeLink.destination(href) }
}

/// Credits never disappear when optional branding is hidden. Host owns approved
/// replacement brand content, provider copy, destinations, deduplication and overlay placement.
/// Omitted brand uses the bundled Pointr artwork.
public struct KozmosMapAttribution: View {
    let credits: [KozmosMapAttributionCredit]
    let brand: AnyView?
    let showBrand: Bool
    let label: String
    let appearance: KozmosMapAttributionAppearance
    @Environment(\.displayScale) private var displayScale
    @State private var creditViewportWidth: CGFloat = 0
    @State private var creditRowHeight: CGFloat = 18

    public init(
        credits: [KozmosMapAttributionCredit],
        brand: AnyView? = nil,
        showBrand: Bool = true,
        label: String = "Map attribution",
        appearance: KozmosMapAttributionAppearance = .map
    ) {
        self.credits = credits
        self.brand = brand
        self.showBrand = showBrand
        self.label = label
        self.appearance = appearance
    }

    public var body: some View {
        if !credits.isEmpty || showBrand {
            VStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                if showBrand {
                    if let brand { brand } else {
                        Image("PointrLogo", bundle: .module)
                            .resizable()
                            .scaledToFit()
                            .frame(maxWidth: 98, maxHeight: 34)
                            .accessibilityLabel(Text(verbatim: "Pointr"))
                    }
                }
                if !credits.isEmpty {
                    ScrollView(.horizontal, showsIndicators: appearance == .surface) {
                      HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                        ForEach(credits) { credit in
                            Group {
                                if let url = credit.destination {
                                    Link(destination: url) {
                                        creditText(credit.label, linked: true)
                                    }
                                    .accessibilityLabel(Text(verbatim: credit.label))
                                    .accessibilityAddTraits(.isLink)
                                    .accessibilityRemoveTraits(.isButton)
                                } else {
                                    creditText(credit.label, linked: false)
                                }
                            }
                            .font(KozmosTypography.caption2)
                            .lineLimit(1)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: true, vertical: true)
                        }
                      }
                      .padding(.horizontal, 2)
                      .padding(.top, 2)
                      .padding(.bottom, appearance == .surface ? 2 : 0)
                      .accessibilityElement(children: .contain)
                      .frame(minWidth: creditViewportWidth)
                      .background(GeometryReader { proxy in
                          Color.clear.preference(key: AttributionRowHeight.self, value: proxy.size.height)
                      })
                    }
                    .frame(height: creditRowHeight)
                    .onPreferenceChange(AttributionRowHeight.self) {
                        creditRowHeight = AttributionRowHeight.stabilized(
                            current: creditRowHeight, measured: $0, scale: displayScale
                        )
                    }
                    .background(GeometryReader { proxy in
                        Color.clear.onAppear { creditViewportWidth = proxy.size.width }
                            .onChange(of: proxy.size.width) { creditViewportWidth = $0 }
                    })
                }
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
            .padding(.top, KozmosDimensions.primitivesLayoutSpacing100)
            .padding(.bottom, appearance == .surface ? KozmosDimensions.primitivesLayoutSpacing100 : 0)
            .background(appearance == .surface ? KozmosColors.primitivesColorsBackground0 : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
            .accessibilityElement(children: .contain)
            .accessibilityLabel(Text(verbatim: label))
        }
    }

    /// The halo is painted, not extra Text views: SwiftUI's scroll accessibility
    /// bridge can expose background Text copies even when their group is hidden.
    private func creditText(_ label: String, linked: Bool) -> some View {
        let text = Text(verbatim: label).underline(linked)
        let width = KozmosDimensions.semanticsMapAttributionHaloWidth
        return text
            .foregroundColor(appearance == .map ? KozmosColors.semanticsMapAttributionText : KozmosColors.primitivesColorsForeground300)
            .background {
                if appearance == .map {
                    Canvas { context, size in
                        let glyphs = context.resolve(text.font(KozmosTypography.caption2)
                            .foregroundColor(KozmosColors.semanticsMapAttributionHalo))
                        for index in 0..<8 {
                            context.draw(glyphs, at: CGPoint(
                                x: size.width / 2 + CGFloat([-1, 0, 1, -1, 1, -1, 0, 1][index]) * width,
                                y: size.height / 2 + CGFloat([-1, -1, -1, 0, 0, 1, 1, 1][index]) * width
                            ))
                        }
                    }
                    .accessibilityHidden(true)
                    .allowsHitTesting(false)
                }
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(Text(verbatim: label))
    }
}

struct AttributionRowHeight: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
    /// Centered fractional-point layouts can alternate by one physical pixel.
    /// Keep the larger viewport in that case; accept real intrinsic-size changes.
    static func stabilized(current: CGFloat, measured: CGFloat, scale: CGFloat) -> CGFloat {
        guard measured > 0 else { return current }
        let scale = max(scale, 1)
        let oldPixels = Int((current * scale).rounded())
        let newPixels = Int((measured * scale).rounded(.up))
        return newPixels > oldPixels || oldPixels - newPixels > 1
            ? CGFloat(newPixels) / scale : current
    }
}
