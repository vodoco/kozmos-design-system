// Accordion.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.accordion.KozmosAccordion
import com.kozmos.components.accordion.KozmosAccordionContent
import com.kozmos.components.accordion.KozmosAccordionItem
import com.kozmos.components.accordion.KozmosAccordionTrigger
import com.kozmos.components.text.KozmosText

// One item opens at a time, and the open one is yours to hold: its trigger
// and its content share the item's value and your selection. Pressing the
// open trigger closes it, as React's collapsible does.
@Composable
fun StepFreeAccess() {
    var open by remember { mutableStateOf<String?>(null) }
    KozmosAccordion {
        KozmosAccordionItem {
            KozmosAccordionTrigger(
                value = "item-1",
                selectedValue = open,
                onValueChange = { open = it },
                title = "Is there step-free access?"
            )
            KozmosAccordionContent(value = "item-1", selectedValue = open) {
                KozmosText(text = "Yes. Every floor is reached by lift.")
            }
        }
    }
}
