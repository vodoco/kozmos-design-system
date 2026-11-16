import SwiftUI
import Figma

// State is the form. Default is the control, whole stars bound to an Int;
// Readonly is a score, which the set draws to the nearest half on the stars
// (decision 181) and `init(rating:)` takes as a Double.
struct KozmosRatingConnect: FigmaConnect {
    let component = KozmosRating.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=512-39747"
    var variant = ["State": "Default"]

    @FigmaEnum(
        "Value",
        mapping: [
            "0": 0,
            "1": 1,
            "2": 2,
            "3": 3,
            "4": 4,
            "5": 5
        ]
    )
    var value: Int = 3

    var body: some View {
        KozmosRating(
            value: .constant(self.value),
            max: 5
        )
    }
}

struct KozmosRatingReadonlyConnect: FigmaConnect {
    let component = KozmosRating.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=512-39747"
    var variant = ["State": "Readonly"]

    @FigmaEnum(
        "Value",
        mapping: [
            "0": 0,
            "0.5": 0.5,
            "1": 1,
            "1.5": 1.5,
            "2": 2,
            "2.5": 2.5,
            "3": 3,
            "3.5": 3.5,
            "4": 4,
            "4.5": 4.5,
            "5": 5
        ]
    )
    var rating: Double = 4.5

    var body: some View {
        KozmosRating(
            rating: self.rating,
            max: 5
        )
    }
}
