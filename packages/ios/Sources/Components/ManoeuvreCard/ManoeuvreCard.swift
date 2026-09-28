import SwiftUI

/// The current manoeuvre, floating over the map during navigation: its arrow,
/// the instruction, how far and how long, and a grab bar that opens the full
/// itinerary in its place. Mirrors the product prototype's instruction card:
/// 402 wide it is 378 × 119, radius 18, a solid surface unless the product asks for
/// glass, the instruction 20/600
/// over a 14 grey detail, a 36 × 5 grab bar at its foot.
///
/// The card owns the toggle and what VoiceOver hears of it. The itinerary it
/// opens into is the caller's — `KozmosItinerary`, in the products — so the
/// card never decides what a route is made of. Open, the card is as tall as
/// the itinerary up to `maxItineraryHeight`, past which the itinerary scrolls:
/// a long route must not cover the map.
public struct KozmosManoeuvreCard<Itinerary: View>: View {
    let type: DirectionType
    let instruction: String
    let detail: String?
    let isExpanded: Bool
    let onToggle: () -> Void
    let expandLabel: String
    let collapseLabel: String
    let manoeuvreLabel: String
    let surface: KozmosSurfaceStyle
    let maxItineraryHeight: CGFloat
    let itinerary: Itinerary

    public init(
        type: DirectionType,
        instruction: String,
        detail: String? = nil,
        isExpanded: Bool,
        onToggle: @escaping () -> Void,
        expandLabel: String = "Show itinerary",
        collapseLabel: String = "Hide itinerary",
        manoeuvreLabel: String = "Current manoeuvre",
        surface: KozmosSurfaceStyle = .solid,
        maxItineraryHeight: CGFloat = 320,
        @ViewBuilder itinerary: () -> Itinerary
    ) {
        self.type = type
        self.instruction = instruction
        self.detail = detail
        self.isExpanded = isExpanded
        self.onToggle = onToggle
        self.expandLabel = expandLabel
        self.collapseLabel = collapseLabel
        self.manoeuvreLabel = manoeuvreLabel
        self.surface = surface
        self.maxItineraryHeight = maxItineraryHeight
        self.itinerary = itinerary()
    }

    /// What VoiceOver reads for the closed card: the instruction, then the
    /// detail. The arrow says nothing the instruction does not.
    static func accessibilityDescription(instruction: String, detail: String?) -> String {
        [instruction, detail].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: ", ")
    }

    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer, style: .continuous)
    }

    public var body: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            if isExpanded {
                // The itinerary as it is when it fits the cap, in a scroll
                // view when it does not: decided in one layout pass, so the
                // card never shows a frame at the wrong height. A scroll view
                // alone would take the whole cap for a route of three steps,
                // and so would `.frame(maxHeight:)`, which takes all of the
                // proposal up to its maximum; the layout below proposes the
                // cap and is only as tall as what it holds.
                KozmosCappedHeightLayout(cap: maxItineraryHeight) {
                    ViewThatFits(in: .vertical) {
                        itinerary
                            .frame(maxWidth: .infinity, alignment: .leading)
                        ScrollView {
                            itinerary
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }
            } else {
                // The instruction row is the button: a tap anywhere on it opens
                // the itinerary, and VoiceOver hears the manoeuvre with that hint.
                Button(action: onToggle) {
                    HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                        Image(systemName: type.iconName)
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundColor(KozmosColors.primitivesColorsTheme500)
                            .frame(width: KozmosDimensions.primitivesLayoutSizing400, height: KozmosDimensions.primitivesLayoutSizing400)
                        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                            Text(instruction)
                                .font(KozmosTypography.title3.weight(.semibold))
                                .foregroundColor(KozmosColors.primitivesColorsForeground100)
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)
                            if let detail, !detail.isEmpty {
                                // Muted, and on glass the foreground colour
                                // (decision 48): the card's surface says which.
                                Text(detail)
                                    .font(KozmosTypography.subheadline)
                                    .kozmosMutedText()
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(Self.accessibilityDescription(instruction: instruction, detail: detail))
                .accessibilityHint(expandLabel)
                .accessibilityAddTraits(.isButton)
            }
            // The grab bar: the sign that the card opens, and the way to close it.
            Button(action: onToggle) {
                Capsule()
                    .fill(KozmosColors.primitivesColorsBackground300)
                    .frame(width: 36, height: 5)
                    .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing50)
                    .frame(maxWidth: .infinity)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(isExpanded ? collapseLabel : expandLabel)
            // Closed, the instruction row already offers the way in.
            .accessibilityHidden(!isExpanded)
        }
        .padding(.top, KozmosDimensions.primitivesLayoutSpacing200)
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
        .padding(.bottom, KozmosDimensions.primitivesLayoutSpacing50)
        .frame(maxWidth: .infinity)
        .kozmosSurface(shape, style: surface)
        .kozmosElevation(KozmosShadows.semanticsElevationFloating)
        .accessibilityElement(children: .contain)
        // Open, the card has no name of its own: the itinerary inside is the
        // named thing, and two groups called the same would be read twice.
        .accessibilityLabel(isExpanded ? "" : manoeuvreLabel)
    }
}
