// POIResultCard.mdx's SwiftUI snippet ("What a travel time includes"), word
// for word below this comment: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project. Change
// the two together.
import SwiftUI
import Kozmos

// The whole time, the queue included, and the queue's part of it, each in
// the visitor's words: "12 min", "Includes security (about 8 min)".
struct AfterSecurityResult: View {
    let poi: KozmosPOIPresentation
    // The result's number, counted from 1: the one its map marker shows.
    let number: Int
    let totalSeconds: Double
    let totalLabel: String
    let securitySeconds: Double
    let securityLabel: String
    let onSelect: (String) -> Void

    var body: some View {
        KozmosPOIResultCard(
            poi: poi,
            result: KozmosPOIResultPresentation(
                poiId: poi.id,
                resultIndex: number,
                travelEstimate: KozmosTravelEstimatePresentation(
                    durationSeconds: totalSeconds,
                    durationLabel: totalLabel,
                    // Drawn under the time and said after it.
                    breakdown: [
                        KozmosTravelEstimatePartPresentation(
                            kind: .securityQueue,
                            durationSeconds: securitySeconds,
                            label: securityLabel
                        )
                    ]
                )
            ),
            onSelect: onSelect
        )
    }
}
