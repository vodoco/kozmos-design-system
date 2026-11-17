// DatePicker.mdx's Compose snippet ("Mixed"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.datepicker.KozmosDatePicker
import java.time.LocalDate

// Each selected feature's opening date; where they differ, the field shows
// "Multiple values" and the dialog opens with no date chosen.
@Composable
fun OpeningDateAcrossSelection(dates: List<LocalDate>) {
    val differs = dates.distinct().size > 1
    var edit by remember(dates) { mutableStateOf<LocalDate?>(null) }
    KozmosDatePicker(
        date = edit ?: dates.first(),
        onDateSelected = { edit = it },
        label = "Opens on",
        mixed = differs && edit == null,
        onResetMixed = if (differs) ({ edit = null }) else null
    )
}
