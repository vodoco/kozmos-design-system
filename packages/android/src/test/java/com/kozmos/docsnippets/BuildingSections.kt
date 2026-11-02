// Accordion.mdx's Compose snippet ("Boxed"), word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.accordion.KozmosAccordion
import com.kozmos.components.accordion.KozmosAccordionContent
import com.kozmos.components.accordion.KozmosAccordionItem
import com.kozmos.components.accordion.KozmosAccordionTrigger
import com.kozmos.components.accordion.KozmosAccordionVariant
import com.kozmos.components.icon.KozmosIcon
import com.kozmos.components.text.KozmosText

// One section open at a time, and the open one is yours to hold, as are the
// "Step n/5" words. A later section is disabled until you reach it, and one
// that is loading shows a spinner and takes no press until you clear it.
@Composable
fun BuildingSections(
    open: String?,
    onOpen: (String?) -> Unit,
    levelsLoading: Boolean,
    plansReached: Boolean
) {
    KozmosAccordion(variant = KozmosAccordionVariant.Boxed) {
        KozmosAccordionItem {
            KozmosAccordionTrigger(
                value = "details",
                selectedValue = open,
                onValueChange = onOpen,
                title = "Building details",
                label = "Step 1/5",
                icon = { KozmosIcon(name = "home-line") }
            )
            KozmosAccordionContent(value = "details", selectedValue = open) {
                KozmosText(text = "The form")
            }
        }
        KozmosAccordionItem {
            KozmosAccordionTrigger(
                value = "levels",
                selectedValue = open,
                onValueChange = onOpen,
                title = "Levels",
                label = "Step 3/5",
                icon = { KozmosIcon(name = "layers-three-01") },
                loading = levelsLoading
            )
            KozmosAccordionContent(value = "levels", selectedValue = open) {
                KozmosText(text = "The levels")
            }
        }
        KozmosAccordionItem(disabled = !plansReached) {
            KozmosAccordionTrigger(
                value = "plans",
                selectedValue = open,
                onValueChange = onOpen,
                title = "Floor plans",
                label = "Step 4/5",
                icon = { KozmosIcon(name = "layers-three-01") }
            )
            KozmosAccordionContent(value = "plans", selectedValue = open) {
                KozmosText(text = "The plans")
            }
        }
    }
}
