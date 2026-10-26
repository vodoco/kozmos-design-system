// DatePicker.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A Kozmos field around the system picker, which opens the system calendar:
// the label above it names the picker for VoiceOver, the helper is its hint,
// and the bounds are React's min and max. There is always a date.
struct VisitDate: View {
    @Binding var date: Date

    var body: some View {
        KozmosDatePicker(
            selection: $date,
            label: "Visit date",
            helperText: "Within the next 30 days",
            minimumDate: .now,
            maximumDate: .now.addingTimeInterval(30 * 24 * 60 * 60)
        )
    }
}
