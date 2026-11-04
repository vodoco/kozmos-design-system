import SwiftUI
import Figma

struct KozmosAccordionClosedConnect: FigmaConnect {
    let component = KozmosAccordion<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977"
    var variant = ["Variant": "Default", "State": "Closed"]

    @FigmaString("Trigger Text")
    var trigger: String = "What is Kozmos?"

    var body: some View {
        KozmosAccordion {
            AnyView(
                KozmosAccordionItem {
                    KozmosAccordionTrigger(
                        value: "item-1",
                        title: self.trigger,
                        selection: Binding<String?>.constant(nil)
                    )
                }
            )
        }
    }
}

struct KozmosAccordionOpenConnect: FigmaConnect {
    let component = KozmosAccordion<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977"
    var variant = ["Variant": "Default", "State": "Open"]

    @FigmaString("Trigger Text")
    var trigger: String = "What is Kozmos?"

    @FigmaString("Content Text")
    var content: String = "Kozmos provides shared design system primitives."

    var body: some View {
        KozmosAccordion {
            AnyView(
                KozmosAccordionItem {
                    VStack(spacing: 0) {
                        KozmosAccordionTrigger(
                            value: "item-1",
                            title: self.trigger,
                            selection: Binding<String?>.constant("item-1")
                        )
                        KozmosAccordionContent(
                            value: "item-1",
                            selection: Binding<String?>.constant("item-1")
                        ) {
                            Text(self.content)
                        }
                    }
                }
            )
        }
    }
}

struct KozmosAccordionBoxedClosedConnect: FigmaConnect {
    let component = KozmosAccordion<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977"
    var variant = ["Variant": "Boxed", "State": "Closed"]

    @FigmaString("Trigger Text")
    var trigger: String = "What is Kozmos?"

    @FigmaString("Label Text")
    var label: String = "Step 1/5"

    var body: some View {
        KozmosAccordion(variant: .boxed) {
            AnyView(
                KozmosAccordionItem {
                    KozmosAccordionTrigger(
                        value: "item-1",
                        title: self.trigger,
                        selection: Binding<String?>.constant(nil),
                        label: self.label
                    )
                }
            )
        }
    }
}

struct KozmosAccordionBoxedOpenConnect: FigmaConnect {
    let component = KozmosAccordion<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977"
    var variant = ["Variant": "Boxed", "State": "Open"]

    @FigmaString("Trigger Text")
    var trigger: String = "What is Kozmos?"

    @FigmaString("Label Text")
    var label: String = "Step 1/5"

    @FigmaString("Content Text")
    var content: String = "Kozmos provides shared design system primitives."

    var body: some View {
        KozmosAccordion(variant: .boxed) {
            AnyView(
                KozmosAccordionItem {
                    VStack(spacing: 0) {
                        KozmosAccordionTrigger(
                            value: "item-1",
                            title: self.trigger,
                            selection: Binding<String?>.constant("item-1"),
                            label: self.label
                        )
                        KozmosAccordionContent(
                            value: "item-1",
                            selection: Binding<String?>.constant("item-1")
                        ) {
                            Text(self.content)
                        }
                    }
                }
            )
        }
    }
}

struct KozmosAccordionBoxedDisabledConnect: FigmaConnect {
    let component = KozmosAccordion<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977"
    var variant = ["Variant": "Boxed", "State": "Disabled"]

    @FigmaString("Trigger Text")
    var trigger: String = "What is Kozmos?"

    @FigmaString("Label Text")
    var label: String = "Step 1/5"

    var body: some View {
        KozmosAccordion(variant: .boxed) {
            AnyView(
                KozmosAccordionItem(disabled: true) {
                    KozmosAccordionTrigger(
                        value: "item-1",
                        title: self.trigger,
                        selection: Binding<String?>.constant(nil),
                        label: self.label
                    )
                }
            )
        }
    }
}

struct KozmosAccordionBoxedLoadingConnect: FigmaConnect {
    let component = KozmosAccordion<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977"
    var variant = ["Variant": "Boxed", "State": "Loading"]

    @FigmaString("Trigger Text")
    var trigger: String = "What is Kozmos?"

    @FigmaString("Label Text")
    var label: String = "Step 1/5"

    var body: some View {
        KozmosAccordion(variant: .boxed) {
            AnyView(
                KozmosAccordionItem {
                    KozmosAccordionTrigger(
                        value: "item-1",
                        title: self.trigger,
                        selection: Binding<String?>.constant(nil),
                        label: self.label,
                        loading: true
                    )
                }
            )
        }
    }
}
