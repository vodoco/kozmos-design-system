package com.kozmos.components.stepper

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

// A numbered row only: Compose draws no dots and no column yet (GAP-191 and
// GAP-173 are web and Figma first), so a Dots or vertical instance shows no
// Compose snippet rather than a numbered row.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=512-39614")
@FigmaVariant("Variant", "Numbered")
@FigmaVariant("Orientation", "Horizontal")
class KozmosStepperConnect {
    @FigmaProperty(FigmaType.Enum, "Count")
    val count: Int = Figma.mapping(
        "2" to 2,
        "3" to 3,
        "4" to 4,
        "5" to 5,
        "6" to 6,
        "7" to 7,
        "8" to 8
    )

    @FigmaProperty(FigmaType.Enum, "Current")
    val currentStep: Int = Figma.mapping(
        "1" to 0,
        "2" to 1,
        "3" to 2,
        "4" to 3,
        "5" to 4,
        "6" to 5,
        "7" to 6,
        "8" to 7
    )

    @FigmaProperty(FigmaType.Text, "Step 1 Text")
    val step1Text: String = "Start"

    @FigmaProperty(FigmaType.Text, "Step 2 Text")
    val step2Text: String = "Review"

    @FigmaProperty(FigmaType.Text, "Step 3 Text")
    val step3Text: String = "Confirm"

    @FigmaProperty(FigmaType.Text, "Step 4 Text")
    val step4Text: String = "Done"

    @FigmaProperty(FigmaType.Text, "Step 5 Text")
    val step5Text: String = "Step 5"

    @FigmaProperty(FigmaType.Text, "Step 6 Text")
    val step6Text: String = "Step 6"

    @FigmaProperty(FigmaType.Text, "Step 7 Text")
    val step7Text: String = "Step 7"

    @FigmaProperty(FigmaType.Text, "Step 8 Text")
    val step8Text: String = "Step 8"

    @Composable
    fun ComponentExample() {
        KozmosStepper(
            steps = listOf(
                step1Text,
                step2Text,
                step3Text,
                step4Text,
                step5Text,
                step6Text,
                step7Text,
                step8Text
            ).take(count),
            currentStep = currentStep.coerceAtMost(count - 1)
        )
    }
}
