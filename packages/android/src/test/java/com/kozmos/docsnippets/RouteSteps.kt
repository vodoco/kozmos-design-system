// Stepper.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.stepper.KozmosStepper

// currentStep counts from 0: the steps before it are done, the ones after it
// to come. It shows progress only, and no step can be pressed.
@Composable
fun RouteSteps() {
    KozmosStepper(
        steps = listOf("Choose destination", "Review route", "Navigate"),
        currentStep = 1
    )
}
