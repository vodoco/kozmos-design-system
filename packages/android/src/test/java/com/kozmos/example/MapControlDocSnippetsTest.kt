// The Compose snippets of MapControlButton.mdx and MapControlsGroup.mdx,
// character for character below their imports, so they compile with the
// package and a renamed or removed parameter fails here rather than in a
// reader's project. Change one, change the other.
package com.kozmos.example

import androidx.compose.foundation.layout.Column
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Layers
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButton
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonLabelPlacement
import com.kozmos.components.mapcontrolsgroup.KozmosMapControlsGroup
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.contracts.KozmosUserLocationState
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

// MapControlButton.mdx

// A map toggle: grey while off, the theme's blue and navy while on. It rests
// icon-only and says its new state for a moment when it changes.
@Composable
fun LayersToggle(showsLayers: Boolean, onShowsLayersChange: (Boolean) -> Unit) {
    KozmosMapControlButton(
        label = "Layers",
        onClick = { onShowsLayersChange(!showsLayers) },
        icon = { Icon(Icons.Outlined.Layers, contentDescription = null) },
        stateLabel = if (showsLayers) "On" else "Off",
        labelPlacement = KozmosMapControlButtonLabelPlacement.Stacked,
        pressed = showsLayers,
        revealOnChange = true
    )
}

// MapControlsGroup.mdx

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

/**
 * Compiling is most of the point; composing each snippet shows it lays out,
 * and names what TalkBack is told.
 */
class MapControlDocSnippetsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun theDocsSnippetsCompose() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                Column {
                    LayersToggle(showsLayers = false, onShowsLayersChange = {})
                    MapControls(
                        bearing = 30f,
                        locationState = KozmosUserLocationState.Heading,
                        zoomIn = {},
                        zoomOut = {},
                        resetBearing = {},
                        recenter = {}
                    )
                    WayfindingControls(stepFree = true, onStepFreeChange = {})
                }
            }
        }
        assertEquals(false, tree.named("Layers, Off").selected)
        assertEquals(true, tree.named("Focus, On, map turns with you").selected)
        assertEquals(true, tree.named("Step-free, On").selected)
    }
}
