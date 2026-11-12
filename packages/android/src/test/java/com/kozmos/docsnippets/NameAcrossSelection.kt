// Input.mdx's Compose snippet ("A mixed value"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.input.KozmosInput

@Composable
fun NameAcrossSelection(names: List<String>) {
    val differs = names.distinct().size > 1
    var edit by remember(names) { mutableStateOf<String?>(null) }
    KozmosInput(
        value = edit ?: if (differs) "" else names.first(),
        onValueChange = { edit = it },
        label = "Name",
        mixed = differs && edit == null,
        onResetMixed = if (differs) ({ edit = null }) else null
    )
}
