// ChipInput.mdx's Compose snippet ("Implementation"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.chipinput.KozmosChipInput

// A place's keywords: Done or a comma adds one, Backspace in the empty
// field removes the last, and each chip has its own remove.
@Composable
fun PlaceKeywords() {
    var keywords by remember { mutableStateOf(listOf("coffee", "breakfast")) }
    KozmosChipInput(
        values = keywords,
        onValuesChange = { keywords = it },
        label = "Keywords",
        placeholder = "Add a keyword",
        helperText = "Press Done or type a comma to add one."
    )
}
