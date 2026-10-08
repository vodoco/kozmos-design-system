package com.kozmos.components.mapcontrolsgroup

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonLabelPlacement
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonPresentation
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosUserLocationState
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * The location control's mark for each mode (row 77), and step-free in its
 * place, drawn in each theme on the page surface.
 *
 * Off, locating (the arc in the mark's place), following, heading and heading
 * paused (decision 45: the upright pointer in outline); then no position and
 * step-free off and on; then the SDK's stacked presentation, where the state
 * sits under the name. Following, heading and step-free on are the pressed
 * ones: their mark takes the theme's blue and their words navy. The surface is drawn
 * explicitly because Paparazzi's own window is dark, and a pressed tint that
 * only read on it would pass unseen.
 */
class KozmosMapControlsGroupPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    @Test
    fun theModesInLightMode() = snapshotIn(dark = false)

    @Test
    fun theModesInDarkMode() = snapshotIn(dark = true)

    private fun snapshotIn(dark: Boolean) {
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                KozmosMaterialTheme {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier
                            .background(KozmosThemeTokens.semanticsSurface0)
                            .padding(16.dp)
                    ) {
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            Location(KozmosUserLocationState.Off)
                            Location(KozmosUserLocationState.Locating)
                            Location(KozmosUserLocationState.Following)
                            Location(KozmosUserLocationState.Heading)
                            Location(KozmosUserLocationState.HeadingPaused)
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            Location(KozmosUserLocationState.Unavailable)
                            KozmosMapControlsGroup(onStepFreeChange = {}, stepFree = false)
                            KozmosMapControlsGroup(onStepFreeChange = {}, stepFree = true)
                        }
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalAlignment = Alignment.Bottom
                        ) {
                            KozmosMapControlsGroup(
                                onMyLocation = {},
                                locationPresentation = KozmosMapControlButtonPresentation.Labelled,
                                locationLabel = "Focus",
                                locationStateLabel = "On",
                                locationState = KozmosUserLocationState.Following,
                                locationLabelPlacement = KozmosMapControlButtonLabelPlacement.Stacked
                            )
                            KozmosMapControlsGroup(
                                locationPresentation = KozmosMapControlButtonPresentation.Labelled,
                                locationLabelPlacement = KozmosMapControlButtonLabelPlacement.Stacked,
                                onStepFreeChange = {},
                                stepFree = true
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Location(state: KozmosUserLocationState) {
    KozmosMapControlsGroup(onMyLocation = {}, locationState = state)
}
