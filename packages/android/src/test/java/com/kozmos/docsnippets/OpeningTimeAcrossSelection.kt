// TimePicker.mdx's Compose snippet ("Mixed"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.timepicker.KozmosTimePicker
import java.time.LocalTime

// Each selected feature's opening time; where they differ, the field shows
// "Multiple values" and the dialog opens on no time of theirs.
@Composable
fun OpeningTimeAcrossSelection(times: List<LocalTime>) {
    val differs = times.distinct().size > 1
    var edit by remember(times) { mutableStateOf<LocalTime?>(null) }
    KozmosTimePicker(
        time = edit ?: times.first(),
        onTimeSelected = { edit = it },
        label = "Opens at",
        mixed = differs && edit == null,
        onResetMixed = if (differs) ({ edit = null }) else null
    )
}
