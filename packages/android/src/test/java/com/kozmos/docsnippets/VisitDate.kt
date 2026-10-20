// DatePicker.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.datepicker.KozmosDatePicker
import java.time.LocalDate

// A read-only field, labelled inside, that opens the system's date dialog.
// date is null until one is chosen.
@Composable
fun VisitDate(date: LocalDate?, onDateChange: (LocalDate) -> Unit) {
    KozmosDatePicker(date = date, onDateSelected = onDateChange, label = "Visit date")
}
