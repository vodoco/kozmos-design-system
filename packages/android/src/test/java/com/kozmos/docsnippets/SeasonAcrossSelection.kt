// DateRangePicker.mdx's Compose snippet ("Mixed"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.daterangepicker.KozmosDateRangePicker
import com.kozmos.components.daterangepicker.KozmosDateRangeValue

// Each selected feature's season; where they differ, both ends show
// "Multiple values", and one reset under the range brings them back.
@Composable
fun SeasonAcrossSelection(seasons: List<KozmosDateRangeValue>) {
    val differs = seasons.distinct().size > 1
    var edit by remember(seasons) { mutableStateOf<KozmosDateRangeValue?>(null) }
    KozmosDateRangePicker(
        value = edit ?: seasons.first(),
        onValueChange = { edit = it },
        label = "Season",
        mixed = differs && edit == null,
        onResetMixed = if (differs) ({ edit = null }) else null
    )
}
