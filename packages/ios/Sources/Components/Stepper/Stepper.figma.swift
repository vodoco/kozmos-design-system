import SwiftUI
import Figma

// A numbered row only: SwiftUI draws no dots and no column yet (GAP-191 and
// GAP-173 are web and Figma first), so a Dots or vertical instance shows no
// SwiftUI snippet rather than a numbered row.
struct KozmosStepperConnect: FigmaConnect {
    let component = KozmosStepper.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=512-39614"
    var variant = ["Variant": "Numbered", "Orientation": "Horizontal"]

    @FigmaEnum(
        "Count",
        mapping: [
            "2": 2,
            "3": 3,
            "4": 4,
            "5": 5,
            "6": 6,
            "7": 7,
            "8": 8
        ]
    )
    var count: Int = 4

    @FigmaEnum(
        "Current",
        mapping: [
            "1": 0,
            "2": 1,
            "3": 2,
            "4": 3,
            "5": 4,
            "6": 5,
            "7": 6,
            "8": 7
        ]
    )
    var currentStep: Int = 0

    @FigmaString("Step 1 Text")
    var step1Text: String = "Start"

    @FigmaString("Step 2 Text")
    var step2Text: String = "Review"

    @FigmaString("Step 3 Text")
    var step3Text: String = "Confirm"

    @FigmaString("Step 4 Text")
    var step4Text: String = "Done"

    @FigmaString("Step 5 Text")
    var step5Text: String = "Step 5"

    @FigmaString("Step 6 Text")
    var step6Text: String = "Step 6"

    @FigmaString("Step 7 Text")
    var step7Text: String = "Step 7"

    @FigmaString("Step 8 Text")
    var step8Text: String = "Step 8"

    private var stepLabels: [String] {
        Array(
            [
                self.step1Text, self.step2Text, self.step3Text, self.step4Text,
                self.step5Text, self.step6Text, self.step7Text, self.step8Text
            ].prefix(self.count)
        )
    }

    var body: some View {
        KozmosStepper(
            steps: self.stepLabels,
            currentStep: min(self.currentStep, self.count - 1)
        )
    }
}
