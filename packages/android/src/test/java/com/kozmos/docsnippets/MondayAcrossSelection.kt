// SegmentedControl.mdx's Compose snippet ("Mixed"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.segmentedcontrol.KozmosSegmentedControl
import com.kozmos.components.segmentedcontrol.SegmentedControlSize

// The features' Mondays differ, so the control is mixed until an option is
// chosen: none is selected, and "Multiple values" is under the track.
@Composable
fun MondayAcrossSelection(days: List<Int>) {
    val differs = days.distinct().size > 1
    var edit by remember(days) { mutableStateOf<Int?>(null) }
    KozmosSegmentedControl(
        options = listOf("Hours", "Closed", "Always open"),
        selectedIndex = edit ?: days.first(),
        onOptionSelected = { edit = it },
        size = SegmentedControlSize.Sm,
        mixed = differs && edit == null,
        onResetMixed = if (differs) ({ edit = null }) else null
    )
}
