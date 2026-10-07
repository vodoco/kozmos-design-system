package com.kozmos.components.theme

import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.KozmosEmotion
import com.kozmos.components.alert.AlertStatus
import com.kozmos.components.alert.KozmosAlert
import com.kozmos.components.alert.KozmosAlertTitle
import com.kozmos.components.backdrop.KozmosBackdrop
import com.kozmos.components.breadcrumb.KozmosBreadcrumb
import com.kozmos.components.chip.KozmosChip
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.KozmosDirectionStep
import com.kozmos.components.dynamicisland.KozmosDynamicIsland
import com.kozmos.components.emptystate.KozmosEmptyState
import com.kozmos.components.floorselector.KozmosFloorSelector
import com.kozmos.components.link.KozmosLink
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButton
import com.kozmos.components.progress.KozmosProgress
import com.kozmos.components.rating.KozmosRating
import com.kozmos.components.savelocationcard.KozmosSaveLocationCard
import com.kozmos.components.searchbar.KozmosSearchBar
import com.kozmos.components.segmentedcontrol.KozmosSegmentedControl
import com.kozmos.components.separator.KozmosSeparator
import com.kozmos.components.skeleton.KozmosSkeleton
import com.kozmos.components.slider.KozmosSlider
import com.kozmos.components.stepper.KozmosStepper
import com.kozmos.components.tag.KozmosTag
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.components.userlocationmarker.KozmosUserLocationMarker
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * Components that read the light palette directly until 2026-09-22, drawn in
 * each theme on the page surface. In dark mode they drew their light colours:
 * white chips, fields and cards on a black page with dark text. Now every
 * colour comes through `KozmosThemeTokens`, and the light goldens are the
 * values those components always drew. The island is black in both themes and
 * its content reads dark; the backdrop dims with the scrim role in both.
 */
class KozmosDarkModePaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    @Test
    fun theControlsInLightMode() = snapshotIn(dark = false) { Controls() }

    @Test
    fun theControlsInDarkMode() = snapshotIn(dark = true) { Controls() }

    @Test
    fun theSurfacesInLightMode() = snapshotIn(dark = false) { Surfaces() }

    @Test
    fun theSurfacesInDarkMode() = snapshotIn(dark = true) { Surfaces() }

    private fun snapshotIn(dark: Boolean, content: @Composable () -> Unit) {
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                KozmosMaterialTheme {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier
                            .background(KozmosThemeTokens.semanticsSurface0)
                            .padding(16.dp)
                    ) {
                        content()
                    }
                }
            }
        }
    }
}

@Composable
private fun Controls() {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        KozmosChip(text = "Cafés")
        KozmosTag(text = "Open", emotion = KozmosEmotion.Success)
        KozmosTag(text = "Closed", emotion = KozmosEmotion.Danger)
    }
    KozmosAlert(status = AlertStatus.Info, modifier = Modifier.fillMaxWidth()) {
        KozmosAlertTitle(title = "Level 2 is closed until 14:00")
    }
    KozmosSearchBar(value = "Gate B12", onValueChange = {}, modifier = Modifier.fillMaxWidth())
    KozmosSegmentedControl(options = listOf("Walk", "Step-free"), selectedIndex = 0, onOptionSelected = {})
    KozmosStepper(steps = listOf("Search", "Route", "Go"), currentStep = 1)
    KozmosSlider(value = 0.4f, onValueChange = {}, modifier = Modifier.fillMaxWidth())
    KozmosProgress(progress = 0.6f, modifier = Modifier.fillMaxWidth())
    KozmosBreadcrumb(items = listOf("Terminal 1", "Level 2", "Gate B12"), onItemClick = {})
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        KozmosFloorSelector(floors = listOf("2", "1", "G"), selectedFloor = "1", onFloorSelect = {})
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            KozmosRating(value = 3, onValueChange = {})
            KozmosLink(text = "Open in maps", onClick = {})
        }
    }
    KozmosSeparator()
}

@Composable
private fun Surfaces() {
    KozmosSaveLocationCard(modifier = Modifier.fillMaxWidth())
    KozmosDirectionStep(type = DirectionType.Left, instruction = "Turn left at the lifts")
    KozmosEmptyState(title = "No places match")
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        KozmosMapControlButton(label = "Locate me", onClick = {})
        KozmosSkeleton(modifier = Modifier.width(96.dp).height(24.dp))
        KozmosUserLocationMarker()
    }
    KozmosDynamicIsland(
        compactLeading = { Text("Gate B12") },
        compactTrailing = { Text("4 min") }
    )
    Box(Modifier.fillMaxWidth().height(56.dp)) {
        KozmosChip(text = "Behind the backdrop", modifier = Modifier.padding(12.dp))
        KozmosBackdrop()
    }
}
