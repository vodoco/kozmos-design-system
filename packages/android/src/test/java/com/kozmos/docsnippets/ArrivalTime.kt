// TimePicker.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.timepicker.KozmosTimePicker
import java.time.LocalTime

// A Kozmos field, its label above, that opens Material's time picker in a
// dialog, in the Kozmos theme's colours. time is null until one is chosen.
// The field and the dialog keep the device's clock, 12- or 24-hour, and the
// field writes the time in the locale's style.
@Composable
fun ArrivalTime(time: LocalTime?, onTimeChange: (LocalTime) -> Unit) {
    KozmosTimePicker(time = time, onTimeSelected = onTimeChange, label = "Arrival time")
}
