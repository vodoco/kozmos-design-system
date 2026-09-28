import SwiftUI

/// One step of an itinerary, as the products present it: the SDK's own
/// wording, the arrow it gets, and whether it is the step under way.
public struct KozmosItineraryStep: Identifiable, Hashable, Sendable {
    public let id: String
    public let instruction: String
    public let type: DirectionType
    public let isCurrent: Bool

    public init(id: String, instruction: String, type: DirectionType, isCurrent: Bool = false) {
        self.id = id
        self.instruction = instruction
        self.type = type
        self.isCurrent = isCurrent
    }
}

/// The whole route as a list: where it starts, every step with the current one
/// emphasised, where it ends. Mirrors the product prototype's itinerary —
/// FROM and TO in 11-point capitals beside their names, steps in 15 with the
/// current one semibold in the theme colour.
///
/// VoiceOver hears the endpoints as "From, name" and "To, name", each step as
/// one element, the current one selected.
public struct KozmosItinerary: View {
    let origin: String
    let steps: [KozmosItineraryStep]
    let destination: String
    let originLabel: String
    let destinationLabel: String
    let label: String

    public init(
        origin: String,
        steps: [KozmosItineraryStep],
        destination: String,
        originLabel: String = "From",
        destinationLabel: String = "To",
        label: String = "Itinerary"
    ) {
        self.origin = origin
        self.steps = steps
        self.destination = destination
        self.originLabel = originLabel
        self.destinationLabel = destinationLabel
        self.label = label
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            endpoint(originLabel, name: origin, emphasised: false)
            ForEach(steps) { step in
                row(step)
            }
            endpoint(destinationLabel, name: destination, emphasised: true)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    /// The captions and the origin are muted, and on glass, in a glass
    /// manoeuvre card, the foreground colour (decision 48).
    private func endpoint(_ label: String, name: String, emphasised: Bool) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            Text(label.uppercased())
                .font(KozmosTypography.caption2)
                .kozmosMutedText()
                .frame(width: KozmosDimensions.primitivesLayoutSizing500, alignment: .leading)
            Text(name)
                .font(emphasised ? KozmosTypography.subheadline.weight(.semibold) : KozmosTypography.subheadline)
                .kozmosMutedText(emphasised ? KozmosColors.primitivesColorsForeground100 : KozmosColors.primitivesColorsForeground500)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label), \(name)")
    }

    private func row(_ step: KozmosItineraryStep) -> some View {
        HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            Image(systemName: step.type.iconName)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(step.isCurrent ? KozmosColors.primitivesColorsTheme500 : KozmosColors.primitivesColorsForeground500)
                .frame(width: KozmosDimensions.primitivesLayoutSizing500, height: 20, alignment: .leading)
            Text(step.instruction)
                .font(step.isCurrent ? KozmosTypography.subheadline.weight(.semibold) : KozmosTypography.subheadline)
                .foregroundColor(step.isCurrent ? KozmosColors.primitivesColorsTheme500 : KozmosColors.primitivesColorsForeground100)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(step.instruction)
        .accessibilityAddTraits(step.isCurrent ? .isSelected : [])
    }
}
