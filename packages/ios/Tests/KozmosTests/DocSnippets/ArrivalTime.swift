// TimePicker.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The picker hides its label, which VoiceOver still says: KozmosFieldWrapper
// shows it above the field, as React's label is. There is always a time.
struct ArrivalTime: View {
    @Binding var time: Date

    var body: some View {
        KozmosFieldWrapper(label: "Arrival time") {
            KozmosTimePicker(selection: $time, label: "Arrival time")
        }
    }
}
