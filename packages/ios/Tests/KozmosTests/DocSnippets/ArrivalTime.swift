// TimePicker.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A Kozmos field around the system picker, which opens the system time
// wheels in the device's 12- or 24-hour clock: the label above it names the
// picker for VoiceOver. There is always a time.
struct ArrivalTime: View {
    @Binding var time: Date

    var body: some View {
        KozmosTimePicker(selection: $time, label: "Arrival time")
    }
}
