// TimePicker.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.timepicker.KozmosTimePicker
import java.time.LocalTime

// A read-only field, labelled inside, that opens the system's time dialog.
// time is null until one is chosen, and the dialog and the field keep a
// 12-hour clock in every locale.
@Composable
fun ArrivalTime(time: LocalTime?, onTimeChange: (LocalTime) -> Unit) {
    KozmosTimePicker(time = time, onTimeSelected = onTimeChange, label = "Arrival time")
}
