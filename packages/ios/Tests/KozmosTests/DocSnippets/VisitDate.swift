// DatePicker.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The picker hides its label, which VoiceOver still says: KozmosFieldWrapper
// shows it above the field, as React's label is. There is always a date.
struct VisitDate: View {
    @Binding var date: Date

    var body: some View {
        KozmosFieldWrapper(label: "Visit date") {
            KozmosDatePicker(selection: $date, label: "Visit date")
        }
    }
}
