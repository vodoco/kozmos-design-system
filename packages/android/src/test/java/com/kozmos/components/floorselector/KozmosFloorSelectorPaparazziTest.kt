package com.kozmos.components.floorselector

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import com.kozmos.contracts.KozmosFloorPresentation
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * Row 69 (GAP-070): the levels that hold results, marked with their count in
 * the square's trailing top corner — on L3's twelve and the selected L2's
 * three; not on L1, whose count is unknown, nor on G's real zero; and not on
 * the stepper, which shows one level at a time. Drawn on the page surface in
 * each theme, and right to left at twice the text size, where the marker
 * mirrors and grows with the square it sits in.
 */
class KozmosFloorSelectorPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    private val levels = listOf(
        KozmosFloorPresentation(id = "3", label = "Level 3", shortLabel = "L3", resultCount = 12),
        KozmosFloorPresentation(id = "2", label = "Level 2", shortLabel = "L2", resultCount = 3),
        KozmosFloorPresentation(id = "1", label = "Level 1", shortLabel = "L1"),
        KozmosFloorPresentation(id = "0", label = "Ground", shortLabel = "G", resultCount = 0)
    )

    @Test
    fun theResultMarkersInLightMode() = snapshotIn(dark = false) { AllThree() }

    @Test
    fun theResultMarkersInDarkMode() = snapshotIn(dark = true) { AllThree() }

    @Test
    fun theResultMarkersRightToLeftAtTwiceTheTextSize() =
        snapshotIn(dark = false, rtl = true, fontScale = 2f) { ListAndStepper() }

    @Composable
    private fun AllThree() {
        Column(verticalArrangement = Arrangement.spacedBy(24.dp)) {
            ListAndStepper()
            KozmosFloorSelector(
                floors = levels,
                selectedFloor = "1",
                onFloorSelect = {},
                variant = KozmosFloorSelectorVariant.HorizontalList
            )
        }
    }

    @Composable
    private fun ListAndStepper() {
        Row(horizontalArrangement = Arrangement.spacedBy(24.dp), verticalAlignment = Alignment.Top) {
            KozmosFloorSelector(floors = levels, selectedFloor = "2", onFloorSelect = {})
            KozmosFloorSelector(
                floors = levels,
                selectedFloor = "2",
                onFloorSelect = {},
                variant = KozmosFloorSelectorVariant.CompactStepper
            )
        }
    }

    private fun snapshotIn(
        dark: Boolean,
        rtl: Boolean = false,
        fontScale: Float = 1f,
        content: @Composable () -> Unit
    ) {
        paparazzi.snapshot {
            val device = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
                LocalDensity provides Density(device.density, fontScale)
            ) {
                MaterialTheme(colorScheme = if (dark) darkColorScheme() else lightColorScheme()) {
                    Column(
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
