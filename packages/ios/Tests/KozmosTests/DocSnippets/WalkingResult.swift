// POIResultCard.mdx's SwiftUI snippet ("A walk shown as a band"), word for
// word below this comment: compiled here, so a renamed or removed parameter
// fails in this target rather than in a reader's project. Change the two
// together.
import SwiftUI
import Kozmos

// The walk the product already has, and its exact time in the visitor's words.
struct WalkingResult: View {
    let poi: KozmosPOIPresentation
    let walkSeconds: Double
    let walkLabel: String
    let bandLabels: [KozmosTravelTimeBand: String]
    let onSelect: (String) -> Void

    var body: some View {
        KozmosPOIResultCard(
            poi: poi,
            result: KozmosPOIResultPresentation(
                poiId: poi.id,
                resultIndex: 0,
                // The list shows the band; the details card keeps durationLabel.
                travelEstimate: KozmosTravelEstimatePresentation(
                    durationSeconds: walkSeconds,
                    durationLabel: walkLabel,
                    band: KozmosTravelTimeBand(durationSeconds: walkSeconds)
                )
            ),
            // English until the product passes its own words.
            travelTimeBandLabels: bandLabels,
            onSelect: onSelect
        )
    }
}
