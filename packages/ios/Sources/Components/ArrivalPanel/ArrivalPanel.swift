import SwiftUI

/// Host-confirmed arrival content. The host owns detection, announcement, focus and dismissal.
public struct KozmosArrivalPanel: View {
    private let destination: String
    private let destinationImage: String?
    private let locationText: String?
    private let title: String
    private let message: String?
    private let actualDurationText: String?
    private let actualDistanceText: String?
    private let durationLabel: String
    private let distanceLabel: String
    private let doneLabel: String
    private let pending: Bool
    private let presentation: KozmosRoutePresentation
    private let surface: KozmosSurfaceStyle
    private let onDone: () -> Void

    public init(destination: String, destinationImage: String? = nil, locationText: String? = nil,
                title: String = "You've arrived", message: String? = nil,
                actualDurationText: String? = nil, actualDistanceText: String? = nil,
                durationLabel: String = "Journey time", distanceLabel: String = "Distance travelled",
                doneLabel: String = "Done", pending: Bool = false,
                presentation: KozmosRoutePresentation = .hosted, surface: KozmosSurfaceStyle = .solid,
                onDone: @escaping () -> Void) {
        self.destination = destination; self.destinationImage = destinationImage; self.locationText = locationText
        self.title = title; self.message = message; self.actualDurationText = actualDurationText
        self.actualDistanceText = actualDistanceText; self.durationLabel = durationLabel; self.distanceLabel = distanceLabel
        self.doneLabel = doneLabel; self.pending = pending; self.presentation = presentation; self.surface = surface; self.onDone = onDone
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            Text(title).font(KozmosTypography.title3.weight(.semibold)).accessibilityAddTraits(.isHeader)
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                if let destinationImage, !destinationImage.isEmpty { KozmosDestinationImage(source: destinationImage) }
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                    Text(destination).font(KozmosTypography.body.weight(.semibold)).fixedSize(horizontal: false, vertical: true)
                    if let locationText, !locationText.isEmpty { Text(locationText).font(KozmosTypography.subheadline).kozmosMutedText() }
                }.frame(maxWidth: .infinity, alignment: .leading)
            }
            if let message, !message.isEmpty { Text(message).font(KozmosTypography.body) }
            if [actualDurationText, actualDistanceText].contains(where: { !($0 ?? "").isEmpty }) {
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing200) { metrics }.fixedSize(horizontal: true, vertical: false)
                    VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) { metrics }
                }
            }
            KozmosButton(doneLabel, isDisabled: pending, fillsWidth: true, action: onDone)
        }
        .foregroundColor(KozmosColors.primitivesColorsForeground100)
        .frame(maxWidth: .infinity, alignment: .leading)
        .modifier(KozmosRoutePanelSurface(presentation: presentation, surface: surface))
    }

    @ViewBuilder private var metrics: some View {
        if let actualDurationText, !actualDurationText.isEmpty { metric(durationLabel, actualDurationText) }
        if let actualDistanceText, !actualDistanceText.isEmpty { metric(distanceLabel, actualDistanceText) }
    }
    private func metric(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
            Text(label).font(KozmosTypography.subheadline).kozmosMutedText()
            Text(value).font(KozmosTypography.body.weight(.semibold))
        }.accessibilityElement(children: .combine)
    }
}
