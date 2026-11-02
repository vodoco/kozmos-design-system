package com.kozmos.components.accordion

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977")
@FigmaVariant("Variant", "Default")
@FigmaVariant("State", "Closed")
class KozmosAccordionClosedConnect {
    @FigmaProperty(FigmaType.Text, "Trigger Text")
    val trigger: String = "What is Kozmos?"

    @Composable
    fun ComponentExample() {
        KozmosAccordion {
            KozmosAccordionItem {
                KozmosAccordionTrigger(
                    value = "item-1",
                    selectedValue = null,
                    onValueChange = {},
                    title = trigger
                )
            }
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977")
@FigmaVariant("Variant", "Default")
@FigmaVariant("State", "Open")
class KozmosAccordionOpenConnect {
    @FigmaProperty(FigmaType.Text, "Trigger Text")
    val trigger: String = "What is Kozmos?"

    @FigmaProperty(FigmaType.Text, "Content Text")
    val content: String = "Kozmos provides shared design system primitives."

    @Composable
    fun ComponentExample() {
        KozmosAccordion {
            KozmosAccordionItem {
                KozmosAccordionTrigger(
                    value = "item-1",
                    selectedValue = "item-1",
                    onValueChange = {},
                    title = trigger
                )
                KozmosAccordionContent(
                    value = "item-1",
                    selectedValue = "item-1"
                ) {
                    Text(content)
                }
            }
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977")
@FigmaVariant("Variant", "Boxed")
@FigmaVariant("State", "Closed")
class KozmosAccordionBoxedClosedConnect {
    @FigmaProperty(FigmaType.Text, "Trigger Text")
    val trigger: String = "What is Kozmos?"

    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Step 1/5"

    @Composable
    fun ComponentExample() {
        KozmosAccordion(variant = KozmosAccordionVariant.Boxed) {
            KozmosAccordionItem {
                KozmosAccordionTrigger(
                    value = "item-1",
                    selectedValue = null,
                    onValueChange = {},
                    title = trigger,
                    label = label
                )
            }
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977")
@FigmaVariant("Variant", "Boxed")
@FigmaVariant("State", "Open")
class KozmosAccordionBoxedOpenConnect {
    @FigmaProperty(FigmaType.Text, "Trigger Text")
    val trigger: String = "What is Kozmos?"

    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Step 1/5"

    @FigmaProperty(FigmaType.Text, "Content Text")
    val content: String = "Kozmos provides shared design system primitives."

    @Composable
    fun ComponentExample() {
        KozmosAccordion(variant = KozmosAccordionVariant.Boxed) {
            KozmosAccordionItem {
                KozmosAccordionTrigger(
                    value = "item-1",
                    selectedValue = "item-1",
                    onValueChange = {},
                    title = trigger,
                    label = label
                )
                KozmosAccordionContent(
                    value = "item-1",
                    selectedValue = "item-1"
                ) {
                    Text(content)
                }
            }
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977")
@FigmaVariant("Variant", "Boxed")
@FigmaVariant("State", "Disabled")
class KozmosAccordionBoxedDisabledConnect {
    @FigmaProperty(FigmaType.Text, "Trigger Text")
    val trigger: String = "What is Kozmos?"

    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Step 1/5"

    @Composable
    fun ComponentExample() {
        KozmosAccordion(variant = KozmosAccordionVariant.Boxed) {
            KozmosAccordionItem(disabled = true) {
                KozmosAccordionTrigger(
                    value = "item-1",
                    selectedValue = null,
                    onValueChange = {},
                    title = trigger,
                    label = label
                )
            }
        }
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-977")
@FigmaVariant("Variant", "Boxed")
@FigmaVariant("State", "Loading")
class KozmosAccordionBoxedLoadingConnect {
    @FigmaProperty(FigmaType.Text, "Trigger Text")
    val trigger: String = "What is Kozmos?"

    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Step 1/5"

    @Composable
    fun ComponentExample() {
        KozmosAccordion(variant = KozmosAccordionVariant.Boxed) {
            KozmosAccordionItem {
                KozmosAccordionTrigger(
                    value = "item-1",
                    selectedValue = null,
                    onValueChange = {},
                    title = trigger,
                    label = label,
                    loading = true
                )
            }
        }
    }
}
