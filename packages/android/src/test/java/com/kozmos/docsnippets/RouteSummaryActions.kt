// RouteSummary.mdx's Compose snippets, word for word below the package line:
// compiled here, and composed and measured by KozmosRouteSummaryActionsTest.
// Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.navigationannouncer.KozmosNavigationAnnouncer
import com.kozmos.components.routeprogressrail.KozmosRouteProgressRail
import com.kozmos.components.routesummary.KozmosRouteSummary

// Static wayfinding: Previous and Next in the summary's actions. The host
// owns the step, disables the ends, and says the new step through its
// announcer, the one announcement owner.
@Composable
fun StepByStepSummary(steps: List<String>, onEnd: () -> Unit) {
    var step by remember { mutableIntStateOf(0) }
    Column {
        KozmosRouteSummary(
            destination = "Airport Shuttles",
            durationText = "4 min",
            distanceText = "201 m",
            onEndRoute = onEnd,
            actions = {
                KozmosButton(onClick = { step -= 1 }, variant = KozmosButtonVariant.Outline, enabled = step > 0) {
                    Text("Previous")
                }
                KozmosButton(onClick = { step += 1 }, enabled = step < steps.lastIndex) {
                    Text("Next")
                }
            }
        ) {
            KozmosRouteProgressRail(
                progress = step / steps.lastIndex.coerceAtLeast(1).toFloat(),
                type = DirectionType.Straight,
                label = steps[step]
            )
        }
        KozmosNavigationAnnouncer(message = steps[step])
    }
}

// The route preview: no End, the place's line under the destination, and
// Go and Details.
@Composable
fun RoutePreviewSummary(onGo: () -> Unit, onDetails: () -> Unit) {
    KozmosRouteSummary(
        destination = "Tessel Shoes",
        locationText = "Store · Level 1 · Harbour Point Mall",
        durationText = "3 min",
        distanceText = "205 m",
        actions = {
            KozmosButton(onClick = onGo) { Text("Go") }
            KozmosButton(onClick = onDetails, variant = KozmosButtonVariant.Outline) { Text("Details") }
        }
    )
}
