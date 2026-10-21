// Stepper.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// currentStep counts from 0: the steps before it are done, the ones after it
// to come. It shows progress only, and no step can be pressed.
struct RouteSteps: View {
    var body: some View {
        KozmosStepper(
            steps: ["Choose destination", "Review route", "Navigate"],
            currentStep: 1
        )
    }
}
