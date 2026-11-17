// Switch.mdx's Compose snippet ("Mixed"), word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.switch.KozmosSwitch

// The features' settings differ, so the switch is mixed until it is clicked:
// the click turns it on, and that edit clears mixed. TalkBack says
// "Multiple values" as its state.
@Composable
fun StepFreeAcrossSelection(settings: List<Boolean>) {
    val differs = settings.distinct().size > 1
    var edit by remember(settings) { mutableStateOf<Boolean?>(null) }
    KozmosSwitch(
        checked = edit ?: settings.first(),
        onCheckedChange = { edit = it },
        label = "Step-free",
        mixed = differs && edit == null,
        onResetMixed = if (differs) ({ edit = null }) else null
    )
}
