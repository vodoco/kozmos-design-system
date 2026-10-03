import SwiftUI

/// One step of an itinerary, as the products present it: the SDK's own
/// wording, the arrow it gets, and whether it is the step under way.
public struct KozmosItineraryStep: Identifiable, Hashable, Sendable {
    public let id: String
    public let instructionParts: [KozmosInstructionPart]
    public var instruction: String { instructionParts.map(\.text).joined() }
    public let type: DirectionType
    public let isCurrent: Bool
    /// Localized estimates for this step, not actual journey totals.
    public let distance: String?
    public let duration: String?

    public init(id: String, instruction: String, type: DirectionType, isCurrent: Bool = false, distance: String? = nil, duration: String? = nil) {
        self.init(id: id, instruction: [KozmosInstructionPart(text: instruction)], type: type, isCurrent: isCurrent, distance: distance, duration: duration)
    }

    public init(id: String, instruction: [KozmosInstructionPart], type: DirectionType, isCurrent: Bool = false, distance: String? = nil, duration: String? = nil) {
        self.id = id
        self.instructionParts = instruction
        self.type = type
        self.isCurrent = isCurrent
        self.distance = distance
        self.duration = duration
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
    @Environment(\.kozmosGuidanceForeground) private var guidance
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
        let uniqueCurrent = steps.filter(\.isCurrent).count == 1
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            endpoint(originLabel, name: origin, emphasised: false)
            ForEach(steps) { step in
                row(step, isCurrent: uniqueCurrent && step.isCurrent)
            }
            endpoint(destinationLabel, name: destination, emphasised: true)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    /// The captions and the origin are muted, and on glass, in a glass
    /// manoeuvre card, the foreground colour (decision 48).
    private func endpoint(_ label: String, name: String, emphasised: Bool) -> some View {
        ViewThatFits(in: .horizontal) {
            HStack(alignment: .firstTextBaseline, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                endpointCaption(label).fixedSize(horizontal: true, vertical: false)
                    .frame(minWidth: KozmosDimensions.primitivesLayoutSizing500, alignment: .leading)
                endpointName(name, emphasised: emphasised)
                    .frame(minWidth: 80, alignment: .leading)
            }
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                endpointCaption(label).fixedSize(horizontal: false, vertical: true)
                endpointName(name, emphasised: emphasised)
            }
        }
        .fixedSize(horizontal: false, vertical: true)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label), \(name)")
    }

    private func endpointCaption(_ label: String) -> some View {
        Text(label.uppercased()).font(KozmosTypography.caption2).kozmosMutedText()
    }

    private func endpointName(_ name: String, emphasised: Bool) -> some View {
        Text(name)
            .font(emphasised ? KozmosTypography.subheadline.weight(.semibold) : KozmosTypography.subheadline)
            .kozmosMutedText(emphasised ? KozmosColors.primitivesColorsForeground100 : KozmosColors.primitivesColorsForeground500)
            .fixedSize(horizontal: false, vertical: true)
    }

    private func row(_ step: KozmosItineraryStep, isCurrent: Bool) -> some View {
        HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            Image(systemName: step.type.iconName)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(guidance ?? (isCurrent ? KozmosColors.primitivesColorsTheme500 : KozmosColors.primitivesColorsForeground500))
                .frame(width: KozmosDimensions.primitivesLayoutSizing500, height: 20, alignment: .leading)
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                KozmosInstructionText(parts: step.instructionParts)
                    .font(isCurrent ? KozmosTypography.subheadline.weight(.semibold) : KozmosTypography.subheadline)
                    .foregroundColor(guidance ?? (isCurrent ? KozmosColors.primitivesColorsTheme500 : KozmosColors.primitivesColorsForeground100))
                let metrics = [step.distance, step.duration].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " • ")
                if !metrics.isEmpty {
                    Text(metrics).font(KozmosTypography.subheadline).kozmosMutedText()
                }
            }
            .fixedSize(horizontal: false, vertical: true)
        }
        .kozmosInstructionAccessibility(step.instructionParts, suffix: [step.distance, step.duration].compactMap { $0 }, selected: isCurrent)
    }
}
