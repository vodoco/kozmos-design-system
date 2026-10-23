// MapControlsGroup.mdx's Compose snippet, word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project, and composed by MapControlDocSnippetsTest.
// Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonLabelPlacement
import com.kozmos.components.mapcontrolsgroup.KozmosMapControlsGroup
import com.kozmos.contracts.KozmosUserLocationState

@Composable
fun MapControls(
    bearing: Float,
    locationState: KozmosUserLocationState,
    zoomIn: () -> Unit,
    zoomOut: () -> Unit,
    resetBearing: () -> Unit,
    recenter: () -> Unit
) {
    KozmosMapControlsGroup(
        compassBearing = bearing,
        onZoomIn = zoomIn,
        onZoomOut = zoomOut,
        onCompassReset = resetBearing,
        onMyLocation = recenter,
        // The SDK's control: "Focus" over "Off" or "On" for a moment when the
        // mode changes, and "No Location" alone with no position.
        locationLabel = "Focus",
        locationStateLabel = when (locationState) {
            KozmosUserLocationState.Following, KozmosUserLocationState.Heading -> "On"
            KozmosUserLocationState.Unavailable, KozmosUserLocationState.PermissionDenied -> "No Location"
            else -> "Off"
        },
        locationHeadingDescription = "map turns with you",
        locationHeadingPausedDescription = "press to turn the map with you again",
        // Every name is the product's to translate.
        zoomInLabel = "Zoom in",
        zoomOutLabel = "Zoom out",
        compassResetLabel = "Reset bearing",
        locationState = locationState,
        locationRevealOnChange = true,
        locationLabelPlacement = KozmosMapControlButtonLabelPlacement.Stacked
    )
}

// While a route is shown, step-free takes the location control's place.
@Composable
fun WayfindingControls(stepFree: Boolean, onStepFreeChange: (Boolean) -> Unit) {
    KozmosMapControlsGroup(
        locationRevealOnChange = true,
        locationLabelPlacement = KozmosMapControlButtonLabelPlacement.Stacked,
        onStepFreeChange = onStepFreeChange,
        stepFree = stepFree,
        stepFreeLabel = "Step-free"
    )
}
