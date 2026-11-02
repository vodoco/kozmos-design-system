// Accordion.mdx's SwiftUI snippet ("Boxed"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project, and drawn by
// KozmosAccordionBoxedTests. Change the two together.
import SwiftUI
import Kozmos

// One section open at a time, and the open one is yours to hold, as are the
// "Step n/5" words. A later section is disabled until you reach it, and one
// that is loading shows a spinner and takes no tap until you clear it.
struct BuildingSections: View {
    @Binding var open: String?
    var levelsLoading: Bool
    var plansReached: Bool

    var body: some View {
        KozmosAccordion(variant: .boxed) {
            KozmosAccordionItem {
                KozmosAccordionTrigger(
                    value: "details",
                    title: "Building details",
                    selection: $open,
                    label: "Step 1/5"
                ) {
                    KozmosIcon("home-line")
                }
                KozmosAccordionContent(value: "details", selection: $open) {
                    KozmosText("The form")
                }
            }
            KozmosAccordionItem {
                KozmosAccordionTrigger(
                    value: "levels",
                    title: "Levels",
                    selection: $open,
                    label: "Step 3/5",
                    loading: levelsLoading
                ) {
                    KozmosIcon("layers-three-01")
                }
                KozmosAccordionContent(value: "levels", selection: $open) {
                    KozmosText("The levels")
                }
            }
            KozmosAccordionItem(disabled: !plansReached) {
                KozmosAccordionTrigger(
                    value: "plans",
                    title: "Floor plans",
                    selection: $open,
                    label: "Step 4/5"
                ) {
                    KozmosIcon("layers-three-01")
                }
                KozmosAccordionContent(value: "plans", selection: $open) {
                    KozmosText("The plans")
                }
            }
        }
    }
}
