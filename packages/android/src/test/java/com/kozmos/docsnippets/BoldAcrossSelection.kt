// ToggleButton.mdx's Compose snippet ("Mixed"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.togglebutton.KozmosToggleButton

// Bold on some of the selected labels and not on others: the toggle is
// mixed until it is clicked, which turns it on and clears mixed. TalkBack
// hears Compose's mixed state, "partially checked".
@Composable
fun BoldAcrossSelection(bold: List<Boolean>) {
    val differs = bold.distinct().size > 1
    var edit by remember(bold) { mutableStateOf<Boolean?>(null) }
    KozmosToggleButton(
        checked = edit ?: bold.first(),
        onCheckedChange = { edit = it },
        label = "Bold",
        mixed = differs && edit == null,
        onResetMixed = if (differs) ({ edit = null }) else null
    )
}
