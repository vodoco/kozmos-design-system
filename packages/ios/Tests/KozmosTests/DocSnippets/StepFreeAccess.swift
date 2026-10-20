// Accordion.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// One item opens at a time, and the open one is yours to hold: its trigger
// and its content share the item's value and your selection. Pressing the
// open trigger closes it, as React's collapsible does.
struct StepFreeAccess: View {
    @State private var open: String?

    var body: some View {
        KozmosAccordion {
            KozmosAccordionItem {
                KozmosAccordionTrigger(
                    value: "item-1",
                    title: "Is there step-free access?",
                    selection: $open
                )
                KozmosAccordionContent(value: "item-1", selection: $open) {
                    KozmosText("Yes. Every floor is reached by lift.")
                }
            }
        }
    }
}
