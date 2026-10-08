package com.kozmos.components.locationpin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.categorytile.KozmosCategoryTint
import com.kozmos.components.counter.KozmosInkedFill
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosColors
import org.junit.Rule
import org.junit.Test

/**
 * A pin in a category's colour, on the floor and off it. At rest a numbered
 * pin is quiet: a ring in the colour on the white disc, with the number in
 * the foreground (the yellow fill as the number's colour read 1.92:1, Olcay,
 * 2026-09-21). Off the floor the ring is dashed. Selected, the marker is solid
 * with the fill's ink on the number (decision 55, 2026-09-29).
 */
class KozmosLocationPinPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    private val yellow = KozmosCategoryTint(
        KozmosColors.semanticsCategoryAccentYellow,
        KozmosInkedFill(KozmosColors.semanticsCategoryFillYellow, KozmosColors.semanticsCategoryOnfillYellow)
    )
    private val navy = KozmosCategoryTint(
        KozmosColors.semanticsCategoryAccentNavy,
        KozmosInkedFill(KozmosColors.semanticsCategoryFillNavy, KozmosColors.semanticsCategoryOnfillNavy)
    )

    @Test
    fun anOffFloorPinsNumberIsInTheForeground() {
        paparazzi.snapshot {
            KozmosMaterialTheme {
                Row(
                    modifier = Modifier.background(Color.White).padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 4, tint = yellow)
                    KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 4, offFloor = true, tint = yellow)
                    KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 7, tint = navy)
                    KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 7, offFloor = true, tint = navy)
                }
            }
        }
    }

    /**
     * Decision 55: numbered pins are quiet at rest and filled when selected,
     * as the result card's number tab is; off the floor the outlined marker's
     * ring is dashed, selected or not; a featured pin keeps its fill.
     */
    @Test
    fun numberedPinsAreQuietAtRestAndFilledWhenSelected() {
        paparazzi.snapshot {
            KozmosMaterialTheme {
                Row(
                    modifier = Modifier.background(Color.White).padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 1)
                    KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 2, selected = true)
                    KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 3, offFloor = true)
                    KozmosLocationPin(size = KozmosLocationPinSize.Lg, number = 4, offFloor = true, selected = true)
                    KozmosLocationPin(size = KozmosLocationPinSize.Lg, featured = true)
                }
            }
        }
    }
}
