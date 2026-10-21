// Radio.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.radio.KozmosRadioGroup
import com.kozmos.components.radio.KozmosRadioGroupItem

// Each option draws its own label, and every option shares your selection:
// the group stacks them as one selectable group, and takes no name (React's
// aria-label has no counterpart).
@Composable
fun ChooseAnOption() {
    var selection by remember { mutableStateOf("option-one") }
    KozmosRadioGroup {
        KozmosRadioGroupItem(
            value = "option-one",
            selectedValue = selection,
            onOptionSelected = { selection = it },
            label = "Option One"
        )
        KozmosRadioGroupItem(
            value = "option-two",
            selectedValue = selection,
            onOptionSelected = { selection = it },
            label = "Option Two"
        )
    }
}
